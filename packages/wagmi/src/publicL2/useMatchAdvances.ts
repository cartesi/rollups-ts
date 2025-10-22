import type {
    CartesiPublicClient,
    ListMatchAdvancesParams,
} from "@cartesi/viem";
import { queryOptions, skipToken, useQuery } from "@tanstack/react-query";
import type { Address, Hash } from "viem";
import { useCartesiClient } from "./provider.js";

const matchAdvancesOptions = (
    client: CartesiPublicClient,
    params: Partial<ListMatchAdvancesParams>,
) =>
    queryOptions({
        queryKey: [
            "matchAdvances",
            { ...params, epochIndex: params.epochIndex?.toString() },
        ],
        queryFn:
            params.application &&
            params.epochIndex &&
            params.tournamentAddress &&
            params.idHash
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
