import type { CartesiPublicClient, ListTournamentsParams } from "@cartesi/viem";
import { queryOptions, skipToken, useQuery } from "@tanstack/react-query";
import { useCartesiClient } from "./provider.js";

const tournamentsOptions = (
    client: CartesiPublicClient,
    params: Partial<ListTournamentsParams>,
) =>
    queryOptions({
        queryKey: [
            "tournaments",
            {
                ...params,
                epochIndex: params.epochIndex?.toString(),
                level: params.level?.toString(),
                parentTournamentAddress:
                    params.parentTournamentAddress?.toString(),
                parentMatchIdHash: params.parentMatchIdHash?.toString(),
            },
        ],
        queryFn:
            params.application !== undefined
                ? () =>
                      client.listTournaments({
                          application: params.application as string,
                          ...params,
                      })
                : skipToken,
    });

export const useTournaments = (
    params: Partial<ListTournamentsParams> &
        Omit<ReturnType<typeof tournamentsOptions>, "queryKey" | "queryFn">,
) => {
    const client = useCartesiClient();
    return useQuery({
        ...tournamentsOptions(client, params),
        ...params,
    });
};
