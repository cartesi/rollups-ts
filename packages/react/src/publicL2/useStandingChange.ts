import type {
    CartesiPublicClient,
    GetStandingChangeParams,
} from "@cartesi/client";
import { queryOptions, skipToken, useQuery } from "@tanstack/react-query";
import type { Address, Hash } from "viem";
import { useCartesiClient } from "./provider.js";
import { serverUrl } from "./serverUrl.js";

export const standingChangeQueryKey = (
    client: CartesiPublicClient,
    params: Partial<GetStandingChangeParams>,
) => [
    serverUrl(client),
    "standingChange",
    {
        ...params,
        epochIndex: params.epochIndex?.toString(),
        logIndex: params.logIndex?.toString(),
    },
];

export const standingChangeOptions = (
    client: CartesiPublicClient,
    params: Partial<GetStandingChangeParams>,
) =>
    queryOptions({
        queryKey: standingChangeQueryKey(client, params),
        queryFn:
            params.application !== undefined &&
            params.epochIndex !== undefined &&
            params.tournamentAddress !== undefined &&
            params.txHash !== undefined &&
            params.logIndex !== undefined
                ? () =>
                      client.getStandingChange({
                          application: params.application as string,
                          epochIndex: params.epochIndex as bigint,
                          tournamentAddress:
                              params.tournamentAddress as Address,
                          txHash: params.txHash as Hash,
                          logIndex: params.logIndex as bigint,
                      })
                : skipToken,
    });

export const useStandingChange = (
    params: Partial<GetStandingChangeParams> &
        Omit<ReturnType<typeof standingChangeOptions>, "queryKey" | "queryFn">,
) => {
    const client = useCartesiClient();
    return useQuery({
        ...standingChangeOptions(client, params),
        ...params,
    });
};
