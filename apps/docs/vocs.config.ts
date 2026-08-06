import { type Config, defineConfig } from "vocs/config";

/** Minimal structural view of the hast nodes this plugin walks. */
type HastNode = {
    type: string;
    tagName?: string;
    properties?: Record<string, unknown>;
    children?: HastNode[];
};

/**
 * Point viem's JSDoc links at viem.sh.
 *
 * Most links in viem's JSDoc are absolute, but a few are relative to its own
 * site — `createPublicClient` documents "[Public Actions](/docs/actions/public/
 * introduction)". Twoslash renders that JSDoc into the hover popups of our code
 * blocks, so those hrefs become links to `/docs/...` pages of *this* site, which
 * do not exist: they render with the dead link styling and are reported by
 * `checkDeadlinks` on every build.
 *
 * Rewriting them makes the tooltips link where they mean to. Only links inside
 * a `<pre>` are touched, which is exactly the hover content twoslash injected —
 * an authored `/docs/...` link in prose would still be reported as dead.
 *
 * Runs between vocs' twoslash rendering and its dead link check (see the rehype
 * plugin order in vocs' `internal/mdx.ts`).
 */
const rehypeViemDocLinks = () => (tree: HastNode) => {
    const visit = (node: HastNode, inCode: boolean): void => {
        const code = inCode || node.tagName === "pre";
        if (code && node.tagName === "a") {
            const href = node.properties?.href;
            if (typeof href === "string" && href.startsWith("/docs/")) {
                node.properties = {
                    ...node.properties,
                    href: `https://viem.sh${href}`,
                };
            }
        }
        for (const child of node.children ?? []) visit(child, code);
    };
    visit(tree, false);
};

