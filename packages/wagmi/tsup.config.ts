import { defineConfig } from "tsup";

export default defineConfig({
    clean: true,
    dts: true,
    entry: ["src/index.ts"],
    esbuildOptions(options) {
        options.banner = {
            js: '"use client";',
        };
    },
    external: ["@tanstack/react-query", "react", "viem", "wagmi"],
    format: ["cjs", "esm"],
    minify: true,
    sourcemap: true,
});
