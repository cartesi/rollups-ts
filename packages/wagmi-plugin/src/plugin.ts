import type { ContractConfig, Plugin } from "@wagmi/cli";
import type { Abi, Address } from "abitype";
import fs from "node:fs";
import path from "node:path";
import { isAddress } from "viem";
import { downloadAndExtract, type TarballSource } from "./download.js";

export type ContractFilter = string | RegExp;

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

const matches = (name: string, filters?: ContractFilter[]): boolean =>
    (filters ?? []).some((filter) =>
        typeof filter === "string" ? filter === name : filter.test(name),
    );

/**
 * List all contracts in a foundry `out` directory, mapping contract name to
 * the path of its artifact JSON file (`<Source>.sol/<Contract>.json`).
 */
const findArtifacts = (directory: string): Map<string, string> => {
    const artifacts = new Map<string, string>();
    const sources = fs
        .readdirSync(directory, { withFileTypes: true })
        .filter((entry) => entry.isDirectory() && entry.name.endsWith(".sol"));
    for (const source of sources) {
        const sourceDir = path.join(directory, source.name);
        const files = fs
            .readdirSync(sourceDir)
            .filter((file) => file.endsWith(".json"));
        for (const file of files) {
            const name = path.basename(file, ".json");
            const existing = artifacts.get(name);
            if (existing) {
                throw new Error(
                    `Duplicate contract name ${name}: ${existing} and ${path.join(sourceDir, file)}`,
                );
            }
            artifacts.set(name, path.join(sourceDir, file));
        }
    }
    return artifacts;
};

/**
 * Read all deployment files from a deployments directory laid out as
 * `<chainId>/<Contract>.txt`, each holding nothing but the address, mapping
 * contract name to its address on each chain.
 */
