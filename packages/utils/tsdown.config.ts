import { defineConfig } from "tsdown";

export default defineConfig({
    clean: true,
    dts: true,
    entry: [
        "src/index.ts",
        "src/download.ts",
        "src/wagmi/plugins/index.ts",
        "src/wagmi/plugins/deployments.ts",
    ],
    fixedExtension: false,
    format: ["cjs", "esm"],
    minify: true,
    sourcemap: true,
});
