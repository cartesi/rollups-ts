import {
    type Address,
    type ByteArray,
    decodeAbiParameters,
    encodeAbiParameters,
    encodePacked,
    getAddress,
    type Hex,
    hexToBigInt,
    isAddressEqual,
    size,
    slice,
} from "viem";
import {
    abiBytesSize,
    abiUint256ArraySize,
    asBytes,
    asHex,
    readAbiBytes,
    readAbiUint256Array,
    readAddress,
    readUint256,
    WORD,
    writeAbiBytes,
    writeAbiUint256Array,
    writeAddress,
    writeUint256,
} from "./bytes.js";
import type { Input } from "./input.js";
import {
    erc1155BatchPortalAddress,
    erc1155SinglePortalAddress,
    erc20PortalAddress,
    erc721PortalAddress,
    etherPortalAddress,
} from "./rollups.js";
import type { Prettify, To } from "./types.js";

// payloads of portal deposit inputs are packed-encoded (`abi.encodePacked`)
// by the rollups contracts `InputEncoding` library, so unlike inputs and
// outputs there is no ABI to decode against; layouts below mirror that
// library, and sizes are in bytes

// each deposit type takes a `bytes` parameter selecting the representation of
// its variable-size data fields: `Hex` (the default) or `Uint8Array`

/**
 * Payload of an input added by the Ether portal.
 * Layout: `sender (20) ‖ value (32) ‖ execLayerData`.
 */
export type EtherDeposit<bytes extends Hex | ByteArray = Hex> = {
    /** Ether sender */
    sender: Address;
    /** Amount of Wei being sent */
    value: bigint;
    /** Additional data to be interpreted by the execution layer */
    execLayerData: bytes;
};

/**
 * Payload of an input added by the ERC-20 portal.
 * Layout: `token (20) ‖ sender (20) ‖ value (32) ‖ execLayerData`.
 */
export type Erc20Deposit<bytes extends Hex | ByteArray = Hex> = {
    /** Token contract */
    token: Address;
    /** Token sender */
    sender: Address;
    /** Amount of tokens being sent */
    value: bigint;
    /** Additional data to be interpreted by the execution layer */
    execLayerData: bytes;
};

/**
 * Payload of an input added by the ERC-721 portal.
 * Layout: `token (20) ‖ sender (20) ‖ tokenId (32) ‖
 * abi.encode(baseLayerData, execLayerData)`.
 */
export type Erc721Deposit<bytes extends Hex | ByteArray = Hex> = {
    /** Token contract */
    token: Address;
    /** Token sender */
    sender: Address;
    /** Token identifier */
    tokenId: bigint;
    /** Additional data to be interpreted by the base layer */
    baseLayerData: bytes;
    /** Additional data to be interpreted by the execution layer */
    execLayerData: bytes;
};

/**
 * Payload of an input added by the ERC-1155 single portal.
 * Layout: `token (20) ‖ sender (20) ‖ tokenId (32) ‖ value (32) ‖
 * abi.encode(baseLayerData, execLayerData)`.
 */
export type Erc1155SingleDeposit<bytes extends Hex | ByteArray = Hex> = {
    /** Token contract */
    token: Address;
    /** Token sender */
    sender: Address;
    /** Identifier of the token being transferred */
    tokenId: bigint;
    /** Transfer amount */
    value: bigint;
    /** Additional data to be interpreted by the base layer */
    baseLayerData: bytes;
    /** Additional data to be interpreted by the execution layer */
    execLayerData: bytes;
};

/**
 * Payload of an input added by the ERC-1155 batch portal.
 * Layout: `token (20) ‖ sender (20) ‖
 * abi.encode(tokenIds, values, baseLayerData, execLayerData)`.
 */
export type Erc1155BatchDeposit<bytes extends Hex | ByteArray = Hex> = {
    /** Token contract */
    token: Address;
    /** Token sender */
    sender: Address;
    /** Identifiers of the tokens being transferred */
    tokenIds: readonly bigint[];
    /** Transfer amounts per token type */
    values: readonly bigint[];
    /** Additional data to be interpreted by the base layer */
    baseLayerData: bytes;
    /** Additional data to be interpreted by the execution layer */
    execLayerData: bytes;
};

