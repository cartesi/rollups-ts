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
import { outputsAbi } from "./rollups.js";
import type { ParamsToObject, Prettify, To } from "./types.js";

type OutputName = AbiFunction.ExtractNames<typeof outputsAbi>;

/**
 * Output variant named `name`, with the `type` discriminator field plus
 * fields inferred from the arguments of the homonymous function of the
 * rollups contracts `Outputs` interface. The `bytes` parameter selects the
 * representation of the `payload` field: `Hex` (the default) or `Uint8Array`.
 */
type OutputOf<
    name extends OutputName,
    bytes extends Hex.Hex | Bytes.Bytes = Hex.Hex,
> = Prettify<
    { type: name } & ParamsToObject<
        AbiFunction.FromAbi<typeof outputsAbi, name>["inputs"],
        bytes
    >
>;

/**
 * Notice output: informational statement that can be validated on the base
 * layer, but not executed.
 */
export type Notice<bytes extends Hex.Hex | Bytes.Bytes = Hex.Hex> = OutputOf<
    "Notice",
    bytes
>;

/**
 * Voucher output: a single-use permission to execute a `CALL` to a base layer
 * contract on behalf of the application.
 */
export type Voucher<bytes extends Hex.Hex | Bytes.Bytes = Hex.Hex> = OutputOf<
    "Voucher",
    bytes
>;

/**
 * Delegate call voucher output: a single-use permission to execute a
 * `DELEGATECALL` to a base layer contract in the context of the application
 * contract.
 */
export type DelegateCallVoucher<bytes extends Hex.Hex | Bytes.Bytes = Hex.Hex> =
    OutputOf<"DelegateCallVoucher", bytes>;

/**
 * Output of a Cartesi application, as defined by the rollups contracts
 * `Outputs` interface, discriminated by the `type` field.
 */
export type Output<bytes extends Hex.Hex | Bytes.Bytes = Hex.Hex> = {
    [name in OutputName]: OutputOf<name, bytes>;
}[OutputName];

// the Outputs ABI items, resolved once. `satisfies Record<OutputName, ...>`
// fails to compile if the pinned rollups-contracts release grows a function
// this module does not handle, which is what the `functionName` switch of a
// resolving decoder used to catch.
const outputAbi = {
    Notice: AbiFunction.fromAbi(outputsAbi, "Notice"),
    Voucher: AbiFunction.fromAbi(outputsAbi, "Voucher"),
    DelegateCallVoucher: AbiFunction.fromAbi(outputsAbi, "DelegateCallVoucher"),
} satisfies Record<OutputName, AbiFunction.AbiFunction>;

// their selectors, in the representation each decode path dispatches on and
// each byte array encoder writes
const selector = {
    Notice: AbiFunction.getSelector(outputAbi.Notice),
    Voucher: AbiFunction.getSelector(outputAbi.Voucher),
    DelegateCallVoucher: AbiFunction.getSelector(outputAbi.DelegateCallVoucher),
} satisfies Record<OutputName, Hex.Hex>;

const selectorBytes = {
    Notice: Hex.toBytes(selector.Notice),
    Voucher: Hex.toBytes(selector.Voucher),
    DelegateCallVoucher: Hex.toBytes(selector.DelegateCallVoucher),
} satisfies Record<OutputName, Bytes.Bytes>;

// dispatch on the selector rather than letting the decoder resolve the
// function, both because `decodeData` does not check it when handed a
// resolved item and because naming the item statically in each branch is
// what keeps the decoded tuple exactly typed. Mirrors decodeOutputBytes.
const decodeOutputHex = (data: Hex.Hex): Output => {
    const dataSelector = Hex.slice(data, 0, 4);
    switch (dataSelector) {
        case selector.Notice: {
            // a notice carries no address, so there is nothing to checksum
            const [payload] = AbiFunction.decodeData(outputAbi.Notice, data);
            return { type: "Notice", payload };
        }
        case selector.Voucher: {
            const [destination, value, payload] = AbiFunction.decodeData(
                outputAbi.Voucher,
                data,
                { checksumAddress: true },
            );
            return { type: "Voucher", destination, value, payload };
        }
        case selector.DelegateCallVoucher: {
            const [destination, payload] = AbiFunction.decodeData(
                outputAbi.DelegateCallVoucher,
                data,
                { checksumAddress: true },
            );
            return { type: "DelegateCallVoucher", destination, payload };
        }
        default:
            return selectorNotFound(dataSelector);
    }
};

