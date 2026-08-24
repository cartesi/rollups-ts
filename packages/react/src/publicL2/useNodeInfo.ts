import type { CartesiPublicClient } from "@cartesi/client";
import { queryOptions, useQuery } from "@tanstack/react-query";

import { useCartesiClient } from "./provider.js";
import { serverUrl } from "./serverUrl.js";

export const nodeInfoQueryKey = (client: CartesiPublicClient) => [
    serverUrl(client),
    "nodeInfo",
];

export const nodeInfoOptions = (client: CartesiPublicClient) =>
    queryOptions({
        queryKey: nodeInfoQueryKey(client),
        queryFn: () => client.getNodeInfo(),
    });

export const useNodeInfo = (
    params?: Omit<ReturnType<typeof nodeInfoOptions>, "queryKey" | "queryFn">,
) => {
    const client = useCartesiClient();
    return useQuery({
        ...nodeInfoOptions(client),
        ...params,
    });
};
