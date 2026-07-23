import type { CartesiPublicClient, GetEpochParams } from "@cartesi/viem";
import { queryOptions, skipToken, useQuery } from "@tanstack/react-query";
import { useCartesiClient } from "./provider.js";
import { serverUrl } from "./serverUrl.js";

export const epochQueryKey = (
    client: CartesiPublicClient,
    params: Partial<GetEpochParams>,
) => [
    serverUrl(client),
    "epoch",
    { ...params, epochIndex: params.epochIndex?.toString() },
];

export const epochOptions = (
    client: CartesiPublicClient,
    params: Partial<GetEpochParams>,
) =>
    queryOptions({
        queryKey: epochQueryKey(client, params),
        queryFn:
            params.application !== undefined && params.epochIndex !== undefined
                ? () =>
                      client.getEpoch({
                          application: params.application as string,
                          epochIndex: params.epochIndex as bigint,
                      })
                : skipToken,
    });

export const useEpoch = (
    params: Partial<GetEpochParams> &
        Omit<ReturnType<typeof epochOptions>, "queryKey" | "queryFn">,
) => {
    const client = useCartesiClient();
    return useQuery({
        ...epochOptions(client, params),
        ...params,
    });
};
