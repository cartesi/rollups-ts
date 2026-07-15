import {
    type Address,
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
import type { Input } from "./input.js";
import {
    erc1155BatchPortalAddress,
    erc1155SinglePortalAddress,
    erc20PortalAddress,
    erc721PortalAddress,
    etherPortalAddress,
} from "./rollups.js";
import type { Prettify } from "./types.js";

// payloads of portal deposit inputs are packed-encoded (`abi.encodePacked`)
// by the rollups contracts `InputEncoding` library, so unlike inputs and
// outputs there is no ABI to decode against; layouts below mirror that
// library, and sizes are in bytes

/**
 * Payload of an input added by the Ether portal.
 * Layout: `sender (20) ‖ value (32) ‖ execLayerData`.
 */
export type EtherDeposit = {
    /** Ether sender */
    sender: Address;
    /** Amount of Wei being sent */
    value: bigint;
    /** Additional data to be interpreted by the execution layer */
    execLayerData: Hex;
};

/**
 * Payload of an input added by the ERC-20 portal.
 * Layout: `token (20) ‖ sender (20) ‖ value (32) ‖ execLayerData`.
 */
export type ERC20Deposit = {
    /** Token contract */
    token: Address;
    /** Token sender */
    sender: Address;
    /** Amount of tokens being sent */
    value: bigint;
    /** Additional data to be interpreted by the execution layer */
    execLayerData: Hex;
};

/**
 * Payload of an input added by the ERC-721 portal.
 * Layout: `token (20) ‖ sender (20) ‖ tokenId (32) ‖
 * abi.encode(baseLayerData, execLayerData)`.
 */
export type ERC721Deposit = {
    /** Token contract */
    token: Address;
    /** Token sender */
    sender: Address;
    /** Token identifier */
    tokenId: bigint;
    /** Additional data to be interpreted by the base layer */
    baseLayerData: Hex;
    /** Additional data to be interpreted by the execution layer */
    execLayerData: Hex;
};

/**
 * Payload of an input added by the ERC-1155 single portal.
 * Layout: `token (20) ‖ sender (20) ‖ tokenId (32) ‖ value (32) ‖
 * abi.encode(baseLayerData, execLayerData)`.
 */
export type SingleERC1155Deposit = {
    /** Token contract */
    token: Address;
    /** Token sender */
    sender: Address;
    /** Identifier of the token being transferred */
    tokenId: bigint;
    /** Transfer amount */
    value: bigint;
    /** Additional data to be interpreted by the base layer */
    baseLayerData: Hex;
    /** Additional data to be interpreted by the execution layer */
    execLayerData: Hex;
};

/**
 * Payload of an input added by the ERC-1155 batch portal.
 * Layout: `token (20) ‖ sender (20) ‖
 * abi.encode(tokenIds, values, baseLayerData, execLayerData)`.
 */
export type BatchERC1155Deposit = {
    /** Token contract */
    token: Address;
    /** Token sender */
    sender: Address;
    /** Identifiers of the tokens being transferred */
    tokenIds: readonly bigint[];
    /** Transfer amounts per token type */
    values: readonly bigint[];
    /** Additional data to be interpreted by the base layer */
    baseLayerData: Hex;
    /** Additional data to be interpreted by the execution layer */
    execLayerData: Hex;
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

const assertMinSize = (payload: Hex, min: number, what: string): void => {
    if (size(payload) < min) {
        throw new Error(
            `invalid ${what} payload: expected at least ${min} bytes, got ${size(payload)}`,
        );
    }
};

const sliceFrom = (payload: Hex, start: number): Hex =>
    size(payload) > start ? slice(payload, start) : "0x";

/**
 * Decode the payload of an input added by the Ether portal.
 * @param payload packed-encoded deposit payload (the `payload` field of a
 * decoded input)
 * @returns decoded Ether deposit
 * @throws if the payload is too short
 */
export const decodeEtherDeposit = (payload: Hex): EtherDeposit => {
    assertMinSize(payload, 52, "Ether deposit");
    return {
        sender: getAddress(slice(payload, 0, 20)),
        value: hexToBigInt(slice(payload, 20, 52)),
        execLayerData: sliceFrom(payload, 52),
    };
};

/**
 * Encode an Ether deposit as the Ether portal does. This is the inverse of
 * `decodeEtherDeposit`, useful for testing.
 * @param deposit Ether deposit to encode
 * @returns packed-encoded deposit payload
 */
export const encodeEtherDeposit = (deposit: EtherDeposit): Hex =>
    encodePacked(
        ["address", "uint256", "bytes"],
        [deposit.sender, deposit.value, deposit.execLayerData],
    );

/**
 * Decode the payload of an input added by the ERC-20 portal.
 * @param payload packed-encoded deposit payload (the `payload` field of a
 * decoded input)
 * @returns decoded ERC-20 deposit
 * @throws if the payload is too short
 */
export const decodeERC20Deposit = (payload: Hex): ERC20Deposit => {
    assertMinSize(payload, 72, "ERC-20 deposit");
    return {
        token: getAddress(slice(payload, 0, 20)),
        sender: getAddress(slice(payload, 20, 40)),
        value: hexToBigInt(slice(payload, 40, 72)),
        execLayerData: sliceFrom(payload, 72),
    };
};

/**
 * Encode an ERC-20 deposit as the ERC-20 portal does. This is the inverse of
 * `decodeERC20Deposit`, useful for testing.
 * @param deposit ERC-20 deposit to encode
 * @returns packed-encoded deposit payload
 */
export const encodeERC20Deposit = (deposit: ERC20Deposit): Hex =>
    encodePacked(
        ["address", "address", "uint256", "bytes"],
        [deposit.token, deposit.sender, deposit.value, deposit.execLayerData],
    );

/**
 * Decode the payload of an input added by the ERC-721 portal.
 * @param payload packed-encoded deposit payload (the `payload` field of a
 * decoded input)
 * @returns decoded ERC-721 deposit
 * @throws if the payload is too short or its data tail is malformed
 */
export const decodeERC721Deposit = (payload: Hex): ERC721Deposit => {
    assertMinSize(payload, 72, "ERC-721 deposit");
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

/**
 * Encode an ERC-721 deposit as the ERC-721 portal does. This is the inverse
 * of `decodeERC721Deposit`, useful for testing.
 * @param deposit ERC-721 deposit to encode
 * @returns packed-encoded deposit payload
 */
export const encodeERC721Deposit = (deposit: ERC721Deposit): Hex =>
    encodePacked(
        ["address", "address", "uint256", "bytes"],
        [
            deposit.token,
            deposit.sender,
            deposit.tokenId,
            encodeAbiParameters(dataAbi, [
                deposit.baseLayerData,
                deposit.execLayerData,
            ]),
        ],
    );

/**
 * Decode the payload of an input added by the ERC-1155 single portal.
 * @param payload packed-encoded deposit payload (the `payload` field of a
 * decoded input)
 * @returns decoded ERC-1155 single deposit
 * @throws if the payload is too short or its data tail is malformed
 */
export const decodeSingleERC1155Deposit = (
    payload: Hex,
): SingleERC1155Deposit => {
    assertMinSize(payload, 104, "ERC-1155 single deposit");
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

/**
 * Encode an ERC-1155 single deposit as the ERC-1155 single portal does. This
 * is the inverse of `decodeSingleERC1155Deposit`, useful for testing.
 * @param deposit ERC-1155 single deposit to encode
 * @returns packed-encoded deposit payload
 */
export const encodeSingleERC1155Deposit = (
    deposit: SingleERC1155Deposit,
): Hex =>
    encodePacked(
        ["address", "address", "uint256", "uint256", "bytes"],
        [
            deposit.token,
            deposit.sender,
            deposit.tokenId,
            deposit.value,
            encodeAbiParameters(dataAbi, [
                deposit.baseLayerData,
                deposit.execLayerData,
            ]),
        ],
    );

/**
 * Decode the payload of an input added by the ERC-1155 batch portal.
 * @param payload packed-encoded deposit payload (the `payload` field of a
 * decoded input)
 * @returns decoded ERC-1155 batch deposit
 * @throws if the payload is too short or its data tail is malformed
 */
export const decodeBatchERC1155Deposit = (
    payload: Hex,
): BatchERC1155Deposit => {
    assertMinSize(payload, 40, "ERC-1155 batch deposit");
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

/**
 * Encode an ERC-1155 batch deposit as the ERC-1155 batch portal does. This is
 * the inverse of `decodeBatchERC1155Deposit`, useful for testing.
 * @param deposit ERC-1155 batch deposit to encode
 * @returns packed-encoded deposit payload
 */
export const encodeBatchERC1155Deposit = (deposit: BatchERC1155Deposit): Hex =>
    encodePacked(
        ["address", "address", "bytes"],
        [
            deposit.token,
            deposit.sender,
            encodeAbiParameters(batchDataAbi, [
                deposit.tokenIds,
                deposit.values,
                deposit.baseLayerData,
                deposit.execLayerData,
            ]),
        ],
    );

/**
 * Deposit made through one of the rollups portals, discriminated by the
 * `type` field.
 */
export type Deposit = Prettify<
    | ({ type: "BatchERC1155Deposit" } & BatchERC1155Deposit)
    | ({ type: "ERC20Deposit" } & ERC20Deposit)
    | ({ type: "ERC721Deposit" } & ERC721Deposit)
    | ({ type: "EtherDeposit" } & EtherDeposit)
    | ({ type: "SingleERC1155Deposit" } & SingleERC1155Deposit)
>;

/**
 * Decode the payload of an input as a portal deposit, dispatching on the
 * input's `msgSender`: if it is one of the portal deployment addresses, the
 * payload is decoded with the corresponding decode function.
 * @param input decoded input (only `msgSender` and `payload` are used)
 * @returns decoded deposit, discriminated by the `type` field, or `undefined`
 * if `msgSender` is not a portal (i.e. the input is not a deposit)
 * @throws if `msgSender` is a portal but the payload is malformed
 */
export const decodeDeposit = (
    input: Pick<Input, "msgSender" | "payload">,
): Deposit | undefined => {
    const { msgSender, payload } = input;
    if (isAddressEqual(msgSender, etherPortalAddress)) {
        return { type: "EtherDeposit", ...decodeEtherDeposit(payload) };
    }
    if (isAddressEqual(msgSender, erc20PortalAddress)) {
        return { type: "ERC20Deposit", ...decodeERC20Deposit(payload) };
    }
    if (isAddressEqual(msgSender, erc721PortalAddress)) {
        return { type: "ERC721Deposit", ...decodeERC721Deposit(payload) };
    }
    if (isAddressEqual(msgSender, erc1155SinglePortalAddress)) {
        return {
            type: "SingleERC1155Deposit",
            ...decodeSingleERC1155Deposit(payload),
        };
    }
    if (isAddressEqual(msgSender, erc1155BatchPortalAddress)) {
        return {
            type: "BatchERC1155Deposit",
            ...decodeBatchERC1155Deposit(payload),
        };
    }
    return undefined;
};
