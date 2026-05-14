import { deployments } from "@rollups-ts/utils/wagmi/plugins";
import { defineConfig } from "@wagmi/cli";
import { actions, foundry, react } from "@wagmi/cli/plugins";

const config: ReturnType<typeof defineConfig> = defineConfig({
    out: "src/generated.ts",
    plugins: [
        deployments({
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
        actions(),
        react(),
    ],
});

export default config;
