import type {
    CartesiPublicClient,
    GetMatchAdvanceParams,
} from "@cartesi/client";
import { queryOptions, skipToken, useQuery } from "@tanstack/react-query";
import type { Address, Hash } from "viem";
import { useCartesiClient } from "./provider.js";
import { serverUrl } from "./serverUrl.js";

export const matchAdvanceQueryKey = (
    client: CartesiPublicClient,
    params: Partial<GetMatchAdvanceParams>,
) => [
    serverUrl(client),
    "matchAdvance",
    {
        ...params,
        epochIndex: params.epochIndex?.toString(),
        logIndex: params.logIndex?.toString(),
    },
];

export const matchAdvanceOptions = (
    client: CartesiPublicClient,
    params: Partial<GetMatchAdvanceParams>,
) =>
    queryOptions({
        queryKey: matchAdvanceQueryKey(client, params),
        queryFn:
            params.application !== undefined &&
            params.epochIndex !== undefined &&
            params.tournamentAddress !== undefined &&
            params.idHash !== undefined &&
            params.txHash !== undefined &&
            params.logIndex !== undefined
                ? () =>
                      client.getMatchAdvance({
                          application: params.application as string,
                          epochIndex: params.epochIndex as bigint,
                          tournamentAddress:
                              params.tournamentAddress as Address,
                          idHash: params.idHash as Hash,
                          txHash: params.txHash as Hash,
                          logIndex: params.logIndex as bigint,
                      })
                : skipToken,
    });

export const useMatchAdvance = (
    params: Partial<GetMatchAdvanceParams> &
        Omit<ReturnType<typeof matchAdvanceOptions>, "queryKey" | "queryFn">,
) => {
    const client = useCartesiClient();
    return useQuery({
        ...matchAdvanceOptions(client, params),
        ...params,
    });
};
