import type {
    CartesiPublicClient,
    GetEpochByVirtualIndexParams,
} from "@cartesi/client";
import { queryOptions, skipToken, useQuery } from "@tanstack/react-query";
import { useCartesiClient } from "./provider.js";
import { serverUrl } from "./serverUrl.js";

export const epochByVirtualIndexQueryKey = (
    client: CartesiPublicClient,
    params: Partial<GetEpochByVirtualIndexParams>,
) => [
    serverUrl(client),
    "epochByVirtualIndex",
    { ...params, virtualIndex: params.virtualIndex?.toString() },
];

export const epochByVirtualIndexOptions = (
    client: CartesiPublicClient,
    params: Partial<GetEpochByVirtualIndexParams>,
) =>
    queryOptions({
        queryKey: epochByVirtualIndexQueryKey(client, params),
        queryFn:
            params.application !== undefined &&
            params.virtualIndex !== undefined
                ? () =>
                      client.getEpochByVirtualIndex({
                          application: params.application as string,
                          virtualIndex: params.virtualIndex as bigint,
                      })
                : skipToken,
    });

export const useEpochByVirtualIndex = (
    params: Partial<GetEpochByVirtualIndexParams> &
        Omit<
            ReturnType<typeof epochByVirtualIndexOptions>,
            "queryKey" | "queryFn"
        >,
) => {
    const client = useCartesiClient();
    return useQuery({
        ...epochByVirtualIndexOptions(client, params),
        ...params,
    });
};
