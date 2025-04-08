import { type ListInputsParams } from "@cartesi/viem";
import { useQuery } from "@tanstack/react-query";
import { useCartesiClient } from "./provider.js";

export const useInputs = (params: ListInputsParams) => {
    const client = useCartesiClient();
    return useQuery({
        queryKey: ["inputs", params],
        queryFn: () => client.listInputs(params),
    });
};
