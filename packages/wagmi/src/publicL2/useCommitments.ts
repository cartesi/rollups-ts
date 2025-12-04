import type { CartesiPublicClient, ListCommitmentsParams } from "@cartesi/viem";
import { queryOptions, skipToken, useQuery } from "@tanstack/react-query";
import { useCartesiClient } from "./provider.js";

const commitmentsOptions = (
    client: CartesiPublicClient,
    params: Partial<ListCommitmentsParams>,
) =>
    queryOptions({
        queryKey: [
            "commitments",
            { ...params, epochIndex: params.epochIndex?.toString() },
        ],
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
