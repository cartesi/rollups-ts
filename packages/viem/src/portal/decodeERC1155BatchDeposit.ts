import {
    type DecodeAbiParametersErrorType,
    decodeAbiParameters,
    getAddress,
    type Hex,
    size,
    slice,
} from "viem";
import type { ErrorType } from "../types/utils.js";
import {
    InvalidDepositPayloadError,
    type InvalidDepositPayloadErrorType,
} from "./errors.js";
import type { ERC1155BatchDeposit } from "./types.js";

export type DecodeERC1155BatchDepositReturnType = ERC1155BatchDeposit;

export type DecodeERC1155BatchDepositErrorType =
    | InvalidDepositPayloadErrorType
    | DecodeAbiParametersErrorType
    | ErrorType;

/**
 * Decode an ERC1155BatchPortal deposit input payload.
 * Layout (InputEncoding.sol): token (20 bytes) + sender (20 bytes) +
 * abi.encode(tokenIds, values, baseLayerData, execLayerData).
 * @param payload input payload produced by the ERC1155BatchPortal
 * @returns decoded deposit
 */
export const decodeERC1155BatchDeposit = (
    payload: Hex,
): ERC1155BatchDeposit => {
    const payloadSize = size(payload);
    if (payloadSize < 40) {
        throw new InvalidDepositPayloadError({
            portal: "ERC1155BatchPortal",
            payload,
            expectedMinSize: 40,
            size: payloadSize,
        });
    }
    const [tokenIds, values, baseLayerData, execLayerData] =
        decodeAbiParameters(
            [
                { type: "uint256[]" },
                { type: "uint256[]" },
                { type: "bytes" },
                { type: "bytes" },
            ],
            payloadSize > 40 ? slice(payload, 40) : "0x",
        );
    return {
        type: "ERC1155BatchDeposit",
        token: getAddress(slice(payload, 0, 20)),
        sender: getAddress(slice(payload, 20, 40)),
        tokenIds,
        values,
        baseLayerData,
        execLayerData,
    };
};
