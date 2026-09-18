import { describe, expectTypeOf, it } from "vitest";
import type { ApplicationStatus, InputStatus } from "../src/types/actions.js";

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
