import type { CartesiPublicClient, GetTournamentParams } from "@cartesi/viem";
import { queryOptions, skipToken, useQuery } from "@tanstack/react-query";
import type { Address } from "viem";
import { useCartesiClient } from "./provider.js";

const tournamentOptions = (
    client: CartesiPublicClient,
    params: Partial<GetTournamentParams>,
) =>
    queryOptions({
        queryKey: ["tournament", params],
        queryFn:
            params.application && params.address
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
