import type { DecodeAbiParametersErrorType, Hex } from "viem";
import type { ErrorType } from "../types/utils.js";
import { decodeERC20Deposit } from "./decodeERC20Deposit.js";
import { decodeERC721Deposit } from "./decodeERC721Deposit.js";
import { decodeERC1155BatchDeposit } from "./decodeERC1155BatchDeposit.js";
import { decodeERC1155SingleDeposit } from "./decodeERC1155SingleDeposit.js";
import { decodeEtherDeposit } from "./decodeEtherDeposit.js";
import type { InvalidDepositPayloadErrorType } from "./errors.js";
import type { PortalDeposit, PortalKind } from "./types.js";

export type DecodeDepositReturnType<portal extends PortalKind = PortalKind> =
    PortalDeposit[portal];

export type DecodeDepositErrorType =
    | InvalidDepositPayloadErrorType
    | DecodeAbiParametersErrorType
    | ErrorType;

/**
 * Decode a portal deposit input payload, given the portal it came from.
 * @param portal portal kind, e.g. obtained from `getPortal(input.sender)`
 * @param payload input payload produced by the portal
 * @returns decoded deposit, narrowed to the portal's deposit type
 */
export const decodeDeposit = <portal extends PortalKind>(
    portal: portal,
    payload: Hex,
): DecodeDepositReturnType<portal> => {
    switch (portal as PortalKind) {
        case "EtherPortal":
            return decodeEtherDeposit(
                payload,
            ) as DecodeDepositReturnType<portal>;
        case "ERC20Portal":
            return decodeERC20Deposit(
                payload,
            ) as DecodeDepositReturnType<portal>;
        case "ERC721Portal":
            return decodeERC721Deposit(
                payload,
            ) as DecodeDepositReturnType<portal>;
        case "ERC1155SinglePortal":
            return decodeERC1155SingleDeposit(
                payload,
            ) as DecodeDepositReturnType<portal>;
        case "ERC1155BatchPortal":
            return decodeERC1155BatchDeposit(
                payload,
            ) as DecodeDepositReturnType<portal>;
    }
};