// hand-rolled decoder over the fixed Outputs calldata layouts, so byte array
// data is decoded without a hex conversion and the payload is a zero-copy
// subarray of the data
const decodeOutputBytes = (data: Bytes.Bytes): Output<Bytes.Bytes> => {
    const base = 4;
    if (hasSelector(data, selectorBytes.Notice)) {
        return {
            type: "Notice",
            payload: readAbiBytes(data, base, base),
        };
    }
    if (hasSelector(data, selectorBytes.Voucher)) {
        return {
            type: "Voucher",
            destination: readAddressWord(data, base),
            value: readUint256(data, base + WORD),
            payload: readAbiBytes(data, base, base + 2 * WORD),
        };
    }
    if (hasSelector(data, selectorBytes.DelegateCallVoucher)) {
        return {
            type: "DelegateCallVoucher",
            destination: readAddressWord(data, base),
            payload: readAbiBytes(data, base, base + WORD),
        };
    }
    return selectorNotFound(data.subarray(0, 4));
};

/**
 * Decode a blob of output data as one of the functions of the rollups
 * contracts `Outputs` interface.
 * @param data ABI-encoded output data, as a hex string or byte array
 * @returns decoded output, discriminated by the `type` field; the `payload`
 * follows the representation of `data`, and is a zero-copy subarray when
 * `data` is a byte array
 * @throws ox `AbiItem.NotFoundError` if the data does not start with the
 * selector of one of the `Outputs` functions
 */
export function decodeOutput(data: Hex.Hex): Output;
export function decodeOutput(data: Bytes.Bytes): Output<Bytes.Bytes>;
export function decodeOutput(
    data: Hex.Hex | Bytes.Bytes,
): Output<Hex.Hex | Bytes.Bytes>;
export function decodeOutput(
    data: Hex.Hex | Bytes.Bytes,
): Output<Hex.Hex | Bytes.Bytes> {
    return typeof data === "string"
        ? decodeOutputHex(data)
        : decodeOutputBytes(data);
}

