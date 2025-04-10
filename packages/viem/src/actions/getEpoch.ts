import { Client, numberToHex, Transport } from "viem";
import { PublicCartesiRpcSchema } from "../decorators/publicL2.js";
import {
    type GetEpochParams,
    type GetEpochReturnType,
} from "../types/actions.js";
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
