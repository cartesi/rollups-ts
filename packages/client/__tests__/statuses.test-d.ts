import { describe, expectTypeOf, it } from "vitest";
import type {
    ApplicationStatus,
    BondDisposition,
    BondEventType,
    CommitmentSide,
    InnerTournamentDisposition,
    InputStatus,
    MatchPhase,
    MatchTimeoutOutcome,
    TournamentKind,
    TournamentStandingState,
} from "../src/types/actions.js";

// The node's status unions are hand-mirrored from its OpenRPC specification,
// and nothing else in this package enumerates them: waitForInput rejects by
// exclusion rather than by listing the terminal statuses. These assertions are
// what makes the next specification change fail loudly here.
describe("status unions", () => {
    it("mirrors InputCompletionStatus", () => {
        expectTypeOf<InputStatus>().toEqualTypeOf<
            | "NONE"
            | "ACCEPTED"
            | "REJECTED"
            | "EXCEPTION"
            | "MACHINE_HALTED"
            | "OVERFLOW"
            | "UNEXPECTED_YIELD"
        >();
    });

    it("mirrors ApplicationStatus", () => {
        expectTypeOf<ApplicationStatus>().toEqualTypeOf<
            | "OK"
            | "FAILED"
            | "DIVERGED"
            | "CORRUPTED"
            | "GUEST_EXCEPTION"
            | "MACHINE_HALTED"
            | "MCYCLE_OVERFLOW"
            | "UNEXPECTED_YIELD"
        >();
    });
});

// the PRT enums are mirrored the same way, and the snapshot fields that carry
// them are the only thing in this package that names their members
describe("PRT enums", () => {
    it("mirrors TournamentKind and TournamentStandingState", () => {
        expectTypeOf<TournamentKind>().toEqualTypeOf<"LEAF" | "NON_LEAF">();

        expectTypeOf<TournamentStandingState>().toEqualTypeOf<
            | "MATCHES_ACTIVE"
            | "AWAITING_CLOSURE"
            | "ROOT_WINNER"
            | "ROOT_FAILED"
            | "INNER_WINNER"
            | "INNER_ELIMINABLE_NO_WINNER"
            | "INNER_ELIMINABLE_WINNER_EXPIRED"
        >();
    });

    it("mirrors the match enums", () => {
        expectTypeOf<MatchPhase>().toEqualTypeOf<
            "UNINITIALIZED" | "BISECTING" | "READY_TO_SEAL" | "SEALED"
        >();

        expectTypeOf<MatchTimeoutOutcome>().toEqualTypeOf<
            "NONE" | "ONE_WINS" | "TWO_WINS" | "ELIMINATE_BOTH"
        >();

        // the responder side of a bisection, which is not the winner enum a
        // deleted match carries
        expectTypeOf<CommitmentSide>().toEqualTypeOf<"ONE" | "TWO">();
    });

    it("mirrors the bond enums", () => {
        expectTypeOf<InnerTournamentDisposition>().toEqualTypeOf<
            "UNSETTLED" | "WINNER" | "ELIMINABLE"
        >();

        expectTypeOf<BondDisposition>().toEqualTypeOf<
            "TOURNAMENT_RUNNING" | "NO_WINNER" | "RECOVERABLE" | "RECOVERED"
        >();

        expectTypeOf<BondEventType>().toEqualTypeOf<
            "PARTIAL_BOND_REFUND" | "BOND_RECOVERED"
        >();
    });
});
