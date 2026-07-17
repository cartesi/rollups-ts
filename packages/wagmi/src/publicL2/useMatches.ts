import type { CartesiPublicClient, ListMatchesParams } from "@cartesi/viem";
import { queryOptions, skipToken, useQuery } from "@tanstack/react-query";
import { useCartesiClient } from "./provider.js";
import { serverUrl } from "./serverUrl.js";

export const matchesOptions = (
    client: CartesiPublicClient,
    params: Partial<ListMatchesParams>,
) =>
    queryOptions({
        queryKey: [
            serverUrl(client),
            "matches",
            { ...params, epochIndex: params.epochIndex?.toString() },
        ],
        queryFn:
            params.application !== undefined
                ? () =>
                      client.listMatches({
                          application: params.application as string,
                          ...params,
                      })
                : skipToken,
    });

export const useMatches = (
    params: Partial<ListMatchesParams> &
        Omit<ReturnType<typeof matchesOptions>, "queryKey" | "queryFn">,
) => {
    const client = useCartesiClient();
    return useQuery({
        ...matchesOptions(client, params),
        ...params,
    });
};
