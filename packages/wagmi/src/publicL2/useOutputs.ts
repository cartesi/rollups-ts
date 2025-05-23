import type { CartesiPublicClient, ListOutputsParams } from "@cartesi/viem";
import { queryOptions, skipToken, useQuery } from "@tanstack/react-query";
import { useCartesiClient } from "./provider.js";

const outputsOptions = (
    client: CartesiPublicClient,
    params: Partial<ListOutputsParams>,
) =>
    queryOptions({
        queryKey: [
            "outputs",
            {
                ...params,
                epochIndex: params.epochIndex?.toString(),
                inputIndex: params.inputIndex?.toString(),
            },
        ],
        queryFn: params.application
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
