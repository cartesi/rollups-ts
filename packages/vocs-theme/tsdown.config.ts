import { defineConfig } from "tsdown";

export default defineConfig({
    clean: true,
    dts: true,
    entry: ["src/index.ts", "src/slots/index.ts"],
    fixedExtension: false,
    format: ["cjs", "esm"],
    minify: true,
    sourcemap: true,
});
