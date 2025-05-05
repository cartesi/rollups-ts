import { CartesiPublicClient, type GetOutputParams } from "@cartesi/viem";
import { queryOptions, skipToken, useQuery } from "@tanstack/react-query";
import { useCartesiClient } from "./provider.js";

const outputOptions = (
    client: CartesiPublicClient,
    params: Partial<GetOutputParams>,
) =>
    queryOptions({
        queryKey: ["output", params],
        queryFn:
            params.application && params.outputIndex
                ? () =>
                      client.getOutput({
                          application: params.application!,
                          outputIndex: params.outputIndex!,
                      })
                : skipToken,
    });

export const useOutput = (
    params: Partial<GetOutputParams> &
        Omit<ReturnType<typeof outputOptions>, "queryKey" | "queryFn">,
) => {
    const client = useCartesiClient();
    return useQuery({
        ...outputOptions(client, params),
        ...params,
    });
};
