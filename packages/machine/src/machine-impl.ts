// The machine wrapper itself: JSON in and out, byte blobs, error mapping.
// It talks to a NativeAddon and knows nothing about how that addon reaches
// libcartesi, so the N-API addon (src/node) and the Emscripten module
// (src/wasm) share this one implementation.
import type {
    BreakReason,
    CartesiMachine,
    HtifYieldCommand,
    McycleRootHashes,
    Reg,
    SharingMode,
    UarchBreakReason,
    UarchCycleRootHashes,
} from "./cartesi-machine.js";
import {
    HtifYieldReason,
    MachineError,
    MAX_MCYCLE,
} from "./cartesi-machine.js";
import {
    fromBase64Hashes,
    parseJson,
    toBase64Hashes,
    toMcycleRootHashes,
    toUarchCycleRootHashes,
} from "./encoding.js";
import type { NativeAddon, NativeMachine } from "./native.js";
import type {
    AccessLog,
    AccessLogType,
    AddressRangeDescription,
    HashTreeStats,
    MachineConfig,
    MachineRuntimeConfig,
    MemoryRangeConfig,
    PartialBundle,
    Proof,
} from "./types.js";

/// Access log types
enum AccessLogTypeEnum {
    Annotations = 1, ///< Includes annotations
    LargeData = 2, ///< Includes data larger than 8 bytes
}

const accessLogType = (logType: AccessLogType): number => {
    let type = 0;
    type |= logType.has_annotations ? AccessLogTypeEnum.Annotations : 0;
    type |= logType.has_large_data ? AccessLogTypeEnum.LargeData : 0;
    return type;
};

/**
 * Converts errors thrown by the native addon (which carry the cm_error code
 * and the emulator's error description) into MachineError.
 */
const call = <T>(fn: () => T): T => {
    try {
        return fn();
    } catch (error) {
        const e = error as { code?: unknown; description?: unknown };
        if (typeof e.code === "number" && typeof e.description === "string") {
            throw new MachineError(e.code, e.description);
        }
        throw error;
    }
};

/**
 * High-level wrapper for the Cartesi Machine C API
 */
export class CartesiMachineImpl implements CartesiMachine {
    protected addon: NativeAddon;
    protected machine: NativeMachine;

    /**
     * Clones an empty machine object from an existing one
     */
    cloneEmpty(): CartesiMachine {
        return new CartesiMachineImpl(
            this.addon,
            call(() => this.machine.cloneEmpty()),
        );
    }

    constructor(addon: NativeAddon, machine: NativeMachine) {
        this.addon = addon;
        this.machine = machine;
    }

    /**
     * Gets the default configuration
     */
    getDefaultConfig(): MachineConfig {
        return JSON.parse(
            call(() => this.machine.getDefaultConfig()),
        ) as MachineConfig;
    }

    /**
     * Gets the address of a register
     */
    getRegAddress(reg: Reg): bigint {
        return call(() => this.machine.getRegAddress(reg));
    }

    /**
     * Gets a description of what is at a given target physical address
     */
    getAddressName(paddr: bigint): string {
        return call(() => this.machine.getAddressName(paddr));
    }

    /**
     * Checks if the machine is empty
     */
    isEmpty(): boolean {
        return call(() => this.machine.isEmpty());
    }

    /**
     * Checks if the machine is a remote machine controlled via the JSON-RPC
     * API
     */
    isJsonrpcMachine(): boolean {
        return call(() => this.machine.isJsonrpcMachine());
    }

    /**
     * Creates a new machine instance from configuration
     */
    create(
        config: MachineConfig,
        runtimeConfig?: MachineRuntimeConfig,
        dir?: string,
    ): CartesiMachine {
        call(() =>
            this.machine.create(
                JSON.stringify(config),
                runtimeConfig ? JSON.stringify(runtimeConfig) : null,
                dir ?? null,
            ),
        );
        return this;
    }

    /**
     * Loads a machine instance from a directory
     */
    load(
        dir: string,
        runtimeConfig?: MachineRuntimeConfig,
        sharing?: SharingMode,
    ): CartesiMachine {
        call(() =>
            this.machine.load(
                dir,
                runtimeConfig ? JSON.stringify(runtimeConfig) : null,
                sharing,
            ),
        );
        return this;
    }

