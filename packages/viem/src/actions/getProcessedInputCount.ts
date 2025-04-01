import { hexToBigInt, Transport } from "viem";
import { CartesiPublicClient } from "../clients/createCartesiPublicClient.js";
import {
    type GetProcessedInputCountParams,
    type GetProcessedInputCountReturnType,
} from "../types/actions.js";

export const getProcessedInputCount = async (
    client: CartesiPublicClient<Transport>,
    params: GetProcessedInputCountParams,
): Promise<GetProcessedInputCountReturnType> => {
    const { processed_inputs } = await client.request({
        method: "cartesi_getProcessedInputCount",
        params,
    });
    return hexToBigInt(processed_inputs);
};
