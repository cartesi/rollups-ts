import { numberToHex, Transport } from "viem";
import { CartesiPublicClient } from "../clients/createCartesiPublicClient";
import { type GetEpochParams, type GetEpochReturnType } from "../types/actions";
import { epochConverter } from "../types/converter";

export const getEpoch = async (
    client: CartesiPublicClient<Transport>,
    params: GetEpochParams,
): Promise<GetEpochReturnType> => {
    const epoch = await client.request({
        method: "cartesi_getEpoch",
        params: {
            application: params.application,
            epoch_index: numberToHex(params.epochIndex),
        },
    });
    return epochConverter(epoch);
};
