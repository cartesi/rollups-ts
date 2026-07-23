import type { CartesiPublicClient, GetReportParams } from "@cartesi/client";
import { queryOptions, skipToken, useQuery } from "@tanstack/react-query";
import { useCartesiClient } from "./provider.js";
import { serverUrl } from "./serverUrl.js";

export const reportQueryKey = (
    client: CartesiPublicClient,
    params: Partial<GetReportParams>,
) => [
    serverUrl(client),
    "report",
    { ...params, reportIndex: params.reportIndex?.toString() },
];

export const reportOptions = (
    client: CartesiPublicClient,
    params: Partial<GetReportParams>,
) =>
    queryOptions({
        queryKey: reportQueryKey(client, params),
        queryFn:
            params.application !== undefined && params.reportIndex !== undefined
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
