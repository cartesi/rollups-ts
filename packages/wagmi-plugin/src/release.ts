import type { ContractConfig } from "@wagmi/cli";
import type { Abi, Address } from "abitype";
import fs from "node:fs";
import path from "node:path";
import { isAddress } from "viem";
import { downloadAndExtract, type TarballSource } from "./download.js";

export type ContractFilter = string | RegExp;

/**
 * A release whose contracts a plugin generates: the tarballs it publishes,
 * plus how the release is laid out.
 */
export interface Release {
    /**
     * Foundry build artifacts tarballs, merged into one set of contracts.
     * More than one is needed when the deployment addresses span projects
     * built separately, as a PRT deployment spans dave and rollups-contracts.
     * A contract several of them build is generated once, and their ABIs
     * must agree.
     */
    artifacts: TarballSource[];
    /** deployment addresses tarball */
    deployments: TarballSource;
    /** anvil devnet tarball, or `false` to skip the devnet addresses */
    anvil: TarballSource | false;
    /**
     * The release that first published the plaintext deployment files, named
     * in the error raised for a tarball that has none.
     */
    plaintextDeploymentsSince: string;
    /**
     * Deployments named after the role they play rather than after the
     * contract they are an instance of, mapped to the artifact holding
     * their ABI.
     */
    artifactAliases?: Record<string, string>;
    /** contracts (by name or regular expression) to include */
    include?: ContractFilter[];
    /** contracts (by name or regular expression) to exclude, after `include` */
    exclude?: ContractFilter[];
}

const matches = (name: string, filters?: ContractFilter[]): boolean =>
    (filters ?? []).some((filter) =>
        typeof filter === "string" ? filter === name : filter.test(name),
    );

/**
 * List all contracts in a tarball of foundry build artifacts, mapping
 * contract name to the artifact files (`<Source>.sol/<Contract>.json`)
 * declaring it.
 *
 * Every `.sol` directory below `directory` is searched, at any depth, so
 * this works both for a tarball holding a single foundry `out` directory
 * and for one holding several of them, one per contracts project.
 *
 * A name can map to more than one artifact when projects share a source
 * file; the ABIs are only required to agree once the contract is actually
 * generated (see `readAbi`).
 */
export const findArtifacts = (directory: string): Map<string, string[]> => {
    const artifacts = new Map<string, string[]>();
    const visit = (dir: string) => {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            if (!entry.isDirectory()) continue;
            const child = path.join(dir, entry.name);
            if (!entry.name.endsWith(".sol")) {
                visit(child);
                continue;
            }
            const files = fs
                .readdirSync(child)
                .filter((file) => file.endsWith(".json"));
            for (const file of files) {
                const name = path.basename(file, ".json");
                const paths = artifacts.get(name) ?? [];
                paths.push(path.join(child, file));
                artifacts.set(name, paths);
            }
        }
    };
    visit(directory);
    return artifacts;
};

/**
 * Read all deployment files from a deployments directory laid out as
 * `<chainId>/<Contract>.txt`, each holding nothing but the address, mapping
 * contract name to its address on each chain.
 *
 * Releases also publish a JSON file per contract, which these deprecate and
 * which is not read.
 */
