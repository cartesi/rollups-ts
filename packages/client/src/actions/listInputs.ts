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
    const {
        application,
        descending,
        epochIndex,
        transactionHash: transaction_hash,
        limit,
        offset,
        sender,
    } = params;
    const inputs = await client.request({
        method: "cartesi_listInputs",
        params: {
            application,
            descending,
            limit,
            offset,
            sender,
            transaction_hash,
            epoch_index:
                epochIndex !== undefined ? numberToHex(epochIndex) : undefined,
        },
    });
    return {
        data: inputs.data.map(inputConverter),
        pagination: paginationConverter(inputs.pagination),
    };
};
