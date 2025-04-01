import { Transport } from "viem";
import { CartesiPublicClient } from "../clients/createCartesiPublicClient";
import {
    type ListEpochsParams,
    type ListEpochsReturnType,
} from "../types/actions";
import { epochConverter, paginationConverter } from "../types/converter";

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
