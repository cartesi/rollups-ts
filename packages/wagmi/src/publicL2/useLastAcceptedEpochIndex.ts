import {
    CartesiPublicClient,
    GetLastAcceptedEpochIndexParams,
} from "@cartesi/viem";
import { queryOptions, skipToken, useQuery } from "@tanstack/react-query";
import { useCartesiClient } from "./provider.js";

const lastAcceptedEpochIndexOptions = (
    client: CartesiPublicClient,
    params: Partial<GetLastAcceptedEpochIndexParams>,
) =>
    queryOptions({
        queryKey: ["lastAcceptedEpochIndex", params],
        queryFn: params.application
            ? () =>
                  client.getLastAcceptedEpochIndex({
                      application: params.application!,
                  })
            : skipToken,
    });

export const useLastAcceptedEpochIndex = (
    params: Partial<GetLastAcceptedEpochIndexParams> &
        Omit<
            ReturnType<typeof lastAcceptedEpochIndexOptions>,
            "queryKey" | "queryFn"
        >,
) => {
    const client = useCartesiClient();
    return useQuery({
        ...lastAcceptedEpochIndexOptions(client, params),
        ...params,
    });
};
