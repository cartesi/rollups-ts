import type { CartesiPublicClient } from "@cartesi/viem";
import { queryOptions, useQuery } from "@tanstack/react-query";

import { useCartesiClient } from "./provider.js";
import { serverUrl } from "./serverUrl.js";

export const chainIdOptions = (client: CartesiPublicClient) =>
    queryOptions({
        queryKey: [serverUrl(client), "chainId"],
        queryFn: () => client.getChainId(),
    });

export const useChainId = (
    params: Omit<ReturnType<typeof chainIdOptions>, "queryKey" | "queryFn">,
) => {
    const client = useCartesiClient();
    return useQuery({
        ...chainIdOptions(client),
        ...params,
    });
};
