import { getAddress, numberToHex, type Client, type Transport } from "viem";
import type { PublicCartesiRpcSchema } from "../decorators/publicL2.js";
import type {
    GetCommitmentParams,
    GetCommitmentReturnType,
} from "../types/actions.js";
import { commitmentConverter } from "../types/converter.js";

export const getCommitment = async (
    client: Client<Transport, undefined, undefined, PublicCartesiRpcSchema>,
    params: GetCommitmentParams,
): Promise<GetCommitmentReturnType> => {
    const { data: commitment } = await client.request({
        method: "cartesi_getCommitment",
        params: {
            application: params.application,
            commitment: params.commitment,
            epoch_index: numberToHex(params.epochIndex),
            tournament_address: getAddress(params.tournamentAddress),
        },
    });
    return commitmentConverter(commitment);
};