const config: Config = defineConfig({
    rootDir: ".",
    srcDir: ".",
    // dead links are reported but do not fail the build; set to `true` (vocs'
    // default) to make them an error
    checkDeadlinks: "warn",
    markdown: {
        rehypePlugins: [rehypeViemDocLinks],
    },
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
            text: "Cartesi Client",
            items: [
                {
                    text: "Introduction",
                    link: "/client",
                },
                {
                    text: "L1 Contract Interactions",
                    link: "/client/l1",
                },
                {
                    text: "Public L2 Actions",
                    collapsed: true,
                    items: [
                        {
                            text: "listApplications",
                            link: "/client/listApplications",
                        },
                        {
                            text: "getApplication",
                            link: "/client/getApplication",
                        },
                        { text: "listEpochs", link: "/client/listEpochs" },
                        { text: "getEpoch", link: "/client/getEpoch" },
                        {
                            text: "listTournaments",
                            link: "/client/listTournaments",
                        },
                        { text: "getTournament", link: "/client/getTournament" },
                        {
                            text: "listCommitments",
                            link: "/client/listCommitments",
                        },
                        { text: "getCommitment", link: "/client/getCommitment" },
                        { text: "listMatches", link: "/client/listMatches" },
                        { text: "getMatch", link: "/client/getMatch" },
                        {
                            text: "listMatchAdvances",
                            link: "/client/listMatchAdvances",
                        },
                        {
                            text: "getMatchAdvanced",
                            link: "/client/getMatchAdvanced",
                        },
                        { text: "listInputs", link: "/client/listInputs" },
                        { text: "getInput", link: "/client/getInput" },
                        { text: "listOutputs", link: "/client/listOutputs" },
                        { text: "getOutput", link: "/client/getOutput" },
                        { text: "listReports", link: "/client/listReports" },
                        { text: "getReport", link: "/client/getReport" },
                        {
                            text: "getProcessedInputCount",
                            link: "/client/getProcessedInputCount",
                        },
                        {
                            text: "getLastAcceptedEpochIndex",
                            link: "/client/getLastAcceptedEpochIndex",
                        },
                        { text: "getWithdrawal", link: "/client/getWithdrawal" },
                        {
                            text: "listWithdrawals",
                            link: "/client/listWithdrawals",
                        },
                        { text: "waitForInput", link: "client/waitForInput" },
                    ],
                },
            ],
        },
        {
            text: "React Hooks",
            items: [
                {
                    text: "Introduction",
                    link: "/react",
                },
                {
                    text: "Public L2 Hooks",
                    collapsed: true,
                    items: [
                        {
                            text: "useApplication",
                            link: "/react/useApplication",
                        },
                        {
                            text: "useApplications",
                            link: "/react/useApplications",
                        },
                        { text: "useChainId", link: "/react/useChainId" },
                        { text: "useEpoch", link: "/react/useEpoch" },
                        { text: "useEpochs", link: "/react/useEpochs" },
                        { text: "useTournament", link: "/react/useTournament" },
                        {
                            text: "useTournaments",
                            link: "/react/useTournaments",
                        },
                        { text: "useCommitment", link: "/react/useCommitment" },
                        {
                            text: "useCommitments",
                            link: "/react/useCommitments",
                        },
                        { text: "useMatch", link: "/react/useMatch" },
                        { text: "useMatches", link: "/react/useMatches" },
                        {
                            text: "useMatchAdvanced",
                            link: "/react/useMatchAdvanced",
                        },
                        {
                            text: "useMatchAdvances",
                            link: "/react/useMatchAdvances",
                        },
                        { text: "useInput", link: "/react/useInput" },
                        { text: "useInputs", link: "/react/useInputs" },
                        {
                            text: "useLastAcceptedEpochIndex",
                            link: "/react/useLastAcceptedEpochIndex",
                        },
                        {
                            text: "useNodeVersion",
                            link: "/react/useNodeVersion",
                        },
                        { text: "useOutput", link: "/react/useOutput" },
                        { text: "useOutputs", link: "/react/useOutputs" },
                        {
                            text: "useProcessedInputCount",
                            link: "/react/useProcessedInputCount",
                        },
                        { text: "useReport", link: "/react/useReport" },
                        { text: "useReports", link: "/react/useReports" },
                        {
                            text: "useWaitForInput",
                            link: "/react/useWaitForInput",
                        },
                        {
                            text: "useWithdrawal",
                            link: "/react/useWithdrawal",
                        },
                        {
                            text: "useWithdrawals",
                            link: "/react/useWithdrawals",
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
                            text: "decodeDeposit",
                            link: "/codec/decodeDeposit",
                        },
                        {
                            text: "decodeEtherDeposit",
                            link: "/codec/decodeEtherDeposit",
                        },
                        {
                            text: "encodeEtherDeposit",
                            link: "/codec/encodeEtherDeposit",
                        },
                        {
                            text: "decodeErc20Deposit",
                            link: "/codec/decodeErc20Deposit",
                        },
                        {
                            text: "encodeErc20Deposit",
                            link: "/codec/encodeErc20Deposit",
                        },
                        {
                            text: "decodeErc721Deposit",
                            link: "/codec/decodeErc721Deposit",
                        },
                        {
                            text: "encodeErc721Deposit",
                            link: "/codec/encodeErc721Deposit",
                        },
                        {
                            text: "decodeErc1155SingleDeposit",
                            link: "/codec/decodeErc1155SingleDeposit",
                        },
                        {
                            text: "encodeErc1155SingleDeposit",
                            link: "/codec/encodeErc1155SingleDeposit",
                        },
                        {
                            text: "decodeErc1155BatchDeposit",
                            link: "/codec/decodeErc1155BatchDeposit",
                        },
                        {
                            text: "encodeErc1155BatchDeposit",
                            link: "/codec/encodeErc1155BatchDeposit",
                        },
                    ],
                },
            ],
        },
        {
            text: "Rollup",
            items: [
                {
                    text: "Introduction",
                    link: "/rollup",
                },
                {
                    text: "Getting Started",
                    link: "/rollup/getting-started",
                },
                {
                    text: "Guide",
                    collapsed: true,
                    items: [
                        {
                            text: "Handling Requests",
                            link: "/rollup/handling-requests",
                        },
                        {
                            text: "Emitting Outputs",
                            link: "/rollup/emitting-outputs",
                        },
                        {
                            text: "Testing on the Host",
                            link: "/rollup/testing",
                        },
                        {
                            text: "Running in the Cartesi Machine",
                            link: "/rollup/cartesi-machine",
                        },
                    ],
                },
                {
                    text: "API",
                    collapsed: true,
                    items: [
                        { text: "new Rollup", link: "/rollup/Rollup" },
                        { text: "finish", link: "/rollup/finish" },
                        { text: "run", link: "/rollup/run" },
                        { text: "emitVoucher", link: "/rollup/emitVoucher" },
                        {
                            text: "emitDelegateCallVoucher",
                            link: "/rollup/emitDelegateCallVoucher",
                        },
                        { text: "emitNotice", link: "/rollup/emitNotice" },
                        { text: "emitReport", link: "/rollup/emitReport" },
                        {
                            text: "emitException",
                            link: "/rollup/emitException",
                        },
                        { text: "progress", link: "/rollup/progress" },
                        { text: "gio", link: "/rollup/gio" },
                        { text: "merkle", link: "/rollup/merkle" },
                        { text: "close", link: "/rollup/close" },
                        { text: "Types & Constants", link: "/rollup/types" },
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
