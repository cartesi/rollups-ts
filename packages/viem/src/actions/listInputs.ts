import { type Client, type Transport, numberToHex } from "viem";
import type { PublicCartesiRpcSchema } from "../decorators/publicL2.js";
import type {
    ListInputsParams,
    ListInputsReturnType,
} from "../types/actions.js";
import { inputConverter, paginationConverter } from "../types/converter.js";

export const listInputs = async (
    client: Client<Transport, undefined, undefined, PublicCartesiRpcSchema>,
    params: ListInputsParams,
): Promise<ListInputsReturnType> => {
    const inputs = await client.request({
        method: "cartesi_listInputs",
        params: {
            application: params.application,
            epoch_index:
                params.epochIndex !== undefined
                    ? numberToHex(params.epochIndex)
                    : undefined,
            sender: params.sender,
            limit: params.limit,
            offset: params.offset,
        },
    });
    return {
        data: inputs.data.map(inputConverter),
        pagination: paginationConverter(inputs.pagination),
    };
};
