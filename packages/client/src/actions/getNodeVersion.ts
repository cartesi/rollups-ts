import type { Client, Transport } from "viem";
import type { PublicCartesiRpcSchema } from "../decorators/publicL2.js";
import type { GetNodeVersionReturnType } from "../types/actions.js";

export const getNodeVersion = async (
    client: Client<Transport, undefined, undefined, PublicCartesiRpcSchema>,
): Promise<GetNodeVersionReturnType> => {
    const { data: version } = await client.request({
        method: "cartesi_getNodeVersion",
        params: [],
    });
    return version;
};
