import { getAddress, type Hex, hexToBigInt, size, slice } from "viem";
import type { ErrorType } from "../types/utils.js";
import {
    InvalidDepositPayloadError,
    type InvalidDepositPayloadErrorType,
} from "./errors.js";
import type { EtherDeposit } from "./types.js";

export type DecodeEtherDepositReturnType = EtherDeposit;

export type DecodeEtherDepositErrorType =
    | InvalidDepositPayloadErrorType
    | ErrorType;

/**
 * Decode an EtherPortal deposit input payload.
 * Layout (InputEncoding.sol): sender (20 bytes) + value (32 bytes) + execLayerData.
 * @param payload input payload produced by the EtherPortal
 * @returns decoded deposit
 */
export const decodeEtherDeposit = (payload: Hex): EtherDeposit => {
    const payloadSize = size(payload);
    if (payloadSize < 52) {
        throw new InvalidDepositPayloadError({
            portal: "EtherPortal",
            payload,
            expectedMinSize: 52,
            size: payloadSize,
        });
    }
    return {
        type: "EtherDeposit",
        sender: getAddress(slice(payload, 0, 20)),
        value: hexToBigInt(slice(payload, 20, 52)),
        execLayerData: payloadSize > 52 ? slice(payload, 52) : "0x",
    };
};
