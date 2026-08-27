// A machine over HTTP, for callers that have no binding at all.
//
// cartesi-jsonrpc-machine answers JSON-RPC over HTTP and sends
// Access-Control-Allow-Origin, so a page can drive a machine running on a
// server with nothing but fetch — no addon, no WebAssembly module. The wire
// types differ from the C API in three ways this file absorbs: byte blobs and
// hashes are base64, break reasons are names rather than numbers, and
// parameters are positional.
//
//     const machine = await connect("http://127.0.0.1:8080");
//     await machine.load("/machines/app");
//     await machine.run();
//
// Calls are asynchronous, so this cannot implement CartesiMachine itself; it
// mirrors it, method for method.
import {
    BreakReason,
    MachineError,
    HtifYieldReason,
    MAX_MCYCLE,
    UarchBreakReason,
    type ErrorCode,
    Reg,
    type HtifYieldCommand,
    type SharingMode,
} from "../cartesi-machine.js";
import type {
    AccessLog,
    AccessLogType,
    AddressRangeDescription,
    HashTreeStats,
    MachineConfig,
    MachineRuntimeConfig,
    MemoryRangeConfig,
    Proof,
} from "../types.js";

// -----------------------------------------------------------------------------
// Wire encoding
// -----------------------------------------------------------------------------

const toBase64 = (bytes: Uint8Array): string => {
    let binary = "";
    for (const byte of bytes) {
        binary += String.fromCharCode(byte);
    }
    return btoa(binary);
};

const fromBase64 = (text: string): Uint8Array => {
    const binary = atob(text);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
};

/**
 * The emulator writes u64 values as JSON numbers, so a register with its top
 * bits set does not survive JSON.parse. Quoting integers too long to be exact
 * doubles keeps them intact for BigInt to read; anything shorter is exact
 * already. Digits inside strings are never preceded by one of these
 * delimiters, so they are left alone.
 */
const parse = (text: string): unknown =>
    JSON.parse(
        text.replace(/([:[,]\s*)(-?\d{16,})(?=\s*[,\]}])/g, '$1"$2"'),
    ) as unknown;

/**
 * A marker no JSON payload of this API can contain, used to smuggle a bigint
 * through JSON.stringify and out again as a bare number.
 */
const BIGINT_TAG = " bigint:";

/** The mirror image: bigints have to reach the wire as JSON numbers. */
const stringify = (value: unknown): string =>
    JSON.stringify(value, (_key, item: unknown) =>
        typeof item === "bigint" ? `${BIGINT_TAG}${item}` : item,
    ).replace(new RegExp(`"${BIGINT_TAG}(-?\\d+)"`, "g"), "$1");

const toBigInt = (value: unknown): bigint => BigInt(value as string | number);

const SHARING_MODES = ["none", "config", "all"] as const;

/**
 * Registers cross as names, not numbers. The names are the enum keys in snake
 * case, with two irregularities the emulator's own naming has: tohost and
 * fromhost are single words, and the three iflags keep their capital letter.
 */
const regName = (reg: Reg): string => {
    const key = Reg[reg];
    if (key === undefined) {
        throw new Error(`@cartesi/machine: unknown register ${reg}`);
    }
    return key
        .replace(/ToHost/g, "Tohost")
        .replace(/FromHost/g, "Fromhost")
        .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
        .toLowerCase()
        .replace(
            /^iflags_([xyh])$/,
            (_match, flag: string) => `iflags_${flag.toUpperCase()}`,
        );
};

const BREAK_REASONS: Record<string, BreakReason> = {
    failed: BreakReason.Failed,
    halted: BreakReason.Halted,
    yielded_manually: BreakReason.YieldedManually,
    yielded_automatically: BreakReason.YieldedAutomatically,
    yielded_softly: BreakReason.YieldedSoftly,
    reached_target_mcycle: BreakReason.ReachedTargetMcycle,
    console_output: BreakReason.ConsoleOutput,
    console_input: BreakReason.ConsoleInput,
    mcycle_overflow: BreakReason.McycleOverflow,
};

