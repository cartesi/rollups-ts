import { rollupsContracts } from "@cartesi/wagmi-plugin";
import { defineConfig } from "@wagmi/cli";

const config: ReturnType<typeof defineConfig> = defineConfig({
    out: "src/rollups.ts",
    plugins: [
        rollupsContracts({
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