const readDeployments = (
    directory: string,
): Map<string, Record<number, Address>> => {
    const deployments = new Map<string, Record<number, Address>>();
    const chains = fs
        .readdirSync(directory, { withFileTypes: true })
        .filter((entry) => entry.isDirectory() && /^\d+$/.test(entry.name));
    for (const chain of chains) {
        const chainId = Number(chain.name);
        const chainDir = path.join(directory, chain.name);
        const files = fs
            .readdirSync(chainDir)
            .filter((file) => file.endsWith(".txt"));
        if (files.length === 0) {
            throw new Error(
                `No deployment addresses for chain ${chainId}: ${chainDir} has no plaintext deployment file, so it predates rollups-contracts 3.0.0-alpha.8`,
            );
        }
        for (const file of files) {
            const name = path.basename(file, ".txt");
            const address = fs
                .readFileSync(path.join(chainDir, file), "utf8")
                .trim();
            if (!isAddress(address)) {
                throw new Error(
                    `${name} has an invalid address on chain ${chainId}: ${address}`,
                );
            }
            const addresses = deployments.get(name) ?? {};
            addresses[chainId] = address;
            deployments.set(name, addresses);
        }
    }
    return deployments;
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

/**
 * Give each aliased deployment the artifact of the interface it implements,
 * so that it is generated with an ABI like any other deployed contract.
 */
const applyArtifactAliases = (
    artifacts: Map<string, string>,
    deployments: Map<string, Record<number, Address>>,
): void => {
    for (const [name, artifactName] of Object.entries(artifactAliases)) {
        const artifactPath = artifacts.get(artifactName);
        if (deployments.has(name) && !artifacts.has(name) && artifactPath) {
            artifacts.set(name, artifactPath);
        }
    }
};

/**
 * Merge deployment maps of disjoint chains, as read from the deployment
 * addresses and the anvil devnet tarballs.
 */
const mergeDeployments = (
    maps: Map<string, Record<number, Address>>[],
): Map<string, Record<number, Address>> => {
    const merged = new Map<string, Record<number, Address>>();
    for (const map of maps) {
        for (const [name, addresses] of map) {
            merged.set(name, { ...merged.get(name), ...addresses });
        }
    }
    return merged;
};

const readAbi = (artifactPath: string, name: string): Abi => {
    let artifact: { abi: Abi };
    try {
        artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    } catch (error) {
        throw new Error(`Failed to parse artifact file: ${artifactPath}`, {
            cause: error,
        });
    }
    if (!Array.isArray(artifact.abi)) {
        throw new Error(`Contract ${name} has a missing or invalid ABI`);
    }
    return artifact.abi;
};

/**
 * Collapse a per-chain address record to a single address if the address is
 * the same across all chains, which wagmi represents as a plain address.
 */
const collapseAddress = (
    addresses: Record<number, Address>,
): ContractConfig["address"] => {
    const unique = new Set(
        Object.values(addresses).map((address) => address.toLowerCase()),
    );
    return unique.size === 1 ? Object.values(addresses)[0] : addresses;
};

/**
 * Wagmi plugin that generates contracts from a rollups-contracts release:
 * ABIs from the foundry build artifacts tarball, addresses from the
 * deployment addresses tarball. Both tarballs are downloaded and extracted on
 * every run, so generating contracts needs network access. When `artifacts`
 * and `deployments` are omitted, the tarballs of the rollups-contracts
 * `DEFAULT_VERSION` GitHub release are used.
 *
 * Deployed contracts get their address across all chains: a single address
 * if it is the same on every chain, or a per-chain record otherwise.
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
        artifacts: artifactsSource = DEFAULT_ARTIFACTS,
        deployments: deploymentsSource = DEFAULT_DEPLOYMENTS,
        anvil: anvilSource = DEFAULT_ANVIL,
        include,
        exclude,
    } = options;
    const included = (name: string): boolean =>
        (include ? matches(name, include) : true) && !matches(name, exclude);
    return {
        name: "rollupsContracts",
        contracts: async () => {
            const [artifactsDir, deploymentsDir, anvilDir] = await Promise.all([
                downloadAndExtract(artifactsSource),
                downloadAndExtract(deploymentsSource),
                anvilSource ? downloadAndExtract(anvilSource) : undefined,
            ]);

            try {
                // tarballs contain the `out` (resp. `deployments`) directory
                // contents either at the root or nested under that directory
                const resolveRoot = (dir: string, nested: string) =>
                    fs.existsSync(path.join(dir, nested))
                        ? path.join(dir, nested)
                        : dir;

                const artifacts = findArtifacts(
                    resolveRoot(artifactsDir, "out"),
                );
                const deployments = mergeDeployments([
                    readDeployments(resolveRoot(deploymentsDir, "deployments")),
                    ...(anvilDir
                        ? [
                              readDeployments(
                                  resolveRoot(anvilDir, "deployments"),
                              ),
                          ]
                        : []),
                ]);

                applyArtifactAliases(artifacts, deployments);

                for (const name of deployments.keys()) {
                    if (included(name) && !artifacts.has(name)) {
                        throw new Error(
                            `Deployed contract ${name} has no build artifact`,
                        );
                    }
                }

                return [...artifacts.entries()]
                    .filter(([name]) => included(name))
                    .sort(([a], [b]) => a.localeCompare(b))
                    .flatMap(([name, artifactPath]) => {
                        const abi = readAbi(artifactPath, name);
                        const addresses = deployments.get(name);
                        if (abi.length === 0) {
                            if (addresses) {
                                throw new Error(
                                    `Deployed contract ${name} has an empty ABI`,
                                );
                            }
                            // pure libraries have empty ABIs; nothing to generate
                            return [];
                        }
                        return [
                            {
                                name,
                                abi,
                                ...(addresses && {
                                    address: collapseAddress(addresses),
                                }),
                            },
                        ];
                    });
            } finally {
                // the extractions are only needed while the contracts are
                // read out of them; the tarballs they came from stay cached
                fs.rmSync(artifactsDir, { recursive: true, force: true });
                fs.rmSync(deploymentsDir, { recursive: true, force: true });
                if (anvilDir) {
                    fs.rmSync(anvilDir, { recursive: true, force: true });
                }
            }
        },
    };
};
