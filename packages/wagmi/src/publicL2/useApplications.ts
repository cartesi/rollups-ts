import { type ListApplicationsParams } from "@cartesi/viem";
import { useQuery } from "@tanstack/react-query";
import { useCartesiClient } from "./provider.js";

export const useApplications = (params?: ListApplicationsParams) => {
    const client = useCartesiClient();
    return useQuery({
        queryKey: ["applications", params],
        queryFn: () => client.listApplications(params),
    });
};
