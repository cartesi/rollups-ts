import { type Config, defineConfig } from "vocs/config";

const config: Config = defineConfig({
    rootDir: ".",
    srcDir: ".",
    // twoslash renders viem's JSDoc, which contains viem.sh-relative links
    checkDeadlinks: "warn",
    // GitHub Pages deployment requires fully static output
    renderStrategy: "full-static",
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
            text: "Viem Extension",
            items: [
                {
                    text: "Introduction",
                    link: "/viem",
                },
                {
                    text: "L1 Contract Interactions",
                    link: "/viem/l1",
                },
                {
                    text: "Public L2 Actions",
                    collapsed: true,
                    items: [
                        {
                            text: "listApplications",
                            link: "/viem/listApplications",
                        },
                        {
                            text: "getApplication",
                            link: "/viem/getApplication",
                        },
                        { text: "listEpochs", link: "/viem/listEpochs" },
                        { text: "getEpoch", link: "/viem/getEpoch" },
                        {
                            text: "listTournaments",
                            link: "/viem/listTournaments",
                        },
                        { text: "getTournament", link: "/viem/getTournament" },
                        {
                            text: "listCommitments",
                            link: "/viem/listCommitments",
                        },
                        { text: "getCommitment", link: "/viem/getCommitment" },
                        { text: "listMatches", link: "/viem/listMatches" },
                        { text: "getMatch", link: "/viem/getMatch" },
                        {
                            text: "listMatchAdvances",
                            link: "/viem/listMatchAdvances",
                        },
                        {
                            text: "getMatchAdvanced",
                            link: "/viem/getMatchAdvanced",
                        },
                        { text: "listInputs", link: "/viem/listInputs" },
                        { text: "getInput", link: "/viem/getInput" },
                        { text: "listOutputs", link: "/viem/listOutputs" },
                        { text: "getOutput", link: "/viem/getOutput" },
                        { text: "listReports", link: "/viem/listReports" },
                        { text: "getReport", link: "/viem/getReport" },
                        {
                            text: "getProcessedInputCount",
                            link: "/viem/getProcessedInputCount",
                        },
                        {
                            text: "getLastAcceptedEpochIndex",
                            link: "/viem/getLastAcceptedEpochIndex",
                        },
                        { text: "getWithdrawal", link: "/viem/getWithdrawal" },
                        {
                            text: "listWithdrawals",
                            link: "/viem/listWithdrawals",
                        },
                        { text: "waitForInput", link: "viem/waitForInput" },
                    ],
                },
            ],
        },
        {
            text: "React Hooks",
            items: [
                {
                    text: "Introduction",
                    link: "/wagmi",
                },
                {
                    text: "Public L2 Hooks",
                    collapsed: true,
                    items: [
                        {
                            text: "useApplication",
                            link: "/wagmi/useApplication",
                        },
                        {
                            text: "useApplications",
                            link: "/wagmi/useApplications",
                        },
                        { text: "useChainId", link: "/wagmi/useChainId" },
                        { text: "useEpoch", link: "/wagmi/useEpoch" },
                        { text: "useEpochs", link: "/wagmi/useEpochs" },
                        { text: "useTournament", link: "/wagmi/useTournament" },
                        {
                            text: "useTournaments",
                            link: "/wagmi/useTournaments",
                        },
                        { text: "useCommitment", link: "/wagmi/useCommitment" },
                        {
                            text: "useCommitments",
                            link: "/wagmi/useCommitments",
                        },
                        { text: "useMatch", link: "/wagmi/useMatch" },
                        { text: "useMatches", link: "/wagmi/useMatches" },
                        {
                            text: "useMatchAdvanced",
                            link: "/wagmi/useMatchAdvanced",
                        },
                        {
                            text: "useMatchAdvances",
                            link: "/wagmi/useMatchAdvances",
                        },
                        { text: "useInput", link: "/wagmi/useInput" },
                        { text: "useInputs", link: "/wagmi/useInputs" },
                        {
                            text: "useLastAcceptedEpochIndex",
                            link: "/wagmi/useLastAcceptedEpochIndex",
                        },
                        {
                            text: "useNodeVersion",
                            link: "/wagmi/useNodeVersion",
                        },
                        { text: "useOutput", link: "/wagmi/useOutput" },
                        { text: "useOutputs", link: "/wagmi/useOutputs" },
                        {
                            text: "useProcessedInputCount",
                            link: "/wagmi/useProcessedInputCount",
                        },
                        { text: "useReport", link: "/wagmi/useReport" },
                        { text: "useReports", link: "/wagmi/useReports" },
                        {
                            text: "useWaitForInput",
                            link: "/wagmi/useWaitForInput",
                        },
                        {
                            text: "useWithdrawal",
                            link: "/wagmi/useWithdrawal",
                        },
                        {
                            text: "useWithdrawals",
                            link: "/wagmi/useWithdrawals",
                        },
                    ],
                },
            ],
        },
        {
            text: "Wagmi CLI Plugin",
            items: [
                {
                    text: "Introduction",
                    link: "/wagmi-plugin",
                },
            ],
        },
        {
            text: "Codec",
            items: [
                {
                    text: "Introduction",
                    link: "/codec",
                },
                {
                    text: "Decode Functions",
                    collapsed: true,
                    items: [
                        { text: "decodeInput", link: "/codec/decodeInput" },
                        { text: "decodeOutput", link: "/codec/decodeOutput" },
                    ],
                },
                {
                    text: "Encode Functions",
                    collapsed: true,
                    items: [
                        { text: "encodeInput", link: "/codec/encodeInput" },
                        { text: "encodeOutput", link: "/codec/encodeOutput" },
                        { text: "encodeNotice", link: "/codec/encodeNotice" },
                        { text: "encodeVoucher", link: "/codec/encodeVoucher" },
                        {
                            text: "encodeDelegateCallVoucher",
                            link: "/codec/encodeDelegateCallVoucher",
                        },
                    ],
                },
                {
                    text: "Portal Deposits",
                    collapsed: true,
                    items: [
                        {
                            text: "decodeEtherDeposit",
                            link: "/codec/decodeEtherDeposit",
                        },
                        {
                            text: "encodeEtherDeposit",
                            link: "/codec/encodeEtherDeposit",
                        },
                        {
                            text: "decodeERC20Deposit",
                            link: "/codec/decodeERC20Deposit",
                        },
                        {
                            text: "encodeERC20Deposit",
                            link: "/codec/encodeERC20Deposit",
                        },
                        {
                            text: "decodeERC721Deposit",
                            link: "/codec/decodeERC721Deposit",
                        },
                        {
                            text: "encodeERC721Deposit",
                            link: "/codec/encodeERC721Deposit",
                        },
                        {
                            text: "decodeSingleERC1155Deposit",
                            link: "/codec/decodeSingleERC1155Deposit",
                        },
                        {
                            text: "encodeSingleERC1155Deposit",
                            link: "/codec/encodeSingleERC1155Deposit",
                        },
                        {
                            text: "decodeBatchERC1155Deposit",
                            link: "/codec/decodeBatchERC1155Deposit",
                        },
                        {
                            text: "encodeBatchERC1155Deposit",
                            link: "/codec/encodeBatchERC1155Deposit",
                        },
                    ],
                },
            ],
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
                    collapsed: true,
                    items: [
                        {
                            text: "createClient",
                            link: "/rpc/createClient",
                        },
                    ],
                },
                {
                    text: "Methods",
                    collapsed: true,
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
                            text: "cartesi_listTournaments",
                            link: "/rpc/cartesi_listTournaments",
                        },
                        {
                            text: "cartesi_listCommitments",
                            link: "/rpc/cartesi_listCommitments",
                        },
                        {
                            text: "cartesi_listMatches",
                            link: "/rpc/cartesi_listMatches",
                        },
                        {
                            text: "cartesi_listMatchAdvances",
                            link: "/rpc/cartesi_listMatchAdvances",
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
                            text: "cartesi_getTournament",
                            link: "/rpc/cartesi_getTournament",
                        },
                        {
                            text: "cartesi_getCommitment",
                            link: "/rpc/cartesi_getCommitment",
                        },
                        {
                            text: "cartesi_getMatch",
                            link: "/rpc/cartesi_getMatch",
                        },
                        {
                            text: "cartesi_getMatchAdvanced",
                            link: "/rpc/cartesi_getMatchAdvanced",
                        },
                        {
                            text: "cartesi_getLastAcceptedEpochIndex",
                            link: "/rpc/cartesi_getLastAcceptedEpochIndex",
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
                        {
                            text: "cartesi_getWithdrawal",
                            link: "/rpc/cartesi_getWithdrawal",
                        },
                        {
                            text: "cartesi_listWithdrawals",
                            link: "/rpc/cartesi_listWithdrawals",
                        },
                    ],
                },
            ],
        },
    ],
});

export default config;
