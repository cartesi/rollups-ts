import { defineConfig } from "tsdown";

export default defineConfig({
    clean: true,
    dts: true,
    entry: ["src/index.ts"],
    fixedExtension: false,
    format: ["cjs", "esm"],
    minify: true,
    sourcemap: true,
    // `__dirname` in the ESM output, used to locate the native addon relative
    // to the package root
    shims: true,
});
