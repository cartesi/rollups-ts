import type { CartesiPublicClient, GetMatchParams } from "@cartesi/viem";
import { queryOptions, skipToken, useQuery } from "@tanstack/react-query";
import type { Address, Hash } from "viem";
import { useCartesiClient } from "./provider.js";

const matchOptions = (
    client: CartesiPublicClient,
    params: Partial<GetMatchParams>,
) =>
    queryOptions({
        queryKey: [
            "match",
            { ...params, epochIndex: params.epochIndex?.toString() },
        ],
        queryFn:
            params.application !== undefined &&
            params.epochIndex !== undefined &&
            params.tournamentAddress !== undefined &&
            params.idHash !== undefined
                ? () =>
                      client.getMatch({
                          application: params.application as string,
                          epochIndex: params.epochIndex as bigint,
                          tournamentAddress:
                              params.tournamentAddress as Address,
                          idHash: params.idHash as Hash,
                      })
                : skipToken,
    });

export const useMatch = (
    params: Partial<GetMatchParams> &
        Omit<ReturnType<typeof matchOptions>, "queryKey" | "queryFn">,
) => {
    const client = useCartesiClient();
    return useQuery({
        ...matchOptions(client, params),
        ...params,
    });
};
