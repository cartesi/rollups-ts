import type {
    CartesiPublicClient,
    GetExecutedOutputCountParams,
} from "@cartesi/client";
import { queryOptions, skipToken, useQuery } from "@tanstack/react-query";
import { useCartesiClient } from "./provider.js";
import { serverUrl } from "./serverUrl.js";

export const executedOutputCountQueryKey = (
    client: CartesiPublicClient,
    params: Partial<GetExecutedOutputCountParams>,
) => [serverUrl(client), "executedOutputCount", params];

export const executedOutputCountOptions = (
    client: CartesiPublicClient,
    params: Partial<GetExecutedOutputCountParams>,
) =>
    queryOptions({
        queryKey: executedOutputCountQueryKey(client, params),
        queryFn:
            params.application !== undefined
                ? () =>
                      client.getExecutedOutputCount({
                          application: params.application as string,
                      })
                : skipToken,
    });

export const useExecutedOutputCount = (
    params: Partial<GetExecutedOutputCountParams> &
        Omit<
            ReturnType<typeof executedOutputCountOptions>,
            "queryKey" | "queryFn"
        >,
) => {
    const client = useCartesiClient();
    return useQuery({
        ...params,
        ...executedOutputCountOptions(client, params),
    });
};
