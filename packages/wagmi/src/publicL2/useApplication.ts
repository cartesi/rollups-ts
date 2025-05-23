import type { CartesiPublicClient, GetApplicationParams } from "@cartesi/viem";
import { queryOptions, skipToken, useQuery } from "@tanstack/react-query";
import { useCartesiClient } from "./provider.js";

const applicationOptions = (
    client: CartesiPublicClient,
    params: Partial<GetApplicationParams>,
) =>
    queryOptions({
        queryKey: ["application", params],
        queryFn: params.application
            ? () =>
                  client.getApplication({
                      application: params.application as string,
                  })
            : skipToken,
    });

export const useApplication = (
    params: Partial<GetApplicationParams> &
        Omit<ReturnType<typeof applicationOptions>, "queryKey" | "queryFn">,
) => {
    const client = useCartesiClient();
    return useQuery({
        ...applicationOptions(client, params),
        ...params,
    });
};
