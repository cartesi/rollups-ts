import { type Client, type Transport, getAddress, numberToHex } from "viem";
import type { PublicCartesiRpcSchema } from "../decorators/publicL2.js";
import type {
    ListBondEventsParams,
    ListBondEventsReturnType,
} from "../types/actions.js";
import { bondEventConverter, paginationConverter } from "../types/converter.js";

export const listBondEvents = async (
    client: Client<Transport, undefined, undefined, PublicCartesiRpcSchema>,
    params: ListBondEventsParams,
): Promise<ListBondEventsReturnType> => {
    const bondEvents = await client.request({
        method: "cartesi_listBondEvents",
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
        data: bondEvents.data.map(bondEventConverter),
        pagination: paginationConverter(bondEvents.pagination),
    };
};