export const readDeployments = (
    directory: string,
    plaintextSince: string,
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
                `No deployment addresses for chain ${chainId}: ${chainDir} has no plaintext deployment file, so it predates ${plaintextSince}`,
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
 * Merge the artifacts of several tarballs into one set of contracts, keeping
 * every artifact declaring a name so that `readAbi` can hold the copies to
 * agreement.
 */
export const mergeArtifacts = (
    maps: Map<string, string[]>[],
): Map<string, string[]> => {
    const merged = new Map<string, string[]>();
    for (const map of maps) {
        for (const [name, paths] of map) {
            merged.set(name, [...(merged.get(name) ?? []), ...paths]);
        }
    }
    return merged;
};

/**
 * Merge deployment maps of disjoint chains, as read from the deployment
 * addresses and the anvil devnet tarballs.
 */
export const mergeDeployments = (
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

/**
 * Give each aliased deployment the artifact of the contract it is an
 * instance of, so that it is generated with an ABI like any other deployed
 * contract.
 */
const applyArtifactAliases = (
    aliases: Record<string, string>,
    artifacts: Map<string, string[]>,
    deployments: Map<string, Record<number, Address>>,
): void => {
    for (const [name, artifactName] of Object.entries(aliases)) {
        const artifactPaths = artifacts.get(artifactName);
        if (deployments.has(name) && !artifacts.has(name) && artifactPaths) {
            artifacts.set(name, artifactPaths);
        }
    }
};

/**
 * An ABI as a set of entries, each canonically serialized, so that two ABIs
 * holding the same functions, events and errors compare equal however the
 * compiler happened to order them.
 */
const abiEntries = (abi: Abi): Set<string> => {
    const canonical = (value: unknown): unknown =>
        Array.isArray(value)
            ? value.map(canonical)
            : value && typeof value === "object"
              ? Object.fromEntries(
                    Object.entries(value as Record<string, unknown>)
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([key, item]) => [key, canonical(item)]),
                )
              : value;
    return new Set(abi.map((entry) => JSON.stringify(canonical(entry))));
};

const sameAbi = (a: Abi, b: Abi): boolean => {
    const [left, right] = [abiEntries(a), abiEntries(b)];
    return (
        left.size === right.size && [...left].every((entry) => right.has(entry))
    );
};

/**
 * Read the ABI of a contract, which several artifact files may declare when
 * more than one of the release's projects builds the same source file. The
 * copies must agree, since only one contract is generated for the name.
 */
export const readAbi = (artifactPaths: string[], name: string): Abi => {
    const readOne = (artifactPath: string): Abi => {
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
    const [source, ...others] = artifactPaths;
    if (!source) {
        throw new Error(`Contract ${name} has no build artifact`);
    }
    const abi = readOne(source);
    for (const other of others) {
        if (!sameAbi(readOne(other), abi)) {
            throw new Error(
                `Contract ${name} has conflicting ABIs: ${source} and ${other}`,
            );
        }
    }
    return abi;
};

/**
 * Collapse a per-chain address record to a single address if the address is
 * the same across all chains, which wagmi represents as a plain address.
 */
export const collapseAddress = (
    addresses: Record<number, Address>,
): ContractConfig["address"] => {
    const unique = new Set(
        Object.values(addresses).map((address) => address.toLowerCase()),
    );
    return unique.size === 1 ? Object.values(addresses)[0] : addresses;
};

/**
 * Download the tarballs of a release and turn them into wagmi contracts:
 * ABIs from the build artifacts, addresses from the deployment addresses
 * and anvil devnet tarballs.
 */
export const releaseContracts = async (
    release: Release,
): Promise<ContractConfig[]> => {
    const included = (name: string): boolean =>
        (release.include ? matches(name, release.include) : true) &&
        !matches(name, release.exclude);

    // every extraction is the caller's to remove, including those of the
    // downloads that succeeded when a sibling failed, so they are collected
    // as they land rather than awaited together
    const extracted: string[] = [];
    const extract = async (source: TarballSource) => {
        const directory = await downloadAndExtract(source);
        extracted.push(directory);
        return directory;
    };

    try {
        const [artifactsDirs, deploymentsDir, anvilDir] = await Promise.all([
            Promise.all(release.artifacts.map(extract)),
            extract(release.deployments),
            release.anvil ? extract(release.anvil) : undefined,
        ]);

        // tarballs contain the `deployments` directory contents either at
        // the root or nested under that directory
        const resolveRoot = (dir: string, nested: string) =>
            fs.existsSync(path.join(dir, nested))
                ? path.join(dir, nested)
                : dir;

        const artifacts = mergeArtifacts(artifactsDirs.map(findArtifacts));
        const deployments = mergeDeployments(
            [deploymentsDir, ...(anvilDir ? [anvilDir] : [])].map((dir) =>
                readDeployments(
                    resolveRoot(dir, "deployments"),
                    release.plaintextDeploymentsSince,
                ),
            ),
        );

        if (release.artifactAliases) {
            applyArtifactAliases(
                release.artifactAliases,
                artifacts,
                deployments,
            );
        }

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
            .flatMap(([name, artifactPaths]) => {
                const abi = readAbi(artifactPaths, name);
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
        // the extractions are only needed while the contracts are read out
        // of them
        for (const directory of extracted) {
            fs.rmSync(directory, { recursive: true, force: true });
        }
    }
};
