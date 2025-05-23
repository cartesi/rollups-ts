import type { Client, Transport } from "viem";
import type { PublicCartesiRpcSchema } from "../decorators/publicL2.js";
import type {
    GetApplicationParams,
    GetApplicationReturnType,
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
