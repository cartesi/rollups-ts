import type { ExtractAbiFunction, ExtractAbiFunctionNames } from "abitype";
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
import { outputsAbi } from "./rollups.js";
import type {
    DecodedBytes,
    EncodedData,
    ParamsToObject,
    Prettify,
    To,
} from "./types.js";

type OutputName = ExtractAbiFunctionNames<typeof outputsAbi>;

/**
 * Output variant named `name`, with the `type` discriminator field plus
 * fields inferred from the arguments of the homonymous function of the
 * rollups contracts `Outputs` interface. The `bytes` parameter selects the
 * representation of the `payload` field: `Hex` (the default) or `Uint8Array`.
 */
type OutputOf<
    name extends OutputName,
    bytes extends Hex | ByteArray = Hex,
> = Prettify<
    { type: name } & ParamsToObject<
        ExtractAbiFunction<typeof outputsAbi, name>["inputs"],
        bytes
    >
>;

/**
 * Notice output: informational statement that can be validated on the base
 * layer, but not executed.
 */
export type Notice<bytes extends Hex | ByteArray = Hex> = OutputOf<
    "Notice",
    bytes
>;

/**
 * Voucher output: a single-use permission to execute a `CALL` to a base layer
 * contract on behalf of the application.
 */
export type Voucher<bytes extends Hex | ByteArray = Hex> = OutputOf<
    "Voucher",
    bytes
>;

/**
 * Delegate call voucher output: a single-use permission to execute a
 * `DELEGATECALL` to a base layer contract in the context of the application
 * contract.
 */
export type DelegateCallVoucher<bytes extends Hex | ByteArray = Hex> = OutputOf<
    "DelegateCallVoucher",
    bytes
>;

/**
 * Output of a Cartesi application, as defined by the rollups contracts
 * `Outputs` interface, discriminated by the `type` field.
 */
export type Output<bytes extends Hex | ByteArray = Hex> = {
    [name in OutputName]: OutputOf<name, bytes>;
}[OutputName];

const selectorOf = (name: OutputName): ByteArray =>
    hexToBytes(toFunctionSelector(getAbiItem({ abi: outputsAbi, name })));

const noticeSelector = selectorOf("Notice");
const voucherSelector = selectorOf("Voucher");
const delegateCallVoucherSelector = selectorOf("DelegateCallVoucher");

const decodeOutputHex = (data: Hex): Output => {
    const decoded = decodeFunctionData({ abi: outputsAbi, data });
    switch (decoded.functionName) {
        case "Notice": {
            const [payload] = decoded.args;
            return { type: "Notice", payload };
        }
        case "Voucher": {
            const [destination, value, payload] = decoded.args;
            return { type: "Voucher", destination, value, payload };
        }
        case "DelegateCallVoucher": {
            const [destination, payload] = decoded.args;
            return { type: "DelegateCallVoucher", destination, payload };
        }
    }
};

// hand-rolled decoder over the fixed Outputs calldata layouts, so byte array
// data is decoded without a hex conversion and the payload is a zero-copy
// subarray of the data
const decodeOutputBytes = (data: ByteArray): Output<ByteArray> => {
    const base = 4;
    if (hasSelector(data, noticeSelector)) {
        return {
            type: "Notice",
            payload: readAbiBytes(data, base, base),
        };
    }
    if (hasSelector(data, voucherSelector)) {
        return {
            type: "Voucher",
            destination: readAddressWord(data, base),
            value: readUint256(data, base + WORD),
            payload: readAbiBytes(data, base, base + 2 * WORD),
        };
    }
    if (hasSelector(data, delegateCallVoucherSelector)) {
        return {
            type: "DelegateCallVoucher",
            destination: readAddressWord(data, base),
            payload: readAbiBytes(data, base, base + WORD),
        };
    }
    throw new AbiFunctionSignatureNotFoundError(
        bytesToHex(data.subarray(0, 4)),
        { docsPath: "/docs/contract/decodeFunctionData" },
    );
};

/**
 * Decode a blob of output data as one of the functions of the rollups
 * contracts `Outputs` interface.
 * @param data ABI-encoded output data, as a hex string or byte array
 * @returns decoded output, discriminated by the `type` field; the `payload`
 * follows the representation of `data`, and is a zero-copy subarray when
 * `data` is a byte array
 * @throws viem `AbiFunctionSignatureNotFoundError` if the data does not start
 * with the selector of one of the `Outputs` functions
 */
export const decodeOutput = <data extends Hex | ByteArray>(
    data: data,
): Output<DecodedBytes<data>> => {
    const blob: Hex | ByteArray = data;
    return (
        typeof blob === "string"
            ? decodeOutputHex(blob)
            : decodeOutputBytes(blob)
    ) as Output<DecodedBytes<data>>;
};

