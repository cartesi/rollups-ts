import type { Client, Transport } from "viem";
import type { PublicCartesiRpcSchema } from "../decorators/publicL2.js";
import type {
    GetTournamentParams,
    GetTournamentReturnType,
} from "../types/actions.js";
import { tournamentConverter } from "../types/converter.js";

export const getTournament = async (
    client: Client<Transport, undefined, undefined, PublicCartesiRpcSchema>,
    params: GetTournamentParams,
): Promise<GetTournamentReturnType> => {
    const { data: tournament } = await client.request({
        method: "cartesi_getTournament",
        params: {
            application: params.application,
            address: params.address,
        },
    });
    return tournamentConverter(tournament);
};
