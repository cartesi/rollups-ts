import { Transport } from "viem";
import { CartesiPublicClient } from "../clients/createCartesiPublicClient";
import {
    type GetApplicationParams,
    type GetApplicationReturnType,
} from "../types/actions";
import { applicationConverter } from "../types/converter";

export const getApplication = async (
    client: CartesiPublicClient<Transport>,
    params: GetApplicationParams,
): Promise<GetApplicationReturnType> => {
    const application = await client.request({
        method: "cartesi_getApplication",
        params,
    });
    return applicationConverter(application);
};
