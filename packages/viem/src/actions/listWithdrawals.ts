import { type Client, type Transport, numberToHex } from "viem";
import type { PublicCartesiRpcSchema } from "../decorators/publicL2.js";
import type {
    ListWithdrawalsParams,
    ListWithdrawalsReturnType,
} from "../types/actions.js";
import {
    paginationConverter,
    withdrawalConverter,
} from "../types/converter.js";

export const listWithdrawals = async (
    client: Client<Transport, undefined, undefined, PublicCartesiRpcSchema>,
    params: ListWithdrawalsParams,
): Promise<ListWithdrawalsReturnType> => {
    const withdrawals = await client.request({
        method: "cartesi_listWithdrawals",
        params: {
            application: params.application,
            account_index:
                params.accountIndex !== undefined
                    ? numberToHex(params.accountIndex)
                    : undefined,
            limit: params.limit,
            offset: params.offset,
            descending: params.descending,
        },
    });
    return {
        data: withdrawals.data.map(withdrawalConverter),
        pagination: paginationConverter(withdrawals.pagination),
    };
};
