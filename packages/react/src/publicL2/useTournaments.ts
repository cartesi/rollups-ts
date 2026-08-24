import type {
    CartesiPublicClient,
    ListTournamentsParams,
} from "@cartesi/client";
import { queryOptions, skipToken, useQuery } from "@tanstack/react-query";
import { useCartesiClient } from "./provider.js";
import { serverUrl } from "./serverUrl.js";

export const tournamentsQueryKey = (
    client: CartesiPublicClient,
    params: Partial<ListTournamentsParams>,
) => [
    serverUrl(client),
    "tournaments",
    {
        ...params,
        epochIndex: params.epochIndex?.toString(),
        level: params.level?.toString(),
        parentTournamentAddress: params.parentTournamentAddress?.toString(),
        parentMatchIdHash: params.parentMatchIdHash?.toString(),
    },
];

export const tournamentsOptions = (
    client: CartesiPublicClient,
    params: Partial<ListTournamentsParams>,
) =>
    queryOptions({
        queryKey: tournamentsQueryKey(client, params),
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
