import { type GetReportParams } from "@cartesi/viem";
import { useQuery } from "@tanstack/react-query";
import { useCartesiClient } from "./provider.js";

export const useReport = (params: Partial<GetReportParams>) => {
    const client = useCartesiClient();
    return useQuery({
        queryKey: ["report", params],
        queryFn: () =>
            client.getReport({
                application: params.application!,
                reportIndex: params.reportIndex!,
            }),
        enabled: !!params.application && !!params.reportIndex,
    });
};
