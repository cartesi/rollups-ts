import { rollupsContracts } from "@cartesi/wagmi-plugin";
import { defineConfig } from "@wagmi/cli";
import { actions, react } from "@wagmi/cli/plugins";

const config: ReturnType<typeof defineConfig> = defineConfig({
    out: "src/generated.ts",
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
        actions(),
        react(),
    ],
});

export default config;
