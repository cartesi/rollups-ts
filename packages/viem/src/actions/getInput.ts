import { numberToHex, Transport } from "viem";
import { CartesiPublicClient } from "../clients/createCartesiPublicClient";
import { type GetInputParams, type GetInputReturnType } from "../types/actions";
import { inputConverter } from "../types/converter";

export const getInput = async (
    client: CartesiPublicClient<Transport>,
    params: GetInputParams,
): Promise<GetInputReturnType> => {
    const input = await client.request({
        method: "cartesi_getInput",
        params: {
            application: params.application,
            input_index: numberToHex(params.inputIndex),
        },
    });
    return inputConverter(input);
};
