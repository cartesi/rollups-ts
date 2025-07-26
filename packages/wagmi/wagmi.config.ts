import DataAvailability from "@cartesi/rollups/out/DataAvailability.sol/DataAvailability.json" with {
    type: "json",
};
import IApplication from "@cartesi/rollups/out/IApplication.sol/IApplication.json" with {
    type: "json",
};
import { defineConfig, type Plugin } from "@wagmi/cli";
import { actions, react } from "@wagmi/cli/plugins";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import type { Abi } from "viem";

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
    out: "src/generated.ts",
    contracts: [
        {
            abi: DataAvailability.abi as Abi,
            name: "DataAvailability",
        },
        {
            abi: IApplication.abi as Abi,
            name: "IApplication",
        },
    ],
    plugins: [
        cannonDeployments({ directory: "deployment" }),
        actions(),
        react(),
    ],
});

export default config;
