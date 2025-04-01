import { Transport } from "viem";
import { CartesiPublicClient } from "../clients/createCartesiPublicClient.js";
import {
    type GetApplicationParams,
    type GetApplicationReturnType,
} from "../types/actions.js";
import { applicationConverter } from "../types/converter.js";

export const getApplication = async (
    client: CartesiPublicClient<Transport>,
    params: GetApplicationParams,
): Promise<GetApplicationReturnType> => {
    const { data: application } = await client.request({
        method: "cartesi_getApplication",
        params,
    });
    return applicationConverter(application);
};
