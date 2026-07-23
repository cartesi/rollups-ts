import { getAddress, numberToHex, type Client, type Transport } from "viem";
import type { PublicCartesiRpcSchema } from "../decorators/publicL2.js";
import type {
    ListMatchesParams,
    ListMatchesReturnType,
} from "../types/actions.js";
import { matchConverter, paginationConverter } from "../types/converter.js";

export const listMatches = async (
    client: Client<Transport, undefined, undefined, PublicCartesiRpcSchema>,
    params: ListMatchesParams,
): Promise<ListMatchesReturnType> => {
    const matches = await client.request({
        method: "cartesi_listMatches",
        params: {
            ...params,
            epoch_index:
                params.epochIndex !== undefined
                    ? numberToHex(params.epochIndex)
                    : undefined,
            tournament_address: params.tournamentAddress
                ? getAddress(params.tournamentAddress)
                : undefined,
        },
    });
    return {
        data: matches.data.map(matchConverter),
        pagination: paginationConverter(matches.pagination),
    };
};
