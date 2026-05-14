import { deployments } from "@rollups-ts/utils/wagmi/plugins";
import { defineConfig } from "@wagmi/cli";
import { foundry } from "@wagmi/cli/plugins";

const config: ReturnType<typeof defineConfig> = defineConfig({
    out: "src/rollups.ts",
    plugins: [
        deployments({
            // Assumes all chains have same address. Therefore picks the mainnet deployment information.
            directory: "./tmp/deployments/1",
            contractsDir: "./tmp/out",
        }),
        foundry({
            project: "./tmp",
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
                "UsdWithdrawalOutputBuilderFactory.sol/**",
                "IApplicationForeclosure.sol/**",
                "IApplicationWithdrawal.sol/**",
            ],
        }),
    ],
});

export default config;
