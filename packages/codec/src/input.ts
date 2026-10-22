import * as AbiFunction from "ox/AbiFunction";
import type * as Bytes from "ox/Bytes";
import * as Hex from "ox/Hex";
import {
    asBytes,
    asHex,
    ceilWord,
    hasSelector,
    readAbiBytes,
    readAddressWord,
    readUint256,
    selectorNotFound,
    WORD,
    writeAbiBytes,
    writeAddressWord,
    writeBytes,
    writeUint256,
} from "./bytes.js";
import { inputsAbi } from "./rollups.js";
import type { ParamsToObject, To } from "./types.js";

/**
 * Input of a Cartesi application. Inputs are encoded as `EvmAdvance` calls
 * by the `InputBox` contract when added on the base layer; the node just
 * forwards the encoded blob to the machine. Field names and types are
 * inferred from the arguments of the `EvmAdvance` function of the rollups
 * contracts `Inputs` interface. The `bytes` parameter selects the
 * representation of the `payload` field: `Hex` (the default) or `Uint8Array`.
 */
export type Input<bytes extends Hex.Hex | Bytes.Bytes = Hex.Hex> =
    ParamsToObject<
        AbiFunction.FromAbi<typeof inputsAbi, "EvmAdvance">["inputs"],
        bytes
    >;

// the EvmAdvance ABI item, resolved once. `fromAbi` precomputes its signature
// hash, so the selector is keccak'd at module load rather than per call, and
// both representations of it come from the one item.
const evmAdvance = AbiFunction.fromAbi(inputsAbi, "EvmAdvance");
const selector = AbiFunction.getSelector(evmAdvance);
const selectorBytes = Hex.toBytes(selector);

const decodeInputHex = (data: Hex.Hex): Input => {
    // `decodeData` does not check the selector when it is handed a resolved
    // ABI item, so without this guard data for another function would decode
    // as EvmAdvance arguments instead of being rejected
    const dataSelector = Hex.slice(data, 0, 4);
    if (dataSelector !== selector) return selectorNotFound(dataSelector);
    const [
        chainId,
        appContract,
        msgSender,
        blockNumber,
        blockTimestamp,
        prevRandao,
        index,
        payload,
    ] = AbiFunction.decodeData(evmAdvance, data, { checksumAddress: true });
    return {
        chainId,
        appContract,
        msgSender,
        blockNumber,
        blockTimestamp,
        prevRandao,
        index,
        payload,
    };
};

// hand-rolled decoder over the fixed EvmAdvance calldata layout, so byte
// array data is decoded without a hex conversion and the payload is a
// zero-copy subarray of the data
const decodeInputBytes = (data: Bytes.Bytes): Input<Bytes.Bytes> => {
    if (!hasSelector(data, selectorBytes)) {
        return selectorNotFound(data.subarray(0, 4));
    }
    const base = 4;
    return {
        chainId: readUint256(data, base),
        appContract: readAddressWord(data, base + WORD),
        msgSender: readAddressWord(data, base + 2 * WORD),
        blockNumber: readUint256(data, base + 3 * WORD),
        blockTimestamp: readUint256(data, base + 4 * WORD),
        prevRandao: readUint256(data, base + 5 * WORD),
        index: readUint256(data, base + 6 * WORD),
        payload: readAbiBytes(data, base, base + 7 * WORD),
    };
};

/**
 * Decode a blob of input data as an `EvmAdvance` call of the rollups
 * contracts `Inputs` interface.
 * @param data ABI-encoded input data, as a hex string or byte array
 * @returns decoded input; the `payload` follows the representation of `data`,
 * and is a zero-copy subarray when `data` is a byte array
 * @throws ox `AbiItem.NotFoundError` if the data does not start with the
 * `EvmAdvance` function selector
 */
export function decodeInput(data: Hex.Hex): Input;
export function decodeInput(data: Bytes.Bytes): Input<Bytes.Bytes>;
export function decodeInput(
    data: Hex.Hex | Bytes.Bytes,
): Input<Hex.Hex | Bytes.Bytes>;
export function decodeInput(
    data: Hex.Hex | Bytes.Bytes,
): Input<Hex.Hex | Bytes.Bytes> {
    return typeof data === "string"
        ? decodeInputHex(data)
        : decodeInputBytes(data);
}

const encodeInputBytes = (input: Input<Hex.Hex | Bytes.Bytes>): Bytes.Bytes => {
    const payload = asBytes(input.payload);
    const data = new Uint8Array(4 + 9 * WORD + ceilWord(payload.length));
    let offset = writeBytes(data, 0, selectorBytes);
    offset = writeUint256(data, offset, input.chainId);
    offset = writeAddressWord(data, offset, input.appContract);
    offset = writeAddressWord(data, offset, input.msgSender);
    offset = writeUint256(data, offset, input.blockNumber);
    offset = writeUint256(data, offset, input.blockTimestamp);
    offset = writeUint256(data, offset, input.prevRandao);
    offset = writeUint256(data, offset, input.index);
    offset = writeUint256(data, offset, BigInt(8 * WORD)); // payload offset
    writeAbiBytes(data, offset, payload);
    return data;
};

/**
 * Encode an input as an `EvmAdvance` call of the rollups contracts `Inputs`
 * interface. This is the inverse of `decodeInput`, useful for testing.
 * @param input input to encode; the `payload` may be a hex string or byte
 * array
 * @param to representation of the encoded data: `"hex"` (the default) or
 * `"bytes"`
 * @returns ABI-encoded input data
 */
export function encodeInput(
    input: Input<Hex.Hex | Bytes.Bytes>,
    to?: "hex",
): Hex.Hex;
export function encodeInput(
    input: Input<Hex.Hex | Bytes.Bytes>,
    to: "bytes",
): Bytes.Bytes;
export function encodeInput(
    input: Input<Hex.Hex | Bytes.Bytes>,
    to?: To,
): Hex.Hex | Bytes.Bytes;
export function encodeInput(
    input: Input<Hex.Hex | Bytes.Bytes>,
    to?: To,
): Hex.Hex | Bytes.Bytes {
    return to === "bytes"
        ? encodeInputBytes(input)
        : AbiFunction.encodeData(evmAdvance, [
              input.chainId,
              input.appContract,
              input.msgSender,
              input.blockNumber,
              input.blockTimestamp,
              input.prevRandao,
              input.index,
              asHex(input.payload),
          ]);
}
