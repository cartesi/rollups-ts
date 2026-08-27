import { defineConfig } from "tsdown";

export default defineConfig({
    clean: true,
    dts: true,
    entry: [
        "src/index.ts",
        "src/browser.ts",
        "src/browser/worker.ts",
        "src/jsonrpc/client.ts",
    ],
    // the Emscripten module is an asset, not a dependency to bundle: it is
    // several megabytes and scripts/copy-wasm.mjs places it next to the output,
    // where this relative specifier resolves
    external: ["./cartesi-machine.mjs"],
    fixedExtension: false,
    // the browser build has nothing to require: it is ESM-only, like the
    // Emscripten module it loads
    format: ["cjs", "esm"],
    minify: true,
    // __dirname in the ESM output, used to locate the native addon and the
    // bundled cartesi-jsonrpc-machine executable relative to the package root
    shims: true,
    sourcemap: true,
});
