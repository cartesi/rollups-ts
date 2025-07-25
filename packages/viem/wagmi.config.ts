import { defineConfig, type Plugin } from "@wagmi/cli";
import { foundry } from "@wagmi/cli/plugins";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

interface CannonOptions {
    directory: string;
    includes?: RegExp[];
    excludes?: RegExp[];
}

const shouldIncludeFile = (name: string, config: CannonOptions): boolean => {
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

const cannonDeployments = (config: CannonOptions): Plugin => {
    return {
        name: "cannon",
        contracts: () => {
            // list all files exported by cannon in directory
            const files = readdirSync(config.directory).filter((file) =>
                shouldIncludeFile(file, config),
            );

            // return an array of contracts as expected by wagmi
            return files.map((file) => {
                // read the file and parse it as json
                const deployment = JSON.parse(
                    readFileSync(path.join(config.directory, file), "utf8"),
                );

                // get the address and abi from the deployment
                return {
                    abi: deployment.abi,
                    address: deployment.address,
                    name: deployment.contractName,
                };
            });
        },
    };
};

const config: ReturnType<typeof defineConfig> = defineConfig({
    out: "src/rollups.ts",
    plugins: [
        cannonDeployments({ directory: "deployment" }),
        foundry({
            project: "node_modules/@cartesi/rollups",
            forge: { build: false },
            exclude: [
                "ApplicationFactory.sol/**",
                "AuthorityFactory.sol/**",
                "ERC1155BatchPortal.sol/**",
                "ERC1155SinglePortal.sol/**",
                "ERC20Portal.sol/**",
                "ERC721Portal.sol/**",
                "EtherPortal.sol/**",
                "InputBox.sol/**",
                "QuorumFactory.sol/**",
                "SafeERC20Transfer.sol/**",
                "SelfHostedApplicationFactory.sol/**",
            ],
        }),
    ],
});

export default config;
