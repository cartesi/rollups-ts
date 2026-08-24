import { type Client, type Transport, hexToBigInt } from "viem";
import type { PublicCartesiRpcSchema } from "../decorators/publicL2.js";
import type {
    GetExecutedOutputCountParams,
    GetExecutedOutputCountReturnType,
} from "../types/actions.js";

/**
 * Number of outputs of an application that were already executed.
 *
 * The count is monotone: an unchanged value means no new executions have been
 * observed, which makes it a change signal to poll. When it does change,
 * re-query the bounded executable-output working set with `listOutputs` using
 * `executed: false` and `outputType: ["Voucher", "DelegateCallVoucher"]`, then
 * diff that pending set against the previous result to identify the
 * executions.
 *
 * Neither this count, nor an output index, nor a pagination offset is a valid
 * resume cursor: executions are observed out of output-index order, so a late
 * execution can land behind such a cursor. The node documents a race-free
 * execution cursor as expected in a future ingestion API.
 */
export const getExecutedOutputCount = async (
    client: Client<Transport, undefined, undefined, PublicCartesiRpcSchema>,
    params: GetExecutedOutputCountParams,
): Promise<GetExecutedOutputCountReturnType> => {
    const { data } = await client.request({
        method: "cartesi_getExecutedOutputCount",
        params,
    });
    return hexToBigInt(data);
};
