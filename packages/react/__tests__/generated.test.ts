import { describe, expect, it } from "vitest";
import {
    daveAppFactoryAbi,
    daveAppFactoryAddress,
    useSimulateITournamentTryRecoveringBond,
    useWriteITournamentTryRecoveringBond,
} from "../src/index.js";

// `src/generated.ts` is wagmi codegen output, so there is nothing here to unit
// test. What is worth pinning is that turning on `prt` actually reaches the
// package's public surface: a consumer importing from `@cartesi/react` gets the
// bond-claim hooks and the factory a PRT application is deployed through. If
// codegen stops emitting them, this fails rather than a consumer's build.
//
// The bond is claimed through `ITournament`, not through `Tournament`: a
// tournament is created per dispute by the factory, so a consumer holds its
// address and calls the interface. `Tournament` itself is excluded as internal.

describe("PRT contract hooks", () => {
    it.each([
        [
            "useWriteITournamentTryRecoveringBond",
            useWriteITournamentTryRecoveringBond,
        ],
        [
            "useSimulateITournamentTryRecoveringBond",
            useSimulateITournamentTryRecoveringBond,
        ],
    ])("exports %s", (_name, hook) => {
        expect(hook).toBeTypeOf("function");
    });

    it("exports the PRT application factory", () => {
        expect(daveAppFactoryAbi).toBeInstanceOf(Array);
        // per-chain, because the tournament parameters depend on block time
        expect(daveAppFactoryAddress).toHaveProperty("1");
    });
});
