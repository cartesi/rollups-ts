import pRetry, { AbortError } from "p-retry";
import { numberToHex, Transport } from "viem";
import { CartesiPublicClient } from "../clients/createCartesiPublicClient.js";
import {
    type WaitForInputParams,
    type WaitForInputReturnType,
} from "../types/actions.js";
import { inputConverter } from "../types/converter.js";

export const waitForInput = async (
    client: CartesiPublicClient<Transport>,
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

            if (
                rejectErrors &&
                (input.status === "CYCLE_LIMIT_EXCEEDED" ||
                    input.status === "EXCEPTION" ||
                    input.status === "MACHINE_HALTED" ||
                    input.status === "PAYLOAD_LENGTH_LIMIT_EXCEEDED" ||
                    input.status === "REJECTED" ||
                    input.status === "TIME_LIMIT_EXCEEDED" ||
                    input.status === "OUTPUTS_LIMIT_EXCEEDED")
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
