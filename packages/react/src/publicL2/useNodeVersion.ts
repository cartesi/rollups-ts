import type { CartesiPublicClient } from "@cartesi/client";
import { queryOptions, useQuery } from "@tanstack/react-query";

import { useCartesiClient } from "./provider.js";
import { serverUrl } from "./serverUrl.js";

export const nodeVersionQueryKey = (client: CartesiPublicClient) => [
    serverUrl(client),
    "nodeVersion",
];

export const nodeVersionOptions = (client: CartesiPublicClient) =>
    queryOptions({
        queryKey: nodeVersionQueryKey(client),
        queryFn: () => client.getNodeVersion(),
    });

export const useNodeVersion = (
    params?: Omit<
        ReturnType<typeof nodeVersionOptions>,
        "queryKey" | "queryFn"
    >,
) => {
    const client = useCartesiClient();
    return useQuery({
        ...nodeVersionOptions(client),
        ...params,
    });
};