// abi.encode(baseLayerData, execLayerData) tail of ERC-721/1155 deposits
const dataAbi = [{ type: "bytes" }, { type: "bytes" }] as const;

// abi.encode(tokenIds, values, baseLayerData, execLayerData) tail of
// ERC-1155 batch deposits
const batchDataAbi = [
    { type: "uint256[]" },
    { type: "uint256[]" },
    { type: "bytes" },
    { type: "bytes" },
] as const;

const assertMinSize = (
    payload: Hex | ByteArray,
    min: number,
    what: string,
): void => {
    if (size(payload) < min) {
        throw new Error(
            `invalid ${what} payload: expected at least ${min} bytes, got ${size(payload)}`,
        );
    }
};

const sliceFrom = (payload: Hex, start: number): Hex =>
    size(payload) > start ? slice(payload, start) : "0x";

// hand-rolled encoders of the abi.encode'd data tails, filling a
// preallocated buffer

const dataTailSize = (
    baseLayerData: ByteArray,
    execLayerData: ByteArray,
): number =>
    2 * WORD + abiBytesSize(baseLayerData) + abiBytesSize(execLayerData);

const writeDataTail = (
    data: Uint8Array,
    offset: number,
    baseLayerData: ByteArray,
    execLayerData: ByteArray,
): void => {
    const baseLayerDataOffset = 2 * WORD;
    const execLayerDataOffset =
        baseLayerDataOffset + abiBytesSize(baseLayerData);
    let next = writeUint256(data, offset, BigInt(baseLayerDataOffset));
    next = writeUint256(data, next, BigInt(execLayerDataOffset));
    next = writeAbiBytes(data, next, baseLayerData);
    writeAbiBytes(data, next, execLayerData);
};

const batchDataTailSize = (
    tokenIds: readonly bigint[],
    values: readonly bigint[],
    baseLayerData: ByteArray,
    execLayerData: ByteArray,
): number =>
    4 * WORD +
    abiUint256ArraySize(tokenIds) +
    abiUint256ArraySize(values) +
    abiBytesSize(baseLayerData) +
    abiBytesSize(execLayerData);

const writeBatchDataTail = (
    data: Uint8Array,
    offset: number,
    tokenIds: readonly bigint[],
    values: readonly bigint[],
    baseLayerData: ByteArray,
    execLayerData: ByteArray,
): void => {
    const tokenIdsOffset = 4 * WORD;
    const valuesOffset = tokenIdsOffset + abiUint256ArraySize(tokenIds);
    const baseLayerDataOffset = valuesOffset + abiUint256ArraySize(values);
    const execLayerDataOffset =
        baseLayerDataOffset + abiBytesSize(baseLayerData);
    let next = writeUint256(data, offset, BigInt(tokenIdsOffset));
    next = writeUint256(data, next, BigInt(valuesOffset));
    next = writeUint256(data, next, BigInt(baseLayerDataOffset));
    next = writeUint256(data, next, BigInt(execLayerDataOffset));
    next = writeAbiUint256Array(data, next, tokenIds);
    next = writeAbiUint256Array(data, next, values);
    next = writeAbiBytes(data, next, baseLayerData);
    writeAbiBytes(data, next, execLayerData);
};

const decodeEtherDepositHex = (payload: Hex): EtherDeposit => ({
    sender: getAddress(slice(payload, 0, 20)),
    value: hexToBigInt(slice(payload, 20, 52)),
    execLayerData: sliceFrom(payload, 52),
});

const decodeEtherDepositBytes = (
    payload: ByteArray,
): EtherDeposit<ByteArray> => ({
    sender: readAddress(payload, 0),
    value: readUint256(payload, 20),
    execLayerData: payload.subarray(52),
});

