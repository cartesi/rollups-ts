import { getAddress, numberToHex, type Client, type Transport } from "viem";
import type { PublicCartesiRpcSchema } from "../decorators/publicL2.js";
import type { GetMatchParams, GetMatchReturnType } from "../types/actions.js";
import { matchConverter } from "../types/converter.js";

export const getMatch = async (
    client: Client<Transport, undefined, undefined, PublicCartesiRpcSchema>,
    params: GetMatchParams,
): Promise<GetMatchReturnType> => {
    const { data: match } = await client.request({
        method: "cartesi_getMatch",
        params: {
            application: params.application,
            epoch_index: numberToHex(params.epochIndex),
            tournament_address: getAddress(params.tournamentAddress),
            id_hash: params.idHash,
        },
    });
    return matchConverter(match);
};
