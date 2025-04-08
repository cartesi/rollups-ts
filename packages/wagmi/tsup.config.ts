import { defineConfig } from "tsup";

export default defineConfig({
    entry: ["src/index.ts", "src/actions/index.ts", "src/rollups.ts"],
    format: ["cjs", "esm"],
    dts: true,
    sourcemap: true,
    clean: true,
    minify: true,
});