/**
 * Decode the payload of an input added by the Ether portal.
 * @param payload packed-encoded deposit payload (the `payload` field of a
 * decoded input), as a hex string or byte array
 * @returns decoded Ether deposit; `execLayerData` follows the representation
 * of `payload`, and is a zero-copy subarray when `payload` is a byte array
 * @throws if the payload is too short
 */
export function decodeEtherDeposit(payload: Hex): EtherDeposit;
export function decodeEtherDeposit(payload: ByteArray): EtherDeposit<ByteArray>;
export function decodeEtherDeposit(
    payload: Hex | ByteArray,
): EtherDeposit<Hex | ByteArray>;
export function decodeEtherDeposit(
    payload: Hex | ByteArray,
): EtherDeposit<Hex | ByteArray> {
    assertMinSize(payload, 52, "Ether deposit");
    return typeof payload === "string"
        ? decodeEtherDepositHex(payload)
        : decodeEtherDepositBytes(payload);
}

/**
 * Encode an Ether deposit as the Ether portal does. This is the inverse of
 * `decodeEtherDeposit`, useful for testing.
 * @param deposit Ether deposit to encode; `execLayerData` may be a hex string
 * or byte array
 * @param to representation of the encoded data: `"hex"` (the default) or
 * `"bytes"`
 * @returns packed-encoded deposit payload
 */
export function encodeEtherDeposit(
    deposit: EtherDeposit<Hex | ByteArray>,
    to?: "hex",
): Hex;
export function encodeEtherDeposit(
    deposit: EtherDeposit<Hex | ByteArray>,
    to: "bytes",
): ByteArray;
export function encodeEtherDeposit(
    deposit: EtherDeposit<Hex | ByteArray>,
    to?: To,
): Hex | ByteArray;
export function encodeEtherDeposit(
    deposit: EtherDeposit<Hex | ByteArray>,
    to?: To,
): Hex | ByteArray {
    if (to === "bytes") {
        const execLayerData = asBytes(deposit.execLayerData);
        const data = new Uint8Array(52 + execLayerData.length);
        let offset = writeAddress(data, 0, deposit.sender);
        offset = writeUint256(data, offset, deposit.value);
        data.set(execLayerData, offset);
        return data;
    }
    return encodePacked(
        ["address", "uint256", "bytes"],
        [deposit.sender, deposit.value, asHex(deposit.execLayerData)],
    );
}

const decodeErc20DepositHex = (payload: Hex): Erc20Deposit => ({
    token: getAddress(slice(payload, 0, 20)),
    sender: getAddress(slice(payload, 20, 40)),
    value: hexToBigInt(slice(payload, 40, 72)),
    execLayerData: sliceFrom(payload, 72),
});

const decodeErc20DepositBytes = (
    payload: ByteArray,
): Erc20Deposit<ByteArray> => ({
    token: readAddress(payload, 0),
    sender: readAddress(payload, 20),
    value: readUint256(payload, 40),
    execLayerData: payload.subarray(72),
});

/**
 * Decode the payload of an input added by the ERC-20 portal.
 * @param payload packed-encoded deposit payload (the `payload` field of a
 * decoded input), as a hex string or byte array
 * @returns decoded ERC-20 deposit; `execLayerData` follows the representation
 * of `payload`, and is a zero-copy subarray when `payload` is a byte array
 * @throws if the payload is too short
 */
export function decodeErc20Deposit(payload: Hex): Erc20Deposit;
export function decodeErc20Deposit(payload: ByteArray): Erc20Deposit<ByteArray>;
export function decodeErc20Deposit(
    payload: Hex | ByteArray,
): Erc20Deposit<Hex | ByteArray>;
export function decodeErc20Deposit(
    payload: Hex | ByteArray,
): Erc20Deposit<Hex | ByteArray> {
    assertMinSize(payload, 72, "ERC-20 deposit");
    return typeof payload === "string"
        ? decodeErc20DepositHex(payload)
        : decodeErc20DepositBytes(payload);
}

/**
 * Encode an ERC-20 deposit as the ERC-20 portal does. This is the inverse of
 * `decodeErc20Deposit`, useful for testing.
 * @param deposit ERC-20 deposit to encode; `execLayerData` may be a hex
 * string or byte array
 * @param to representation of the encoded data: `"hex"` (the default) or
 * `"bytes"`
 * @returns packed-encoded deposit payload
 */
