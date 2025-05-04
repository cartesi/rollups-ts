import { type ListOutputsParams } from "@cartesi/viem";
import { useQuery } from "@tanstack/react-query";
import { useCartesiClient } from "./provider.js";

export const useOutputs = (params: Partial<ListOutputsParams>) => {
    const client = useCartesiClient();
    return useQuery({
        queryKey: ["outputs", params],
        queryFn: () =>
            client.listOutputs({
                application: params.application!,
                ...params,
            }),
        enabled: !!params.application,
    });
};
