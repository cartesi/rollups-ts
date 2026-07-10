import type { Address } from "viem";
import {
    erc20PortalAddress,
    erc721PortalAddress,
    erc1155BatchPortalAddress,
    erc1155SinglePortalAddress,
    etherPortalAddress,
} from "../rollups.js";
import type { PortalKind } from "./types.js";

const portals: Record<string, PortalKind> = {
    [etherPortalAddress.toLowerCase()]: "EtherPortal",
    [erc20PortalAddress.toLowerCase()]: "ERC20Portal",
    [erc721PortalAddress.toLowerCase()]: "ERC721Portal",
    [erc1155SinglePortalAddress.toLowerCase()]: "ERC1155SinglePortal",
    [erc1155BatchPortalAddress.toLowerCase()]: "ERC1155BatchPortal",
};

export type GetPortalReturnType = PortalKind | undefined;

/**
 * Identify which portal a deposit input came from, by its sender address.
 * @param sender input sender address (any casing)
 * @returns the portal kind, or undefined if the address is not a portal
 */
export const getPortal = (sender: Address): GetPortalReturnType =>
    portals[sender.toLowerCase()];
