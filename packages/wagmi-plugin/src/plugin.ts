import type { Plugin } from "@wagmi/cli";
import type { TarballSource } from "./download.js";
import { type ContractFilter, releaseContracts } from "./release.js";

export type { ContractFilter };

/**
 * rollups-contracts version used by default when `artifacts` and
 * `deployments` are omitted.
 */
export const DEFAULT_VERSION = "3.0.0-alpha.10";

const defaultReleaseUrl = `https://github.com/cartesi/rollups-contracts/releases/download/v${DEFAULT_VERSION}`;

/**
 * Default source of the foundry build artifacts tarball: the
 * rollups-contracts `DEFAULT_VERSION` GitHub release, hash-verified.
 */
export const DEFAULT_ARTIFACTS: TarballSource = {
    url: `${defaultReleaseUrl}/cartesi-rollups-contracts-${DEFAULT_VERSION}-artifacts.tar.gz`,
    sha256: "5213ce59d0f5a1c4fef4ebf17b6ef999be709c32b4b94511c320729bb2afa959",
};

/**
 * Default source of the deployment addresses tarball: the rollups-contracts
 * `DEFAULT_VERSION` GitHub release, hash-verified.
 */
export const DEFAULT_DEPLOYMENTS: TarballSource = {
    url: `${defaultReleaseUrl}/cartesi-rollups-contracts-${DEFAULT_VERSION}-deployment-addresses.tar.gz`,
    sha256: "ba92d98c5f1ccbc3edf3b05e3717dc7292f56187b363f86d2569d00b6eedf4b5",
};

/**
 * Anvil version the devnet tarball of the `DEFAULT_VERSION` release was
 * dumped with. It is part of the asset name, so it must be bumped alongside
 * `DEFAULT_VERSION` whenever a release changes its foundry version.
 */
export const DEFAULT_ANVIL_VERSION = "1.5.1";

/**
 * Default source of the anvil devnet tarball: the rollups-contracts
 * `DEFAULT_VERSION` GitHub release, hash-verified. Besides the anvil state
 * dump, it carries the deployment addresses on the devnet (chain 31337),
 * including the devnet-only test tokens.
 */
export const DEFAULT_ANVIL: TarballSource = {
    url: `${defaultReleaseUrl}/cartesi-rollups-contracts-${DEFAULT_VERSION}-anvil-${DEFAULT_ANVIL_VERSION}.tar.gz`,
    sha256: "fb38dc6e1faf238a152453dfd351ae5899d99fd35e9c675b4dce97cd6b05a68b",
};

/**
 * dave version used by default when `artifacts`, `deployments` and `anvil`
 * are omitted from the `prt` option of `rollupsContracts`.
 */
export const PRT_DEFAULT_VERSION = "3.0.0-alpha.4";

const prtDefaultReleaseUrl = `https://github.com/cartesi/dave/releases/download/v${PRT_DEFAULT_VERSION}`;

/**
 * Default source of the PRT foundry build artifacts tarball: the dave
 * `PRT_DEFAULT_VERSION` GitHub release, hash-verified.
 */
export const PRT_DEFAULT_ARTIFACTS: TarballSource = {
    url: `${prtDefaultReleaseUrl}/cartesi-rollups-prt-${PRT_DEFAULT_VERSION}-contract-artifacts.tar.gz`,
    sha256: "622964166b4049b556dc20b26ef2b9a5e8621a2ad3e1f43eee0b802a085244b3",
};

/**
 * Default source of the PRT deployment addresses tarball: the dave
 * `PRT_DEFAULT_VERSION` GitHub release, hash-verified.
 */
export const PRT_DEFAULT_DEPLOYMENTS: TarballSource = {
    url: `${prtDefaultReleaseUrl}/cartesi-rollups-prt-${PRT_DEFAULT_VERSION}-deployment-addresses.tar.gz`,
    sha256: "24bbd3df188952ad0abb1b1d3bc1d5da8e832da3e15286bf552abba9db60f1e8",
};

/**
 * Anvil version the devnet tarball of the dave `PRT_DEFAULT_VERSION` release
 * was dumped with. It is part of the asset name, so it must be bumped
 * alongside `PRT_DEFAULT_VERSION` whenever a release changes its foundry
 * version.
 */
