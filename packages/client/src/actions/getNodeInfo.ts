import type { Client, Transport } from "viem";
import type { PublicCartesiRpcSchema } from "../decorators/publicL2.js";
import type { GetNodeInfoReturnType } from "../types/actions.js";
import { nodeInfoConverter } from "../types/converter.js";

export const getNodeInfo = async (
    client: Client<Transport, undefined, undefined, PublicCartesiRpcSchema>,
): Promise<GetNodeInfoReturnType> => {
    const { data: nodeInfo } = await client.request({
        method: "cartesi_getNodeInfo",
        params: [],
    });
    return nodeInfoConverter(nodeInfo);
};
