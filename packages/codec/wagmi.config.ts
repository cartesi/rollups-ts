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
                "Erc20Portal",
                "Erc721Portal",
                "Erc1155SinglePortal",
                "Erc1155BatchPortal",
            ],
        }),
    ],
});

export default config;
