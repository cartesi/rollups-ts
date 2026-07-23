import type {
    CartesiPublicClient,
    GetMatchAdvancedParams,
} from "@cartesi/client";
import { queryOptions, skipToken, useQuery } from "@tanstack/react-query";
import type { Address, Hash } from "viem";
import { useCartesiClient } from "./provider.js";
import { serverUrl } from "./serverUrl.js";

export const matchAdvancedQueryKey = (
    client: CartesiPublicClient,
    params: Partial<GetMatchAdvancedParams>,
) => [
    serverUrl(client),
    "matchAdvanced",
    { ...params, epochIndex: params.epochIndex?.toString() },
];

export const matchAdvancedOptions = (
    client: CartesiPublicClient,
    params: Partial<GetMatchAdvancedParams>,
) =>
    queryOptions({
        queryKey: matchAdvancedQueryKey(client, params),
        queryFn:
            params.application !== undefined &&
            params.epochIndex !== undefined &&
            params.tournamentAddress !== undefined &&
            params.idHash !== undefined &&
            params.parent !== undefined
                ? () =>
                      client.getMatchAdvanced({
                          application: params.application as string,
                          epochIndex: params.epochIndex as bigint,
                          tournamentAddress:
                              params.tournamentAddress as Address,
                          idHash: params.idHash as Hash,
                          parent: params.parent as Hash,
                      })
                : skipToken,
    });

export const useMatchAdvanced = (
    params: Partial<GetMatchAdvancedParams> &
        Omit<ReturnType<typeof matchAdvancedOptions>, "queryKey" | "queryFn">,
) => {
    const client = useCartesiClient();
    return useQuery({
        ...matchAdvancedOptions(client, params),
        ...params,
    });
};
