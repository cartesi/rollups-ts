import type { CartesiPublicClient, GetInputParams } from "@cartesi/viem";
import { queryOptions, skipToken, useQuery } from "@tanstack/react-query";
import { useCartesiClient } from "./provider.js";

const inputOptions = (
    client: CartesiPublicClient,
    params: Partial<GetInputParams>,
) =>
    queryOptions({
        queryKey: [
            "input",
            { ...params, inputIndex: params.inputIndex?.toString() },
        ],
        queryFn:
            params.application && params.inputIndex
                ? () =>
                      client.getInput({
                          application: params.application as string,
                          inputIndex: params.inputIndex as bigint,
                      })
                : skipToken,
    });

export const useInput = (
    params: Partial<GetInputParams> &
        Omit<ReturnType<typeof inputOptions>, "queryKey" | "queryFn">,
) => {
    const client = useCartesiClient();
    return useQuery({
        ...inputOptions(client, params),
        ...params,
    });
};
