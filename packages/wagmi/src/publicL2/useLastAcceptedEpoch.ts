import { GetLastAcceptedEpochParams } from "@cartesi/viem";
import { useQuery } from "@tanstack/react-query";
import { useCartesiClient } from "./provider.js";

export const useLastAcceptedEpoch = (params: GetLastAcceptedEpochParams) => {
    const client = useCartesiClient();
    return useQuery({
        queryKey: ["lastAcceptedEpoch", params],
        queryFn: () => client.getLastAcceptedEpoch(params),
    });
};
