import type { CartesiPublicClient, GetCommitmentParams } from "@cartesi/viem";
import { queryOptions, skipToken, useQuery } from "@tanstack/react-query";
import type { Address, Hash } from "viem";
import { useCartesiClient } from "./provider.js";

const commitmentOptions = (
    client: CartesiPublicClient,
    params: Partial<GetCommitmentParams>,
) =>
    queryOptions({
        queryKey: ["commitment", params],
        queryFn:
            params.application &&
            params.epochIndex &&
            params.tournamentAddress &&
            params.commitment
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
