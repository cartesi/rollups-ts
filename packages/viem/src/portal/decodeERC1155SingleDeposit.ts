import {
    type DecodeAbiParametersErrorType,
    decodeAbiParameters,
    getAddress,
    type Hex,
    hexToBigInt,
    size,
    slice,
} from "viem";
import type { ErrorType } from "../types/utils.js";
import {
    InvalidDepositPayloadError,
    type InvalidDepositPayloadErrorType,
} from "./errors.js";
import type { ERC1155SingleDeposit } from "./types.js";

export type DecodeERC1155SingleDepositReturnType = ERC1155SingleDeposit;

export type DecodeERC1155SingleDepositErrorType =
    | InvalidDepositPayloadErrorType
    | DecodeAbiParametersErrorType
    | ErrorType;

/**
 * Decode an ERC1155SinglePortal deposit input payload.
 * Layout (InputEncoding.sol): token (20 bytes) + sender (20 bytes) + tokenId (32 bytes) +
 * value (32 bytes) + abi.encode(baseLayerData, execLayerData).
 * @param payload input payload produced by the ERC1155SinglePortal
 * @returns decoded deposit
 */
export const decodeERC1155SingleDeposit = (
    payload: Hex,
): ERC1155SingleDeposit => {
    const payloadSize = size(payload);
    if (payloadSize < 104) {
        throw new InvalidDepositPayloadError({
            portal: "ERC1155SinglePortal",
            payload,
            expectedMinSize: 104,
            size: payloadSize,
        });
    }
    const [baseLayerData, execLayerData] = decodeAbiParameters(
        [{ type: "bytes" }, { type: "bytes" }],
        payloadSize > 104 ? slice(payload, 104) : "0x",
    );
    return {
        type: "ERC1155SingleDeposit",
        token: getAddress(slice(payload, 0, 20)),
        sender: getAddress(slice(payload, 20, 40)),
        tokenId: hexToBigInt(slice(payload, 40, 72)),
        value: hexToBigInt(slice(payload, 72, 104)),
        baseLayerData,
        execLayerData,
    };
};
