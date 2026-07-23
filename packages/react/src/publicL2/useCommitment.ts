import type { CartesiPublicClient, GetCommitmentParams } from "@cartesi/client";
import { queryOptions, skipToken, useQuery } from "@tanstack/react-query";
import type { Address, Hash } from "viem";
import { useCartesiClient } from "./provider.js";
import { serverUrl } from "./serverUrl.js";

export const commitmentQueryKey = (
    client: CartesiPublicClient,
    params: Partial<GetCommitmentParams>,
) => [
    serverUrl(client),
    "commitment",
    { ...params, epochIndex: params.epochIndex?.toString() },
];

export const commitmentOptions = (
    client: CartesiPublicClient,
    params: Partial<GetCommitmentParams>,
) =>
    queryOptions({
        queryKey: commitmentQueryKey(client, params),
        queryFn:
            params.application !== undefined &&
            params.epochIndex !== undefined &&
            params.tournamentAddress !== undefined &&
            params.commitment !== undefined
                ? () =>
                      client.getCommitment({
                          application: params.application as string,
                          epochIndex: params.epochIndex as bigint,
                          tournamentAddress:
                              params.tournamentAddress as Address,
                          commitment: params.commitment as Hash,
                      })
                : skipToken,
    });

export const useCommitment = (
    params: Partial<GetCommitmentParams> &
        Omit<ReturnType<typeof commitmentOptions>, "queryKey" | "queryFn">,
) => {
    const client = useCartesiClient();
    return useQuery({
        ...commitmentOptions(client, params),
        ...params,
    });
};
