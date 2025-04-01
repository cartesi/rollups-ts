import { Transport } from "viem";
import { CartesiPublicClient } from "../clients/createCartesiPublicClient.js";
import {
    type GetLastAcceptedEpochParams,
    type GetLastAcceptedEpochReturnType,
} from "../types/actions.js";
import { epochConverter } from "../types/converter.js";

export const getLastAcceptedEpoch = async (
    client: CartesiPublicClient<Transport>,
    params: GetLastAcceptedEpochParams,
): Promise<GetLastAcceptedEpochReturnType> => {
    const { data: epoch } = await client.request({
        method: "cartesi_getLastAcceptedEpoch",
        params,
    });
    return epochConverter(epoch);
};
