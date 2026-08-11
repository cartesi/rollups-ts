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
            // anchored at the package root: `**/src` would also pick up the
            // vendored libcmt C sources under deps/ and node-gyp's dependency
            // files under build/, which the coverage provider cannot parse
            include: ["src/**"],
        },
    },
});
