import { Client, numberToHex, Transport } from "viem";
import { PublicCartesiRpcSchema } from "../decorators/publicL2.js";
import {
    type GetReportParams,
    type GetReportReturnType,
} from "../types/actions.js";
import { reportConverter } from "../types/converter.js";

export const getReport = async (
    client: Client<Transport, undefined, undefined, PublicCartesiRpcSchema>,
    params: GetReportParams,
): Promise<GetReportReturnType> => {
    const { data: report } = await client.request({
        method: "cartesi_getReport",
        params: {
            application: params.application,
            report_index: numberToHex(params.reportIndex),
        },
    });
    return reportConverter(report);
};