const encodeNoticeBytes = (
    notice: Omit<Notice<Hex | ByteArray>, "type">,
): ByteArray => {
    const payload = asBytes(notice.payload);
    const data = new Uint8Array(4 + 2 * WORD + ceilWord(payload.length));
    let offset = writeBytes(data, 0, noticeSelector);
    offset = writeUint256(data, offset, BigInt(WORD)); // payload offset
    writeAbiBytes(data, offset, payload);
    return data;
};

/**
 * Encode a notice as a `Notice` call of the rollups contracts `Outputs`
 * interface.
 * @param notice notice to encode; the `payload` may be a hex string or byte
 * array
 * @param to representation of the encoded data: `"hex"` (the default) or
 * `"bytes"`
 * @returns ABI-encoded output data
 */
export const encodeNotice = <to extends To = "hex">(
    notice: Omit<Notice<Hex | ByteArray>, "type">,
    to?: to,
): EncodedData<to> =>
    (to === "bytes"
        ? encodeNoticeBytes(notice)
        : encodeFunctionData({
              abi: outputsAbi,
              functionName: "Notice",
              args: [asHex(notice.payload)],
          })) as EncodedData<to>;

const encodeVoucherBytes = (
    voucher: Omit<Voucher<Hex | ByteArray>, "type">,
): ByteArray => {
    const payload = asBytes(voucher.payload);
    const data = new Uint8Array(4 + 4 * WORD + ceilWord(payload.length));
    let offset = writeBytes(data, 0, voucherSelector);
    offset = writeAddressWord(data, offset, voucher.destination);
    offset = writeUint256(data, offset, voucher.value);
    offset = writeUint256(data, offset, BigInt(3 * WORD)); // payload offset
    writeAbiBytes(data, offset, payload);
    return data;
};

/**
 * Encode a voucher as a `Voucher` call of the rollups contracts `Outputs`
 * interface.
 * @param voucher voucher to encode; the `payload` may be a hex string or byte
 * array
 * @param to representation of the encoded data: `"hex"` (the default) or
 * `"bytes"`
 * @returns ABI-encoded output data
 */
export const encodeVoucher = <to extends To = "hex">(
    voucher: Omit<Voucher<Hex | ByteArray>, "type">,
    to?: to,
): EncodedData<to> =>
    (to === "bytes"
        ? encodeVoucherBytes(voucher)
        : encodeFunctionData({
              abi: outputsAbi,
              functionName: "Voucher",
              args: [
                  voucher.destination,
                  voucher.value,
                  asHex(voucher.payload),
              ],
          })) as EncodedData<to>;

const encodeDelegateCallVoucherBytes = (
    voucher: Omit<DelegateCallVoucher<Hex | ByteArray>, "type">,
): ByteArray => {
    const payload = asBytes(voucher.payload);
    const data = new Uint8Array(4 + 3 * WORD + ceilWord(payload.length));
    let offset = writeBytes(data, 0, delegateCallVoucherSelector);
    offset = writeAddressWord(data, offset, voucher.destination);
    offset = writeUint256(data, offset, BigInt(2 * WORD)); // payload offset
    writeAbiBytes(data, offset, payload);
    return data;
};

/**
 * Encode a delegate call voucher as a `DelegateCallVoucher` call of the
 * rollups contracts `Outputs` interface.
 * @param voucher delegate call voucher to encode; the `payload` may be a hex
 * string or byte array
 * @param to representation of the encoded data: `"hex"` (the default) or
 * `"bytes"`
 * @returns ABI-encoded output data
 */
export const encodeDelegateCallVoucher = <to extends To = "hex">(
    voucher: Omit<DelegateCallVoucher<Hex | ByteArray>, "type">,
    to?: to,
): EncodedData<to> =>
    (to === "bytes"
        ? encodeDelegateCallVoucherBytes(voucher)
        : encodeFunctionData({
              abi: outputsAbi,
              functionName: "DelegateCallVoucher",
              args: [voucher.destination, asHex(voucher.payload)],
          })) as EncodedData<to>;

/**
 * Encode an output as one of the functions of the rollups contracts `Outputs`
 * interface. This is the inverse of `decodeOutput`, useful for testing.
 * @param output output to encode, discriminated by the `type` field; the
 * `payload` may be a hex string or byte array
 * @param to representation of the encoded data: `"hex"` (the default) or
 * `"bytes"`
 * @returns ABI-encoded output data
 */
export const encodeOutput = <to extends To = "hex">(
    output: Output<Hex | ByteArray>,
    to?: to,
): EncodedData<to> => {
    switch (output.type) {
        case "Notice":
            return encodeNotice(output, to);
        case "Voucher":
            return encodeVoucher(output, to);
        case "DelegateCallVoucher":
            return encodeDelegateCallVoucher(output, to);
    }
};
