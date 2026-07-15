import { rollupsContracts } from "@cartesi/wagmi-plugin";
import { defineConfig } from "@wagmi/cli";

const config: ReturnType<typeof defineConfig> = defineConfig({
    out: "src/rollups.ts",
    plugins: [
        rollupsContracts({
            // `exclude` is applied before the "deployed contracts are always
            // included" rule, so a negative match keeps only the Inputs and
            // Outputs interfaces plus the portals (whose deployment addresses
            // `decodeDeposit` dispatches on)
            exclude: [
                /^(?!(Inputs|Outputs|EtherPortal|ERC20Portal|ERC721Portal|ERC1155SinglePortal|ERC1155BatchPortal)$)/,
            ],
        }),
    ],
});

export default config;
