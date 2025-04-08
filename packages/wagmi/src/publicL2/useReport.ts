import { type GetReportParams } from "@cartesi/viem";
import { useQuery } from "@tanstack/react-query";
import { useCartesiClient } from "./provider.js";

export const useReport = (params: GetReportParams) => {
    const client = useCartesiClient();
    return useQuery({
        queryKey: ["report", params],
        queryFn: () => client.getReport(params),
    });
};
