import { getAddress, numberToHex, type Client, type Transport } from "viem";
import type { PublicCartesiRpcSchema } from "../decorators/publicL2.js";
import type {
    GetMatchAdvancedParams,
    GetMatchAdvancedReturnType,
} from "../types/actions.js";
import { matchAdvancedConverter } from "../types/converter.js";

export const getMatchAdvanced = async (
    client: Client<Transport, undefined, undefined, PublicCartesiRpcSchema>,
    params: GetMatchAdvancedParams,
): Promise<GetMatchAdvancedReturnType> => {
    const { data: matchAdvanced } = await client.request({
        method: "cartesi_getMatchAdvanced",
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
