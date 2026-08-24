import type { CartesiPublicClient } from "@cartesi/client";
import { queryOptions, useQuery } from "@tanstack/react-query";

import { useCartesiClient } from "./provider.js";
import { serverUrl } from "./serverUrl.js";

export const chainIdQueryKey = (client: CartesiPublicClient) => [
    serverUrl(client),
    "chainId",
];

export const chainIdOptions = (client: CartesiPublicClient) =>
    queryOptions({
        queryKey: chainIdQueryKey(client),
        queryFn: () => client.getChainId(),
    });

/** @deprecated use `useNodeInfo` instead. */
export const useChainId = (
    params?: Omit<ReturnType<typeof chainIdOptions>, "queryKey" | "queryFn">,
) => {
    const client = useCartesiClient();
    return useQuery({
        ...chainIdOptions(client),
        ...params,
    });
};
