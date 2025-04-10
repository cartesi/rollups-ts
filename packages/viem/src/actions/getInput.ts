import { Client, numberToHex, Transport } from "viem";
import { PublicCartesiRpcSchema } from "../decorators/publicL2.js";
import {
    type GetInputParams,
    type GetInputReturnType,
} from "../types/actions.js";
import { inputConverter } from "../types/converter.js";

export const getInput = async (
    client: Client<Transport, undefined, undefined, PublicCartesiRpcSchema>,
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
