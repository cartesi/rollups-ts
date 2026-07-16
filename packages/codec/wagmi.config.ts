import { rollupsContracts } from "@cartesi/wagmi-plugin";
import { defineConfig } from "@wagmi/cli";

const config: ReturnType<typeof defineConfig> = defineConfig({
    out: "src/rollups.ts",
    plugins: [
        rollupsContracts({
            // the Inputs and Outputs interfaces, plus the portals (whose
            // deployment addresses `decodeDeposit` dispatches on)
            include: [
                "Inputs",
                "Outputs",
                "EtherPortal",
                "ERC20Portal",
                "ERC721Portal",
                "ERC1155SinglePortal",
                "ERC1155BatchPortal",
            ],
        }),
    ],
});

export default config;
