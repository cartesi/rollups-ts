import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        dir: "./__tests__",
        exclude: ["node_modules/**"],
        environment: "node",
        globals: true,
        // libcmt is a process-wide singleton (a second open device returns
        // -EBUSY) and the mock is driven by CMT_INPUTS/cwd, so the suite must
        // not run in parallel. `forks` also keeps `process.chdir` available.
        pool: "forks",
        fileParallelism: false,
        maxWorkers: 1,
        coverage: {
            provider: "v8",
            reporter: ["text", "lcov"],
            include: ["**/src"],
        },
    },
});
