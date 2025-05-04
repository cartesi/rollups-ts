import { type ListEpochsParams } from "@cartesi/viem";
import { useQuery } from "@tanstack/react-query";
import { useCartesiClient } from "./provider.js";

export const useEpochs = (params: Partial<ListEpochsParams>) => {
    const client = useCartesiClient();
    return useQuery({
        queryKey: ["epochs", params],
        queryFn: () =>
            client.listEpochs({
                application: params.application!,
                ...params,
            }),
        enabled: !!params.application,
    });
};
