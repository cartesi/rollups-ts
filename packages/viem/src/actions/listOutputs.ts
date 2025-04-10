import { Client, numberToHex, Transport } from "viem";
import { PublicCartesiRpcSchema } from "../decorators/publicL2.js";
import {
    type ListOutputsParams,
    type ListOutputsReturnType,
} from "../types/actions.js";
import { outputConverter, paginationConverter } from "../types/converter.js";

export const listOutputs = async (
    client: Client<Transport, undefined, undefined, PublicCartesiRpcSchema>,
    params: ListOutputsParams,
): Promise<ListOutputsReturnType> => {
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
            output_type: params.outputType,
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