export function encodeErc20Deposit(
    deposit: Erc20Deposit<Hex | ByteArray>,
    to?: "hex",
): Hex;
export function encodeErc20Deposit(
    deposit: Erc20Deposit<Hex | ByteArray>,
    to: "bytes",
): ByteArray;
export function encodeErc20Deposit(
    deposit: Erc20Deposit<Hex | ByteArray>,
    to?: To,
): Hex | ByteArray;
export function encodeErc20Deposit(
    deposit: Erc20Deposit<Hex | ByteArray>,
    to?: To,
): Hex | ByteArray {
    if (to === "bytes") {
        const execLayerData = asBytes(deposit.execLayerData);
        const data = new Uint8Array(72 + execLayerData.length);
        let offset = writeAddress(data, 0, deposit.token);
        offset = writeAddress(data, offset, deposit.sender);
        offset = writeUint256(data, offset, deposit.value);
        data.set(execLayerData, offset);
        return data;
    }
    return encodePacked(
        ["address", "address", "uint256", "bytes"],
        [
            deposit.token,
            deposit.sender,
            deposit.value,
            asHex(deposit.execLayerData),
        ],
    );
}

const decodeErc721DepositHex = (payload: Hex): Erc721Deposit => {
    const [baseLayerData, execLayerData] = decodeAbiParameters(
        dataAbi,
        sliceFrom(payload, 72),
    );
    return {
        token: getAddress(slice(payload, 0, 20)),
        sender: getAddress(slice(payload, 20, 40)),
        tokenId: hexToBigInt(slice(payload, 40, 72)),
        baseLayerData,
        execLayerData,
    };
};

const decodeErc721DepositBytes = (
    payload: ByteArray,
): Erc721Deposit<ByteArray> => ({
    token: readAddress(payload, 0),
    sender: readAddress(payload, 20),
    tokenId: readUint256(payload, 40),
    baseLayerData: readAbiBytes(payload, 72, 72),
    execLayerData: readAbiBytes(payload, 72, 72 + WORD),
});

/**
 * Decode the payload of an input added by the ERC-721 portal.
 * @param payload packed-encoded deposit payload (the `payload` field of a
 * decoded input), as a hex string or byte array
 * @returns decoded ERC-721 deposit; the data fields follow the representation
 * of `payload`, and are zero-copy subarrays when `payload` is a byte array
 * @throws if the payload is too short or its data tail is malformed
 */
export function decodeErc721Deposit(payload: Hex): Erc721Deposit;
export function decodeErc721Deposit(
    payload: ByteArray,
): Erc721Deposit<ByteArray>;
export function decodeErc721Deposit(
    payload: Hex | ByteArray,
): Erc721Deposit<Hex | ByteArray>;
export function decodeErc721Deposit(
    payload: Hex | ByteArray,
): Erc721Deposit<Hex | ByteArray> {
    assertMinSize(payload, 72, "ERC-721 deposit");
    return typeof payload === "string"
        ? decodeErc721DepositHex(payload)
        : decodeErc721DepositBytes(payload);
}

/**
 * Encode an ERC-721 deposit as the ERC-721 portal does. This is the inverse
 * of `decodeErc721Deposit`, useful for testing.
 * @param deposit ERC-721 deposit to encode; the data fields may be hex
 * strings or byte arrays
 * @param to representation of the encoded data: `"hex"` (the default) or
 * `"bytes"`
 * @returns packed-encoded deposit payload
 */
