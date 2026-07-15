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
                "DataAvailability",
                "ERC1155BatchPortal",
                "ERC1155SinglePortal",
                "ERC20Portal",
                "ERC721Portal",
                "EtherPortal",
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
                "InputBox",
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
                "QuorumFactory",
                "SafeERC20Transfer",
                "SelfHostedApplicationFactory",
                "UsdWithdrawalOutputBuilderFactory",
            ],
        }),
        actions(),
        react(),
    ],
});

export default config;
