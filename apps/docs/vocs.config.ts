import { defineConfig } from "vocs";

export default defineConfig({
    rootDir: ".",
    title: "Cartesi",
    description: "Documentation for Cartesi TypeScript libraries",
    baseUrl: "https://cartesi.github.io",
    basePath: "/rollups-ts",
    logoUrl: "https://cartesi.io/favicon.svg",
    editLink: {
        pattern:
            "https://github.com/cartesi/rollups-ts/edit/main/apps/docs/pages/:path",
        text: "Edit on GitHub",
    },
    sidebar: [
        {
            text: "Introduction",
            link: "/",
        },
        {
            text: "RPC Client",
            items: [
                {
                    text: "Introduction",
                    link: "/rpc",
                },
                {
                    text: "API",
                    items: [
                        {
                            text: "createClient",
                            link: "/rpc/createClient",
                        },
                    ],
                },
                {
                    text: "Methods",
                    items: [
                        {
                            text: "cartesi_listApplications",
                            link: "/rpc/cartesi_listApplications",
                        },
                        {
                            text: "cartesi_listEpochs",
                            link: "/rpc/cartesi_listEpochs",
                        },
                        {
                            text: "cartesi_listInputs",
                            link: "/rpc/cartesi_listInputs",
                        },
                        {
                            text: "cartesi_listOutputs",
                            link: "/rpc/cartesi_listOutputs",
                        },
                        {
                            text: "cartesi_listReports",
                            link: "/rpc/cartesi_listReports",
                        },
                        {
                            text: "cartesi_getApplication",
                            link: "/rpc/cartesi_getApplication",
                        },
                        {
                            text: "cartesi_getEpoch",
                            link: "/rpc/cartesi_getEpoch",
                        },
                        {
                            text: "cartesi_getLastAcceptedEpoch",
                            link: "/rpc/cartesi_getLastAcceptedEpoch",
                        },
                        {
                            text: "cartesi_getInput",
                            link: "/rpc/cartesi_getInput",
                        },
                        {
                            text: "cartesi_getProcessedInputCount",
                            link: "/rpc/cartesi_getProcessedInputCount",
                        },
                        {
                            text: "cartesi_getOutput",
                            link: "/rpc/cartesi_getOutput",
                        },
                        {
                            text: "cartesi_getReport",
                            link: "/rpc/cartesi_getReport",
                        },
                    ],
                },
            ],
        },
    ],
});
