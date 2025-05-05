import { defineConfig } from "tsup";

export default defineConfig({
    clean: true,
    dts: true,
    entry: ["src/index.ts", "src/actions/index.ts", "src/rollups.ts"],
    external: ["viem"],
    format: ["cjs", "esm"],
    minify: true,
    sourcemap: true,
});
