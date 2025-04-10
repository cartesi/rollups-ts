import { Client, Transport } from "viem";
import { PublicCartesiRpcSchema } from "../decorators/publicL2.js";
import {
    type GetLastAcceptedEpochParams,
    type GetLastAcceptedEpochReturnType,
} from "../types/actions.js";
import { epochConverter } from "../types/converter.js";

export const getLastAcceptedEpoch = async (
    client: Client<Transport, undefined, undefined, PublicCartesiRpcSchema>,
    params: GetLastAcceptedEpochParams,
): Promise<GetLastAcceptedEpochReturnType> => {
    const { data: epoch } = await client.request({
        method: "cartesi_getLastAcceptedEpoch",
        params,
    });
    return epochConverter(epoch);
};
