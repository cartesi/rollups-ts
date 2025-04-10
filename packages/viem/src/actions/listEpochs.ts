import { Client, Transport } from "viem";
import { PublicCartesiRpcSchema } from "../decorators/publicL2.js";
import {
    type ListEpochsParams,
    type ListEpochsReturnType,
} from "../types/actions.js";
import { epochConverter, paginationConverter } from "../types/converter.js";

export const listEpochs = async (
    client: Client<Transport, undefined, undefined, PublicCartesiRpcSchema>,
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
