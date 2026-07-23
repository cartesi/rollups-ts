import type { CartesiPublicClient, WaitForInputParams } from "@cartesi/viem";
import { queryOptions, skipToken, useQuery } from "@tanstack/react-query";
import { useCartesiClient } from "./provider.js";
import { serverUrl } from "./serverUrl.js";

export const waitForInputQueryKey = (
    client: CartesiPublicClient,
    params: Partial<WaitForInputParams>,
) => [
    serverUrl(client),
    "waitForInput",
    {
        ...params,
        inputIndex: params.inputIndex?.toString(),
    },
];

export const waitForInputOptions = (
    client: CartesiPublicClient,
    params: Partial<WaitForInputParams>,
) =>
    queryOptions({
        queryKey: waitForInputQueryKey(client, params),
        queryFn:
            params.application !== undefined && params.inputIndex !== undefined
                ? () =>
                      client.waitForInput({
                          application: params.application as string,
                          inputIndex: params.inputIndex as bigint,
                          ...params,
                      })
                : skipToken,
    });

export const useWaitForInput = (
    params: Partial<WaitForInputParams> &
        Omit<ReturnType<typeof waitForInputOptions>, "queryKey" | "queryFn">,
) => {
    const client = useCartesiClient();
    return useQuery({
        ...waitForInputOptions(client, params),
        ...params,
    });
};
