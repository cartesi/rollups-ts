import {
    BreakReason,
    HtifYieldReason,
    SharingMode,
    type CartesiMachine,
} from "./cartesi-machine.js";
import { getRemoteSpawner } from "./remote-binding.js";
import type { RemoteCartesiMachine } from "./remote-cartesi-machine.js";
import type { MachineRuntimeConfig } from "./types.js";

/**
 * Custom error class to signal the rollup has entered an invalid state
 */
export class RollupsFatalError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "RollupsFatalError";
    }
}

/**
 * Custom error class to signal an input was rejected
 */
export class RollupsInputRejectedError extends Error {
    constructor() {
        super("Input rejected");
        this.name = "RollupsInputRejectedError";
    }
}

/**
 * Advance requests can yield either an output or a report, indicated by the type field.
 * The data field contains the output or report data.
 */
export type AdvanceYield =
    | { type: "output"; data: Uint8Array }
    | { type: "report"; data: Uint8Array }
    | { type: "progress"; data: number };

export type AdvanceReturn = Uint8Array;

export type AdvanceResult = {
    outputs: Uint8Array[];
    reports: Uint8Array[];
    outputsMerkleRoot: Uint8Array;
};

export interface RollupsMachine {
    advance(input: Uint8Array): IterableIterator<AdvanceYield, AdvanceReturn>;
    advance(input: Uint8Array, options: { collect: true }): AdvanceResult;
    inspect(query: Uint8Array): IterableIterator<Uint8Array>;
    inspect(query: Uint8Array, options: { collect: true }): Uint8Array[];
    shutdown(): void;
    store(dir: string): RollupsMachine;
}

/**
 * Create a rollups machine from a local machine.
 * @param machine - The local machine.
 * @returns A rollups machine.
 */
function rollupsFromLocal(
    machine: CartesiMachine,
    options?: { noRollback?: boolean; snapshotDir?: string },
): RollupsMachine {
    return new LocalRollupsMachineImpl(
        machine,
        options?.noRollback ?? false,
        options?.snapshotDir,
    );
}

/**
 * Create a rollups machine from a remote machine.
 * @param machine - The remote machine.
 * @returns A rollups machine.
 */
function rollupsFromRemote(
    machine: RemoteCartesiMachine,
    options?: { noRollback?: boolean },
): RollupsMachine {
    return new RemoteRollupsMachineImpl(machine, options?.noRollback ?? false);
}

/**
 * Remote machines are the ones that can fork and be shut down; testing for
 * those two keeps this free of any binding's class.
 */
const isRemoteMachine = (
    machine: CartesiMachine | RemoteCartesiMachine,
): machine is RemoteCartesiMachine =>
    typeof (machine as RemoteCartesiMachine).fork === "function" &&
    typeof (machine as RemoteCartesiMachine).shutdown === "function";

/**
 * Where local rollups machines keep the snapshot a transaction can roll back
 * to. /tmp exists both on a host filesystem and in the WebAssembly build's
 * in-memory one.
 */
const DEFAULT_SNAPSHOT_DIR = "/tmp/cartesi-rollups";

let snapshotCounter = 0;

const uniqueName = (): string => {
    snapshotCounter += 1;
    const random =
        typeof globalThis.crypto?.randomUUID === "function"
            ? globalThis.crypto.randomUUID()
            : Math.random().toString(36).slice(2);
    return `snapshot-${snapshotCounter}-${random}`;
};

const DEFAULT_ADDRESS = "127.0.0.1:0";
const DEFAULT_TIMEOUT = -1;

/**
 * Create a rollups machine from a store directory.
 * @param dir - The directory containing the store.
 * @param runtimeConfig - The runtime configuration.
 * @param address - The address of the remote machine.
 * @param timeout - The timeout for the remote machine.
 * @description This function spawns a new machine, and loads the stored snapshot on it.
 * @returns A rollups machine.
 */
function rollupsFromStore(
    dir: string,
    options?: {
        noRollback?: boolean;
        runtimeConfig?: MachineRuntimeConfig;
        address?: string;
        timeout?: number;
    },
): RollupsMachine {
    const { runtimeConfig } = options ?? {
        address: DEFAULT_ADDRESS,
        timeout: DEFAULT_TIMEOUT,
        runtimeConfig: undefined,
    };
    const address = options?.address ?? DEFAULT_ADDRESS;
    const timeout = options?.timeout ?? DEFAULT_TIMEOUT;
    const machine = getRemoteSpawner()(address, timeout).load(
        dir,
        runtimeConfig,
    );
    return rollupsFromRemote(machine, options);
}

/**
 * Create a rollups machine from a remote machine.
 * @param machine - The remote machine.
 * @returns A rollups machine.
 */
export function rollups(
    machine: RemoteCartesiMachine,
    options?: { noRollback: boolean },
): RollupsMachine;

/**
 * Create a rollups machine from a local machine.
 * @param machine - The local machine.
 * @param options - `noRollback` runs inputs without a snapshot to roll back
 * to; `snapshotDir` chooses where those snapshots are written.
 * @returns A rollups machine.
 */
