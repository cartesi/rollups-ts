import { type Client, type Transport, hexToBigInt } from "viem";
import type { PublicCartesiRpcSchema } from "../decorators/publicL2.js";
import type {
    GetPendingExecutableOutputCountParams,
    GetPendingExecutableOutputCountReturnType,
} from "../types/actions.js";

/**
 * Number of executable outputs of an application that are still pending
 * execution.
 *
 * This is a gauge, not a change signal or a resume cursor: it grows with new
 * executable outputs and shrinks with executions, so it can return to a
 * previous value while work happened in between. Poll
 * `getExecutedOutputCount` instead and, when that monotone count changes,
 * diff the pending set returned by `listOutputs` with `executed: false` and
 * `outputType: ["Voucher", "DelegateCallVoucher"]` against its previous
 * result.
 */
export const getPendingExecutableOutputCount = async (
    client: Client<Transport, undefined, undefined, PublicCartesiRpcSchema>,
    params: GetPendingExecutableOutputCountParams,
): Promise<GetPendingExecutableOutputCountReturnType> => {
    const { data } = await client.request({
        method: "cartesi_getPendingExecutableOutputCount",
        params,
    });
    return hexToBigInt(data);
};
