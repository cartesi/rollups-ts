import type {
    CartesiPublicClient,
    ListBondEventsParams,
} from "@cartesi/client";
import { queryOptions, skipToken, useQuery } from "@tanstack/react-query";
import { useCartesiClient } from "./provider.js";
import { serverUrl } from "./serverUrl.js";

export const bondEventsQueryKey = (
    client: CartesiPublicClient,
    params: Partial<ListBondEventsParams>,
) => [
    serverUrl(client),
    "bondEvents",
    { ...params, epochIndex: params.epochIndex?.toString() },
];

export const bondEventsOptions = (
    client: CartesiPublicClient,
    params: Partial<ListBondEventsParams>,
) =>
    queryOptions({
        queryKey: bondEventsQueryKey(client, params),
        queryFn:
            params.application !== undefined
                ? () =>
                      client.listBondEvents({
                          ...params,
                          application: params.application as string,
                      })
                : skipToken,
    });

export const useBondEvents = (
    params: Partial<ListBondEventsParams> &
        Omit<ReturnType<typeof bondEventsOptions>, "queryKey" | "queryFn">,
) => {
    const client = useCartesiClient();
    return useQuery({
        ...bondEventsOptions(client, params),
        ...params,
    });
};
