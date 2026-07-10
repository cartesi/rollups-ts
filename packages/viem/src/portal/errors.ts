import { BaseError, type Hex } from "viem";
import type { PortalKind } from "./types.js";

export type InvalidDepositPayloadErrorType = InvalidDepositPayloadError & {
    name: "InvalidDepositPayloadError";
};

export class InvalidDepositPayloadError extends BaseError {
    readonly portal: PortalKind;
    readonly payload: Hex;
    readonly expectedMinSize: number;
    readonly size: number;

    constructor({
        portal,
        payload,
        expectedMinSize,
        size,
    }: {
        portal: PortalKind;
        payload: Hex;
        expectedMinSize: number;
        size: number;
    }) {
        super(
            `Invalid ${portal} deposit payload: expected at least ${expectedMinSize} bytes, got ${size}.`,
            {
                metaMessages: [`Payload: ${payload}`],
                name: "InvalidDepositPayloadError",
            },
        );
        this.portal = portal;
        this.payload = payload;
        this.expectedMinSize = expectedMinSize;
        this.size = size;
    }
}
