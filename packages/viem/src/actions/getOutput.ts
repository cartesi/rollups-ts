import { numberToHex, Transport } from "viem";
import { CartesiPublicClient } from "../clients/createCartesiPublicClient.js";
import {
    type GetOutputParams,
    type GetOutputReturnType,
} from "../types/actions.js";
import { outputConverter } from "../types/converter.js";

export const getOutput = async (
    client: CartesiPublicClient<Transport>,
    params: GetOutputParams,
): Promise<GetOutputReturnType> => {
    const { data: output } = await client.request({
        method: "cartesi_getOutput",
        params: {
            application: params.application,
            output_index: numberToHex(params.outputIndex),
        },
    });
    return outputConverter(output);
};
