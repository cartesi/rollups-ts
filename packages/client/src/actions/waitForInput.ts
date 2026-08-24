import pRetry, { AbortError } from "p-retry";
import { type Client, type Transport, numberToHex } from "viem";
import type { PublicCartesiRpcSchema } from "../decorators/publicL2.js";
import type {
    WaitForInputParams,
    WaitForInputReturnType,
} from "../types/actions.js";
import { inputConverter } from "../types/converter.js";

export const waitForInput = async (
    client: Client<Transport, undefined, undefined, PublicCartesiRpcSchema>,
    params: WaitForInputParams,
): Promise<WaitForInputReturnType> => {
    const pollingInterval = params.pollingInterval ?? client.pollingInterval;
    const retryCount = params.retryCount ?? 10;
    const timeout = params.timeout;

    // wait processing by default
    const waitProcessing =
        params.waitProcessing === undefined ? true : params.waitProcessing;

    // reject if input was not successfully processed
    const rejectErrors =
        params.rejectErrors === undefined ? false : params.rejectErrors;

    const input = await pRetry(
        async () => {
            const { data: input } = await client.request({
                method: "cartesi_getInput",
                params: {
                    application: params.application,
                    input_index: numberToHex(params.inputIndex),
                },
            });

            if (waitProcessing && input.status === "NONE") {
                throw new Error("Input is not processed");
            }

            // every terminal status other than ACCEPTED; the node collapsed its
            // resource-limit statuses into these
            if (
                rejectErrors &&
                (input.status === "EXCEPTION" ||
                    input.status === "MACHINE_HALTED" ||
                    input.status === "REJECTED")
            ) {
                throw new AbortError(`Input status: ${input.status}`);
            }

            return input;
        },
        {
            retries: retryCount,
            minTimeout: pollingInterval,
            factor: 1,
            maxRetryTime: timeout,
        },
    );

    return inputConverter(input);
};
