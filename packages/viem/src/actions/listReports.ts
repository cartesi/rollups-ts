import { Client, numberToHex, Transport } from "viem";
import { PublicCartesiRpcSchema } from "../decorators/publicL2.js";
import {
    type ListReportsParams,
    type ListReportsReturnType,
} from "../types/actions.js";
import { paginationConverter, reportConverter } from "../types/converter.js";

export const listReports = async (
    client: Client<Transport, undefined, undefined, PublicCartesiRpcSchema>,
    params: ListReportsParams,
): Promise<ListReportsReturnType> => {
    const reports = await client.request({
        method: "cartesi_listReports",
        params: {
            application: params.application,
            epoch_index: params.epochIndex
                ? numberToHex(params.epochIndex)
                : undefined,
            input_index: params.inputIndex
                ? numberToHex(params.inputIndex)
                : undefined,
            limit: params.limit,
            offset: params.offset,
        },
    });
    return {
        data: reports.data.map(reportConverter),
        pagination: paginationConverter(reports.pagination),
    };
};
