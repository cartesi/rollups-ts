import type { CartesiPublicClient, ListReportsParams } from "@cartesi/viem";
import { queryOptions, skipToken, useQuery } from "@tanstack/react-query";
import { useCartesiClient } from "./provider.js";
import { serverUrl } from "./serverUrl.js";

export const reportsOptions = (
    client: CartesiPublicClient,
    params: Partial<ListReportsParams>,
) =>
    queryOptions({
        queryKey: [
            serverUrl(client),
            "reports",
            {
                ...params,
                epochIndex: params.epochIndex?.toString(),
                inputIndex: params.inputIndex?.toString(),
            },
        ],
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
