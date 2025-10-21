import { getAddress, numberToHex, type Client, type Transport } from "viem";
import type { PublicCartesiRpcSchema } from "../decorators/publicL2.js";
import type {
    ListMatchAdvancesParams,
    ListMatchAdvancesReturnType,
} from "../types/actions.js";
import {
    matchAdvancedConverter,
    paginationConverter,
} from "../types/converter.js";

export const listMatchAdvances = async (
    client: Client<Transport, undefined, undefined, PublicCartesiRpcSchema>,
    params: ListMatchAdvancesParams,
): Promise<ListMatchAdvancesReturnType> => {
    const matchAdvances = await client.request({
        method: "cartesi_listMatchAdvances",
        params: {
            application: params.application,
            descending: params.descending,
            epoch_index: numberToHex(params.epochIndex),
            tournament_address: getAddress(params.tournamentAddress),
            id_hash: params.idHash,
            limit: params.limit,
            offset: params.offset,
        },
    });
    return {
        data: matchAdvances.data.map(matchAdvancedConverter),
        pagination: paginationConverter(matchAdvances.pagination),
    };
};
