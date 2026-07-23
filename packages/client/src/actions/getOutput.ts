import { type Client, type Transport, numberToHex } from "viem";
import type { PublicCartesiRpcSchema } from "../decorators/publicL2.js";
import type { GetOutputParams, GetOutputReturnType } from "../types/actions.js";
import { outputConverter } from "../types/converter.js";

export const getOutput = async (
    client: Client<Transport, undefined, undefined, PublicCartesiRpcSchema>,
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
