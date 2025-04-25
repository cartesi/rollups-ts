import { GetLastAcceptedEpochIndexParams } from "@cartesi/viem";
import { useQuery } from "@tanstack/react-query";
import { useCartesiClient } from "./provider.js";

export const useLastAcceptedEpochIndex = (
    params: GetLastAcceptedEpochIndexParams,
) => {
    const client = useCartesiClient();
    return useQuery({
        queryKey: ["lastAcceptedEpochIndex", params],
        queryFn: () => client.getLastAcceptedEpochIndex(params),
    });
};
