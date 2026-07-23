import type { CartesiPublicClient, GetOutputParams } from "@cartesi/client";
import { queryOptions, skipToken, useQuery } from "@tanstack/react-query";
import { useCartesiClient } from "./provider.js";
import { serverUrl } from "./serverUrl.js";

export const outputQueryKey = (
    client: CartesiPublicClient,
    params: Partial<GetOutputParams>,
) => [
    serverUrl(client),
    "output",
    { ...params, outputIndex: params.outputIndex?.toString() },
];

export const outputOptions = (
    client: CartesiPublicClient,
    params: Partial<GetOutputParams>,
) =>
    queryOptions({
        queryKey: outputQueryKey(client, params),
        queryFn:
            params.application !== undefined && params.outputIndex !== undefined
                ? () =>
                      client.getOutput({
                          application: params.application as string,
                          outputIndex: params.outputIndex as bigint,
                      })
                : skipToken,
    });

export const useOutput = (
    params: Partial<GetOutputParams> &
        Omit<ReturnType<typeof outputOptions>, "queryKey" | "queryFn">,
) => {
    const client = useCartesiClient();
    return useQuery({
        ...outputOptions(client, params),
        ...params,
    });
};
