import type { Client, Hex, Transport } from "viem";
import { hexToNumber } from "viem";
import type { PublicCartesiRpcSchema } from "../decorators/publicL2.js";
import type { GetChainIdReturnType } from "../types/actions.js";

export const getChainId = async (
    client: Client<Transport, undefined, undefined, PublicCartesiRpcSchema>,
): Promise<GetChainIdReturnType> => {
    const { data: chainId } = await client.request({
        method: "cartesi_getChainId",
        params: [],
    });
    return hexToNumber(chainId as Hex);
};
