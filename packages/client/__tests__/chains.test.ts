import { describe, expect, it } from "vitest";
import { cartesi } from "../src/chains.js";
import * as abi from "../src/rollups.js";

// `contracts` is hand-written and internal: it reaches users only through the
// `cartesi` devnet chain. So what is worth pinning is that each entry still
// carries the address codegen generated, and that the two PRT factories — the
// only contracts dave deploys per chain — are taken from the devnet rather than
// from whichever chain happened to come first in the record.

const devnet = 31337;

// deployed per chain, so their generated export is a record, not an address
const perChain = ["daveAppFactory", "multiLevelTournamentFactory"];

describe("cartesi devnet contracts", () => {
    it("pins the per-chain PRT factories to the devnet", () => {
        expect(cartesi.contracts.daveAppFactory.address).toBe(
            abi.daveAppFactoryAddress[devnet],
        );
        expect(cartesi.contracts.multiLevelTournamentFactory.address).toBe(
            abi.multiLevelTournamentFactoryAddress[devnet],
        );
    });

    it("takes every other address from codegen unchanged", () => {
        const generated = abi as Record<string, unknown>;
        let checked = 0;

        for (const [name, contract] of Object.entries(cartesi.contracts)) {
            if (perChain.includes(name)) continue;
            expect(contract.address).toBe(generated[`${name}Address`]);
            checked++;
        }

        // an empty `contracts` would pass the loop without asserting anything
        expect(checked).toBeGreaterThan(0);
    });
});
