import { type Client, type Transport, numberToHex } from "viem";
import type { PublicCartesiRpcSchema } from "../decorators/publicL2.js";
import type { GetEpochParams, GetEpochReturnType } from "../types/actions.js";
import { epochConverter } from "../types/converter.js";

export const getEpoch = async (
    client: Client<Transport, undefined, undefined, PublicCartesiRpcSchema>,
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
