import { rollupsContracts } from "@cartesi/wagmi-plugin";
import { defineConfig } from "@wagmi/cli";

const config: ReturnType<typeof defineConfig> = defineConfig({
    out: "src/rollups.ts",
    plugins: [
        rollupsContracts({
            // `exclude` is applied before the "deployed contracts are always
            // included" rule, so a negative match keeps only the Inputs and
            // Outputs interfaces
            exclude: [/^(?!(Inputs|Outputs)$)/],
        }),
    ],
});

export default config;
