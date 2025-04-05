import { Transport } from "viem";
import { CartesiPublicClient } from "../clients/createCartesiPublicClient";
import {
    type ListApplicationsParams,
    type ListApplicationsReturnType,
} from "../types/actions";
import { applicationConverter, paginationConverter } from "../types/converter";

export const listApplications = async (
    client: CartesiPublicClient<Transport>,
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
