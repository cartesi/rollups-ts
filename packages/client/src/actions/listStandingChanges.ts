import { type Client, type Transport, getAddress, numberToHex } from "viem";
import type { PublicCartesiRpcSchema } from "../decorators/publicL2.js";
import type {
    ListStandingChangesParams,
    ListStandingChangesReturnType,
} from "../types/actions.js";
import {
    paginationConverter,
    standingChangedConverter,
} from "../types/converter.js";

export const listStandingChanges = async (
    client: Client<Transport, undefined, undefined, PublicCartesiRpcSchema>,
    params: ListStandingChangesParams,
): Promise<ListStandingChangesReturnType> => {
    const standingChanges = await client.request({
        method: "cartesi_listStandingChanges",
        params: {
            ...params,
            epoch_index: numberToHex(params.epochIndex),
            tournament_address: getAddress(params.tournamentAddress),
        },
    });
    return {
        data: standingChanges.data.map(standingChangedConverter),
        pagination: paginationConverter(standingChanges.pagination),
    };
};
