import { type GetInputParams } from "@cartesi/viem";
import { useQuery } from "@tanstack/react-query";
import { useCartesiClient } from "./provider.js";

export const useInput = (params: Partial<GetInputParams>) => {
    const client = useCartesiClient();
    return useQuery({
        queryKey: ["input", params],
        queryFn: () =>
            client.getInput({
                application: params.application!,
                inputIndex: params.inputIndex!,
            }),
        enabled: !!params.application && !!params.inputIndex,
    });
};
