import { type Client, type Transport, getAddress, numberToHex } from "viem";
import type { PublicCartesiRpcSchema } from "../decorators/publicL2.js";
import type {
    GetStandingChangeParams,
    GetStandingChangeReturnType,
} from "../types/actions.js";
import { standingChangedConverter } from "../types/converter.js";

export const getStandingChange = async (
    client: Client<Transport, undefined, undefined, PublicCartesiRpcSchema>,
    params: GetStandingChangeParams,
): Promise<GetStandingChangeReturnType> => {
    const { data: standingChange } = await client.request({
        method: "cartesi_getStandingChange",
        params: {
            application: params.application,
            epoch_index: numberToHex(params.epochIndex),
            tournament_address: getAddress(params.tournamentAddress),
            tx_hash: params.txHash,
            log_index: numberToHex(params.logIndex),
        },
    });
    return standingChangedConverter(standingChange);
};
