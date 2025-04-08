import { type GetApplicationParams } from "@cartesi/viem";
import { useQuery } from "@tanstack/react-query";
import { useCartesiClient } from "./provider.js";

export const useApplication = (params: GetApplicationParams) => {
    const client = useCartesiClient();
    return useQuery({
        queryKey: ["application", params],
        queryFn: () => client.getApplication(params),
    });
};
