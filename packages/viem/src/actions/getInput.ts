import { numberToHex, Transport } from "viem";
import { CartesiPublicClient } from "../clients/createCartesiPublicClient.js";
import {
    type GetInputParams,
    type GetInputReturnType,
} from "../types/actions.js";
import { inputConverter } from "../types/converter.js";

export const getInput = async (
    client: CartesiPublicClient<Transport>,
    params: GetInputParams,
): Promise<GetInputReturnType> => {
    const { data: input } = await client.request({
        method: "cartesi_getInput",
        params: {
            application: params.application,
            input_index: numberToHex(params.inputIndex),
        },
    });
    return inputConverter(input);
};