const UARCH_BREAK_REASONS: Record<string, UarchBreakReason> = {
    reached_target_uarch_cycle: UarchBreakReason.ReachedTargetUarchCycle,
    uarch_halted: UarchBreakReason.UarchHalted,
    uarch_cycle_overflow: UarchBreakReason.UarchCycleOverflow,
};

// -----------------------------------------------------------------------------
// The client
// -----------------------------------------------------------------------------

export interface ConnectOptions {
    /** Passed to every fetch, for credentials, an AbortSignal, or headers. */
    fetchOptions?: RequestInit;
    /** Defaults to the global fetch. */
    fetch?: typeof globalThis.fetch;
}

/**
 * A machine reached over JSON-RPC: the CartesiMachine surface, with every call
 * a promise, plus the server-level calls a remote machine has.
 */
export interface RemoteMachineClient {
    // -- server ---------------------------------------------------------------

    /** The address this client talks to. */
    readonly url: string;
    getServerVersion(): Promise<string>;
    /**
     * Forks the server and returns a client for the child, which starts as a
     * copy of this machine — how a rollups machine takes a snapshot it can go
     * back to without copying its memory.
     */
    fork(): Promise<RemoteMachineClient>;
    rebind(address: string): Promise<string>;
    emancipate(): Promise<void>;
    shutdown(): Promise<void>;

    // -- machine --------------------------------------------------------------

    isEmpty(): Promise<boolean>;
    create(
        config: MachineConfig,
        runtimeConfig?: MachineRuntimeConfig,
        dir?: string,
    ): Promise<void>;
    load(
        dir: string,
        runtimeConfig?: MachineRuntimeConfig,
        sharing?: SharingMode,
    ): Promise<void>;
    store(dir: string, sharing?: SharingMode): Promise<void>;
    cloneStored(fromDir: string, toDir: string): Promise<void>;
    renameStored(fromDir: string, toDir: string): Promise<void>;
    removeStored(dir: string): Promise<void>;
    syncStored(dir: string): Promise<void>;
    destroy(): Promise<void>;

    getDefaultConfig(): Promise<MachineConfig>;
    getInitialConfig(): Promise<MachineConfig>;
    getRuntimeConfig(): Promise<MachineRuntimeConfig>;
    setRuntimeConfig(runtimeConfig: MachineRuntimeConfig): Promise<void>;
    replaceMemoryRange(rangeConfig: MemoryRangeConfig): Promise<void>;
    getAddressRanges(): Promise<AddressRangeDescription[]>;
    getRegAddress(reg: Reg): Promise<bigint>;
    getAddressName(paddr: bigint): Promise<string>;

    getRootHash(): Promise<Uint8Array>;
    readRevertRootHash(): Promise<Uint8Array>;
    writeRevertRootHash(hash: Uint8Array): Promise<void>;
    getNodeHash(address: bigint, log2Size: number): Promise<Uint8Array>;
    getProof(
        address: bigint,
        log2Size: number,
        log2RootSize?: number,
    ): Promise<Proof>;
    verifyHashTree(): Promise<boolean>;
    getHashTreeStats(clear?: boolean): Promise<HashTreeStats>;

    readWord(address: bigint): Promise<bigint>;
    writeWord(address: bigint, value: bigint): Promise<void>;
    readReg(reg: Reg): Promise<bigint>;
    writeReg(reg: Reg, value: bigint): Promise<void>;
    readMemory(address: bigint, length: bigint): Promise<Uint8Array>;
    writeMemory(address: bigint, data: Uint8Array): Promise<void>;
    readVirtualMemory(address: bigint, length: bigint): Promise<Uint8Array>;
    writeVirtualMemory(address: bigint, data: Uint8Array): Promise<void>;
    translateVirtualAddress(vaddr: bigint): Promise<bigint>;
    readConsoleOutput(maxLength?: bigint): Promise<Uint8Array>;
    writeConsoleInput(data: Uint8Array): Promise<number>;

