import { defineConfig } from "tsdown";

export default defineConfig({
    clean: true,
    dts: true,
    entry: ["src/index.ts"],
    fixedExtension: false,
    format: ["cjs", "esm"],
    minify: true,
    // __dirname in the ESM output, used to locate the native addon and the
    // bundled cartesi-jsonrpc-machine executable relative to the package root
    shims: true,
    sourcemap: true,
});
