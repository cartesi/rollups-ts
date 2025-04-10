import { Client, hexToBigInt, Transport } from "viem";
import { PublicCartesiRpcSchema } from "../decorators/publicL2.js";
import {
    type GetProcessedInputCountParams,
    type GetProcessedInputCountReturnType,
} from "../types/actions.js";

export const getProcessedInputCount = async (
    client: Client<Transport, undefined, undefined, PublicCartesiRpcSchema>,
    params: GetProcessedInputCountParams,
): Promise<GetProcessedInputCountReturnType> => {
    const { processed_inputs } = await client.request({
        method: "cartesi_getProcessedInputCount",
        params,
    });
    return hexToBigInt(processed_inputs);
};
