// The rollups state machine and its transactions, against a scripted machine.
//
// A real advance needs a machine image with a rollups application in it; what
// is under test here is the layer above that — how an accepted, rejected or
// failed input is turned into outputs, errors and, for a local machine, a
// snapshot to roll back to. A stub machine that answers cmio requests from a
// script exercises exactly that, on any host, with no emulator installed.
import { describe, expect, it } from "vitest";
import {
    BreakReason,
    HtifYieldCommand,
    HtifYieldReason,
    SharingMode,
    type CartesiMachine,
} from "../src/cartesi-machine";
import {
    rollups,
    RollupsFatalError,
    RollupsInputRejectedError,
} from "../src/rollups";

type Yield = {
    breakReason: BreakReason;
    reason: HtifYieldReason;
    data?: Uint8Array;
};

const bytes = (text: string): Uint8Array => new TextEncoder().encode(text);

const accepted = (): Yield => ({
    breakReason: BreakReason.YieldedManually,
    reason: HtifYieldReason.ManualRxAccepted,
    // outputs Merkle root
    data: new Uint8Array(32).fill(7),
});

const output = (text: string): Yield => ({
    breakReason: BreakReason.YieldedAutomatically,
    reason: HtifYieldReason.AutomaticTxOutput,
    data: bytes(text),
});

const report = (text: string): Yield => ({
    breakReason: BreakReason.YieldedAutomatically,
    reason: HtifYieldReason.AutomaticTxReport,
    data: bytes(text),
});

/**
 * A machine that runs a script of yields, recording the calls that make up a
 * transaction. Only the members the rollups layer touches are implemented.
 */
class ScriptedMachine {
    readonly calls: string[] = [];
    private script: Yield[] = [];
    private current: Yield | null = null;

    constructor(private readonly rootHash = new Uint8Array(32).fill(1)) {}

    /** Queues what the machine yields for the next input. */
    script_(...yields: Yield[]): this {
        this.script.push(...yields);
        return this;
    }

    sendCmioResponse(reason: HtifYieldReason, data: Uint8Array): void {
        this.calls.push(`send:${reason}:${data.length}`);
    }

    run(): BreakReason {
        this.current = this.script.shift() ?? null;
        if (this.current === null) {
            throw new Error("the script ran out of yields");
        }
        return this.current.breakReason;
    }

    receiveCmioRequest(): {
        cmd: HtifYieldCommand;
        reason: HtifYieldReason;
        data: Uint8Array;
    } {
        const current = this.current;
        if (current === null) {
            throw new Error("no yield to receive");
        }
        return {
            cmd:
                current.breakReason === BreakReason.YieldedManually
                    ? HtifYieldCommand.Manual
                    : HtifYieldCommand.Automatic,
            reason: current.reason,
            data: current.data ?? new Uint8Array(),
        };
    }

    getRootHash(): Uint8Array {
        return this.rootHash;
    }

    store(dir: string, sharing?: SharingMode): CartesiMachine {
        this.calls.push(`store:${dir}:${sharing}`);
        return this as unknown as CartesiMachine;
    }

    load(dir: string): CartesiMachine {
        this.calls.push(`load:${dir}`);
        return this as unknown as CartesiMachine;
    }

    destroy(): void {
        this.calls.push("destroy");
    }

    removeStored(dir: string): void {
        this.calls.push(`remove:${dir}`);
    }

    asMachine(): CartesiMachine {
        return this as unknown as CartesiMachine;
    }
}

const dirOf = (call: string): string => call.split(":")[1] as string;

describe("rollups", () => {
    describe("advance", () => {
        it("collects outputs and reports, and returns the outputs root", () => {
            const machine = new ScriptedMachine().script_(
                output("first"),
                report("progress"),
                output("second"),
                accepted(),
            );

            const { outputs, reports, outputsMerkleRoot } = rollups(
                machine.asMachine(),
            ).advance(bytes("input"), { collect: true });

            expect(outputs.map((o) => new TextDecoder().decode(o))).toEqual([
                "first",
                "second",
            ]);
            expect(reports).toHaveLength(1);
            expect(outputsMerkleRoot).toEqual(new Uint8Array(32).fill(7));
        });

        it("rejects an input by restoring the snapshot it took first", () => {
            const machine = new ScriptedMachine().script_({
                breakReason: BreakReason.YieldedManually,
                reason: HtifYieldReason.ManualRxRejected,
            });

            expect(() =>
                rollups(machine.asMachine()).advance(bytes("input"), {
                    collect: true,
                }),
            ).toThrow(RollupsInputRejectedError);

            // stored before the input, reloaded into the same machine object
            // afterwards, and the snapshot cleaned up
            const [store, , destroy, load, remove] = machine.calls;
            expect(store).toMatch(/^store:\/tmp\/cartesi-rollups\//);
            expect(destroy).toBe("destroy");
            expect(load).toBe(`load:${dirOf(store as string)}`);
            expect(remove).toBe(`remove:${dirOf(store as string)}`);
        });

        it("stores with sharing all, so a machine with no backing files can be restored", () => {
            const machine = new ScriptedMachine().script_(accepted());
            rollups(machine.asMachine()).advance(bytes("input"), {
                collect: true,
            });
            expect(machine.calls[0]).toBe(
                `store:${dirOf(machine.calls[0] as string)}:${SharingMode.All}`,
            );
        });

        it("discards the snapshot once the input is accepted", () => {
            const machine = new ScriptedMachine().script_(accepted());
            rollups(machine.asMachine()).advance(bytes("input"), {
                collect: true,
            });
            const store = machine.calls[0] as string;
            expect(machine.calls).toContain(`remove:${dirOf(store)}`);
            expect(machine.calls).not.toContain("destroy");
        });

        it("skips snapshots entirely when rollback is not wanted", () => {
            const machine = new ScriptedMachine().script_(accepted());
            rollups(machine.asMachine(), { noRollback: true }).advance(
                bytes("input"),
                { collect: true },
            );
            expect(
                machine.calls.some((call) => call.startsWith("store:")),
            ).toBe(false);
        });

        it("writes snapshots where it is told to", () => {
            const machine = new ScriptedMachine().script_(accepted());
            rollups(machine.asMachine(), {
                snapshotDir: "/snapshots",
            }).advance(bytes("input"), { collect: true });
            expect(machine.calls[0]).toMatch(/^store:\/snapshots\//);
        });

        it("surfaces an application exception, and rolls back", () => {
            const machine = new ScriptedMachine().script_({
                breakReason: BreakReason.YieldedManually,
                reason: HtifYieldReason.ManualTxException,
                data: bytes("assertion failed"),
            });

            expect(() =>
                rollups(machine.asMachine()).advance(bytes("input"), {
                    collect: true,
                }),
            ).toThrow(new RollupsFatalError("assertion failed"));
            expect(machine.calls).toContain("destroy");
        });
    });

    describe("inspect", () => {
        it("collects reports", () => {
            const machine = new ScriptedMachine().script_(
                report("one"),
                report("two"),
                accepted(),
            );

            const reports = rollups(machine.asMachine()).inspect(
                bytes("query"),
                { collect: true },
            );

            expect(reports.map((r) => new TextDecoder().decode(r))).toEqual([
                "one",
                "two",
            ]);
        });
    });
});
