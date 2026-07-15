import { defineConfig } from "tsdown";

export default defineConfig({
    clean: true,
    dts: true,
    entry: ["src/index.ts", "src/rollups.ts"],
    fixedExtension: false,
    format: ["cjs", "esm"],
    minify: true,
    sourcemap: true,
});
