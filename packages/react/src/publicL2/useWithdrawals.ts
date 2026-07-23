import type { CartesiPublicClient, ListWithdrawalsParams } from "@cartesi/client";
import { queryOptions, skipToken, useQuery } from "@tanstack/react-query";
import { useCartesiClient } from "./provider.js";
import { serverUrl } from "./serverUrl.js";

export const withdrawalsQueryKey = (
    client: CartesiPublicClient,
    params: Partial<ListWithdrawalsParams>,
) => [
    serverUrl(client),
    "withdrawals",
    {
        application: params.application,
        accountIndex: params.accountIndex?.toString(),
        limit: params.limit,
        offset: params.offset,
        descending: params.descending,
    },
];

export const withdrawalsOptions = (
    client: CartesiPublicClient,
    params: Partial<ListWithdrawalsParams>,
) =>
    queryOptions({
        queryKey: withdrawalsQueryKey(client, params),
        queryFn:
            params.application !== undefined
                ? () =>
                      client.listWithdrawals({
                          application: params.application as string,
                          accountIndex: params.accountIndex,
                          limit: params.limit,
                          offset: params.offset,
                          descending: params.descending,
                      })
                : skipToken,
    });

export const useWithdrawals = (
    params: Partial<ListWithdrawalsParams> &
        Omit<ReturnType<typeof withdrawalsOptions>, "queryKey" | "queryFn">,
) => {
    const client = useCartesiClient();
    return useQuery({
        ...params,
        ...withdrawalsOptions(client, params),
    });
};
