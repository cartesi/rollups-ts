import { describe, expectTypeOf, it } from "vitest";
import type {
    BondEvent,
    MatchBisectionSnapshot,
    MatchSealedSnapshot,
    MatchSnapshot,
} from "../src/types/actions.js";

// The node describes a match snapshot and a bond event as a oneOf over their
// discriminant, so each is mirrored as a discriminated union rather than as a
// flat record of nullable fields. These assertions are what keeps the narrowing
// honest: reading the wrong payload for a phase has to be a type error, not a
// runtime null.
describe("match snapshot", () => {
    it("carries no phase payload while uninitialized", () => {
        type Uninitialized = Extract<MatchSnapshot, { phase: "UNINITIALIZED" }>;

        expectTypeOf<Uninitialized["bisection"]>().toEqualTypeOf<null>();
        expectTypeOf<Uninitialized["sealed"]>().toEqualTypeOf<null>();
    });

    it("carries a current height only while bisecting", () => {
        type Bisecting = Extract<MatchSnapshot, { phase: "BISECTING" }>;
        type Sealable = Extract<MatchSnapshot, { phase: "READY_TO_SEAL" }>;

        expectTypeOf<
            Bisecting["bisection"]["currentHeight"]
        >().toEqualTypeOf<bigint>();
        expectTypeOf<
            Sealable["bisection"]["currentHeight"]
        >().toEqualTypeOf<null>();

        // both are still a bisection snapshot, height aside
        expectTypeOf<
            Bisecting["bisection"]
        >().toExtend<MatchBisectionSnapshot>();
        expectTypeOf<
            Sealable["bisection"]
        >().toExtend<MatchBisectionSnapshot>();
        expectTypeOf<Bisecting["sealed"]>().toEqualTypeOf<null>();
    });

    it("carries the sealed values only once sealed", () => {
        type Sealed = Extract<MatchSnapshot, { phase: "SEALED" }>;

        expectTypeOf<Sealed["sealed"]>().toEqualTypeOf<MatchSealedSnapshot>();
        expectTypeOf<Sealed["bisection"]>().toEqualTypeOf<null>();
    });
});

describe("bond event", () => {
    it("carries exactly one of refund and recovery", () => {
        type Refund = Extract<BondEvent, { type: "PARTIAL_BOND_REFUND" }>;
        type Recovery = Extract<BondEvent, { type: "BOND_RECOVERED" }>;

        expectTypeOf<Refund["recovery"]>().toEqualTypeOf<null>();
        expectTypeOf<Refund["refund"]["success"]>().toEqualTypeOf<boolean>();

        expectTypeOf<Recovery["refund"]>().toEqualTypeOf<null>();
        expectTypeOf<Recovery["recovery"]["burned"]>().toEqualTypeOf<bigint>();
    });
});
