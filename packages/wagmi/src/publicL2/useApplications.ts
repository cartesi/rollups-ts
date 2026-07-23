import type {
    CartesiPublicClient,
    ListApplicationsParams,
} from "@cartesi/viem";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { useCartesiClient } from "./provider.js";
import { serverUrl } from "./serverUrl.js";

export const applicationsQueryKey = (
    client: CartesiPublicClient,
    params?: Partial<ListApplicationsParams>,
) => [serverUrl(client), "applications", params];

export const applicationsOptions = (
    client: CartesiPublicClient,
    params?: Partial<ListApplicationsParams>,
) =>
    queryOptions({
        queryKey: applicationsQueryKey(client, params),
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
