import { Client, Transport } from "viem";
import { PublicCartesiRpcSchema } from "../decorators/publicL2.js";
import {
    type ListApplicationsParams,
    type ListApplicationsReturnType,
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
