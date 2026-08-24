import type {
    CartesiPublicClient,
    GetPendingExecutableOutputCountParams,
} from "@cartesi/client";
import { queryOptions, skipToken, useQuery } from "@tanstack/react-query";
import { useCartesiClient } from "./provider.js";
import { serverUrl } from "./serverUrl.js";

export const pendingExecutableOutputCountQueryKey = (
    client: CartesiPublicClient,
    params: Partial<GetPendingExecutableOutputCountParams>,
) => [serverUrl(client), "pendingExecutableOutputCount", params];

export const pendingExecutableOutputCountOptions = (
    client: CartesiPublicClient,
    params: Partial<GetPendingExecutableOutputCountParams>,
) =>
    queryOptions({
        queryKey: pendingExecutableOutputCountQueryKey(client, params),
        queryFn:
            params.application !== undefined
                ? () =>
                      client.getPendingExecutableOutputCount({
                          application: params.application as string,
                      })
                : skipToken,
    });

export const usePendingExecutableOutputCount = (
    params: Partial<GetPendingExecutableOutputCountParams> &
        Omit<
            ReturnType<typeof pendingExecutableOutputCountOptions>,
            "queryKey" | "queryFn"
        >,
) => {
    const client = useCartesiClient();
    return useQuery({
        ...params,
        ...pendingExecutableOutputCountOptions(client, params),
    });
};
