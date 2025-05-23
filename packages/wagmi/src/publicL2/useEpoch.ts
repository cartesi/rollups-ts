import type { CartesiPublicClient, GetEpochParams } from "@cartesi/viem";
import { queryOptions, skipToken, useQuery } from "@tanstack/react-query";
import { useCartesiClient } from "./provider.js";

const epochOptions = (
    client: CartesiPublicClient,
    params: Partial<GetEpochParams>,
) =>
    queryOptions({
        queryKey: [
            "epoch",
            { ...params, epochIndex: params.epochIndex?.toString() },
        ],
        queryFn:
            params.application && params.epochIndex
                ? () =>
                      client.getEpoch({
                          application: params.application as string,
                          epochIndex: params.epochIndex as bigint,
                      })
                : skipToken,
    });

export const useEpoch = (
    params: Partial<GetEpochParams> &
        Omit<ReturnType<typeof epochOptions>, "queryKey" | "queryFn">,
) => {
    const client = useCartesiClient();
    return useQuery({
        ...epochOptions(client, params),
        ...params,
    });
};
