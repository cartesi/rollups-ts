import type { CartesiPublicClient, ListInputsParams } from "@cartesi/viem";
import { queryOptions, skipToken, useQuery } from "@tanstack/react-query";
import { useCartesiClient } from "./provider.js";

const inputsOptions = (
    client: CartesiPublicClient,
    params: Partial<ListInputsParams>,
) =>
    queryOptions({
        queryKey: [
            "inputs",
            { ...params, epochIndex: params.epochIndex?.toString() },
        ],
        queryFn: params.application
            ? () =>
                  client.listInputs({
                      application: params.application as string,
                      ...params,
                  })
            : skipToken,
    });

export const useInputs = (
    params: Partial<ListInputsParams> &
        Omit<ReturnType<typeof inputsOptions>, "queryKey" | "queryFn">,
) => {
    const client = useCartesiClient();
    return useQuery({
        ...inputsOptions(client, params),
        ...params,
    });
};
