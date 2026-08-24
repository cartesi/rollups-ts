import { type Client, type Transport, getAddress, numberToHex } from "viem";
import type { PublicCartesiRpcSchema } from "../decorators/publicL2.js";
import type {
    GetMatchAdvanceParams,
    GetMatchAdvanceReturnType,
} from "../types/actions.js";
import { matchAdvancedConverter } from "../types/converter.js";

export const getMatchAdvance = async (
    client: Client<Transport, undefined, undefined, PublicCartesiRpcSchema>,
    params: GetMatchAdvanceParams,
): Promise<GetMatchAdvanceReturnType> => {
    const { data: matchAdvanced } = await client.request({
        method: "cartesi_getMatchAdvance",
        params: {
            application: params.application,
            epoch_index: numberToHex(params.epochIndex),
            tournament_address: getAddress(params.tournamentAddress),
            id_hash: params.idHash,
            parent: params.parent,
        },
    });
    return matchAdvancedConverter(matchAdvanced);
};
