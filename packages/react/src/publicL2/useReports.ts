import type { CartesiPublicClient, ListReportsParams } from "@cartesi/client";
import { queryOptions, skipToken, useQuery } from "@tanstack/react-query";
import { useCartesiClient } from "./provider.js";
import { serverUrl } from "./serverUrl.js";

export const reportsQueryKey = (
    client: CartesiPublicClient,
    params: Partial<ListReportsParams>,
) => [
    serverUrl(client),
    "reports",
    {
        ...params,
        epochIndex: params.epochIndex?.toString(),
        inputIndex: params.inputIndex?.toString(),
        from: params.from?.toString(),
        to: params.to?.toString(),
    },
];

export const reportsOptions = (
    client: CartesiPublicClient,
    params: Partial<ListReportsParams>,
) =>
    queryOptions({
        queryKey: reportsQueryKey(client, params),
        queryFn:
            params.application !== undefined
                ? () =>
                      client.listReports({
                          application: params.application as string,
                          ...params,
                      })
                : skipToken,
    });

export const useReports = (
    params: Partial<ListReportsParams> &
        Omit<ReturnType<typeof reportsOptions>, "queryKey" | "queryFn">,
) => {
    const client = useCartesiClient();
    return useQuery({
        ...reportsOptions(client, params),
        ...params,
    });
};
