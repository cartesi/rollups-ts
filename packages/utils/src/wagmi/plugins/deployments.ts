import type { Plugin } from "@wagmi/cli";
import type { Abi, Address } from "abitype";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { isAddress } from "viem";

export interface DeploymentsOptions {
    directory: string;
    contractsDir: string;
    includes?: RegExp[];
    excludes?: RegExp[];
}

type Contract = {
    abi: Abi;
};

type Deployment = {
    address: Address;
    contractName: string;
};

const shouldIncludeFile = (
    name: string,
    config: DeploymentsOptions,
): boolean => {
    if (config.excludes) {
        // if there is a list of excludes, then if the name matches any of them, then exclude
        for (const exclude of config.excludes) {
            if (exclude.test(name)) {
                return false;
            }
        }
    }
    if (config.includes) {
        // if there is a list of includes, then only include if the name matches any of them
        for (const include of config.includes) {
            if (include.test(name)) {
                return true;
            }
        }
        return false;
    } else {
        // if there is no list of includes, then include everything
        return true;
    }
};

/**
 * Run some basic checks on the deployment information.
 * @param deployment
 * @throws Error if the address is missing or invalid
 */
const checkDeployment = (deployment: Deployment) => {
    if (!isAddress(deployment.address)) {
        throw new Error(
            `${deployment.contractName} has an invalid address: ${deployment.address}`,
        );
    }
};

/**
 * Run some basic checks on the contract information.
 * @param contract
 * @param contractName
 * @throws Error if the contract is missing, or if the ABI is missing, invalid, or empty
 */
const checkContract = (contract: Contract, contractName: string) => {
    if (!contract) {
        throw new Error(`Contract for ${contractName} not found`);
    }

    if (!contract.abi) {
        throw new Error(`Contract ${contractName} is missing ABI`);
    }

    if (!Array.isArray(contract.abi)) {
        throw new Error(`Contract ${contractName} has an invalid ABI`);
    }

    if (contract.abi.length === 0) {
        throw new Error(`Contract ${contractName} has an empty ABI`);
    }
};

export const deployments = (config: DeploymentsOptions): Plugin => {
    return {
        name: "deployments",
        contracts: () => {
            // list all files exported by deployments in directory
            const files: string[] = readdirSync(config.directory, {
                withFileTypes: true,
                encoding: "utf-8",
            })
                .filter((file) => {
                    return (
                        file.isFile() &&
                        file.name.endsWith(".json") &&
                        shouldIncludeFile(file.name, config)
                    );
                })
                .map((file) => file.name);

            // return an array of contracts as expected by wagmi
            return files.map((file) => {
                let deployment: Deployment;
                try {
                    deployment = JSON.parse(
                        readFileSync(path.join(config.directory, file), "utf8"),
                    );
                } catch (error) {
                    throw new Error(
                        `Failed to parse deployment file: ${file}.`,
                        { cause: error as Error },
                    );
                }

                checkDeployment(deployment);

                let contract: Contract;

                try {
                    const contractName = deployment.contractName;
                    const contractPath = path.join(
                        config.contractsDir,
                        `${contractName}.sol`,
                        `${contractName}.json`,
                    );
                    contract = JSON.parse(readFileSync(contractPath, "utf8"));
                } catch (error) {
                    throw new Error(
                        `Failed to get contract file: ${deployment.contractName}`,
                        { cause: error as Error },
                    );
                }

                checkContract(contract, deployment.contractName);

                return {
                    abi: contract.abi,
                    address: deployment.address,
                    name: deployment.contractName,
                };
            });
        },
    };
};
