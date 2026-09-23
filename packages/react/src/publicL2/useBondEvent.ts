import type { CartesiPublicClient, GetBondEventParams } from "@cartesi/client";
import { queryOptions, skipToken, useQuery } from "@tanstack/react-query";
import type { Hash } from "viem";
import { useCartesiClient } from "./provider.js";
import { serverUrl } from "./serverUrl.js";

export const bondEventQueryKey = (
    client: CartesiPublicClient,
    params: Partial<GetBondEventParams>,
) => [
    serverUrl(client),
    "bondEvent",
    { ...params, logIndex: params.logIndex?.toString() },
];

export const bondEventOptions = (
    client: CartesiPublicClient,
    params: Partial<GetBondEventParams>,
) =>
    queryOptions({
        queryKey: bondEventQueryKey(client, params),
        queryFn:
            params.application !== undefined &&
            params.txHash !== undefined &&
            params.logIndex !== undefined
                ? () =>
                      client.getBondEvent({
                          application: params.application as string,
                          txHash: params.txHash as Hash,
                          logIndex: params.logIndex as bigint,
                      })
                : skipToken,
    });

export const useBondEvent = (
    params: Partial<GetBondEventParams> &
        Omit<ReturnType<typeof bondEventOptions>, "queryKey" | "queryFn">,
) => {
    const client = useCartesiClient();
    return useQuery({
        ...bondEventOptions(client, params),
        ...params,
    });
};
