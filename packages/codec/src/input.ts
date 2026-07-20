import type { ExtractAbiFunction } from "abitype";
import {
    AbiFunctionSignatureNotFoundError,
    type ByteArray,
    bytesToHex,
    decodeFunctionData,
    encodeFunctionData,
    getAbiItem,
    type Hex,
    hexToBytes,
    toFunctionSelector,
} from "viem";
import {
    asBytes,
    asHex,
    ceilWord,
    hasSelector,
    readAbiBytes,
    readAddressWord,
    readUint256,
    WORD,
    writeAbiBytes,
    writeAddressWord,
    writeBytes,
    writeUint256,
} from "./bytes.js";
import { inputsAbi } from "./rollups.js";
import type { DecodedBytes, EncodedData, ParamsToObject, To } from "./types.js";

/**
 * Input of a Cartesi application. Inputs are encoded as `EvmAdvance` calls
 * by the `InputBox` contract when added on the base layer; the node just
 * forwards the encoded blob to the machine. Field names and types are
 * inferred from the arguments of the `EvmAdvance` function of the rollups
 * contracts `Inputs` interface. The `bytes` parameter selects the
 * representation of the `payload` field: `Hex` (the default) or `Uint8Array`.
 */
export type Input<bytes extends Hex | ByteArray = Hex> = ParamsToObject<
    ExtractAbiFunction<typeof inputsAbi, "EvmAdvance">["inputs"],
    bytes
>;

const selector = toFunctionSelector(
    getAbiItem({ abi: inputsAbi, name: "EvmAdvance" }),
);
const selectorBytes = hexToBytes(selector);

const decodeInputHex = (data: Hex): Input => {
    const {
        args: [
            chainId,
            appContract,
            msgSender,
            blockNumber,
            blockTimestamp,
            prevRandao,
            index,
            payload,
        ],
    } = decodeFunctionData({ abi: inputsAbi, data });
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
const decodeInputBytes = (data: ByteArray): Input<ByteArray> => {
    if (!hasSelector(data, selectorBytes)) {
        throw new AbiFunctionSignatureNotFoundError(
            bytesToHex(data.subarray(0, 4)),
            { docsPath: "/docs/contract/decodeFunctionData" },
        );
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
 * @throws viem `AbiFunctionSignatureNotFoundError` if the data does not start
 * with the `EvmAdvance` function selector
 */
export const decodeInput = <data extends Hex | ByteArray>(
    data: data,
): Input<DecodedBytes<data>> => {
    const blob: Hex | ByteArray = data;
    return (
        typeof blob === "string" ? decodeInputHex(blob) : decodeInputBytes(blob)
    ) as Input<DecodedBytes<data>>;
};

const encodeInputBytes = (input: Input<Hex | ByteArray>): ByteArray => {
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
export const encodeInput = <to extends To = "hex">(
    input: Input<Hex | ByteArray>,
    to?: to,
): EncodedData<to> =>
    (to === "bytes"
        ? encodeInputBytes(input)
        : encodeFunctionData({
              abi: inputsAbi,
              functionName: "EvmAdvance",
              args: [
                  input.chainId,
                  input.appContract,
                  input.msgSender,
                  input.blockNumber,
                  input.blockTimestamp,
                  input.prevRandao,
                  input.index,
                  asHex(input.payload),
              ],
          })) as EncodedData<to>;
