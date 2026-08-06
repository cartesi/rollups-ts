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
        coverage: {
            provider: "v8",
            reporter: ["text", "lcov"],
            include: ["**/src"],
        },
    },
});
