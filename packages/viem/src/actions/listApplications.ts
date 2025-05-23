import type { Client, Transport } from "viem";
import type { PublicCartesiRpcSchema } from "../decorators/publicL2.js";
import type {
    ListApplicationsParams,
    ListApplicationsReturnType,
} from "../types/actions.js";
import {
    applicationConverter,
    paginationConverter,
} from "../types/converter.js";

export const listApplications = async (
    client: Client<Transport, undefined, undefined, PublicCartesiRpcSchema>,
    params: ListApplicationsParams,
): Promise<ListApplicationsReturnType> => {
    const result = await client.request({
        method: "cartesi_listApplications",
        params: params ?? {},
    });
    return {
        pagination: paginationConverter(result.pagination),
        data: result.data.map(applicationConverter),
    };
};
