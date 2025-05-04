import { type ListReportsParams } from "@cartesi/viem";
import { useQuery } from "@tanstack/react-query";
import { useCartesiClient } from "./provider.js";

export const useReports = (params: Partial<ListReportsParams>) => {
    const client = useCartesiClient();
    return useQuery({
        queryKey: ["reports", params],
        queryFn: () =>
            client.listReports({
                application: params.application!,
                ...params,
            }),
        enabled: !!params.application,
    });
};
