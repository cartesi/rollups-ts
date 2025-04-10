import { defineConfig } from "tsup";

export default defineConfig({
    entry: ["src/index.ts"],
    external: ["react"],
    format: ["cjs", "esm"],
    dts: true,
    sourcemap: true,
    clean: true,
    minify: true,
});
