import type {
    CartesiPublicClient,
    ListMatchAdvancesParams,
} from "@cartesi/client";
import { queryOptions, skipToken, useQuery } from "@tanstack/react-query";
import type { Address, Hash } from "viem";
import { useCartesiClient } from "./provider.js";
import { serverUrl } from "./serverUrl.js";

export const matchAdvancesQueryKey = (
    client: CartesiPublicClient,
    params: Partial<ListMatchAdvancesParams>,
) => [
    serverUrl(client),
    "matchAdvances",
    { ...params, epochIndex: params.epochIndex?.toString() },
];

export const matchAdvancesOptions = (
    client: CartesiPublicClient,
    params: Partial<ListMatchAdvancesParams>,
) =>
    queryOptions({
        queryKey: matchAdvancesQueryKey(client, params),
        queryFn:
            params.application !== undefined &&
            params.epochIndex !== undefined &&
            params.tournamentAddress !== undefined &&
            params.idHash !== undefined
                ? () =>
                      client.listMatchAdvances({
                          application: params.application as string,
                          epochIndex: params.epochIndex as bigint,
                          tournamentAddress:
                              params.tournamentAddress as Address,
                          idHash: params.idHash as Hash,
                          ...params,
                      })
                : skipToken,
    });

export const useMatchAdvances = (
    params: Partial<ListMatchAdvancesParams> &
        Omit<ReturnType<typeof matchAdvancesOptions>, "queryKey" | "queryFn">,
) => {
    const client = useCartesiClient();
    return useQuery({
        ...matchAdvancesOptions(client, params),
        ...params,
    });
};
