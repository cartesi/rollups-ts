import type { CartesiPublicClient, GetWithdrawalParams } from "@cartesi/viem";
import { queryOptions, skipToken, useQuery } from "@tanstack/react-query";
import { useCartesiClient } from "./provider.js";
import { serverUrl } from "./serverUrl.js";

export const withdrawalQueryKey = (
    client: CartesiPublicClient,
    params: Partial<GetWithdrawalParams>,
) => [
    serverUrl(client),
    "withdrawal",
    {
        application: params.application,
        accountIndex: params.accountIndex?.toString(),
    },
];

export const withdrawalOptions = (
    client: CartesiPublicClient,
    params: Partial<GetWithdrawalParams>,
) =>
    queryOptions({
        queryKey: withdrawalQueryKey(client, params),
        queryFn:
            params.application !== undefined &&
            params.accountIndex !== undefined
                ? () =>
                      client.getWithdrawal({
                          application: params.application as string,
                          accountIndex: params.accountIndex as bigint,
                      })
                : skipToken,
    });

export const useWithdrawal = (
    params: Partial<GetWithdrawalParams> &
        Omit<ReturnType<typeof withdrawalOptions>, "queryKey" | "queryFn">,
) => {
    const client = useCartesiClient();
    return useQuery({
        ...params,
        ...withdrawalOptions(client, params),
    });
};
