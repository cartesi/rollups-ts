import type {
    CartesiPublicClient,
    GetLastAcceptedEpochIndexParams,
} from "@cartesi/viem";
import { queryOptions, skipToken, useQuery } from "@tanstack/react-query";
import { useCartesiClient } from "./provider.js";
import { serverUrl } from "./serverUrl.js";

export const lastAcceptedEpochIndexQueryKey = (
    client: CartesiPublicClient,
    params: Partial<GetLastAcceptedEpochIndexParams>,
) => [serverUrl(client), "lastAcceptedEpochIndex", params];

export const lastAcceptedEpochIndexOptions = (
    client: CartesiPublicClient,
    params: Partial<GetLastAcceptedEpochIndexParams>,
) =>
    queryOptions({
        queryKey: lastAcceptedEpochIndexQueryKey(client, params),
        queryFn:
            params.application !== undefined
                ? () =>
                      client.getLastAcceptedEpochIndex({
                          application: params.application as string,
                      })
                : skipToken,
    });

export const useLastAcceptedEpochIndex = (
    params: Partial<GetLastAcceptedEpochIndexParams> &
        Omit<
            ReturnType<typeof lastAcceptedEpochIndexOptions>,
            "queryKey" | "queryFn"
        >,
) => {
    const client = useCartesiClient();
    return useQuery({
        ...lastAcceptedEpochIndexOptions(client, params),
        ...params,
    });
};
