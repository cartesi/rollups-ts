import {
    type CartesiPublicClient,
    createCartesiPublicClient,
} from "@cartesi/viem";
import { custom, http } from "viem";
import { describe, expect, it } from "vitest";
import {
    applicationOptions,
    applicationQueryKey,
    applicationsOptions,
    applicationsQueryKey,
    chainIdOptions,
    chainIdQueryKey,
    commitmentOptions,
    commitmentQueryKey,
    commitmentsOptions,
    commitmentsQueryKey,
    epochOptions,
    epochQueryKey,
    epochsOptions,
    epochsQueryKey,
    inputOptions,
    inputQueryKey,
    inputsOptions,
    inputsQueryKey,
    lastAcceptedEpochIndexOptions,
    lastAcceptedEpochIndexQueryKey,
    matchAdvancedOptions,
    matchAdvancedQueryKey,
    matchAdvancesOptions,
    matchAdvancesQueryKey,
    matchesOptions,
    matchesQueryKey,
    matchOptions,
    matchQueryKey,
    nodeVersionOptions,
    nodeVersionQueryKey,
    outputOptions,
    outputQueryKey,
    outputsOptions,
    outputsQueryKey,
    processedInputCountOptions,
    processedInputCountQueryKey,
    reportOptions,
    reportQueryKey,
    reportsOptions,
    reportsQueryKey,
    serverUrl,
    tournamentOptions,
    tournamentQueryKey,
    tournamentsOptions,
    tournamentsQueryKey,
    waitForInputOptions,
    waitForInputQueryKey,
    withdrawalOptions,
    withdrawalQueryKey,
    withdrawalsOptions,
    withdrawalsQueryKey,
} from "../src/publicL2/index.js";

const urlA = "http://localhost:8080/rpc";
const urlB = "http://node.example.com:8080/rpc";

const clientA = createCartesiPublicClient({ transport: http(urlA) });
const clientB = createCartesiPublicClient({ transport: http(urlB) });
// second instance pointing at the same server as clientA (provider remount)
const clientA2 = createCartesiPublicClient({ transport: http(urlA) });

const application = "0x0000000000000000000000000000000000000001";
const tournamentAddress = "0x0000000000000000000000000000000000000002";

interface Case {
    name: string;
    options: (client: CartesiPublicClient) => { queryKey: readonly unknown[] };
    key: (client: CartesiPublicClient) => readonly unknown[];
}

// bind an *Options factory and its *QueryKey constructor to shared params, so
// each method's representative params are declared exactly once
const mk = <P>(
    name: string,
    options: (
        client: CartesiPublicClient,
        params: P,
    ) => {
        queryKey: readonly unknown[];
    },
    key: (client: CartesiPublicClient, params: P) => readonly unknown[],
    params: P,
): Case => ({
    name,
    options: (client) => options(client, params),
    key: (client) => key(client, params),
});

const cases: Case[] = [
    mk("application", applicationOptions, applicationQueryKey, { application }),
    mk("applications", applicationsOptions, applicationsQueryKey, {}),
    mk(
        "chainId",
        (c) => chainIdOptions(c),
        (c) => chainIdQueryKey(c),
        undefined,
    ),
    mk("commitment", commitmentOptions, commitmentQueryKey, {
        application,
        epochIndex: 1n,
        tournamentAddress,
    }),
    mk("commitments", commitmentsOptions, commitmentsQueryKey, { application }),
    mk("epoch", epochOptions, epochQueryKey, { application, epochIndex: 1n }),
    mk("epochs", epochsOptions, epochsQueryKey, { application }),
    mk("input", inputOptions, inputQueryKey, { application, inputIndex: 2n }),
    mk("inputs", inputsOptions, inputsQueryKey, { application }),
    mk(
        "lastAcceptedEpochIndex",
        lastAcceptedEpochIndexOptions,
        lastAcceptedEpochIndexQueryKey,
        { application },
    ),
    mk("match", matchOptions, matchQueryKey, {
        application,
        epochIndex: 1n,
        tournamentAddress,
    }),
    mk("matchAdvanced", matchAdvancedOptions, matchAdvancedQueryKey, {
        application,
        epochIndex: 1n,
        tournamentAddress,
    }),
    mk("matchAdvances", matchAdvancesOptions, matchAdvancesQueryKey, {
        application,
    }),
    mk("matches", matchesOptions, matchesQueryKey, { application }),
    mk(
        "nodeVersion",
        (c) => nodeVersionOptions(c),
        (c) => nodeVersionQueryKey(c),
        undefined,
    ),
    mk("output", outputOptions, outputQueryKey, {
        application,
        outputIndex: 3n,
    }),
    mk("outputs", outputsOptions, outputsQueryKey, {
        application,
        epochIndex: 1n,
        inputIndex: 2n,
    }),
    mk(
        "processedInputCount",
        processedInputCountOptions,
        processedInputCountQueryKey,
        { application },
    ),
    mk("report", reportOptions, reportQueryKey, {
        application,
        reportIndex: 4n,
    }),
    mk("reports", reportsOptions, reportsQueryKey, { application }),
    mk("tournament", tournamentOptions, tournamentQueryKey, {
        application,
        address: tournamentAddress,
    }),
    mk("tournaments", tournamentsOptions, tournamentsQueryKey, { application }),
    mk("waitForInput", waitForInputOptions, waitForInputQueryKey, {
        application,
        inputIndex: 2n,
    }),
    mk("withdrawal", withdrawalOptions, withdrawalQueryKey, {
        application,
        accountIndex: 3n,
    }),
    mk("withdrawals", withdrawalsOptions, withdrawalsQueryKey, { application }),
];

describe("serverUrl", () => {
    it("returns the transport url", () => {
        expect(serverUrl(clientA)).toBe(urlA);
        expect(serverUrl(clientB)).toBe(urlB);
    });

    it("is stable across client instances with the same url", () => {
        expect(serverUrl(clientA2)).toBe(serverUrl(clientA));
    });

    it("falls back to client.uid for transports without a url", () => {
        const client = createCartesiPublicClient({
            transport: custom({ request: async () => null }),
        });
        expect(serverUrl(client)).toBe(client.uid);
    });
});

describe.each(cases)("$name", ({ options, key }) => {
    it("prefixes the query key with the server url", () => {
        expect(options(clientA).queryKey[0]).toBe(urlA);
        expect(options(clientB).queryKey[0]).toBe(urlB);
    });

    it("produces distinct keys for clients of different servers", () => {
        expect(options(clientA).queryKey).not.toEqual(
            options(clientB).queryKey,
        );
    });

    it("produces identical keys for client instances of the same server", () => {
        expect(options(clientA2).queryKey).toEqual(options(clientA).queryKey);
    });

    it("*QueryKey matches the key the *Options factory builds", () => {
        expect(key(clientA)).toEqual(options(clientA).queryKey);
    });
});

describe("*QueryKey bigint normalization", () => {
    it("stringifies bigint params so hand-built bigint keys are unnecessary", () => {
        const key = inputQueryKey(clientA, { application, inputIndex: 2n });
        expect(key).toEqual([urlA, "input", { application, inputIndex: "2" }]);
        // the stored key holds a string, so a raw 2n would not partial-match
        const params = key[2] as { inputIndex: unknown };
        expect(typeof params.inputIndex).toBe("string");
    });

    it("stringifies every bigint field of multi-index keys", () => {
        const key = outputsQueryKey(clientA, {
            application,
            epochIndex: 1n,
            inputIndex: 2n,
        });
        expect(key[2]).toMatchObject({ epochIndex: "1", inputIndex: "2" });
    });
});
