import { rollupsContracts } from "@cartesi/wagmi-plugin";
import { defineConfig } from "@wagmi/cli";
import { actions, react } from "@wagmi/cli/plugins";

const config: ReturnType<typeof defineConfig> = defineConfig({
    out: "src/generated.ts",
    plugins: [
        rollupsContracts({
            include: [
                "ApplicationFactory",
                "AuthorityFactory",
                "Erc1155BatchPortal",
                "Erc1155SinglePortal",
                "Erc20Portal",
                "Erc721Portal",
                "EtherPortal",
                "IApplicationFactory",
                "IApplication",
                "IAuthorityFactory",
                "IAuthority",
                "IConsensus",
                "IErc1155BatchPortal",
                "IErc1155SinglePortal",
                "IErc20Portal",
                "IErc721Portal",
                "IEtherPortal",
                "IInputBox",
                "InputBox",
                "Inputs",
                "IOutputsMerkleRootValidator",
                "IQuorumFactory",
                "IQuorum",
                "IRefundOutputBuilder",
                "ISafeErc20Transfer",
                "ISelfHostedApplicationFactory",
                "IUsdWithdrawalOutputBuilderFactory",
                "IUsdWithdrawalOutputBuilder",
                "IWithdrawalOutputBuilder",
                "Outputs",
                "QuorumFactory",
                "RefundOutputBuilder",
                "SafeErc20Transfer",
                "SelfHostedApplicationFactory",
                "UsdWithdrawalOutputBuilderFactory",
            ],
        }),
        actions(),
        react(),
    ],
});

export default config;
