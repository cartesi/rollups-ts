import type { Client, Hex, Transport } from "viem";
import { getAbiItem, numberToHex, toFunctionSelector } from "viem";
import type { PublicCartesiRpcSchema } from "../decorators/publicL2.js";
import { outputsAbi } from "../rollups.js";
import type {
    ListOutputsParams,
    ListOutputsReturnType,
    NonEmptyArray,
    OutputType,
} from "../types/actions.js";
import { outputConverter, paginationConverter } from "../types/converter.js";

const toOutputSelector = (outputType: OutputType): Hex =>
    toFunctionSelector(getAbiItem({ abi: outputsAbi, name: outputType }));

const toOutputType = (
    outputType?: OutputType | NonEmptyArray<OutputType>,
): Hex | NonEmptyArray<Hex> | undefined => {
    if (outputType === undefined) return undefined;
    if (typeof outputType === "string") return toOutputSelector(outputType);
    // mapped through the head separately so the result stays a non-empty
    // array for the type checker, which `Array.prototype.map` would widen
    const [first, ...rest] = outputType;
    return [toOutputSelector(first), ...rest.map(toOutputSelector)];
};

export const listOutputs = async (
    client: Client<Transport, undefined, undefined, PublicCartesiRpcSchema>,
    params: ListOutputsParams,
): Promise<ListOutputsReturnType> => {
    const output_type = toOutputType(params.outputType);
    const outputs = await client.request({
        method: "cartesi_listOutputs",
        params: {
            ...params,
            epoch_index:
                params.epochIndex !== undefined
                    ? numberToHex(params.epochIndex)
                    : undefined,
            input_index:
                params.inputIndex !== undefined
                    ? numberToHex(params.inputIndex)
                    : undefined,
            output_type,
            voucher_address: params.voucherAddress,
            from:
                params.from !== undefined
                    ? numberToHex(params.from)
                    : undefined,
            to: params.to !== undefined ? numberToHex(params.to) : undefined,
        },
    });
    return {
        data: outputs.data.map(outputConverter),
        pagination: paginationConverter(outputs.pagination),
    };
};
