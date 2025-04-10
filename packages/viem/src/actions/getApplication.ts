import { Client, Transport } from "viem";
import { PublicCartesiRpcSchema } from "../decorators/publicL2.js";
import {
    type GetApplicationParams,
    type GetApplicationReturnType,
} from "../types/actions.js";
import { applicationConverter } from "../types/converter.js";

export const getApplication = async (
    client: Client<Transport, undefined, undefined, PublicCartesiRpcSchema>,
    params: GetApplicationParams,
): Promise<GetApplicationReturnType> => {
    const { data: application } = await client.request({
        method: "cartesi_getApplication",
        params,
    });
    return applicationConverter(application);
};
