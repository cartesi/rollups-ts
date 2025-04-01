import { numberToHex, Transport } from "viem";
import { CartesiPublicClient } from "../clients/createCartesiPublicClient";
import {
    type GetOutputParams,
    type GetOutputReturnType,
} from "../types/actions";
import { outputConverter } from "../types/converter";

export const getOutput = async (
    client: CartesiPublicClient<Transport>,
    params: GetOutputParams,
): Promise<GetOutputReturnType> => {
    const output = await client.request({
        method: "cartesi_getOutput",
        params: {
            application: params.application,
            output_index: numberToHex(params.outputIndex),
        },
    });
    return outputConverter(output);
};
