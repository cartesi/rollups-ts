import { numberToHex, Transport } from "viem";
import { CartesiPublicClient } from "../clients/createCartesiPublicClient.js";
import {
    type GetReportParams,
    type GetReportReturnType,
} from "../types/actions.js";
import { reportConverter } from "../types/converter.js";

export const getReport = async (
    client: CartesiPublicClient<Transport>,
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
