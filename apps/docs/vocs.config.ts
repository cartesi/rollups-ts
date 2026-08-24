import { createRequire } from "node:module";
import * as path from "node:path";
import { type Config, defineConfig } from "vocs/config";

const require = createRequire(import.meta.url);

/**
 * The TypeScript module twoslash type-checks the code blocks with.
 *
 * vocs would otherwise `require("typescript")` from this package, which the
 * workspace catalog pins to v7. v7 is the native compiler: its entry point
 * only exports `version`/`versionMajorMinor`, so twoslash's `ts.sys.readFile`
 * throws and every code block fails to render. v6 is the last line shipping
 * the JavaScript compiler API twoslash drives.
 *
 * It is aliased rather than pinning this package to v6, so that `typescript`
 * itself stays on the catalog version: viem declares an optional `typescript`
 * peer, so a v6 pin here would resolve a second viem instance whose types are
 * distinct from the one `@cartesi/client` was built against, and every snippet
 * mixing the two would fail to typecheck.
 */
type TsModule = NonNullable<
    NonNullable<Extract<Config["twoslash"], object>>["twoslashOptions"]
>["tsModule"];

const typescript = require("typescript-v6") as TsModule;

/**
 * The directory twoslash's virtual file system reads `lib.*.d.ts` from.
 *
 * `@typescript/vfs` defaults it to `dirname(require.resolve("typescript"))`,
 * which resolves to the v7 package — whose `lib` holds no `lib.*.d.ts` at all,
 * so every snippet fails with `TSVFS: A request was made for lib.es2020.d.ts`.
 * Point it at the v6 lib next to the compiler above.
 */
const tsLibDirectory = path.dirname(require.resolve("typescript-v6"));

/**
 * Twoslash options carrying the compiler above, with `tsModule` hidden from
 * `Object.keys`.
 *
 * vocs ships the resolved config to the browser through `serializeFunctions`,
 * which walks every enumerable key and rewrites each function it finds as
 * source text for the client to `eval`. An enumerable `tsModule` would drag
 * the whole TypeScript module into that walk, and its functions close over
 * bundler-internal names, so each one throws `ReferenceError` while rendering.
 *
 * Non-enumerable keeps it out of the walk while leaving it readable where it
 * matters: vocs resolves the config with a shallow spread, and reads
 * `twoslashOptions.tsModule` directly before handing it to `createTwoslasher`.
 * The `checkOnly` path re-spreads these options instead, and would drop it —
 * so leave `twoslash.checkOnly` off.
 */
