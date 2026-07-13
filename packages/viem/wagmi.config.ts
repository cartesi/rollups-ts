import { rollupsContracts } from "@cartesi/wagmi-plugin";
import { defineConfig } from "@wagmi/cli";

const version = "3.0.0-alpha.6";
const releaseUrl = `https://github.com/cartesi/rollups-contracts/releases/download/v${version}`;

const config: ReturnType<typeof defineConfig> = defineConfig({
    out: "src/rollups.ts",
    plugins: [
        rollupsContracts({
            artifacts: {
                url: `${releaseUrl}/rollups-contracts-${version}-artifacts.tar.gz`,
                sha256: "ad1e0880766d25419fc6da1858ea4e7b9074b400e9d9ef68da88b12f4a8bba45",
            },
            deployments: {
                url: `${releaseUrl}/rollups-contracts-${version}-deployment-addresses.tar.gz`,
                sha256: "bd6ee9b339e0541ce464ea3368e5e70595627b35fe0a68c6f5e044ef433ab895",
            },
            include: [
                "DataAvailability",
                "IApplicationFactory",
                "IApplication",
                "IAuthorityFactory",
                "IAuthority",
                "IConsensus",
                "IERC1155BatchPortal",
                "IERC1155SinglePortal",
                "IERC20Portal",
                "IERC721Portal",
                "IEtherPortal",
                "IInputBox",
                "Inputs",
                "IOutputsMerkleRootValidator",
                "IQuorumFactory",
                "IQuorum",
                "IRefundOutputBuilder",
                "ISafeERC20Transfer",
                "ISelfHostedApplicationFactory",
                "IUsdWithdrawalOutputBuilderFactory",
                "IUsdWithdrawalOutputBuilder",
                "IWithdrawalOutputBuilder",
                "Outputs",
            ],
        }),
    ],
});

export default config;
