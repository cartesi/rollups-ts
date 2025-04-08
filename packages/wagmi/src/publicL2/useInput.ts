import { type GetInputParams } from "@cartesi/viem";
import { useQuery } from "@tanstack/react-query";
import { useCartesiClient } from "./provider.js";

export const useInput = (params: GetInputParams) => {
    const client = useCartesiClient();
    return useQuery({
        queryKey: ["input", params],
        queryFn: () => client.getInput(params),
    });
};