    run(mcycleEnd?: bigint): Promise<BreakReason>;
    runUarch(uarchCycleEnd: bigint): Promise<UarchBreakReason>;
    resetUarch(): Promise<void>;

    receiveCmioRequest(): Promise<{
        cmd: HtifYieldCommand;
        reason: HtifYieldReason;
        data: Uint8Array;
    }>;
    sendCmioResponse(
        reason: HtifYieldReason,
        data: Uint8Array,
        revertRootHash?: Uint8Array,
    ): Promise<void>;

    logStepUarch(logType: AccessLogType): Promise<AccessLog>;
    logResetUarch(logType: AccessLogType): Promise<AccessLog>;
    logSendCmioResponse(
        reason: HtifYieldReason,
        data: Uint8Array,
        logType: AccessLogType,
        revertRootHash?: Uint8Array,
    ): Promise<string>;
    verifyStepUarch(
        rootHashBefore: Uint8Array,
        log: AccessLog,
    ): Promise<Uint8Array>;
    verifyResetUarch(
        rootHashBefore: Uint8Array,
        log: AccessLog,
    ): Promise<Uint8Array>;
}

interface RpcError {
    code: number;
    message: string;
}

/**
 * Connects to a cartesi-jsonrpc-machine server.
 *
 * Nothing is sent until the first call, so this cannot tell whether the
 * address answers; `getServerVersion()` is the cheapest way to find out.
 */