export const PRT_DEFAULT_ANVIL_VERSION = "1.5.1";

/**
 * Default source of the PRT anvil devnet tarball: the dave
 * `PRT_DEFAULT_VERSION` GitHub release, hash-verified. Besides the anvil
 * state dump, it carries the deployment addresses on the devnet (chain
 * 31337).
 */
export const PRT_DEFAULT_ANVIL: TarballSource = {
    url: `${prtDefaultReleaseUrl}/cartesi-rollups-prt-${PRT_DEFAULT_VERSION}-anvil-${PRT_DEFAULT_ANVIL_VERSION}.tar.gz`,
    sha256: "ed10a8077113c426a298bb3592ca3725c31aad0828c7e7853b655593db2cd006",
};

/**
 * Deployments named after the role they play rather than after the contract
 * they are an instance of, mapped to the artifact holding their ABI. The
 * devnet USD withdrawal output builder is deployed through the
 * `UsdWithdrawalOutputBuilderFactory`, and the release publishes no artifact
 * for the concrete contract, only for the interface it implements.
 */
const artifactAliases: Record<string, string> = {
    TestUsdWithdrawalOutputBuilder: "IUsdWithdrawalOutputBuilder",
};

export interface RollupsContractsOptions {
    /**
     * URL of the rollups-contracts foundry build artifacts tarball, i.e.
     * `cartesi-rollups-contracts-<version>-artifacts.tar.gz`. Optionally with an
     * expected SHA-256 hash for integrity verification.
     * Defaults to `DEFAULT_ARTIFACTS`, the tarball of the rollups-contracts
     * `DEFAULT_VERSION` GitHub release.
     */
    artifacts?: TarballSource;
    /**
     * URL of the rollups-contracts deployment addresses tarball, i.e.
     * `cartesi-rollups-contracts-<version>-deployment-addresses.tar.gz`. Optionally
     * with an expected SHA-256 hash for integrity verification.
     * Defaults to `DEFAULT_DEPLOYMENTS`, the tarball of the rollups-contracts
     * `DEFAULT_VERSION` GitHub release. Addresses are read from the plaintext
     * deployment files, so the tarball must come from rollups-contracts
     * 3.0.0-alpha.8 or later.
     */
    deployments?: TarballSource;
    /**
     * URL of the rollups-contracts anvil devnet tarball, i.e.
     * `cartesi-rollups-contracts-<version>-anvil-<anvilVersion>.tar.gz`, whose
     * deployment addresses cover the devnet (chain 31337). Optionally with an
     * expected SHA-256 hash for integrity verification.
     * Defaults to `DEFAULT_ANVIL`, the tarball of the rollups-contracts
     * `DEFAULT_VERSION` GitHub release. Pass `false` to generate only the
     * addresses of the chains the `deployments` tarball covers.
     */
    anvil?: TarballSource | false;
    /**
     * Generate the contracts of a PRT (Permissionless Refereed Tournaments)
     * deployment, from a [dave](https://github.com/cartesi/dave) release on
     * top of the rollups-contracts one.
     *
     * A PRT deployment is a rollups deployment: it runs against the same
     * `InputBox`, portals and factories, at the same addresses, and adds the
     * consensus and tournament contracts. So this generates the union — the
     * rollups-contracts artifacts, which dave does not rebuild, plus dave's
     * own — with the addresses read from the dave release, which cover both.
     *
     * `true` uses the `PRT_DEFAULT_*` tarballs of the dave
     * `PRT_DEFAULT_VERSION` GitHub release, which is deployed against the
     * rollups-contracts `DEFAULT_VERSION` one. Pass an object to point at a
     * different dave release, keeping in mind that its addresses and the
     * `artifacts` release must belong to the same deployment.
     */
    prt?: boolean | PrtOptions;
    /**
     * Contracts (by name or regular expression) to include, deployed or not.
     * When omitted, all contracts in the artifacts are included.
     */
    include?: ContractFilter[];
    /**
     * Contracts (by name or regular expression) to exclude, deployed or not.
     * Applied after `include`.
     */
    exclude?: ContractFilter[];
}

