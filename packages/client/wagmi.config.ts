import { rollupsContracts } from "@cartesi/wagmi-plugin";
import { defineConfig } from "@wagmi/cli";

const config: ReturnType<typeof defineConfig> = defineConfig({
    out: "src/rollups.ts",
    plugins: [
        // the release artifacts are already restricted to the contracts
        // clients are expected to use, so every one of them is generated
        rollupsContracts(),
    ],
});

export default config;
