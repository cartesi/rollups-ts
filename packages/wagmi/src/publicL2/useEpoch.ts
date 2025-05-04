import { type GetEpochParams } from "@cartesi/viem";
import { useQuery } from "@tanstack/react-query";
import { useCartesiClient } from "./provider.js";

export const useEpoch = (params: Partial<GetEpochParams>) => {
    const client = useCartesiClient();
    return useQuery({
        queryKey: ["epoch", params],
        queryFn: () =>
            client.getEpoch({
                application: params.application!,
                epochIndex: params.epochIndex!,
            }),
        enabled: !!params.application && !!params.epochIndex,
    });
};
