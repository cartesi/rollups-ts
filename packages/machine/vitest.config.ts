import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        dir: "./__tests__",
        exclude: ["node_modules/**"],
        environment: "node",
        globals: true,
        // the addon is a process-global resource and the suites spawn machines
        // and JSON-RPC servers, so keep the files sequential
        fileParallelism: false,
        // these drive the emulator, not plain functions: hashing the tree of a
        // 128 MB machine (verifyHashTree) already takes ~4s on a fast host and
        // went over vitest's 5s default on CI runners
        testTimeout: 30_000,
        coverage: {
            provider: "v8",
            reporter: ["text", "lcov"],
            // anchored at the package root, so node-gyp's dependency files
            // under build/ stay out of the coverage provider's parser
            include: ["src/**"],
        },
    },
});
