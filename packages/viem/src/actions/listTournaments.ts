import { numberToHex, type Client, type Transport } from "viem";
import type { PublicCartesiRpcSchema } from "../decorators/publicL2.js";
import type {
    ListTournamentsParams,
    ListTournamentsReturnType,
} from "../types/actions.js";
import {
    paginationConverter,
    tournamentConverter,
} from "../types/converter.js";

export const listTournaments = async (
    client: Client<Transport, undefined, undefined, PublicCartesiRpcSchema>,
    params: ListTournamentsParams,
): Promise<ListTournamentsReturnType> => {
    const tournaments = await client.request({
        method: "cartesi_listTournaments",
        params: {
            ...params,
            epoch_index:
                params.epochIndex !== undefined
                    ? numberToHex(params.epochIndex)
                    : undefined,
            level:
                params.level !== undefined
                    ? numberToHex(params.level)
                    : undefined,
            parent_tournament_address: params.parentTournamentAddress,
            parent_match_id_hash: params.parentMatchIdHash,
        },
    });
    return {
        data: tournaments.data.map(tournamentConverter),
        pagination: paginationConverter(tournaments.pagination),
    };
};
