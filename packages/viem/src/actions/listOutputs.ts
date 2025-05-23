import type { Client, Hex, Transport } from "viem";
import { getAbiItem, numberToHex, toFunctionSelector } from "viem";
import type { PublicCartesiRpcSchema } from "../decorators/publicL2.js";
import { outputsAbi } from "../rollups.js";
import type {
    ListOutputsParams,
    ListOutputsReturnType,
    OutputType,
} from "../types/actions.js";
import { outputConverter, paginationConverter } from "../types/converter.js";

const toOutputType = (outputType?: OutputType): Hex | undefined => {
    switch (outputType) {
        case "Notice":
            return toFunctionSelector(
                getAbiItem({
                    abi: outputsAbi,
                    name: "Notice",
                }),
            );
        case "Voucher":
            return toFunctionSelector(
                getAbiItem({
                    abi: outputsAbi,
                    name: "Voucher",
                }),
            );
        case "DelegateCallVoucher":
            return toFunctionSelector(
                getAbiItem({
                    abi: outputsAbi,
                    name: "DelegateCallVoucher",
                }),
            );
    }
    return undefined;
};

export const listOutputs = async (
    client: Client<Transport, undefined, undefined, PublicCartesiRpcSchema>,
    params: ListOutputsParams,
): Promise<ListOutputsReturnType> => {
    const output_type = toOutputType(params.outputType);
    const outputs = await client.request({
        method: "cartesi_listOutputs",
        params: {
            application: params.application,
            epoch_index: params.epochIndex
                ? numberToHex(params.epochIndex)
                : undefined,
            input_index: params.inputIndex
                ? numberToHex(params.inputIndex)
                : undefined,
            output_type,
            voucher_address: params.voucherAddress,
            limit: params.limit,
            offset: params.offset,
        },
    });
    return {
        data: outputs.data.map(outputConverter),
        pagination: paginationConverter(outputs.pagination),
    };
};
