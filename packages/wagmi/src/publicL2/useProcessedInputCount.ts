import type {
    CartesiPublicClient,
    GetProcessedInputCountParams,
} from "@cartesi/viem";
import { queryOptions, skipToken, useQuery } from "@tanstack/react-query";
import { useCartesiClient } from "./provider.js";

const processedInputCountOptions = (
    client: CartesiPublicClient,
    params: Partial<GetProcessedInputCountParams>,
) =>
    queryOptions({
        queryKey: ["processedInputCount", params],
        queryFn: params.application
            ? () =>
                  client.getProcessedInputCount({
                      application: params.application as string,
                  })
            : skipToken,
    });

export const useProcessedInputCount = (
    params: Partial<GetProcessedInputCountParams> &
        Omit<
            ReturnType<typeof processedInputCountOptions>,
            "queryKey" | "queryFn"
        >,
) => {
    const client = useCartesiClient();
    return useQuery({
        ...params,
        ...processedInputCountOptions(client, params),
    });
};