export function encodeErc721Deposit(
    deposit: Erc721Deposit<Hex | ByteArray>,
    to?: "hex",
): Hex;
export function encodeErc721Deposit(
    deposit: Erc721Deposit<Hex | ByteArray>,
    to: "bytes",
): ByteArray;
export function encodeErc721Deposit(
    deposit: Erc721Deposit<Hex | ByteArray>,
    to?: To,
): Hex | ByteArray;
export function encodeErc721Deposit(
    deposit: Erc721Deposit<Hex | ByteArray>,
    to?: To,
): Hex | ByteArray {
    if (to === "bytes") {
        const baseLayerData = asBytes(deposit.baseLayerData);
        const execLayerData = asBytes(deposit.execLayerData);
        const data = new Uint8Array(
            72 + dataTailSize(baseLayerData, execLayerData),
        );
        let offset = writeAddress(data, 0, deposit.token);
        offset = writeAddress(data, offset, deposit.sender);
        offset = writeUint256(data, offset, deposit.tokenId);
        writeDataTail(data, offset, baseLayerData, execLayerData);
        return data;
    }
    return encodePacked(
        ["address", "address", "uint256", "bytes"],
        [
            deposit.token,
            deposit.sender,
            deposit.tokenId,
            encodeAbiParameters(dataAbi, [
                asHex(deposit.baseLayerData),
                asHex(deposit.execLayerData),
            ]),
        ],
    );
}

const decodeErc1155SingleDepositHex = (payload: Hex): Erc1155SingleDeposit => {
    const [baseLayerData, execLayerData] = decodeAbiParameters(
        dataAbi,
        sliceFrom(payload, 104),
    );
    return {
        token: getAddress(slice(payload, 0, 20)),
        sender: getAddress(slice(payload, 20, 40)),
        tokenId: hexToBigInt(slice(payload, 40, 72)),
        value: hexToBigInt(slice(payload, 72, 104)),
        baseLayerData,
        execLayerData,
    };
};

const decodeErc1155SingleDepositBytes = (
    payload: ByteArray,
): Erc1155SingleDeposit<ByteArray> => ({
    token: readAddress(payload, 0),
    sender: readAddress(payload, 20),
    tokenId: readUint256(payload, 40),
    value: readUint256(payload, 72),
    baseLayerData: readAbiBytes(payload, 104, 104),
    execLayerData: readAbiBytes(payload, 104, 104 + WORD),
});

/**
 * Decode the payload of an input added by the ERC-1155 single portal.
 * @param payload packed-encoded deposit payload (the `payload` field of a
 * decoded input), as a hex string or byte array
 * @returns decoded ERC-1155 single deposit; the data fields follow the
 * representation of `payload`, and are zero-copy subarrays when `payload` is
 * a byte array
 * @throws if the payload is too short or its data tail is malformed
 */
export function decodeErc1155SingleDeposit(payload: Hex): Erc1155SingleDeposit;
export function decodeErc1155SingleDeposit(
    payload: ByteArray,
): Erc1155SingleDeposit<ByteArray>;
export function decodeErc1155SingleDeposit(
    payload: Hex | ByteArray,
): Erc1155SingleDeposit<Hex | ByteArray>;
export function decodeErc1155SingleDeposit(
    payload: Hex | ByteArray,
): Erc1155SingleDeposit<Hex | ByteArray> {
    assertMinSize(payload, 104, "ERC-1155 single deposit");
    return typeof payload === "string"
        ? decodeErc1155SingleDepositHex(payload)
        : decodeErc1155SingleDepositBytes(payload);
}

/**
 * Encode an ERC-1155 single deposit as the ERC-1155 single portal does. This
 * is the inverse of `decodeErc1155SingleDeposit`, useful for testing.
 * @param deposit ERC-1155 single deposit to encode; the data fields may be
 * hex strings or byte arrays
 * @param to representation of the encoded data: `"hex"` (the default) or
 * `"bytes"`
 * @returns packed-encoded deposit payload
 */
