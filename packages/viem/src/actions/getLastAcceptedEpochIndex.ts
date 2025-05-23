import { type Client, type Transport, hexToBigInt } from "viem";
import type { PublicCartesiRpcSchema } from "../decorators/publicL2.js";
import type {
    GetLastAcceptedEpochIndexParams,
    GetLastAcceptedEpochIndexReturnType,
} from "../types/actions.js";

export const getLastAcceptedEpochIndex = async (
    client: Client<Transport, undefined, undefined, PublicCartesiRpcSchema>,
    params: GetLastAcceptedEpochIndexParams,
): Promise<GetLastAcceptedEpochIndexReturnType> => {
    const { data: epochIndex } = await client.request({
        method: "cartesi_getLastAcceptedEpochIndex",
        params,
    });
    return hexToBigInt(epochIndex);
};
