import { defineConfig } from "tsup";

export default defineConfig({
    clean: true,
    dts: true,
    entry: [
        "src/index.ts",
        "src/download.ts",
        "src/wagmi/plugins/index.ts",
        "src/wagmi/plugins/deployments.ts",
    ],
    external: ["@wagmi/cli", "viem"],
    format: ["cjs", "esm"],
    minify: true,
    sourcemap: true,
});
