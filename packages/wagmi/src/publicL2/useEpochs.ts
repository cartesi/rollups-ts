import { type ListEpochsParams } from "@cartesi/viem";
import { useQuery } from "@tanstack/react-query";
import { useCartesiClient } from "./provider.js";

export const useEpochs = (params: ListEpochsParams) => {
    const client = useCartesiClient();
    return useQuery({
        queryKey: ["epochs", params],
        queryFn: () => client.listEpochs(params),
    });
};