export function encodeErc1155SingleDeposit(
    deposit: Erc1155SingleDeposit<Hex | ByteArray>,
    to?: "hex",
): Hex;
export function encodeErc1155SingleDeposit(
    deposit: Erc1155SingleDeposit<Hex | ByteArray>,
    to: "bytes",
): ByteArray;
export function encodeErc1155SingleDeposit(
    deposit: Erc1155SingleDeposit<Hex | ByteArray>,
    to?: To,
): Hex | ByteArray;
export function encodeErc1155SingleDeposit(
    deposit: Erc1155SingleDeposit<Hex | ByteArray>,
    to?: To,
): Hex | ByteArray {
    if (to === "bytes") {
        const baseLayerData = asBytes(deposit.baseLayerData);
        const execLayerData = asBytes(deposit.execLayerData);
        const data = new Uint8Array(
            104 + dataTailSize(baseLayerData, execLayerData),
        );
        let offset = writeAddress(data, 0, deposit.token);
        offset = writeAddress(data, offset, deposit.sender);
        offset = writeUint256(data, offset, deposit.tokenId);
        offset = writeUint256(data, offset, deposit.value);
        writeDataTail(data, offset, baseLayerData, execLayerData);
        return data;
    }
    return encodePacked(
        ["address", "address", "uint256", "uint256", "bytes"],
        [
            deposit.token,
            deposit.sender,
            deposit.tokenId,
            deposit.value,
            encodeAbiParameters(dataAbi, [
                asHex(deposit.baseLayerData),
                asHex(deposit.execLayerData),
            ]),
        ],
    );
}

const decodeErc1155BatchDepositHex = (payload: Hex): Erc1155BatchDeposit => {
    const [tokenIds, values, baseLayerData, execLayerData] =
        decodeAbiParameters(batchDataAbi, sliceFrom(payload, 40));
    return {
        token: getAddress(slice(payload, 0, 20)),
        sender: getAddress(slice(payload, 20, 40)),
        tokenIds,
        values,
        baseLayerData,
        execLayerData,
    };
};

const decodeErc1155BatchDepositBytes = (
    payload: ByteArray,
): Erc1155BatchDeposit<ByteArray> => ({
    token: readAddress(payload, 0),
    sender: readAddress(payload, 20),
    tokenIds: readAbiUint256Array(payload, 40, 40),
    values: readAbiUint256Array(payload, 40, 40 + WORD),
    baseLayerData: readAbiBytes(payload, 40, 40 + 2 * WORD),
    execLayerData: readAbiBytes(payload, 40, 40 + 3 * WORD),
});

/**
 * Decode the payload of an input added by the ERC-1155 batch portal.
 * @param payload packed-encoded deposit payload (the `payload` field of a
 * decoded input), as a hex string or byte array
 * @returns decoded ERC-1155 batch deposit; the data fields follow the
 * representation of `payload`, and are zero-copy subarrays when `payload` is
 * a byte array
 * @throws if the payload is too short or its data tail is malformed
 */
export function decodeErc1155BatchDeposit(payload: Hex): Erc1155BatchDeposit;
export function decodeErc1155BatchDeposit(
    payload: ByteArray,
): Erc1155BatchDeposit<ByteArray>;
export function decodeErc1155BatchDeposit(
    payload: Hex | ByteArray,
): Erc1155BatchDeposit<Hex | ByteArray>;
export function decodeErc1155BatchDeposit(
    payload: Hex | ByteArray,
): Erc1155BatchDeposit<Hex | ByteArray> {
    assertMinSize(payload, 40, "ERC-1155 batch deposit");
    return typeof payload === "string"
        ? decodeErc1155BatchDepositHex(payload)
        : decodeErc1155BatchDepositBytes(payload);
}

/**
 * Encode an ERC-1155 batch deposit as the ERC-1155 batch portal does. This is
 * the inverse of `decodeErc1155BatchDeposit`, useful for testing.
 * @param deposit ERC-1155 batch deposit to encode; the data fields may be hex
 * strings or byte arrays
 * @param to representation of the encoded data: `"hex"` (the default) or
 * `"bytes"`
 * @returns packed-encoded deposit payload
 */
