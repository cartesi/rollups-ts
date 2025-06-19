import type { CartesiPublicClient } from "@cartesi/viem";
import { queryOptions, useQuery } from "@tanstack/react-query";

import { useCartesiClient } from "./provider.js";

const nodeVersionOptions = (client: CartesiPublicClient) =>
    queryOptions({
        queryKey: ["nodeVersion"],
        queryFn: () => client.getNodeVersion(),
    });

export const useNodeVersion = (
    params: Omit<ReturnType<typeof nodeVersionOptions>, "queryKey" | "queryFn">,
) => {
    const client = useCartesiClient();
    return useQuery({
        ...nodeVersionOptions(client),
        ...params,
    });
};
