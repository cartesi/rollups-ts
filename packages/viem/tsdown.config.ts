import { defineConfig } from "tsdown";

export default defineConfig({
    clean: true,
    dts: true,
    entry: [
        "src/actions/index.ts",
        "src/chains.ts",
        "src/index.ts",
        "src/rollups.ts",
    ],
    external: ["viem"],
    format: ["cjs", "esm"],
    minify: true,
    sourcemap: true,
});
