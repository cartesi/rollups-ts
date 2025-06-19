import { type Client, Hex, hexToNumber, type Transport } from "viem";
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
