import { numberToHex, Transport } from "viem";
import { CartesiPublicClient } from "../clients/createCartesiPublicClient.js";
import {
    type ListInputsParams,
    type ListInputsReturnType,
} from "../types/actions.js";
import { inputConverter, paginationConverter } from "../types/converter.js";

export const listInputs = async (
    client: CartesiPublicClient<Transport>,
    params: ListInputsParams,
): Promise<ListInputsReturnType> => {
    const inputs = await client.request({
        method: "cartesi_listInputs",
        params: {
            application: params.application,
            epoch_index: params.epochIndex
                ? numberToHex(params.epochIndex)
                : undefined,
            sender: params.sender,
            limit: params.limit,
            offset: params.offset,
        },
    });
    return {
        data: inputs.data.map(inputConverter),
        pagination: paginationConverter(inputs.pagination),
    };
};
