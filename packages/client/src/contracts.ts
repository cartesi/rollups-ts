import type { Chain } from "viem";
import {
    applicationFactoryAddress,
    authorityFactoryAddress,
    erc1155BatchPortalAddress,
    erc1155SinglePortalAddress,
    erc20PortalAddress,
    erc721PortalAddress,
    etherPortalAddress,
    inputBoxAddress,
    quorumFactoryAddress,
    safeErc20TransferAddress,
    selfHostedApplicationFactoryAddress,
} from "./rollups.js";

export const contracts = {
    applicationFactory: { address: applicationFactoryAddress },
    authorityFactory: { address: authorityFactoryAddress },
    erc1155BatchPortal: { address: erc1155BatchPortalAddress },
    erc1155SinglePortal: { address: erc1155SinglePortalAddress },
    erc20Portal: { address: erc20PortalAddress },
    erc721Portal: { address: erc721PortalAddress },
    etherPortal: { address: etherPortalAddress },
    inputBox: { address: inputBoxAddress },
    quorumFactory: { address: quorumFactoryAddress },
    safeErc20Transfer: { address: safeErc20TransferAddress },
    selfHostedApplicationFactory: {
        address: selfHostedApplicationFactoryAddress,
    },
} as const satisfies Chain["contracts"];