    /**
     * Stores the machine instance to a directory
     */
    store(dir: string, sharing?: SharingMode): CartesiMachine {
        call(() => this.machine.store(dir, sharing));
        return this;
    }

    /**
     * Clones a stored machine directory
     */
    cloneStored(fromDir: string, toDir: string): void {
        call(() => this.machine.cloneStored(fromDir, toDir));
    }

    /**
     * Renames a stored machine directory and makes the rename durable
     */
    renameStored(fromDir: string, toDir: string): void {
        call(() => this.machine.renameStored(fromDir, toDir));
    }

    /**
     * Removes a stored machine directory
     */
    removeStored(dir: string): void {
        call(() => this.machine.removeStored(dir));
    }

    /**
     * Flushes all files of a previously stored machine to permanent storage
     */
    syncStored(dir: string): void {
        call(() => this.machine.syncStored(dir));
    }

    /**
     * Destroys the machine instance
     */
    destroy(): void {
        call(() => this.machine.destroy());
    }

    /**
     * Sets the runtime configuration
     */
    setRuntimeConfig(runtimeConfig: MachineRuntimeConfig): void {
        call(() =>
            this.machine.setRuntimeConfig(JSON.stringify(runtimeConfig)),
        );
    }

    /**
     * Gets the runtime configuration
     */
    getRuntimeConfig(): MachineRuntimeConfig {
        return JSON.parse(
            call(() => this.machine.getRuntimeConfig()),
        ) as MachineRuntimeConfig;
    }

    /**
     * Replaces a memory range
     */
    replaceMemoryRange(rangeConfig: MemoryRangeConfig): void {
        call(() =>
            this.machine.replaceMemoryRange(JSON.stringify(rangeConfig)),
        );
    }

    /**
     * Gets the initial configuration
     */
    getInitialConfig(): MachineConfig {
        return JSON.parse(
            call(() => this.machine.getInitialConfig()),
        ) as MachineConfig;
    }

    /**
     * Gets address ranges
     */
    getAddressRanges(): AddressRangeDescription[] {
        return JSON.parse(
            call(() => this.machine.getAddressRanges()),
        ) as AddressRangeDescription[];
    }

    /**
     * Gets the root hash
     */
    getRootHash(): Uint8Array {
        return call(() => this.machine.getRootHash());
    }

    /**
     * Reads the revert root hash from the shadow state
     */
    readRevertRootHash(): Uint8Array {
        return call(() => this.machine.readRevertRootHash());
    }

    /**
     * Writes the revert root hash to the shadow state
     */
    writeRevertRootHash(hash: Uint8Array): void {
        call(() => this.machine.writeRevertRootHash(hash));
    }

    /**
     * Gets a proof for a node in the hash tree
     */
    getProof(address: bigint, log2Size: number, log2RootSize?: number): Proof {
        return JSON.parse(
            call(() => this.machine.getProof(address, log2Size, log2RootSize)),
        ) as Proof;
    }

    /**
     * Gets the hash of a node in the hash tree
     */
    getNodeHash(address: bigint, log2Size: number): Uint8Array {
        return call(() => this.machine.getNodeHash(address, log2Size));
    }

    /**
     * Reads a word from memory
     */
    readWord(address: bigint): bigint {
        return call(() => this.machine.readWord(address));
    }

    /**
     * Writes a word to memory
     */
    writeWord(address: bigint, value: bigint): void {
        call(() => this.machine.writeWord(address, value));
    }

    /**
     * Reads a register
     */
    readReg(reg: Reg): bigint {
        return call(() => this.machine.readReg(reg));
    }

    /**
     * Writes a register
     */
    writeReg(reg: Reg, value: bigint): void {
        call(() => this.machine.writeReg(reg, value));
    }

    /**
     * Reads memory
     */
    readMemory(address: bigint, length: bigint): Uint8Array {
        return call(() => this.machine.readMemory(address, length));
    }

    /**
     * Writes memory
     */
    writeMemory(address: bigint, data: Uint8Array): void {
        call(() => this.machine.writeMemory(address, data));
    }

    /**
     * Reads virtual memory
     */
    readVirtualMemory(address: bigint, length: bigint): Uint8Array {
        return call(() => this.machine.readVirtualMemory(address, length));
    }

    /**
     * Writes virtual memory
     */
    writeVirtualMemory(address: bigint, data: Uint8Array): void {
        call(() => this.machine.writeVirtualMemory(address, data));
    }

