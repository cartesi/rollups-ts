import { downloadAndExtract } from "@rollups-ts/utils";
import path from "node:path";

const rollupsVersion = "3.0.0-alpha.6" as const;
const basePath = "./tmp";
const deploymentUrl = `https://github.com/cartesi/rollups-contracts/releases/download/v${rollupsVersion}/rollups-contracts-${rollupsVersion}-deployment-addresses.tar.gz`;
const deploymentHash =
    "bd6ee9b339e0541ce464ea3368e5e70595627b35fe0a68c6f5e044ef433ab895" as const;
const deploymentDestination = basePath;
const artifactUrl = `https://github.com/cartesi/rollups-contracts/releases/download/v${rollupsVersion}/rollups-contracts-${rollupsVersion}-artifacts.tar.gz`;
const artifactHash =
    "ad1e0880766d25419fc6da1858ea4e7b9074b400e9d9ef68da88b12f4a8bba45" as const;
const artifactDestination = path.join(basePath, "out");

async function run() {
    await Promise.all([
        downloadAndExtract({
            name: "GitHub rollups-contracts artifacts",
            downloadUrl: artifactUrl,
            expectedHash: artifactHash,
            destination: artifactDestination,
        }),
        downloadAndExtract({
            name: "GitHub rollups-contracts deployment addresses",
            downloadUrl: deploymentUrl,
            expectedHash: deploymentHash,
            destination: deploymentDestination,
        }),
    ])
        .then(() =>
            console.log(
                "wagmi-scripts: Successfully downloaded and extracted rollups contracts!",
            ),
        )
        .catch((error) => {
            console.error(
                "wagmi-scripts: Error downloading and extracting rollups contracts:",
                error,
            );
            process.exitCode = 1;
        });
}

run();
