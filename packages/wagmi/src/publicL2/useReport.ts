import type { CartesiPublicClient, GetReportParams } from "@cartesi/viem";
import { queryOptions, skipToken, useQuery } from "@tanstack/react-query";
import { useCartesiClient } from "./provider.js";

const reportOptions = (
    client: CartesiPublicClient,
    params: Partial<GetReportParams>,
) =>
    queryOptions({
        queryKey: [
            "report",
            { ...params, reportIndex: params.reportIndex?.toString() },
        ],
        queryFn:
            params.application && params.reportIndex
                ? () =>
                      client.getReport({
                          application: params.application as string,
                          reportIndex: params.reportIndex as bigint,
                      })
                : skipToken,
    });

export const useReport = (
    params: Partial<GetReportParams> &
        Omit<ReturnType<typeof reportOptions>, "queryKey" | "queryFn">,
) => {
    const client = useCartesiClient();
    return useQuery({
        ...reportOptions(client, params),
        ...params,
    });
};
