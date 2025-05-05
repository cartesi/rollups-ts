import {
    CartesiPublicClient,
    type ListApplicationsParams,
} from "@cartesi/viem";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { useCartesiClient } from "./provider.js";

const applicationsOptions = (
    client: CartesiPublicClient,
    params?: Partial<ListApplicationsParams>,
) =>
    queryOptions({
        queryKey: ["applications", params],
        queryFn: () => client.listApplications(params),
    });

export const useApplications = (
    params?: ListApplicationsParams &
        Omit<ReturnType<typeof applicationsOptions>, "queryKey" | "queryFn">,
) => {
    const client = useCartesiClient();
    return useQuery({
        ...applicationsOptions(client, params),
        ...params,
    });
};
