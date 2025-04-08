import { GetProcessedInputCountParams } from "@cartesi/viem";
import { useQuery } from "@tanstack/react-query";
import { useCartesiClient } from "./provider.js";

export const useProcessedInputCount = (
    params: GetProcessedInputCountParams,
) => {
    const client = useCartesiClient();
    return useQuery({
        queryKey: ["processedInputCount", params],
        queryFn: () => client.getProcessedInputCount(params),
    });
};
