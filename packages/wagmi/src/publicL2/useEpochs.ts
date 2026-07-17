import type { CartesiPublicClient, ListEpochsParams } from "@cartesi/viem";
import { queryOptions, skipToken, useQuery } from "@tanstack/react-query";
import { useCartesiClient } from "./provider.js";
import { serverUrl } from "./serverUrl.js";

export const epochsOptions = (
    client: CartesiPublicClient,
    params: Partial<ListEpochsParams>,
) =>
    queryOptions({
        queryKey: [serverUrl(client), "epochs", params],
        queryFn:
            params.application !== undefined
                ? () =>
                      client.listEpochs({
                          application: params.application as string,
                          ...params,
                      })
                : skipToken,
    });

export const useEpochs = (
    params: Partial<ListEpochsParams> &
        Omit<ReturnType<typeof epochsOptions>, "queryKey" | "queryFn">,
) => {
    const client = useCartesiClient();
    return useQuery({
        ...epochsOptions(client, params),
        ...params,
    });
};
