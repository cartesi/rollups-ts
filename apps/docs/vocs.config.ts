import { defineConfig } from "vocs";

export default defineConfig({
    rootDir: ".",
    title: "Cartesi",
    description: "Documentation for Cartesi TypeScript libraries",
    baseUrl: "https://cartesi.github.io",
    basePath: "/rollups-ts",
    editLink: {
        pattern:
            "https://github.com/cartesi/rollups-ts/edit/main/apps/docs/pages/:path",
        text: "Edit on GitHub",
    },
});
