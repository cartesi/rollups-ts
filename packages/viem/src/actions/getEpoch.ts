import { numberToHex, Transport } from "viem";
import { CartesiPublicClient } from "../clients/createCartesiPublicClient.js";
import {
    type GetEpochParams,
    type GetEpochReturnType,
} from "../types/actions.js";
import { epochConverter } from "../types/converter.js";

export const getEpoch = async (
    client: CartesiPublicClient<Transport>,
    params: GetEpochParams,
): Promise<GetEpochReturnType> => {
    const { data: epoch } = await client.request({
        method: "cartesi_getEpoch",
        params: {
            application: params.application,
            epoch_index: numberToHex(params.epochIndex),
        },
    });
    return epochConverter(epoch);
};
