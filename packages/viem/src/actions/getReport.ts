import { numberToHex, Transport } from "viem";
import { CartesiPublicClient } from "../clients/createCartesiPublicClient";
import {
    type GetReportParams,
    type GetReportReturnType,
} from "../types/actions";
import { reportConverter } from "../types/converter";

export const getReport = async (
    client: CartesiPublicClient<Transport>,
    params: GetReportParams,
): Promise<GetReportReturnType> => {
    const report = await client.request({
        method: "cartesi_getReport",
        params: {
            application: params.application,
            report_index: numberToHex(params.reportIndex),
        },
    });
    return reportConverter(report);
};
