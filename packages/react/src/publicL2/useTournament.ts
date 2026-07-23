import type { CartesiPublicClient, GetTournamentParams } from "@cartesi/client";
import { queryOptions, skipToken, useQuery } from "@tanstack/react-query";
import type { Address } from "viem";
import { useCartesiClient } from "./provider.js";
import { serverUrl } from "./serverUrl.js";

export const tournamentQueryKey = (
    client: CartesiPublicClient,
    params: Partial<GetTournamentParams>,
) => [serverUrl(client), "tournament", params];

export const tournamentOptions = (
    client: CartesiPublicClient,
    params: Partial<GetTournamentParams>,
) =>
    queryOptions({
        queryKey: tournamentQueryKey(client, params),
        queryFn:
            params.application !== undefined && params.address !== undefined
                ? () =>
                      client.getTournament({
                          application: params.application as string,
                          address: params.address as Address,
                      })
                : skipToken,
    });

export const useTournament = (
    params: Partial<GetTournamentParams> &
        Omit<ReturnType<typeof tournamentOptions>, "queryKey" | "queryFn">,
) => {
    const client = useCartesiClient();
    return useQuery({
        ...tournamentOptions(client, params),
        ...params,
    });
};
