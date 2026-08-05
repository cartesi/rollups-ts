import { rollupsContracts } from "@cartesi/wagmi-plugin";
import { defineConfig } from "@wagmi/cli";
import { actions, react } from "@wagmi/cli/plugins";

const config: ReturnType<typeof defineConfig> = defineConfig({
    out: "src/generated.ts",
    plugins: [
        // the release artifacts are already restricted to the contracts
        // clients are expected to use, so every one of them is generated
        rollupsContracts(),
        actions(),
        react(),
    ],
});

export default config;
