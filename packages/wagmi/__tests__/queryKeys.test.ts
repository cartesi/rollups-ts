import {
    type CartesiPublicClient,
    createCartesiPublicClient,
} from "@cartesi/viem";
import { custom, http } from "viem";
import { describe, expect, it } from "vitest";
import {
    applicationOptions,
    applicationsOptions,
    chainIdOptions,
    commitmentOptions,
    commitmentsOptions,
    epochOptions,
    epochsOptions,
    inputOptions,
    inputsOptions,
    lastAcceptedEpochIndexOptions,
    matchAdvancedOptions,
    matchAdvancesOptions,
    matchesOptions,
    matchOptions,
    nodeVersionOptions,
    outputOptions,
    outputsOptions,
    processedInputCountOptions,
    reportOptions,
    reportsOptions,
    serverUrl,
    tournamentOptions,
    tournamentsOptions,
    waitForInputOptions,
    withdrawalOptions,
    withdrawalsOptions,
} from "../src/publicL2/index.js";

const urlA = "http://localhost:8080/rpc";
const urlB = "http://node.example.com:8080/rpc";

const clientA = createCartesiPublicClient({ transport: http(urlA) });
const clientB = createCartesiPublicClient({ transport: http(urlB) });
// second instance pointing at the same server as clientA (provider remount)
const clientA2 = createCartesiPublicClient({ transport: http(urlA) });

const application = "0x0000000000000000000000000000000000000001";
const tournamentAddress = "0x0000000000000000000000000000000000000002";

// every *Options factory, called with representative params
const factories: Record<
    string,
    (client: CartesiPublicClient) => { queryKey: readonly unknown[] }
> = {
    application: (c) => applicationOptions(c, { application }),
    applications: (c) => applicationsOptions(c, {}),
    chainId: (c) => chainIdOptions(c),
    commitment: (c) =>
        commitmentOptions(c, {
            application,
            epochIndex: 1n,
            tournamentAddress,
        }),
    commitments: (c) => commitmentsOptions(c, { application }),
    epoch: (c) => epochOptions(c, { application, epochIndex: 1n }),
    epochs: (c) => epochsOptions(c, { application }),
    input: (c) => inputOptions(c, { application, inputIndex: 2n }),
    inputs: (c) => inputsOptions(c, { application }),
    lastAcceptedEpochIndex: (c) =>
        lastAcceptedEpochIndexOptions(c, { application }),
    match: (c) =>
        matchOptions(c, { application, epochIndex: 1n, tournamentAddress }),
    matchAdvanced: (c) =>
        matchAdvancedOptions(c, {
            application,
            epochIndex: 1n,
            tournamentAddress,
        }),
    matchAdvances: (c) => matchAdvancesOptions(c, { application }),
    matches: (c) => matchesOptions(c, { application }),
    nodeVersion: (c) => nodeVersionOptions(c),
    output: (c) => outputOptions(c, { application, outputIndex: 3n }),
    outputs: (c) =>
        outputsOptions(c, { application, epochIndex: 1n, inputIndex: 2n }),
    processedInputCount: (c) => processedInputCountOptions(c, { application }),
    report: (c) => reportOptions(c, { application, reportIndex: 4n }),
    reports: (c) => reportsOptions(c, { application }),
    tournament: (c) =>
        tournamentOptions(c, { application, address: tournamentAddress }),
    tournaments: (c) => tournamentsOptions(c, { application }),
    waitForInput: (c) =>
        waitForInputOptions(c, { application, inputIndex: 2n }),
    withdrawal: (c) => withdrawalOptions(c, { application, accountIndex: 3n }),
    withdrawals: (c) => withdrawalsOptions(c, { application }),
};

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

describe.each(Object.entries(factories))("%sOptions", (_name, options) => {
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
});
