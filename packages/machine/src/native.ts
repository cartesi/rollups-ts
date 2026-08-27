/**
 * The native surface both bindings implement: the N-API addon (src/node) and
 * the Emscripten module (src/wasm). It mirrors libcartesi's C API closely —
 * uint64 values cross as bigint, configs/proofs/access logs as JSON strings,
 * byte blobs as Uint8Array — so a binding is a marshalling layer and nothing
 * more, and the machine wrapper in machine-impl.ts stays platform-free.
 *
 * Failed calls throw an Error carrying `code` (cm_error) and `description`
 * (cm_get_last_error_message()).
 */

/** A machine object: one cm_machine, and the calls that take it. */
export interface NativeMachine {
    isEmpty(): boolean;
    isJsonrpcMachine(): boolean;
    create(
        config: string,
        runtimeConfig: string | null,
        dir: string | null,
    ): void;
    load(dir: string, runtimeConfig: string | null, sharing?: number): void;
    cloneEmpty(): NativeMachine;
    store(dir: string, sharing?: number): void;
    cloneStored(fromDir: string, toDir: string): void;
    renameStored(fromDir: string, toDir: string): void;
    removeStored(dir: string): void;
    syncStored(dir: string): void;
    destroy(): void;
    getDefaultConfig(): string;
    getRegAddress(reg: number): bigint;
    setRuntimeConfig(runtimeConfig: string): void;
    getRuntimeConfig(): string;
    replaceMemoryRange(rangeConfig: string): void;
    getInitialConfig(): string;
    getAddressRanges(): string;
    getRootHash(): Uint8Array;
    readRevertRootHash(): Uint8Array;
    writeRevertRootHash(hash: Uint8Array): void;
    getAddressName(paddr: bigint): string;
    getNodeHash(address: bigint, log2Size: number): Uint8Array;
    getProof(address: bigint, log2Size: number, log2RootSize?: number): string;
    readWord(address: bigint): bigint;
    writeWord(address: bigint, value: bigint): void;
    readReg(reg: number): bigint;
    writeReg(reg: number, value: bigint): void;
    readMemory(address: bigint, length: bigint): Uint8Array;
    writeMemory(address: bigint, data: Uint8Array): void;
    readVirtualMemory(address: bigint, length: bigint): Uint8Array;
    writeVirtualMemory(address: bigint, data: Uint8Array): void;
    translateVirtualAddress(vaddr: bigint): bigint;
    /** Drains the console output buffer; `0n` reads everything available. */
    readConsoleOutput(maxLength: bigint): Uint8Array;
    /** Appends to the console input buffer, returning the bytes accepted. */
    writeConsoleInput(data: Uint8Array): bigint;
    run(mcycleEnd: bigint): number;
    runUarch(uarchCycleEnd: bigint): number;
    resetUarch(): void;
    receiveCmioRequest(): { cmd: number; reason: number; data: Uint8Array };
    sendCmioResponse(
        reason: number,
        data: Uint8Array,
        revertRootHash: Uint8Array | null,
    ): void;
    logStep(mcycleCount: bigint, logFilename: string): number;
    logStepUarch(logType: number): string;
    logResetUarch(logType: number): string;
    logSendCmioResponse(
        reason: number,
        data: Uint8Array,
        revertRootHash: Uint8Array,
        logType: number,
    ): string;
    verifyStepUarch(rootHashBefore: Uint8Array, log: string): Uint8Array;
    verifyResetUarch(rootHashBefore: Uint8Array, log: string): Uint8Array;
    verifySendCmioResponse(
        reason: number,
        data: Uint8Array,
        rootHashBefore: Uint8Array,
        log: string,
        revertRootHash: Uint8Array,
    ): Uint8Array;
    verifyHashTree(): boolean;
    getHashTreeStats(clear: boolean): string;
    jsonrpcFork(): { machine: NativeMachine; address: string; pid: number };
    jsonrpcShutdownServer(): void;
    jsonrpcRebindServer(address: string): string;
    jsonrpcGetServerVersion(): string;
    jsonrpcEmancipateServer(): void;
    jsonrpcSetTimeout(ms: number): void;
    jsonrpcGetTimeout(): number;
    jsonrpcSetCleanupCall(call: number): void;
    jsonrpcGetCleanupCall(): number;
    jsonrpcGetServerAddress(): string;
    jsonrpcDelayNextRequest(ms: number): void;
}

/** The calls that do not take a machine, plus the constructors. */
export interface NativeAddon {
    getLastErrorMessage(): string;
    getVersion(): bigint;

    /**
     * libslirp's version, or null where it cannot be loaded — which is to say
     * whether this build can carry a virtio `net-user` device. Optional: only
     * the Node addon links against a libcartesi that has networking at all.
     */
    getSlirpVersion?(): string | null;
    machineNew(): NativeMachine;
    machineCreateNew(
        config: string,
        runtimeConfig: string | null,
        dir: string | null,
    ): NativeMachine;
    machineLoadNew(
        dir: string,
        runtimeConfig: string | null,
        sharing?: number,
    ): NativeMachine;
    getDefaultConfig(): string;
    getRegAddress(reg: number): bigint;
    getAddressName(paddr: bigint): string;
    verifyStep(
        rootHashBefore: Uint8Array,
        logFilename: string,
        mcycleCount: bigint,
    ): Uint8Array;
    verifyStepUarch(rootHashBefore: Uint8Array, log: string): Uint8Array;
    verifyResetUarch(rootHashBefore: Uint8Array, log: string): Uint8Array;
    verifySendCmioResponse(
        reason: number,
        data: Uint8Array,
        rootHashBefore: Uint8Array,
        log: string,
        revertRootHash: Uint8Array,
    ): Uint8Array;
    jsonrpcSpawnServer(
        address: string,
        spawnTimeoutMs: number,
    ): { machine: NativeMachine; boundAddress: string; pid: number };
    jsonrpcConnectServer(
        address: string,
        connectTimeoutMs: number,
    ): NativeMachine;
}
