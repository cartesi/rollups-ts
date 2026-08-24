import type { CartesiPublicClient, ListInputsParams } from "@cartesi/client";
import { queryOptions, skipToken, useQuery } from "@tanstack/react-query";
import { useCartesiClient } from "./provider.js";
import { serverUrl } from "./serverUrl.js";

export const inputsQueryKey = (
    client: CartesiPublicClient,
    params: Partial<ListInputsParams>,
) => [
    serverUrl(client),
    "inputs",
    {
        ...params,
        epochIndex: params.epochIndex?.toString(),
        from: params.from?.toString(),
        to: params.to?.toString(),
    },
];

export const inputsOptions = (
    client: CartesiPublicClient,
    params: Partial<ListInputsParams>,
) =>
    queryOptions({
        queryKey: inputsQueryKey(client, params),
        queryFn:
            params.application !== undefined
                ? () =>
                      client.listInputs({
                          application: params.application as string,
                          ...params,
                      })
                : skipToken,
    });

export const useInputs = (
    params: Partial<ListInputsParams> &
        Omit<ReturnType<typeof inputsOptions>, "queryKey" | "queryFn">,
) => {
    const client = useCartesiClient();
    return useQuery({
        ...inputsOptions(client, params),
        ...params,
    });
};