    /**
     * Reads and consumes the console output buffer, which the runtime config
     * has to point at with `console.output_destination: "to_buffer"`. Without
     * a `maxLength`, everything buffered is returned.
     */
    readConsoleOutput(maxLength?: bigint): Uint8Array {
        return call(() => this.machine.readConsoleOutput(maxLength ?? 0n));
    }

    /**
     * Appends to the console input buffer, which the runtime config has to
     * point at with `console.input_source: "from_buffer"`. The buffer is
     * finite: the return value is how many bytes it took, and the caller keeps
     * the rest for the next call.
     */
    writeConsoleInput(data: Uint8Array): number {
        return Number(call(() => this.machine.writeConsoleInput(data)));
    }

    /**
     * Translates a virtual address to physical address
     */
    translateVirtualAddress(vaddr: bigint): bigint {
        return call(() => this.machine.translateVirtualAddress(vaddr));
    }

    /**
     * Runs the machine
     */
    run(mcycleEnd: bigint = MAX_MCYCLE): BreakReason {
        return call(() => this.machine.run(mcycleEnd));
    }

    /**
     * Runs the machine until mcycleEnd or a fixed point (a manual yield, a
     * halt or an mcycle overflow), collecting the state root hash after every
     * 2^log2McyclePeriod cycles — or, when log2BundleMcycleCount is not zero,
     * the root hash of each bundle of 2^log2BundleMcycleCount of those. A
     * collection is resumed by passing back the mcyclePhase and partialBundle
     * the previous call returned.
     */
    collectMcycleRootHashes(
        mcycleEnd: bigint,
        log2McyclePeriod: number,
        mcyclePhase: bigint,
        log2BundleMcycleCount: number,
        previousPartialBundle?: PartialBundle,
    ): McycleRootHashes {
        return toMcycleRootHashes(
            parseJson(
                call(() =>
                    this.machine.collectMcycleRootHashes(
                        mcycleEnd,
                        BigInt(log2McyclePeriod),
                        mcyclePhase,
                        log2BundleMcycleCount,
                        previousPartialBundle === undefined
                            ? null
                            : JSON.stringify(previousPartialBundle),
                    ),
                ),
            ),
        );
    }

    /**
     * Collects the 2^log2BundleMcycleCount state root hashes of one bundle,
     * counting bundles of samples 2^log2McyclePeriod cycles apart from the
     * current mcycle. Past a fixed point the bundle is padded with its state
     * root hash; a machine already at one is left unchanged.
     */
    collectMcycleBundle(
        bundleOffset: bigint,
        log2McyclePeriod: number,
        log2BundleMcycleCount: number,
    ): Uint8Array[] {
        return fromBase64Hashes(
            JSON.parse(
                call(() =>
                    this.machine.collectMcycleBundle(
                        bundleOffset,
                        BigInt(log2McyclePeriod),
                        log2BundleMcycleCount,
                    ),
                ),
            ),
        );
    }

    /**
     * Runs the microarchitecture
     */
    runUarch(uarchCycleEnd: bigint): UarchBreakReason {
        return call(() => this.machine.runUarch(uarchCycleEnd));
    }

    /**
     * Runs the machine uarch cycle by uarch cycle until mcycleEnd or a fixed
     * point, collecting the state root hash after every uarch cycle (or the
     * root hash of each bundle of 2^log2BundleUarchCycleCount of those).
     *
     * revertUarchTail is the unbundled collection of the machine the revert
     * root hash names, taken while it waited for its input; the emulator
     * needs it whenever the call may end at a rejected input.
     */
    collectUarchCycleRootHashes(
        mcycleEnd: bigint,
        log2BundleUarchCycleCount: number,
        revertUarchTail?: Uint8Array[],
    ): UarchCycleRootHashes {
        return toUarchCycleRootHashes(
            JSON.parse(
                call(() =>
                    this.machine.collectUarchCycleRootHashes(
                        mcycleEnd,
                        log2BundleUarchCycleCount,
                        revertUarchTail === undefined
                            ? null
                            : JSON.stringify(toBase64Hashes(revertUarchTail)),
                    ),
                ),
            ),
        );
    }