export function rollups(
    machine: CartesiMachine,
    options?: { noRollback?: boolean; snapshotDir?: string },
): RollupsMachine;

/**
 * Create a rollups machine from a store directory.
 * @param dir - The directory containing the store.
 * @param runtimeConfig - The runtime configuration.
 * @param address - The address of the remote machine.
 * @param timeout - The timeout for the remote machine.
 * @description This function spawns a new machine, and loads the stored snapshot on it.
 * @returns A rollups machine.
 */
export function rollups(
    dir: string,
    options?: {
        noRollback?: boolean;
        runtimeConfig?: MachineRuntimeConfig;
        address?: string;
        timeout?: number;
    },
): RollupsMachine;

export function rollups(
    arg1: RemoteCartesiMachine | CartesiMachine | string,
    options?: {
        noRollback?: boolean;
        runtimeConfig?: MachineRuntimeConfig;
        address?: string;
        timeout?: number;
        snapshotDir?: string;
    },
): RollupsMachine {
    options = options ?? {
        noRollback: false,
        address: DEFAULT_ADDRESS,
        timeout: DEFAULT_TIMEOUT,
    };

    if (typeof arg1 === "string") {
        return rollupsFromStore(arg1, options);
    } else if (isRemoteMachine(arg1)) {
        return rollupsFromRemote(arg1, options);
    } else {
        return rollupsFromLocal(arg1, options);
    }
}

abstract class RollupsMachineImpl implements RollupsMachine {
    abstract shutdown(): void;
    abstract store(dir: string): RollupsMachine;

    abstract startTransaction(): CartesiMachine;
    abstract commitTransaction(machine: CartesiMachine): void;
    abstract rollbackTransaction(machine: CartesiMachine): void;

    // biome-ignore lint/suspicious/noExplicitAny: implementation signature of the `advance` overloads declared on RollupsMachine; callers never see it
    advance(input: Uint8Array, options?: { collect: true }): any {
        const generator = function* (
            this: RollupsMachineImpl,
        ): IterableIterator<AdvanceYield, AdvanceReturn> {
            // start a machine "transaction"
            const machine = this.startTransaction();

            // write input
            machine.sendCmioResponse(HtifYieldReason.AdvanceState, input);

            while (true) {
                // run machine until it yields or halts
                const breakReason = machine.run();

                switch (breakReason) {
                    case BreakReason.YieldedManually: {
                        const { reason, data } = machine.receiveCmioRequest();
                        switch (reason) {
                            case HtifYieldReason.ManualRxAccepted: {
                                // input was accepted
                                // shutdown the backup fork if it exists
                                this.commitTransaction(machine);
                                return data;
                            }
                            case HtifYieldReason.ManualRxRejected: {
                                // input was rejected
                                this.rollbackTransaction(machine);
                                throw new RollupsInputRejectedError();
                            }
                            case HtifYieldReason.ManualTxException: {
                                // exception
                                this.rollbackTransaction(machine);

                                const description = new TextDecoder().decode(
                                    data,
                                );
                                throw new RollupsFatalError(description);
                            }
                            default: {
                                this.rollbackTransaction(machine);
                                throw new RollupsFatalError(
                                    `Unexpected yield reason: ${reason}`,
                                );
                            }
                        }
                    }
                    case BreakReason.YieldedAutomatically: {
                        const { reason, data } = machine.receiveCmioRequest();
                        switch (reason) {
                            case HtifYieldReason.AutomaticProgress: {
                                try {
                                    const progress = new DataView(
                                        data.buffer,
                                        data.byteOffset,
                                        data.byteLength,
                                    ).getUint32(0, true);
                                    yield {
                                        type: "progress",
                                        data: progress,
                                    };
                                } catch {
                                    // just ignore the progress in case cannot read it
                                }
                                break;
                            }
                            case HtifYieldReason.AutomaticTxOutput: {
                                yield { type: "output", data };
                                break;
                            }
                            case HtifYieldReason.AutomaticTxReport: {
                                yield { type: "report", data };
                                break;
                            }
                        }
                        continue; // run again
                    }
                    default: {
                        this.rollbackTransaction(machine);
                        throw new RollupsFatalError(
                            `Unexpected break reason: ${breakReason}`,
                        );
                    }
                }
            }
        }.bind(this);

        if (options?.collect) {
            const outputs: Uint8Array[] = [];
            const reports: Uint8Array[] = [];
            const rollups = generator();
            while (true) {
                const event = rollups.next();
                if (event.done) {
                    return { outputs, reports, outputsMerkleRoot: event.value };
                }
                switch (event.value.type) {
                    case "output":
                        outputs.push(event.value.data);
                        break;
                    case "report":
                        reports.push(event.value.data);
                        break;
                    case "progress":
                        break;
                }
            }
        }

        return generator();
    }

