import { GetLastAcceptedEpochIndexParams } from "@cartesi/viem";
import { useQuery } from "@tanstack/react-query";
import { useCartesiClient } from "./provider.js";

export const useLastAcceptedEpochIndex = (
    params: Partial<GetLastAcceptedEpochIndexParams>,
) => {
    const client = useCartesiClient();
    return useQuery({
        queryKey: ["lastAcceptedEpochIndex", params],
        queryFn: () =>
            client.getLastAcceptedEpochIndex({
                application: params.application!,
            }),
        enabled: !!params.application,
    });
};
