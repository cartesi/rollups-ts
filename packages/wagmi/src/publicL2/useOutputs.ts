import { type ListOutputsParams } from "@cartesi/viem";
import { useQuery } from "@tanstack/react-query";
import { useCartesiClient } from "./provider.js";

export const useOutputs = (params: ListOutputsParams) => {
    const client = useCartesiClient();
    return useQuery({
        queryKey: ["outputs", params],
        queryFn: () => client.listOutputs(params),
    });
};