const encodeNoticeBytes = (
    notice: Omit<Notice<Hex.Hex | Bytes.Bytes>, "type">,
): Bytes.Bytes => {
    const payload = asBytes(notice.payload);
    const data = new Uint8Array(4 + 2 * WORD + ceilWord(payload.length));
    let offset = writeBytes(data, 0, selectorBytes.Notice);
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
export function encodeNotice(
    notice: Omit<Notice<Hex.Hex | Bytes.Bytes>, "type">,
    to?: "hex",
): Hex.Hex;
export function encodeNotice(
    notice: Omit<Notice<Hex.Hex | Bytes.Bytes>, "type">,
    to: "bytes",
): Bytes.Bytes;
export function encodeNotice(
    notice: Omit<Notice<Hex.Hex | Bytes.Bytes>, "type">,
    to?: To,
): Hex.Hex | Bytes.Bytes;
export function encodeNotice(
    notice: Omit<Notice<Hex.Hex | Bytes.Bytes>, "type">,
    to?: To,
): Hex.Hex | Bytes.Bytes {
    return to === "bytes"
        ? encodeNoticeBytes(notice)
        : AbiFunction.encodeData(outputAbi.Notice, [asHex(notice.payload)]);
}

const encodeVoucherBytes = (
    voucher: Omit<Voucher<Hex.Hex | Bytes.Bytes>, "type">,
): Bytes.Bytes => {
    const payload = asBytes(voucher.payload);
    const data = new Uint8Array(4 + 4 * WORD + ceilWord(payload.length));
    let offset = writeBytes(data, 0, selectorBytes.Voucher);
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
export function encodeVoucher(
    voucher: Omit<Voucher<Hex.Hex | Bytes.Bytes>, "type">,
    to?: "hex",
): Hex.Hex;
export function encodeVoucher(
    voucher: Omit<Voucher<Hex.Hex | Bytes.Bytes>, "type">,
    to: "bytes",
): Bytes.Bytes;
export function encodeVoucher(
    voucher: Omit<Voucher<Hex.Hex | Bytes.Bytes>, "type">,
    to?: To,
): Hex.Hex | Bytes.Bytes;
export function encodeVoucher(
    voucher: Omit<Voucher<Hex.Hex | Bytes.Bytes>, "type">,
    to?: To,
): Hex.Hex | Bytes.Bytes {
    return to === "bytes"
        ? encodeVoucherBytes(voucher)
        : AbiFunction.encodeData(outputAbi.Voucher, [
              voucher.destination,
              voucher.value,
              asHex(voucher.payload),
          ]);
}

const encodeDelegateCallVoucherBytes = (
    voucher: Omit<DelegateCallVoucher<Hex.Hex | Bytes.Bytes>, "type">,
): Bytes.Bytes => {
    const payload = asBytes(voucher.payload);
    const data = new Uint8Array(4 + 3 * WORD + ceilWord(payload.length));
    let offset = writeBytes(data, 0, selectorBytes.DelegateCallVoucher);
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
export function encodeDelegateCallVoucher(
    voucher: Omit<DelegateCallVoucher<Hex.Hex | Bytes.Bytes>, "type">,
    to?: "hex",
): Hex.Hex;
export function encodeDelegateCallVoucher(
    voucher: Omit<DelegateCallVoucher<Hex.Hex | Bytes.Bytes>, "type">,
    to: "bytes",
): Bytes.Bytes;
export function encodeDelegateCallVoucher(
    voucher: Omit<DelegateCallVoucher<Hex.Hex | Bytes.Bytes>, "type">,
    to?: To,
): Hex.Hex | Bytes.Bytes;
export function encodeDelegateCallVoucher(
    voucher: Omit<DelegateCallVoucher<Hex.Hex | Bytes.Bytes>, "type">,
    to?: To,
): Hex.Hex | Bytes.Bytes {
    return to === "bytes"
        ? encodeDelegateCallVoucherBytes(voucher)
        : AbiFunction.encodeData(outputAbi.DelegateCallVoucher, [
              voucher.destination,
              asHex(voucher.payload),
          ]);
}

/**
 * Encode an output as one of the functions of the rollups contracts `Outputs`
 * interface. This is the inverse of `decodeOutput`, useful for testing.
 * @param output output to encode, discriminated by the `type` field; the
 * `payload` may be a hex string or byte array
 * @param to representation of the encoded data: `"hex"` (the default) or
 * `"bytes"`
 * @returns ABI-encoded output data
 */
export function encodeOutput(
    output: Output<Hex.Hex | Bytes.Bytes>,
    to?: "hex",
): Hex.Hex;
export function encodeOutput(
    output: Output<Hex.Hex | Bytes.Bytes>,
    to: "bytes",
): Bytes.Bytes;
export function encodeOutput(
    output: Output<Hex.Hex | Bytes.Bytes>,
    to?: To,
): Hex.Hex | Bytes.Bytes;
export function encodeOutput(
    output: Output<Hex.Hex | Bytes.Bytes>,
    to?: To,
): Hex.Hex | Bytes.Bytes {
    switch (output.type) {
        case "Notice":
            return encodeNotice(output, to);
        case "Voucher":
            return encodeVoucher(output, to);
        case "DelegateCallVoucher":
            return encodeDelegateCallVoucher(output, to);
    }
}
