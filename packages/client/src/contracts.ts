import type { Chain } from "viem";
import {
    applicationFactoryAddress,
    authorityFactoryAddress,
    daveAppFactoryAddress,
    erc1155BatchPortalAddress,
    erc1155SinglePortalAddress,
    erc20PortalAddress,
    erc721PortalAddress,
    etherPortalAddress,
    inputBoxAddress,
    multiLevelTournamentFactoryAddress,
    quorumFactoryAddress,
    safeErc20TransferAddress,
    selfHostedApplicationFactoryAddress,
} from "./rollups.js";

export const contracts = {
    applicationFactory: { address: applicationFactoryAddress },
    authorityFactory: { address: authorityFactoryAddress },
    /**
     * Devnet only. dave deploys this factory once per chain, because the
     * tournament parameters depend on the chain's block time, so there is no
     * single address to put here. On any other chain read
     * `daveAppFactoryAddress[chainId]` from `@cartesi/client/abi`.
     */
    daveAppFactory: { address: daveAppFactoryAddress[31337] },
    erc1155BatchPortal: { address: erc1155BatchPortalAddress },
    erc1155SinglePortal: { address: erc1155SinglePortalAddress },
    erc20Portal: { address: erc20PortalAddress },
    erc721Portal: { address: erc721PortalAddress },
    etherPortal: { address: etherPortalAddress },
    inputBox: { address: inputBoxAddress },
    /** Devnet only, for the same reason as `daveAppFactory`. */
    multiLevelTournamentFactory: {
        address: multiLevelTournamentFactoryAddress[31337],
    },
    quorumFactory: { address: quorumFactoryAddress },
    safeErc20Transfer: { address: safeErc20TransferAddress },
    selfHostedApplicationFactory: {
        address: selfHostedApplicationFactoryAddress,
    },
} as const satisfies Chain["contracts"];
