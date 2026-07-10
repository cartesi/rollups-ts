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
import type { ERC721Deposit } from "./types.js";

export type DecodeERC721DepositReturnType = ERC721Deposit;

export type DecodeERC721DepositErrorType =
    | InvalidDepositPayloadErrorType
    | DecodeAbiParametersErrorType
    | ErrorType;

/**
 * Decode an ERC721Portal deposit input payload.
 * Layout (InputEncoding.sol): token (20 bytes) + sender (20 bytes) + tokenId (32 bytes) +
 * abi.encode(baseLayerData, execLayerData).
 * @param payload input payload produced by the ERC721Portal
 * @returns decoded deposit
 */
export const decodeERC721Deposit = (payload: Hex): ERC721Deposit => {
    const payloadSize = size(payload);
    if (payloadSize < 72) {
        throw new InvalidDepositPayloadError({
            portal: "ERC721Portal",
            payload,
            expectedMinSize: 72,
            size: payloadSize,
        });
    }
    const [baseLayerData, execLayerData] = decodeAbiParameters(
        [{ type: "bytes" }, { type: "bytes" }],
        payloadSize > 72 ? slice(payload, 72) : "0x",
    );
    return {
        type: "ERC721Deposit",
        token: getAddress(slice(payload, 0, 20)),
        sender: getAddress(slice(payload, 20, 40)),
        tokenId: hexToBigInt(slice(payload, 40, 72)),
        baseLayerData,
        execLayerData,
    };
};
