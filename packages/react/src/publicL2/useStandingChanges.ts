import type {
    CartesiPublicClient,
    ListStandingChangesParams,
} from "@cartesi/client";
import { queryOptions, skipToken, useQuery } from "@tanstack/react-query";
import type { Address } from "viem";
import { useCartesiClient } from "./provider.js";
import { serverUrl } from "./serverUrl.js";

export const standingChangesQueryKey = (
    client: CartesiPublicClient,
    params: Partial<ListStandingChangesParams>,
) => [
    serverUrl(client),
    "standingChanges",
    { ...params, epochIndex: params.epochIndex?.toString() },
];

export const standingChangesOptions = (
    client: CartesiPublicClient,
    params: Partial<ListStandingChangesParams>,
) =>
    queryOptions({
        queryKey: standingChangesQueryKey(client, params),
        queryFn:
            params.application !== undefined &&
            params.epochIndex !== undefined &&
            params.tournamentAddress !== undefined
                ? () =>
                      client.listStandingChanges({
                          application: params.application as string,
                          epochIndex: params.epochIndex as bigint,
                          tournamentAddress:
                              params.tournamentAddress as Address,
                          ...params,
                      })
                : skipToken,
    });

export const useStandingChanges = (
    params: Partial<ListStandingChangesParams> &
        Omit<ReturnType<typeof standingChangesOptions>, "queryKey" | "queryFn">,
) => {
    const client = useCartesiClient();
    return useQuery({
        ...standingChangesOptions(client, params),
        ...params,
    });
};