const twoslashOptions = Object.defineProperty({ tsLibDirectory }, "tsModule", {
    value: typescript,
    enumerable: false,
    writable: true,
    configurable: true,
}) as { tsLibDirectory: string; tsModule: TsModule };

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
    twoslash: { twoslashOptions },
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
    topNav: [
        {
            text: "Frontend",
            items: [
                { text: "Client (viem)", link: "/client" },
                { text: "React (hooks)", link: "/react" },
                { text: "RPC (JSON-RPC)", link: "/rpc" },
            ],
        },
        {
            text: "Bindings",
            items: [
                { text: "Rollup (libcmt)", link: "/rollup" },
                { text: "Machine (cartesi-machine)", link: "/machine" },
            ],
        },
        { text: "Encoding", link: "/codec" },
        { text: "Codegen", link: "/wagmi-plugin" },
    ],
    sidebar: {
        "/client/": {
            backLink: true,
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
                            text: "getEpochByVirtualIndex",
                            link: "/client/getEpochByVirtualIndex",
                        },
                        {
                            text: "listTournaments",
                            link: "/client/listTournaments",
                        },
                        {
                            text: "getTournament",
                            link: "/client/getTournament",
                        },
                        {
                            text: "listCommitments",
                            link: "/client/listCommitments",
                        },
                        {
                            text: "getCommitment",
                            link: "/client/getCommitment",
                        },
                        { text: "listMatches", link: "/client/listMatches" },
                        { text: "getMatch", link: "/client/getMatch" },
                        {
                            text: "listMatchAdvances",
                            link: "/client/listMatchAdvances",
                        },
                        {
                            text: "getMatchAdvance",
                            link: "/client/getMatchAdvance",
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
                            text: "getExecutedOutputCount",
                            link: "/client/getExecutedOutputCount",
                        },
                        {
                            text: "getPendingExecutableOutputCount",
                            link: "/client/getPendingExecutableOutputCount",
                        },
                        { text: "getNodeInfo", link: "/client/getNodeInfo" },
                        {
                            text: "getLastAcceptedEpochIndex",
                            link: "/client/getLastAcceptedEpochIndex",
                        },
                        {
                            text: "getWithdrawal",
                            link: "/client/getWithdrawal",
                        },
                        {
                            text: "listWithdrawals",
                            link: "/client/listWithdrawals",
                        },
                        { text: "waitForInput", link: "/client/waitForInput" },
                    ],
                },
            ],
        },
        "/react/": {
            backLink: true,
            items: [
                {
                    text: "Introduction",
                    link: "/react",
                },
                {
                    text: "Public L2 Hooks",
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
                        {
                            text: "useEpochByVirtualIndex",
                            link: "/react/useEpochByVirtualIndex",
                        },
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
                            text: "useMatchAdvance",
                            link: "/react/useMatchAdvance",
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
                        { text: "useNodeInfo", link: "/react/useNodeInfo" },
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
                        {
                            text: "useExecutedOutputCount",
                            link: "/react/useExecutedOutputCount",
                        },
                        {
                            text: "usePendingExecutableOutputCount",
                            link: "/react/usePendingExecutableOutputCount",
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
        "/rpc/": {
            backLink: true,
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
                            text: "cartesi_getEpochByVirtualIndex",
                            link: "/rpc/cartesi_getEpochByVirtualIndex",
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
                            text: "cartesi_getMatchAdvance",
                            link: "/rpc/cartesi_getMatchAdvance",
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
                            text: "cartesi_getExecutedOutputCount",
                            link: "/rpc/cartesi_getExecutedOutputCount",
                        },
                        {
                            text: "cartesi_getPendingExecutableOutputCount",
                            link: "/rpc/cartesi_getPendingExecutableOutputCount",
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
                        {
                            text: "cartesi_getNodeInfo",
                            link: "/rpc/cartesi_getNodeInfo",
                        },
                    ],
                },
            ],
        },
        "/codec/": {
            backLink: true,
            items: [
                {
                    text: "Introduction",
                    link: "/codec",
                },
                {
                    text: "Decode Functions",
                    items: [
                        { text: "decodeInput", link: "/codec/decodeInput" },
                        { text: "decodeOutput", link: "/codec/decodeOutput" },
                    ],
                },
                {
                    text: "Encode Functions",
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
        "/machine/": {
            backLink: true,
            items: [
                { text: "Introduction", link: "/machine" },
                {
                    text: "Guide",
                    items: [
                        { text: "Local Machine", link: "/machine/local" },
                        { text: "Remote Machine", link: "/machine/remote" },
                        {
                            text: "Rollups Machines",
                            link: "/machine/rollups-machines",
                        },
                        {
                            text: "Error Handling",
                            link: "/machine/error-handling",
                        },
                        {
                            text: "Troubleshooting",
                            link: "/machine/troubleshooting",
                        },
                    ],
                },
                {
                    text: "API",
                    items: [
                        { text: "create", link: "/machine/create" },
                        { text: "load", link: "/machine/load" },
                        { text: "empty", link: "/machine/empty" },
                        { text: "spawn", link: "/machine/spawn" },
                        { text: "connect", link: "/machine/connect" },
                        { text: "rollups", link: "/machine/rollups" },
                        {
                            text: "CartesiMachine",
                            link: "/machine/CartesiMachine",
                        },
                        {
                            text: "RemoteCartesiMachine",
                            link: "/machine/RemoteCartesiMachine",
                        },
                        {
                            text: "RollupsMachine",
                            link: "/machine/RollupsMachine",
                        },
                    ],
                },
            ],
        },
        "/rollup/": {
            backLink: true,
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
                    items: [
                        {
                            text: "Handling Requests",
                            link: "/rollup/handling-requests",
                        },
                        {
                            text: "Composing Handlers",
                            link: "/rollup/composing-handlers",
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
                    items: [
                        { text: "new Rollup", link: "/rollup/Rollup" },
                        { text: "finish", link: "/rollup/finish" },
                        { text: "run", link: "/rollup/run" },
                        { text: "chain", link: "/rollup/chain" },
                        { text: "broadcast", link: "/rollup/broadcast" },
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
    },
});

export default config;