export const connect = (
    url: string,
    options: ConnectOptions = {},
): RemoteMachineClient => {
    const doFetch = options.fetch ?? globalThis.fetch.bind(globalThis);
    let nextId = 1;

    const rpc = async (method: string, params: unknown[] = []) => {
        const id = nextId;
        nextId += 1;

        const response = await doFetch(url, {
            ...options.fetchOptions,
            method: "POST",
            headers: {
                ...options.fetchOptions?.headers,
                "content-type": "application/json",
            },
            body: stringify({ jsonrpc: "2.0", id, method, params }),
        });

        if (!response.ok) {
            throw new Error(
                `@cartesi/machine: ${method} failed: ${response.status} ${response.statusText}`,
            );
        }

        const body = parse(await response.text()) as {
            result?: unknown;
            error?: RpcError;
        };

        if (body.error !== undefined) {
            // the server encodes the cm_error code it came from, so the
            // failure arrives as the same MachineError a local machine throws
            throw new MachineError(
                body.error.code as ErrorCode,
                body.error.message,
            );
        }

        return body.result;
    };

    /** Trailing optional parameters are omitted, not sent as null. */
    const params = (...values: unknown[]): unknown[] => {
        const trimmed = [...values];
        while (
            trimmed.length > 0 &&
            trimmed[trimmed.length - 1] === undefined
        ) {
            trimmed.pop();
        }
        return trimmed;
    };

    const sharingName = (sharing?: SharingMode): string | undefined =>
        sharing === undefined ? undefined : SHARING_MODES[sharing];

    const client: RemoteMachineClient = {
        url,

        async getServerVersion() {
            const version = (await rpc("get_version")) as Record<
                string,
                unknown
            >;
            return `${version.major}.${version.minor}.${version.patch}`;
        },

        async fork() {
            const { address } = (await rpc("fork")) as { address: string };
            const forked = new URL(url);
            const [host, port] = address.split(":");
            forked.hostname = host as string;
            forked.port = port as string;
            return connect(forked.toString(), options);
        },

        async rebind(address: string) {
            return (await rpc("rebind", [address])) as string;
        },

        async emancipate() {
            await rpc("emancipate");
        },

        async shutdown() {
            await rpc("shutdown");
        },

        async isEmpty() {
            return (await rpc("machine.is_empty")) as boolean;
        },

        async create(config, runtimeConfig, dir) {
            await rpc("machine.create", params(config, runtimeConfig, dir));
        },

        async load(dir, runtimeConfig, sharing) {
            await rpc(
                "machine.load",
                params(dir, runtimeConfig, sharingName(sharing)),
            );
        },

        async store(dir, sharing) {
            await rpc("machine.store", [dir, sharingName(sharing) ?? "none"]);
        },

        async cloneStored(fromDir, toDir) {
            await rpc("machine.clone_stored", [fromDir, toDir]);
        },

        async renameStored(fromDir, toDir) {
            await rpc("machine.rename_stored", [fromDir, toDir]);
        },

        async removeStored(dir) {
            await rpc("machine.remove_stored", [dir]);
        },

        async syncStored(dir) {
            await rpc("machine.sync_stored", [dir]);
        },

        async destroy() {
            await rpc("machine.destroy");
        },

        async getDefaultConfig() {
            return (await rpc("machine.get_default_config")) as MachineConfig;
        },

        async getInitialConfig() {
            return (await rpc("machine.get_initial_config")) as MachineConfig;
        },

        async getRuntimeConfig() {
            return (await rpc(
                "machine.get_runtime_config",
            )) as MachineRuntimeConfig;
        },

        async setRuntimeConfig(runtimeConfig) {
            await rpc("machine.set_runtime_config", [runtimeConfig]);
        },

        async replaceMemoryRange(rangeConfig) {
            await rpc("machine.replace_memory_range", [rangeConfig]);
        },

        async getAddressRanges() {
            return (await rpc(
                "machine.get_address_ranges",
            )) as AddressRangeDescription[];
        },

        async getRegAddress(reg) {
            return toBigInt(
                await rpc("machine.get_reg_address", [regName(reg)]),
            );
        },

        async getAddressName(paddr) {
            return (await rpc("machine.get_address_name", [paddr])) as string;
        },

        async getRootHash() {
            return fromBase64((await rpc("machine.get_root_hash")) as string);
        },

        async readRevertRootHash() {
            return fromBase64(
                (await rpc("machine.read_revert_root_hash")) as string,
            );
        },

        async writeRevertRootHash(hash) {
            await rpc("machine.write_revert_root_hash", [toBase64(hash)]);
        },

        async getNodeHash(address, log2Size) {
            return fromBase64(
                (await rpc("machine.get_node_hash", [
                    address,
                    log2Size,
                ])) as string,
            );
        },

        async getProof(address, log2Size, log2RootSize) {
            return (await rpc(
                "machine.get_proof",
                params(address, log2Size, log2RootSize),
            )) as Proof;
        },

        async verifyHashTree() {
            return (await rpc("machine.verify_hash_tree")) as boolean;
        },

        async getHashTreeStats(clear = false) {
            return (await rpc("machine.get_hash_tree_stats", [
                clear,
            ])) as HashTreeStats;
        },

        async readWord(address) {
            return toBigInt(await rpc("machine.read_word", [address]));
        },

        async writeWord(address, value) {
            await rpc("machine.write_word", [address, value]);
        },

        async readReg(reg) {
            return toBigInt(await rpc("machine.read_reg", [regName(reg)]));
        },

        async writeReg(reg, value) {
            await rpc("machine.write_reg", [regName(reg), value]);
        },

        async readMemory(address, length) {
            return fromBase64(
                (await rpc("machine.read_memory", [address, length])) as string,
            );
        },

        async writeMemory(address, data) {
            await rpc("machine.write_memory", [address, toBase64(data)]);
        },

        async readVirtualMemory(address, length) {
            return fromBase64(
                (await rpc("machine.read_virtual_memory", [
                    address,
                    length,
                ])) as string,
            );
        },

        async writeVirtualMemory(address, data) {
            await rpc("machine.write_virtual_memory", [
                address,
                toBase64(data),
            ]);
        },

        async translateVirtualAddress(vaddr) {
            return toBigInt(
                await rpc("machine.translate_virtual_address", [vaddr]),
            );
        },

        async readConsoleOutput(maxLength) {
            // Called with no length, the method reports what is buffered
            // instead of returning it, which is how "read everything" is
            // spelled over the wire.
            let want = maxLength ?? 0n;
            if (want === 0n) {
                want = toBigInt(await rpc("machine.read_console_output", []));
                if (want === 0n) {
                    return new Uint8Array(0);
                }
            }
            return fromBase64(
                (await rpc("machine.read_console_output", [want])) as string,
            );
        },

        async writeConsoleInput(data) {
            return Number(
                toBigInt(
                    await rpc("machine.write_console_input", [toBase64(data)]),
                ),
            );
        },

        async run(mcycleEnd = MAX_MCYCLE) {
            const reason = (await rpc("machine.run", [mcycleEnd])) as string;
            const known = BREAK_REASONS[reason];
            if (known === undefined) {
                throw new Error(
                    `@cartesi/machine: unknown break reason ${reason}`,
                );
            }
            return known;
        },

        async runUarch(uarchCycleEnd) {
            const reason = (await rpc("machine.run_uarch", [
                uarchCycleEnd,
            ])) as string;
            const known = UARCH_BREAK_REASONS[reason];
            if (known === undefined) {
                throw new Error(
                    `@cartesi/machine: unknown uarch break reason ${reason}`,
                );
            }
            return known;
        },

        async resetUarch() {
            await rpc("machine.reset_uarch");
        },

        async receiveCmioRequest() {
            // a length of zero asks for the available length only, so the
            // request is fetched in one round trip at its actual size
            const probe = (await rpc("machine.receive_cmio_request", [0])) as {
                available_length: number | string;
            };
            const request = (await rpc("machine.receive_cmio_request", [
                toBigInt(probe.available_length),
            ])) as {
                cmd: number;
                reason: number;
                data: string;
            };
            return {
                cmd: request.cmd as HtifYieldCommand,
                reason: request.reason as HtifYieldReason,
                data: fromBase64(request.data),
            };
        },

        async sendCmioResponse(reason, data, revertRootHash) {
            // the emulator requires a revert hash for advance-state responses
            // and refuses one for everything else, which the local binding
            // fills in the same way
            const hash =
                revertRootHash ??
                (reason === HtifYieldReason.AdvanceState
                    ? await client.getRootHash()
                    : undefined);
            await rpc(
                "machine.send_cmio_response",
                params(
                    reason,
                    toBase64(data),
                    hash === undefined ? undefined : toBase64(hash),
                ),
            );
        },

        async logStepUarch(logType) {
            return (await rpc("machine.log_step_uarch", [
                logType,
            ])) as AccessLog;
        },

        async logResetUarch(logType) {
            return (await rpc("machine.log_reset_uarch", [
                logType,
            ])) as AccessLog;
        },

        async logSendCmioResponse(reason, data, logType, revertRootHash) {
            const log = await rpc(
                "machine.log_send_cmio_response",
                params(
                    reason,
                    toBase64(data),
                    revertRootHash === undefined
                        ? undefined
                        : toBase64(revertRootHash),
                    logType,
                ),
            );
            return JSON.stringify(log);
        },

        async verifyStepUarch(rootHashBefore, log) {
            return fromBase64(
                (await rpc("machine.verify_step_uarch", [
                    toBase64(rootHashBefore),
                    log,
                ])) as string,
            );
        },

        async verifyResetUarch(rootHashBefore, log) {
            return fromBase64(
                (await rpc("machine.verify_reset_uarch", [
                    toBase64(rootHashBefore),
                    log,
                ])) as string,
            );
        },
    };

    return client;
};
