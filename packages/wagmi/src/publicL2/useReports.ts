import { CartesiPublicClient, type ListReportsParams } from "@cartesi/viem";
import { queryOptions, skipToken, useQuery } from "@tanstack/react-query";
import { useCartesiClient } from "./provider.js";

const reportsOptions = (
    client: CartesiPublicClient,
    params: Partial<ListReportsParams>,
) =>
    queryOptions({
        queryKey: ["reports", params],
        queryFn: params.application
            ? () =>
                  client.listReports({
                      application: params.application!,
                      ...params,
                  })
            : skipToken,
    });

export const useReports = (
    params: Partial<ListReportsParams> &
        Omit<ReturnType<typeof reportsOptions>, "queryKey" | "queryFn">,
) => {
    const client = useCartesiClient();
    return useQuery({
        ...reportsOptions(client, params),
        ...params,
    });
};
