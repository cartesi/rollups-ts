import { BaseError } from "viem";
import type { SequencerErrorCode, SequencerErrorResponse } from "./types.js";

export class SequencerRequestError extends BaseError {
    override name = "SequencerRequestError";
    url: string;

    constructor({ cause, url }: { cause?: Error | undefined; url: string }) {
        super("Sequencer request failed.", {
            cause,
            details: cause?.message,
            metaMessages: [`URL: ${url}`],
            name: "SequencerRequestError",
        });
        this.url = url;
    }
}

export class SequencerResponseError extends BaseError {
    override name = "SequencerResponseError";
    body: string;
    status: number;
    url: string;

    constructor({
        body,
        status,
        url,
    }: {
        body: string;
        status: number;
        url: string;
    }) {
        super("Sequencer returned an invalid response.", {
            details: body || `HTTP ${status}`,
            metaMessages: [`Status: ${status}`, `URL: ${url}`],
            name: "SequencerResponseError",
        });
        this.body = body;
        this.status = status;
        this.url = url;
    }
}

export class SequencerTransactionRejectedError extends BaseError {
    override name = "SequencerTransactionRejectedError";
    body: SequencerErrorResponse;
    code: SequencerErrorCode | (string & {});
    status: number;
    url: string;

    constructor({
        body,
        status,
        url,
    }: {
        body: SequencerErrorResponse;
        status: number;
        url: string;
    }) {
        super("Sequencer transaction was rejected.", {
            details: body.message,
            metaMessages: [
                `Code: ${body.code}`,
                `Status: ${status}`,
                `URL: ${url}`,
            ],
            name: "SequencerTransactionRejectedError",
        });
        this.body = body;
        this.code = body.code;
        this.status = status;
        this.url = url;
    }
}
