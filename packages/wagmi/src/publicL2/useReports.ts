import { type ListReportsParams } from "@cartesi/viem";
import { useQuery } from "@tanstack/react-query";
import { useCartesiClient } from "./provider.js";

export const useReports = (params: ListReportsParams) => {
    const client = useCartesiClient();
    return useQuery({
        queryKey: ["reports", params],
        queryFn: () => client.listReports(params),
    });
};
