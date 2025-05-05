import { CartesiPublicClient, type ListEpochsParams } from "@cartesi/viem";
import { queryOptions, skipToken, useQuery } from "@tanstack/react-query";
import { useCartesiClient } from "./provider.js";

const epochsOptions = (
    client: CartesiPublicClient,
    params: Partial<ListEpochsParams>,
) =>
    queryOptions({
        queryKey: ["epochs", params],
        queryFn: params.application
            ? () =>
                  client.listEpochs({
                      application: params.application!,
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