export function encodeErc1155BatchDeposit(
    deposit: Erc1155BatchDeposit<Hex | ByteArray>,
    to?: "hex",
): Hex;
export function encodeErc1155BatchDeposit(
    deposit: Erc1155BatchDeposit<Hex | ByteArray>,
    to: "bytes",
): ByteArray;
export function encodeErc1155BatchDeposit(
    deposit: Erc1155BatchDeposit<Hex | ByteArray>,
    to?: To,
): Hex | ByteArray;
export function encodeErc1155BatchDeposit(
    deposit: Erc1155BatchDeposit<Hex | ByteArray>,
    to?: To,
): Hex | ByteArray {
    if (to === "bytes") {
        const baseLayerData = asBytes(deposit.baseLayerData);
        const execLayerData = asBytes(deposit.execLayerData);
        const data = new Uint8Array(
            40 +
                batchDataTailSize(
                    deposit.tokenIds,
                    deposit.values,
                    baseLayerData,
                    execLayerData,
                ),
        );
        let offset = writeAddress(data, 0, deposit.token);
        offset = writeAddress(data, offset, deposit.sender);
        writeBatchDataTail(
            data,
            offset,
            deposit.tokenIds,
            deposit.values,
            baseLayerData,
            execLayerData,
        );
        return data;
    }
    return encodePacked(
        ["address", "address", "bytes"],
        [
            deposit.token,
            deposit.sender,
            encodeAbiParameters(batchDataAbi, [
                deposit.tokenIds,
                deposit.values,
                asHex(deposit.baseLayerData),
                asHex(deposit.execLayerData),
            ]),
        ],
    );
}

/**
 * Deposit made through one of the rollups portals, discriminated by the
 * `type` field.
 */
export type Deposit<bytes extends Hex | ByteArray = Hex> = Prettify<
    | ({ type: "Erc1155BatchDeposit" } & Erc1155BatchDeposit<bytes>)
    | ({ type: "Erc20Deposit" } & Erc20Deposit<bytes>)
    | ({ type: "Erc721Deposit" } & Erc721Deposit<bytes>)
    | ({ type: "EtherDeposit" } & EtherDeposit<bytes>)
    | ({ type: "Erc1155SingleDeposit" } & Erc1155SingleDeposit<bytes>)
>;

/**
 * Decode the payload of an input as a portal deposit, dispatching on the
 * input's `msgSender`: if it is one of the portal deployment addresses, the
 * payload is decoded with the corresponding decode function.
 * @param input decoded input (only `msgSender` and `payload` are used); the
 * `payload` may be a hex string or byte array
 * @returns decoded deposit, discriminated by the `type` field, or `undefined`
 * if `msgSender` is not a portal (i.e. the input is not a deposit); the data
 * fields follow the representation of the `payload`, and are zero-copy
 * subarrays when the `payload` is a byte array
 * @throws if `msgSender` is a portal but the payload is malformed
 */
export function decodeDeposit(
    input: Pick<Input, "msgSender" | "payload">,
): Deposit | undefined;
export function decodeDeposit(
    input: Pick<Input<ByteArray>, "msgSender" | "payload">,
): Deposit<ByteArray> | undefined;
export function decodeDeposit(
    input: Pick<Input<Hex | ByteArray>, "msgSender" | "payload">,
): Deposit<Hex | ByteArray> | undefined;
export function decodeDeposit(
    input: Pick<Input<Hex | ByteArray>, "msgSender" | "payload">,
): Deposit<Hex | ByteArray> | undefined {
    const { msgSender, payload } = input;
    if (isAddressEqual(msgSender, etherPortalAddress)) {
        return { type: "EtherDeposit", ...decodeEtherDeposit(payload) };
    }
    if (isAddressEqual(msgSender, erc20PortalAddress)) {
        return { type: "Erc20Deposit", ...decodeErc20Deposit(payload) };
    }
    if (isAddressEqual(msgSender, erc721PortalAddress)) {
        return { type: "Erc721Deposit", ...decodeErc721Deposit(payload) };
    }
    if (isAddressEqual(msgSender, erc1155SinglePortalAddress)) {
        return {
            type: "Erc1155SingleDeposit",
            ...decodeErc1155SingleDeposit(payload),
        };
    }
    if (isAddressEqual(msgSender, erc1155BatchPortalAddress)) {
        return {
            type: "Erc1155BatchDeposit",
            ...decodeErc1155BatchDeposit(payload),
        };
    }
    return undefined;
}
