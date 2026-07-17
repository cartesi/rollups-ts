import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        dir: "./__tests__",
        exclude: ["node_modules/**"],
        environment: "node",
        globals: true,
        coverage: {
            provider: "v8",
            reporter: ["text", "lcov"],
            exclude: ["./src/generated.ts"],
            include: ["**/src"],
        },
    },
});
