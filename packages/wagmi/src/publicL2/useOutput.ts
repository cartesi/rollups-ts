import { type GetOutputParams } from "@cartesi/viem";
import { useQuery } from "@tanstack/react-query";
import { useCartesiClient } from "./provider.js";

export const useOutput = (params: GetOutputParams) => {
    const client = useCartesiClient();
    return useQuery({
        queryKey: ["output", params],
        queryFn: () => client.getOutput(params),
    });
};