export interface PrtOptions {
    /**
     * URL of the PRT foundry build artifacts tarball, i.e.
     * `cartesi-rollups-prt-<version>-contract-artifacts.tar.gz`. Optionally with
     * an expected SHA-256 hash for integrity verification.
     * Defaults to `PRT_DEFAULT_ARTIFACTS`, the tarball of the dave
     * `PRT_DEFAULT_VERSION` GitHub release.
     */
    artifacts?: TarballSource;
    /**
     * URL of the PRT deployment addresses tarball, i.e.
     * `cartesi-rollups-prt-<version>-deployment-addresses.tar.gz`. Optionally
     * with an expected SHA-256 hash for integrity verification.
     * Defaults to `PRT_DEFAULT_DEPLOYMENTS`, the tarball of the dave
     * `PRT_DEFAULT_VERSION` GitHub release. Addresses are read from the
     * plaintext deployment files, so the tarball must come from dave
     * 3.0.0-alpha.4 or later.
     */
    deployments?: TarballSource;
    /**
     * URL of the PRT anvil devnet tarball, i.e.
     * `cartesi-rollups-prt-<version>-anvil-<anvilVersion>.tar.gz`, whose
     * deployment addresses cover the devnet (chain 31337). Optionally with an
     * expected SHA-256 hash for integrity verification.
     * Defaults to `PRT_DEFAULT_ANVIL`, the tarball of the dave
     * `PRT_DEFAULT_VERSION` GitHub release. Pass `false` to generate only the
     * addresses of the chains the `deployments` tarball covers.
     */
    anvil?: TarballSource | false;
}

/**
 * Wagmi plugin that generates contracts from a rollups-contracts release:
 * ABIs from the foundry build artifacts tarball, addresses from the
 * deployment addresses and anvil devnet tarballs. The tarballs are downloaded
 * and extracted on every run, so generating contracts needs network access.
 * When `artifacts`, `deployments` and `anvil` are omitted, the tarballs of the
 * rollups-contracts `DEFAULT_VERSION` GitHub release are used.
 *
 * Deployed contracts get their address across all chains: a single address
 * if it is the same on every chain, or a per-chain record otherwise.
 *
 * Set `prt` to also generate the PRT (Permissionless Refereed Tournaments)
 * contracts from a dave release: PRT Rollups is a superset of the core
 * rollups contracts, running against the same `InputBox`, portals and
 * factories, at the same addresses.
 *
 * `include` and `exclude` filter all contracts alike, deployed or not: when
 * neither is given every contract in the artifacts is generated, `include`
 * narrows generation to the matching contracts, and `exclude` then drops
 * matching contracts.
 */
export const rollupsContracts = (
    options: RollupsContractsOptions = {},
): Plugin => {
    const {
        artifacts = DEFAULT_ARTIFACTS,
        deployments = DEFAULT_DEPLOYMENTS,
        anvil = DEFAULT_ANVIL,
        prt = false,
        include,
        exclude,
    } = options;
    const prtOptions: PrtOptions | undefined = prt
        ? prt === true
            ? {}
            : prt
        : undefined;
    return {
        name: "rollupsContracts",
        contracts: () =>
            releaseContracts(
                prtOptions
                    ? {
                          // dave does not rebuild the rollups contracts, so
                          // both sets of artifacts are needed to cover the
                          // addresses the dave release publishes
                          artifacts: [
                              artifacts,
                              prtOptions.artifacts ?? PRT_DEFAULT_ARTIFACTS,
                          ],
                          deployments:
                              prtOptions.deployments ?? PRT_DEFAULT_DEPLOYMENTS,
                          anvil:
                              prtOptions.anvil === undefined
                                  ? PRT_DEFAULT_ANVIL
                                  : prtOptions.anvil,
                          plaintextDeploymentsSince: "dave 3.0.0-alpha.4",
                          artifactAliases,
                          include,
                          exclude,
                      }
                    : {
                          artifacts: [artifacts],
                          deployments,
                          anvil,
                          plaintextDeploymentsSince:
                              "rollups-contracts 3.0.0-alpha.8",
                          artifactAliases,
                          include,
                          exclude,
                      },
            ),
    };
};