    // biome-ignore lint/suspicious/noExplicitAny: implementation signature of the `inspect` overloads declared on RollupsMachine; callers never see it
    inspect(query: Uint8Array, options?: { collect: true }): any {
        const generator = function* (
            this: RollupsMachineImpl,
        ): IterableIterator<Uint8Array> {
            const machine = this.startTransaction();

            // write query
            machine.sendCmioResponse(HtifYieldReason.InspectState, query);

            while (true) {
                // run machine until it yields or halts
                const breakReason = machine.run();

                switch (breakReason) {
                    case BreakReason.YieldedManually: {
                        const { reason, data } = machine.receiveCmioRequest();
                        switch (reason) {
                            case HtifYieldReason.ManualRxAccepted: {
                                // input was accepted
                                this.rollbackTransaction(machine);
                                return;
                            }
                            case HtifYieldReason.ManualRxRejected: {
                                // input was rejected
                                this.rollbackTransaction(machine);
                                throw new RollupsInputRejectedError();
                            }
                            case HtifYieldReason.ManualTxException: {
                                // exception
                                this.rollbackTransaction(machine);
                                const description = new TextDecoder().decode(
                                    data,
                                );
                                throw new RollupsFatalError(description);
                            }
                            default: {
                                this.rollbackTransaction(machine);
                                throw new RollupsFatalError(
                                    `Unexpected yield reason: ${reason}`,
                                );
                            }
                        }
                    }
                    case BreakReason.YieldedAutomatically: {
                        const { reason, data } = machine.receiveCmioRequest();
                        switch (reason) {
                            case HtifYieldReason.AutomaticProgress: {
                                // ignore progress
                                break;
                            }
                            case HtifYieldReason.AutomaticTxOutput: {
                                // ignore output
                                break;
                            }
                            case HtifYieldReason.AutomaticTxReport: {
                                // yield report
                                yield data;
                                break;
                            }
                        }
                        continue; // run again
                    }
                    default: {
                        this.rollbackTransaction(machine);
                        throw new RollupsFatalError(
                            `Unexpected break reason: ${breakReason}`,
                        );
                    }
                }
            }
        }.bind(this);

        if (options?.collect) {
            return [...generator()];
        }

        return generator();
    }
}

class RemoteRollupsMachineImpl extends RollupsMachineImpl {
    private machine: RemoteCartesiMachine;
    private noRollback: boolean;

    constructor(machine: RemoteCartesiMachine, noRollback: boolean = false) {
        super();
        this.machine = machine;
        this.noRollback = noRollback;
    }

    startTransaction(): CartesiMachine {
        if (this.noRollback) {
            // do not fork
            return this.machine;
        } else {
            return this.machine.fork();
        }
    }

    commitTransaction(machine: CartesiMachine): void {
        if (this.noRollback) {
            // do nothing
        } else {
            // shut down current machine
            this.machine.shutdown();

            // replace by fork
            this.machine = machine as RemoteCartesiMachine;
        }
    }

    rollbackTransaction(machine: CartesiMachine): void {
        if (this.noRollback) {
            // do nothing
        } else {
            // shutdown fork
            (machine as RemoteCartesiMachine).shutdown();
        }
    }

    shutdown(): void {
        this.machine.shutdown();
    }

    store(dir: string): RollupsMachine {
        this.machine.store(dir);
        return this;
    }
}

/**
 * A local machine has no server to fork, so a transaction is a snapshot: the
 * machine is stored before the input is sent, and a rejected input (or a
 * failure) loads it back into the same machine object. That costs a copy of
 * the machine's memory ranges per input, which is the price of rollback
 * without a second process; `noRollback` skips it for callers that do not
 * need to survive a rejection.
 */
class LocalRollupsMachineImpl extends RollupsMachineImpl {
    private machine: CartesiMachine;
    private readonly noRollback: boolean;
    private readonly snapshotDir: string;
    private snapshot: string | null = null;

    constructor(
        machine: CartesiMachine,
        noRollback: boolean = false,
        snapshotDir: string = DEFAULT_SNAPSHOT_DIR,
    ) {
        super();
        this.machine = machine;
        this.noRollback = noRollback;
        this.snapshotDir = snapshotDir;
    }

    startTransaction(): CartesiMachine {
        if (!this.noRollback) {
            this.discardSnapshot();
            this.snapshot = `${this.snapshotDir}/${uniqueName()}`;
            // sharing "all" writes the memory ranges out; the default copies
            // the backing files of the machine's own configuration, which a
            // machine created from a configuration does not have
            this.machine.store(this.snapshot, SharingMode.All);
        }
        return this.machine;
    }

    commitTransaction(_machine: CartesiMachine): void {
        this.discardSnapshot();
    }

    rollbackTransaction(_machine: CartesiMachine): void {
        if (this.snapshot === null) {
            return;
        }
        const snapshot = this.snapshot;
        this.snapshot = null;
        // cm_load needs an empty machine object, and reusing this one keeps
        // every reference the caller holds valid
        this.machine.destroy();
        this.machine.load(snapshot);
        this.machine.removeStored(snapshot);
    }

    private discardSnapshot(): void {
        if (this.snapshot !== null) {
            this.machine.removeStored(this.snapshot);
            this.snapshot = null;
        }
    }

    shutdown(): void {
        this.discardSnapshot();
    }

    store(dir: string): RollupsMachine {
        this.machine.store(dir);
        return this;
    }
}
