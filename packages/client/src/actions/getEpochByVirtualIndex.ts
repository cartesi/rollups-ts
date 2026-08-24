import { type Client, type Transport, numberToHex } from "viem";
import type { PublicCartesiRpcSchema } from "../decorators/publicL2.js";
import type {
    GetEpochByVirtualIndexParams,
    GetEpochByVirtualIndexReturnType,
} from "../types/actions.js";
import { epochConverter } from "../types/converter.js";

export const getEpochByVirtualIndex = async (
    client: Client<Transport, undefined, undefined, PublicCartesiRpcSchema>,
    params: GetEpochByVirtualIndexParams,
): Promise<GetEpochByVirtualIndexReturnType> => {
    const { data: epoch } = await client.request({
        method: "cartesi_getEpochByVirtualIndex",
        params: {
            application: params.application,
            virtual_index: numberToHex(params.virtualIndex),
        },
    });
    return epochConverter(epoch);
};
