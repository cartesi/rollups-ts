import type {
    CartesiPublicClient,
    ListCommitmentsParams,
} from "@cartesi/client";
import { queryOptions, skipToken, useQuery } from "@tanstack/react-query";
import { useCartesiClient } from "./provider.js";
import { serverUrl } from "./serverUrl.js";

export const commitmentsQueryKey = (
    client: CartesiPublicClient,
    params: Partial<ListCommitmentsParams>,
) => [
    serverUrl(client),
    "commitments",
    { ...params, epochIndex: params.epochIndex?.toString() },
];

export const commitmentsOptions = (
    client: CartesiPublicClient,
    params: Partial<ListCommitmentsParams>,
) =>
    queryOptions({
        queryKey: commitmentsQueryKey(client, params),
        queryFn:
            params.application !== undefined
                ? () =>
                      client.listCommitments({
                          application: params.application as string,
                          ...params,
                      })
                : skipToken,
    });

export const useCommitments = (
    params: Partial<ListCommitmentsParams> &
        Omit<ReturnType<typeof commitmentsOptions>, "queryKey" | "queryFn">,
) => {
    const client = useCartesiClient();
    return useQuery({
        ...commitmentsOptions(client, params),
        ...params,
    });
};
