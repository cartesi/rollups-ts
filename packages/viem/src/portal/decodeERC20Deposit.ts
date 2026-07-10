import { getAddress, type Hex, hexToBigInt, size, slice } from "viem";
import type { ErrorType } from "../types/utils.js";
import {
    InvalidDepositPayloadError,
    type InvalidDepositPayloadErrorType,
} from "./errors.js";
import type { ERC20Deposit } from "./types.js";

export type DecodeERC20DepositReturnType = ERC20Deposit;

export type DecodeERC20DepositErrorType =
    | InvalidDepositPayloadErrorType
    | ErrorType;

/**
 * Decode an ERC20Portal deposit input payload.
 * Layout (InputEncoding.sol): token (20 bytes) + sender (20 bytes) + value (32 bytes) + execLayerData.
 * @param payload input payload produced by the ERC20Portal
 * @returns decoded deposit
 */
export const decodeERC20Deposit = (payload: Hex): ERC20Deposit => {
    const payloadSize = size(payload);
    if (payloadSize < 72) {
        throw new InvalidDepositPayloadError({
            portal: "ERC20Portal",
            payload,
            expectedMinSize: 72,
            size: payloadSize,
        });
    }
    return {
        type: "ERC20Deposit",
        token: getAddress(slice(payload, 0, 20)),
        sender: getAddress(slice(payload, 20, 40)),
        value: hexToBigInt(slice(payload, 40, 72)),
        execLayerData: payloadSize > 72 ? slice(payload, 72) : "0x",
    };
};
