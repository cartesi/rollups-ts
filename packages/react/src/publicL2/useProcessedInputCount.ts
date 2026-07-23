import type {
    CartesiPublicClient,
    GetProcessedInputCountParams,
} from "@cartesi/client";
import { queryOptions, skipToken, useQuery } from "@tanstack/react-query";
import { useCartesiClient } from "./provider.js";
import { serverUrl } from "./serverUrl.js";

export const processedInputCountQueryKey = (
    client: CartesiPublicClient,
    params: Partial<GetProcessedInputCountParams>,
) => [serverUrl(client), "processedInputCount", params];

export const processedInputCountOptions = (
    client: CartesiPublicClient,
    params: Partial<GetProcessedInputCountParams>,
) =>
    queryOptions({
        queryKey: processedInputCountQueryKey(client, params),
        queryFn:
            params.application !== undefined
                ? () =>
                      client.getProcessedInputCount({
                          application: params.application as string,
                      })
                : skipToken,
    });

export const useProcessedInputCount = (
    params: Partial<GetProcessedInputCountParams> &
        Omit<
            ReturnType<typeof processedInputCountOptions>,
            "queryKey" | "queryFn"
        >,
) => {
    const client = useCartesiClient();
    return useQuery({
        ...params,
        ...processedInputCountOptions(client, params),
    });
};
