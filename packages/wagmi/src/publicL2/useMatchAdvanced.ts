import type {
    CartesiPublicClient,
    GetMatchAdvancedParams,
} from "@cartesi/viem";
import { queryOptions, skipToken, useQuery } from "@tanstack/react-query";
import type { Address, Hash } from "viem";
import { useCartesiClient } from "./provider.js";

const matchAdvancedOptions = (
    client: CartesiPublicClient,
    params: Partial<GetMatchAdvancedParams>,
) =>
    queryOptions({
        queryKey: ["matchAdvanced", params],
        queryFn:
            params.application &&
            params.epochIndex &&
            params.tournamentAddress &&
            params.idHash
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
