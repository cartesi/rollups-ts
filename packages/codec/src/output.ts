import type { ExtractAbiFunction, ExtractAbiFunctionNames } from "abitype";
import { decodeFunctionData, encodeFunctionData, type Hex } from "viem";
import { outputsAbi } from "./rollups.js";
import type { ParamsToObject, Prettify } from "./types.js";

type OutputName = ExtractAbiFunctionNames<typeof outputsAbi>;

/**
 * Output variant named `name`, with the `type` discriminator field plus
 * fields inferred from the arguments of the homonymous function of the
 * rollups contracts `Outputs` interface.
 */
type OutputOf<name extends OutputName> = Prettify<
    { type: name } & ParamsToObject<
        ExtractAbiFunction<typeof outputsAbi, name>["inputs"]
    >
>;

/**
 * Notice output: informational statement that can be validated on the base
 * layer, but not executed.
 */
export type Notice = OutputOf<"Notice">;

/**
 * Voucher output: a single-use permission to execute a `CALL` to a base layer
 * contract on behalf of the application.
 */
export type Voucher = OutputOf<"Voucher">;

/**
 * Delegate call voucher output: a single-use permission to execute a
 * `DELEGATECALL` to a base layer contract in the context of the application
 * contract.
 */
export type DelegateCallVoucher = OutputOf<"DelegateCallVoucher">;

/**
 * Output of a Cartesi application, as defined by the rollups contracts
 * `Outputs` interface, discriminated by the `type` field.
 */
export type Output = { [name in OutputName]: OutputOf<name> }[OutputName];

/**
 * Decode a blob of output data as one of the functions of the rollups
 * contracts `Outputs` interface.
 * @param data ABI-encoded output data
 * @returns decoded output, discriminated by the `type` field
 * @throws viem `AbiFunctionSignatureNotFoundError` if the data does not start
 * with the selector of one of the `Outputs` functions
 */
export const decodeOutput = (data: Hex): Output => {
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

/**
 * Encode a notice as a `Notice` call of the rollups contracts `Outputs`
 * interface.
 * @param notice notice to encode
 * @returns ABI-encoded output data
 */
export const encodeNotice = (notice: Omit<Notice, "type">): Hex =>
    encodeFunctionData({
        abi: outputsAbi,
        functionName: "Notice",
        args: [notice.payload],
    });

/**
 * Encode a voucher as a `Voucher` call of the rollups contracts `Outputs`
 * interface.
 * @param voucher voucher to encode
 * @returns ABI-encoded output data
 */
export const encodeVoucher = (voucher: Omit<Voucher, "type">): Hex =>
    encodeFunctionData({
        abi: outputsAbi,
        functionName: "Voucher",
        args: [voucher.destination, voucher.value, voucher.payload],
    });

/**
 * Encode a delegate call voucher as a `DelegateCallVoucher` call of the
 * rollups contracts `Outputs` interface.
 * @param voucher delegate call voucher to encode
 * @returns ABI-encoded output data
 */
export const encodeDelegateCallVoucher = (
    voucher: Omit<DelegateCallVoucher, "type">,
): Hex =>
    encodeFunctionData({
        abi: outputsAbi,
        functionName: "DelegateCallVoucher",
        args: [voucher.destination, voucher.payload],
    });

/**
 * Encode an output as one of the functions of the rollups contracts `Outputs`
 * interface. This is the inverse of `decodeOutput`, useful for testing.
 * @param output output to encode, discriminated by the `type` field
 * @returns ABI-encoded output data
 */
export const encodeOutput = (output: Output): Hex => {
    switch (output.type) {
        case "Notice":
            return encodeNotice(output);
        case "Voucher":
            return encodeVoucher(output);
        case "DelegateCallVoucher":
            return encodeDelegateCallVoucher(output);
    }
};
