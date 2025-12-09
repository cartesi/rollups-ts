import { getAddress, numberToHex, type Client, type Transport } from "viem";
import type { PublicCartesiRpcSchema } from "../decorators/publicL2.js";
import type {
    ListCommitmentsParams,
    ListCommitmentsReturnType,
} from "../types/actions.js";
import {
    commitmentConverter,
    paginationConverter,
} from "../types/converter.js";

export const listCommitments = async (
    client: Client<Transport, undefined, undefined, PublicCartesiRpcSchema>,
    params: ListCommitmentsParams,
): Promise<ListCommitmentsReturnType> => {
    const commitments = await client.request({
        method: "cartesi_listCommitments",
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
        data: commitments.data.map(commitmentConverter),
        pagination: paginationConverter(commitments.pagination),
    };
};
