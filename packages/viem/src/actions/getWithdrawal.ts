import { type Client, type Transport, numberToHex } from "viem";
import type { PublicCartesiRpcSchema } from "../decorators/publicL2.js";
import type {
    GetWithdrawalParams,
    GetWithdrawalReturnType,
} from "../types/actions.js";
import { withdrawalConverter } from "../types/converter.js";

export const getWithdrawal = async (
    client: Client<Transport, undefined, undefined, PublicCartesiRpcSchema>,
    params: GetWithdrawalParams,
): Promise<GetWithdrawalReturnType> => {
    const { data: withdrawal } = await client.request({
        method: "cartesi_getWithdrawal",
        params: {
            application: params.application,
            account_index: numberToHex(params.accountIndex),
        },
    });

    return withdrawalConverter(withdrawal);
};
