import type { CartesiPublicClient, ListOutputsParams } from "@cartesi/client";
import { queryOptions, skipToken, useQuery } from "@tanstack/react-query";
import { useCartesiClient } from "./provider.js";
import { serverUrl } from "./serverUrl.js";

export const outputsQueryKey = (
    client: CartesiPublicClient,
    params: Partial<ListOutputsParams>,
) => [
    serverUrl(client),
    "outputs",
    {
        ...params,
        epochIndex: params.epochIndex?.toString(),
        inputIndex: params.inputIndex?.toString(),
    },
];

export const outputsOptions = (
    client: CartesiPublicClient,
    params: Partial<ListOutputsParams>,
) =>
    queryOptions({
        queryKey: outputsQueryKey(client, params),
        queryFn:
            params.application !== undefined
                ? () =>
                      client.listOutputs({
                          application: params.application as string,
                          ...params,
                      })
                : skipToken,
    });

export const useOutputs = (
    params: Partial<ListOutputsParams> &
        Omit<ReturnType<typeof outputsOptions>, "queryKey" | "queryFn">,
) => {
    const client = useCartesiClient();
    return useQuery({
        ...outputsOptions(client, params),
        ...params,
    });
};
