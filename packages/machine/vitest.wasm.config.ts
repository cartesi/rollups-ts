import { defineConfig, mergeConfig } from "vitest/config";

import base from "./vitest.config.js";

// The WebAssembly suites, which the default config leaves out: they need
// src/wasm/cartesi-machine.mjs (`pnpm build:wasm`) but no emulator
// distribution, which is the opposite of what the other suites need.
export default mergeConfig(
    base,
    defineConfig({
        test: {
            dir: "./__tests__/wasm",
            exclude: ["node_modules/**"],
        },
    }),
);
