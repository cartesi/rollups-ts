import { Transport } from "viem";
import { CartesiPublicClient } from "../clients/createCartesiPublicClient.js";
import {
    type ListEpochsParams,
    type ListEpochsReturnType,
} from "../types/actions.js";
import { epochConverter, paginationConverter } from "../types/converter.js";

export const listEpochs = async (
    client: CartesiPublicClient<Transport>,
    params: ListEpochsParams,
): Promise<ListEpochsReturnType> => {
    const epochs = await client.request({
        method: "cartesi_listEpochs",
        params,
    });
    return {
        data: epochs.data.map(epochConverter),
        pagination: paginationConverter(epochs.pagination),
    };
};
