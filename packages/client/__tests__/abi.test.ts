import { describe, expect, it } from "vitest";
import {
    daveAppFactoryAddress,
    inputBoxAddress,
    multiLevelTournamentFactoryAddress,
    tournamentAbi,
} from "../src/rollups.js";

// The PRT contracts come from a dave release through codegen rather than being
// hand-written, so what is worth asserting is the shape codegen produced: that
// the bond claim is reachable, and that a contract dave deploys per chain stays
// a record of addresses while one deployed at a single address stays a string.

const publicChains = [1, 10, 8453, 42161, 84532, 421614, 11155111, 11155420];

// dave deploys the factories once per chain, because the tournament parameters
// depend on the chain's block time; 31337 is the devnet the anvil tarball
// carries. dave publishes nothing for cannon (13370), so it has no entry.
const deployedChains = [...publicChains, 31337].sort((a, b) => a - b);

const chainIds = (addresses: Record<number, string>) =>
    Object.keys(addresses)
        .map(Number)
        .sort((a, b) => a - b);

describe("PRT ABIs", () => {
    it("exposes the tournament bond claim", () => {
        const tryRecoveringBond = tournamentAbi.find(
            (item) =>
                item.type === "function" && item.name === "tryRecoveringBond",
        );

        // anyone can claim a finished tournament's bond: no arguments to get
        // wrong, and not a view, so it is a write every consumer can make
        expect(tryRecoveringBond).toMatchObject({
            inputs: [],
            stateMutability: "nonpayable",
        });
    });
});

describe("PRT addresses", () => {
    it.each([
        ["daveAppFactory", daveAppFactoryAddress],
        ["multiLevelTournamentFactory", multiLevelTournamentFactoryAddress],
    ] as const)("generates %s once per deployed chain", (_name, addresses) => {
        expect(chainIds(addresses)).toEqual(deployedChains);
    });

    it("leaves a contract deployed at one address a single address", () => {
        expect(inputBoxAddress).toBeTypeOf("string");
    });
});
