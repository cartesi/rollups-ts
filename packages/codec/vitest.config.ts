import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        dir: "./__tests__",
        exclude: ["node_modules/**"],
        environment: "node",
        globals: true,
        // the *.test-d.ts suites assert on types only, so they need tsc
        typecheck: {
            enabled: true,
            include: ["**/*.test-d.ts"],
        },
        coverage: {
            provider: "v8",
            reporter: ["text", "lcov"],
            exclude: ["./src/rollups.ts"],
            include: ["**/src"],
        },
    },
});