    /**
     * Collects the 2^log2BundleUarchCycleCount state root hashes of one bundle
     * of the current mcycle, expanded to one hash per uarch cycle. The
     * machine is left as collectUarchCycleRootHashes() would leave it with
     * mcycleEnd one past the current mcycle.
     */
    collectUarchCycleBundle(
        bundleOffset: bigint,
        log2BundleUarchCycleCount: number,
        revertUarchTail?: Uint8Array[],
    ): Uint8Array[] {
        return fromBase64Hashes(
            JSON.parse(
                call(() =>
                    this.machine.collectUarchCycleBundle(
                        bundleOffset,
                        log2BundleUarchCycleCount,
                        revertUarchTail === undefined
                            ? null
                            : JSON.stringify(toBase64Hashes(revertUarchTail)),
                    ),
                ),
            ),
        );
    }

    /**
     * Resets the microarchitecture
     */
    resetUarch(): void {
        call(() => this.machine.resetUarch());
    }

    /**
     * Receives a CMIO request
     */
    receiveCmioRequest(): {
        cmd: HtifYieldCommand;
        reason: HtifYieldReason;
        data: Uint8Array;
    } {
        return call(() => this.machine.receiveCmioRequest());
    }

    /**
     * Sends a CMIO response.
     * The revert root hash is the machine root hash to revert to in case the
     * response is eventually rejected. For advance-state responses it must
     * match the current root hash when an accepted manual yield is pending —
     * so that is what it defaults to — and is ignored otherwise; other
     * responses refuse it (it must be absent). A response the machine is not
     * waiting for, or that does not fit in the rx buffer, is a no-op.
     */
    sendCmioResponse(
        reason: HtifYieldReason,
        data: Uint8Array,
        revertRootHash?: Uint8Array,
    ): void {
        const hash =
            revertRootHash ??
            (reason === HtifYieldReason.AdvanceState
                ? this.getRootHash()
                : null);
        call(() => this.machine.sendCmioResponse(reason, data, hash));
    }

    /**
     * Logs a step
     */
    logStep(mcycleCount: bigint, logFilename: string): BreakReason {
        return call(() => this.machine.logStep(mcycleCount, logFilename));
    }

    /**
     * Logs a uarch step
     */
    logStepUarch(logType: AccessLogType): AccessLog {
        return JSON.parse(
            call(() => this.machine.logStepUarch(accessLogType(logType))),
        ) as AccessLog;
    }

    /**
     * Logs uarch reset
     */
    logResetUarch(logType: AccessLogType): AccessLog {
        return JSON.parse(
            call(() => this.machine.logResetUarch(accessLogType(logType))),
        ) as AccessLog;
    }

    /**
     * Logs CMIO response.
     * The revert root hash defaults to the current root hash (unlike
     * sendCmioResponse, the emulator does not check it here).
     */
    logSendCmioResponse(
        reason: HtifYieldReason,
        data: Uint8Array,
        logType: AccessLogType,
        revertRootHash?: Uint8Array,
    ): string {
        const hash = revertRootHash ?? this.getRootHash();
        return call(() =>
            this.machine.logSendCmioResponse(
                reason,
                data,
                hash,
                accessLogType(logType),
            ),
        );
    }

    /**
     * Verifies a uarch step; returns the root hash obtained after the step
     */
    verifyStepUarch(rootHashBefore: Uint8Array, log: AccessLog): Uint8Array {
        return call(() =>
            this.machine.verifyStepUarch(rootHashBefore, JSON.stringify(log)),
        );
    }

    /**
     * Verifies uarch reset; returns the root hash obtained after the reset
     */
    verifyResetUarch(rootHashBefore: Uint8Array, log: AccessLog): Uint8Array {
        return call(() =>
            this.machine.verifyResetUarch(rootHashBefore, JSON.stringify(log)),
        );
    }

    /**
     * Verifies CMIO response; returns the root hash obtained after the
     * response
     */
    verifySendCmioResponse(
        reason: HtifYieldReason,
        data: Uint8Array,
        rootHashBefore: Uint8Array,
        log: AccessLog,
        revertRootHash: Uint8Array,
    ): Uint8Array {
        return call(() =>
            this.machine.verifySendCmioResponse(
                reason,
                data,
                rootHashBefore,
                JSON.stringify(log),
                revertRootHash,
            ),
        );
    }

    /**
     * Verifies hash tree integrity
     */
    verifyHashTree(): boolean {
        return call(() => this.machine.verifyHashTree());
    }

    /**
     * Gets hash tree statistics
     */
    getHashTreeStats(clear: boolean = false): HashTreeStats {
        return JSON.parse(
            call(() => this.machine.getHashTreeStats(clear)),
        ) as HashTreeStats;
    }
}

