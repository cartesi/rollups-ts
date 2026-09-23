import { type Client, type Transport, numberToHex } from "viem";
import type { PublicCartesiRpcSchema } from "../decorators/publicL2.js";
import type {
    GetBondEventParams,
    GetBondEventReturnType,
} from "../types/actions.js";
import { bondEventConverter } from "../types/converter.js";

export const getBondEvent = async (
    client: Client<Transport, undefined, undefined, PublicCartesiRpcSchema>,
    params: GetBondEventParams,
): Promise<GetBondEventReturnType> => {
    const { data: bondEvent } = await client.request({
        method: "cartesi_getBondEvent",
        params: {
            application: params.application,
            tx_hash: params.txHash,
            log_index: numberToHex(params.logIndex),
        },
    });
    return bondEventConverter(bondEvent);
};
