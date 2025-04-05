import { Transport } from "viem";
import { CartesiPublicClient } from "../clients/createCartesiPublicClient";
import {
    type GetLastAcceptedEpochParams,
    type GetLastAcceptedEpochReturnType,
} from "../types/actions";
import { epochConverter } from "../types/converter";

export const getLastAcceptedEpoch = async (
    client: CartesiPublicClient<Transport>,
    params: GetLastAcceptedEpochParams,
): Promise<GetLastAcceptedEpochReturnType> => {
    const epoch = await client.request({
        method: "cartesi_getLastAcceptedEpoch",
        params,
    });
    return epochConverter(epoch);
};