/**
 * The calls that do not belong to a machine — constructors, constants and the
 * standalone verifiers — bound to one addon. Each entry point (src/index.ts
 * for Node, src/browser.ts for the browser) exports these under the names the
 * package's public API uses.
 */
export const createMachineApi = (addon: NativeAddon) => ({
    /**
     * Creates a new empty machine object
     */
    empty(): CartesiMachine {
        return new CartesiMachineImpl(
            addon,
            call(() => addon.machineNew()),
        );
    },

    /**
     * Creates a new machine from a configuration
     */
    create(
        config: MachineConfig,
        runtimeConfig?: MachineRuntimeConfig,
        dir?: string,
    ): CartesiMachine {
        return new CartesiMachineImpl(
            addon,
            call(() =>
                addon.machineCreateNew(
                    JSON.stringify(config),
                    runtimeConfig ? JSON.stringify(runtimeConfig) : null,
                    dir ?? null,
                ),
            ),
        );
    },

    /**
     * Loads a machine from a stored directory
     */
    load(
        dir: string,
        runtimeConfig?: MachineRuntimeConfig,
        sharing?: SharingMode,
    ): CartesiMachine {
        return new CartesiMachineImpl(
            addon,
            call(() =>
                addon.machineLoadNew(
                    dir,
                    runtimeConfig ? JSON.stringify(runtimeConfig) : null,
                    sharing,
                ),
            ),
        );
    },

    /**
     * Gets the last error message
     */
    getLastError(): string {
        return addon.getLastErrorMessage();
    },

    /**
     * Gets the emulator version as a number (major * 1000000 + minor * 1000 + patch)
     */
    getVersion(): bigint {
        return call(() => addon.getVersion());
    },

    /**
     * The version of libslirp behind virtio `net-user` networking, or null
     * when this build has none — a machine with a `net-user` device then
     * fails to create, and one without is unaffected.
     *
     * The Node binding loads libslirp on demand, so this answers what is
     * installed on the host; the WebAssembly build has no networking and
     * always returns null.
     */
    getSlirpVersion(): string | null {
        return addon.getSlirpVersion?.() ?? null;
    },

    /**
     * Gets the default machine configuration
     */
    getDefaultConfig(): MachineConfig {
        return JSON.parse(
            call(() => addon.getDefaultConfig()),
        ) as MachineConfig;
    },

    /**
     * Gets the address of a register
     */
    getRegAddress(reg: Reg): bigint {
        return call(() => addon.getRegAddress(reg));
    },

    /**
     * Gets a description of what is at a given target physical address
     */
    getAddressName(paddr: bigint): string {
        return call(() => addon.getAddressName(paddr));
    },

    /**
     * Verifies a step; returns the root hash obtained after the step, for the
     * caller to check
     */
    verifyStep(
        rootHashBefore: Uint8Array,
        logFilename: string,
        mcycleCount: bigint,
    ): Uint8Array {
        return call(() =>
            addon.verifyStep(rootHashBefore, logFilename, mcycleCount),
        );
    },

    /**
     * Verifies a uarch step; returns the root hash obtained after the step
     */
    verifyStepUarch(rootHashBefore: Uint8Array, log: AccessLog): Uint8Array {
        return call(() =>
            addon.verifyStepUarch(rootHashBefore, JSON.stringify(log)),
        );
    },

    /**
     * Verifies uarch reset; returns the root hash obtained after the reset
     */
    verifyResetUarch(rootHashBefore: Uint8Array, log: AccessLog): Uint8Array {
        return call(() =>
            addon.verifyResetUarch(rootHashBefore, JSON.stringify(log)),
        );
    },

    /**
     * Verifies a CMIO response; returns the root hash obtained after the
     * response
     */
    verifySendCmioResponse(
        reason: HtifYieldReason,
        data: Uint8Array,
        rootHashBefore: Uint8Array,
        log: AccessLog,
        revertRootHash: Uint8Array,
    ): Uint8Array {
        return call(() =>
            addon.verifySendCmioResponse(
                reason,
                data,
                rootHashBefore,
                JSON.stringify(log),
                revertRootHash,
            ),
        );
    },
});

/** The shape src/index.ts and src/browser.ts re-export. */
export type MachineApi = ReturnType<typeof createMachineApi>;
