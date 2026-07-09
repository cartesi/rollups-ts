import { defineConfig } from "tsdown";

export default defineConfig({
    entry: ["src/index.ts"],
    fixedExtension: false,
    format: ["cjs", "esm"],
    dts: true,
    sourcemap: true,
    clean: true,
    minify: true,
});
