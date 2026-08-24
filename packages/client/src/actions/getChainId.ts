import type { Client, Transport } from "viem";
import { hexToNumber } from "viem";
import type { PublicCartesiRpcSchema } from "../decorators/publicL2.js";
import type { GetChainIdReturnType } from "../types/actions.js";

/**
 * @deprecated use `getNodeInfo` instead. The `cartesi_getChainId` method is
 * deprecated by the node.
 */
export const getChainId = async (
    client: Client<Transport, undefined, undefined, PublicCartesiRpcSchema>,
): Promise<GetChainIdReturnType> => {
    const { data: chainId } = await client.request({
        method: "cartesi_getChainId",
        params: [],
    });
    return hexToNumber(chainId);
};
