// The WebAssembly binding: NativeAddon and NativeMachine implemented over the
// Emscripten module's exports. Every entry point of libcartesi's C API takes
// scalars and pointers, so this is pure marshalling — allocate scratch for the
// out parameters, copy bytes in and out of the heap, turn a non-zero cm_error
// into the { code, description } shape the machine wrapper expects.
import type { NativeAddon, NativeMachine } from "../native.js";
import type { CartesiMachineModule } from "./module.js";

const HASH_SIZE = 32;
const HASH_TREE_LOG2_ROOT_SIZE = 64;

/** Errors carry what the wrapper turns into a MachineError. */
class NativeError extends Error {
    constructor(
        readonly code: number,
        readonly description: string,
    ) {
        super(description);
        this.name = "NativeError";
    }
}

/**
 * A scope for heap allocations. Everything a call needs — C strings, input
 * bytes, out parameters — is allocated from one frame and released together,
 * so a throwing call cannot leak the wasm heap.
 */
class Frame {
    private readonly pointers: number[] = [];

    constructor(private readonly module: CartesiMachineModule) {}

    alloc(size: number): number {
        const pointer = this.module._malloc(Math.max(size, 1));
        if (pointer === 0) {
            throw new Error(
                "@cartesi/machine: the WebAssembly heap is exhausted; " +
                    "a machine's memory ranges have to fit in it",
            );
        }
        this.pointers.push(pointer);
        return pointer;
    }

    /** A NUL-terminated copy of `value`; null becomes a null pointer. */
    string(value: string | null | undefined): number {
        if (value === null || value === undefined) {
            return 0;
        }
        const size = this.module.lengthBytesUTF8(value) + 1;
        const pointer = this.alloc(size);
        this.module.stringToUTF8(value, pointer, size);
        return pointer;
    }

    /** A copy of `value`; null becomes a null pointer. */
    bytes(value: Uint8Array | null | undefined): number {
        if (value === null || value === undefined) {
            return 0;
        }
        const pointer = this.alloc(value.length);
        this.module.HEAPU8.set(value, pointer);
        return pointer;
    }

    /** Zeroed scratch for an out parameter. */
    out(size: number): number {
        const pointer = this.alloc(size);
        this.module.HEAPU8.fill(0, pointer, pointer + size);
        return pointer;
    }

    readU8(pointer: number): number {
        return this.module.HEAPU8[pointer] as number;
    }

    readU16(pointer: number): number {
        return this.module.HEAPU16[pointer >> 1] as number;
    }

    readU32(pointer: number): number {
        return this.module.HEAPU32[pointer >> 2] as number;
    }

    readU64(pointer: number): bigint {
        return this.module.HEAPU64[pointer >> 3] as bigint;
    }

    /** Reads a pointer-sized value (wasm32). */
    readPointer(pointer: number): number {
        return this.readU32(pointer);
    }

    /** Copies bytes out of the heap, so the result outlives the frame. */
    readBytes(pointer: number, length: number): Uint8Array {
        return this.module.HEAPU8.slice(pointer, pointer + length);
    }

    /**
     * Reads the string an out parameter points at. The emulator owns that
     * memory and only guarantees it until the next call, which is why this
     * copies immediately.
     */
    readStringAt(pointer: number): string {
        return this.module.UTF8ToString(this.readPointer(pointer));
    }

    release(): void {
        for (const pointer of this.pointers) {
            this.module._free(pointer);
        }
        this.pointers.length = 0;
    }
}

const createBinding = (module: CartesiMachineModule) => {
    const withFrame = <T>(fn: (frame: Frame) => T): T => {
        const frame = new Frame(module);
        try {
            return fn(frame);
        } finally {
            frame.release();
        }
    };

    /** Turns a cm_error into the exception the machine wrapper maps. */
    const check = (code: number): void => {
        if (code !== 0) {
            throw new NativeError(
                code,
                module.UTF8ToString(module._cm_get_last_error_message()),
            );
        }
    };

    const unsupported = (what: string): never => {
        throw new Error(
            `@cartesi/machine: ${what} is not available in the WebAssembly build; ` +
                "it needs a process and sockets, which a browser does not offer",
        );
    };

    // cm_machine objects are owned by the wasm heap and have no other owner
    // once the JavaScript wrapper is gone, so they are released on collection
    // — the same arrangement as the N-API addon's finalizer.
    const finalizer = new FinalizationRegistry<number>((pointer) => {
        module._cm_delete(pointer);
    });

    class WasmMachine implements NativeMachine {
        constructor(private readonly pointer: number) {
            finalizer.register(this, pointer);
        }

        private jsonOut(
            call: (machine: number, out: number) => number,
        ): string {
            return withFrame((frame) => {
                const out = frame.out(4);
                check(call(this.pointer, out));
                return frame.readStringAt(out);
            });
        }

        private boolOut(
            call: (machine: number, out: number) => number,
        ): boolean {
            return withFrame((frame) => {
                const out = frame.out(1);
                check(call(this.pointer, out));
                return frame.readU8(out) !== 0;
            });
        }

        private hashOut(
            call: (machine: number, hash: number) => number,
        ): Uint8Array {
            return withFrame((frame) => {
                const hash = frame.out(HASH_SIZE);
                check(call(this.pointer, hash));
                return frame.readBytes(hash, HASH_SIZE);
            });
        }

        // -- lifecycle ------------------------------------------------------

        isEmpty(): boolean {
            return this.boolOut(module._cm_is_empty);
        }

        isJsonrpcMachine(): boolean {
            return this.boolOut(module._cm_is_jsonrpc_machine);
        }

        create(
            config: string,
            runtimeConfig: string | null,
            dir: string | null,
        ): void {
            withFrame((frame) => {
                check(
                    module._cm_create(
                        this.pointer,
                        frame.string(config),
                        frame.string(runtimeConfig),
                        frame.string(dir),
                    ),
                );
            });
        }

        load(
            dir: string,
            runtimeConfig: string | null,
            sharing: number = 0,
        ): void {
            withFrame((frame) => {
                check(
                    module._cm_load(
                        this.pointer,
                        frame.string(dir),
                        frame.string(runtimeConfig),
                        sharing,
                    ),
                );
            });
        }

        cloneEmpty(): NativeMachine {
            return withFrame((frame) => {
                const out = frame.out(4);
                check(module._cm_clone_empty(this.pointer, out));
                return new WasmMachine(frame.readPointer(out));
            });
        }

        store(dir: string, sharing: number = 0): void {
            withFrame((frame) => {
                check(
                    module._cm_store(this.pointer, frame.string(dir), sharing),
                );
            });
        }

        cloneStored(fromDir: string, toDir: string): void {
            withFrame((frame) => {
                check(
                    module._cm_clone_stored(
                        this.pointer,
                        frame.string(fromDir),
                        frame.string(toDir),
                    ),
                );
            });
        }

        renameStored(fromDir: string, toDir: string): void {
            withFrame((frame) => {
                check(
                    module._cm_rename_stored(
                        this.pointer,
                        frame.string(fromDir),
                        frame.string(toDir),
                    ),
                );
            });
        }

        removeStored(dir: string): void {
            withFrame((frame) => {
                check(
                    module._cm_remove_stored(this.pointer, frame.string(dir)),
                );
            });
        }

        syncStored(dir: string): void {
            withFrame((frame) => {
                check(module._cm_sync_stored(this.pointer, frame.string(dir)));
            });
        }

        destroy(): void {
            check(module._cm_destroy(this.pointer));
        }

        // -- configuration --------------------------------------------------

        getDefaultConfig(): string {
            return this.jsonOut(module._cm_get_default_config);
        }

        getRegAddress(reg: number): bigint {
            return withFrame((frame) => {
                const out = frame.out(8);
                check(module._cm_get_reg_address(this.pointer, reg, out));
                return frame.readU64(out);
            });
        }

        setRuntimeConfig(runtimeConfig: string): void {
            withFrame((frame) => {
                check(
                    module._cm_set_runtime_config(
                        this.pointer,
                        frame.string(runtimeConfig),
                    ),
                );
            });
        }

        getRuntimeConfig(): string {
            return this.jsonOut(module._cm_get_runtime_config);
        }

        replaceMemoryRange(rangeConfig: string): void {
            withFrame((frame) => {
                check(
                    module._cm_replace_memory_range(
                        this.pointer,
                        frame.string(rangeConfig),
                    ),
                );
            });
        }

        getInitialConfig(): string {
            return this.jsonOut(module._cm_get_initial_config);
        }

        getAddressRanges(): string {
            return this.jsonOut(module._cm_get_address_ranges);
        }

        getAddressName(paddr: bigint): string {
            return withFrame((frame) => {
                const out = frame.out(4);
                check(module._cm_get_address_name(this.pointer, paddr, out));
                return frame.readStringAt(out);
            });
        }

        // -- hashes and proofs ----------------------------------------------

        getRootHash(): Uint8Array {
            return this.hashOut(module._cm_get_root_hash);
        }

        readRevertRootHash(): Uint8Array {
            return this.hashOut(module._cm_read_revert_root_hash);
        }

        writeRevertRootHash(hash: Uint8Array): void {
            withFrame((frame) => {
                check(
                    module._cm_write_revert_root_hash(
                        this.pointer,
                        frame.bytes(hash),
                    ),
                );
            });
        }

        getNodeHash(address: bigint, log2Size: number): Uint8Array {
            return withFrame((frame) => {
                const hash = frame.out(HASH_SIZE);
                check(
                    module._cm_get_node_hash(
                        this.pointer,
                        address,
                        log2Size,
                        hash,
                    ),
                );
                return frame.readBytes(hash, HASH_SIZE);
            });
        }

        getProof(
            address: bigint,
            log2Size: number,
            log2RootSize: number = HASH_TREE_LOG2_ROOT_SIZE,
        ): string {
            return withFrame((frame) => {
                const out = frame.out(4);
                check(
                    module._cm_get_proof(
                        this.pointer,
                        address,
                        log2Size,
                        log2RootSize,
                        out,
                    ),
                );
                return frame.readStringAt(out);
            });
        }

        verifyHashTree(): boolean {
            return this.boolOut(module._cm_verify_hash_tree);
        }

        getHashTreeStats(clear: boolean): string {
            return withFrame((frame) => {
                const out = frame.out(4);
                check(
                    module._cm_get_hash_tree_stats(
                        this.pointer,
                        clear ? 1 : 0,
                        out,
                    ),
                );
                return frame.readStringAt(out);
            });
        }

        // -- state access ---------------------------------------------------

        readWord(address: bigint): bigint {
            return withFrame((frame) => {
                const out = frame.out(8);
                check(module._cm_read_word(this.pointer, address, out));
                return frame.readU64(out);
            });
        }

        writeWord(address: bigint, value: bigint): void {
            check(module._cm_write_word(this.pointer, address, value));
        }

        readReg(reg: number): bigint {
            return withFrame((frame) => {
                const out = frame.out(8);
                check(module._cm_read_reg(this.pointer, reg, out));
                return frame.readU64(out);
            });
        }

        writeReg(reg: number, value: bigint): void {
            check(module._cm_write_reg(this.pointer, reg, value));
        }

        readMemory(address: bigint, length: bigint): Uint8Array {
            return withFrame((frame) => {
                const size = Number(length);
                const data = frame.alloc(size);
                check(
                    module._cm_read_memory(this.pointer, address, data, length),
                );
                return frame.readBytes(data, size);
            });
        }

        writeMemory(address: bigint, data: Uint8Array): void {
            withFrame((frame) => {
                check(
                    module._cm_write_memory(
                        this.pointer,
                        address,
                        frame.bytes(data),
                        BigInt(data.length),
                    ),
                );
            });
        }

        readVirtualMemory(address: bigint, length: bigint): Uint8Array {
            return withFrame((frame) => {
                const size = Number(length);
                const data = frame.alloc(size);
                check(
                    module._cm_read_virtual_memory(
                        this.pointer,
                        address,
                        data,
                        length,
                    ),
                );
                return frame.readBytes(data, size);
            });
        }

        writeVirtualMemory(address: bigint, data: Uint8Array): void {
            withFrame((frame) => {
                check(
                    module._cm_write_virtual_memory(
                        this.pointer,
                        address,
                        frame.bytes(data),
                        BigInt(data.length),
                    ),
                );
            });
        }

        translateVirtualAddress(vaddr: bigint): bigint {
            return withFrame((frame) => {
                const out = frame.out(8);
                check(
                    module._cm_translate_virtual_address(
                        this.pointer,
                        vaddr,
                        out,
                    ),
                );
                return frame.readU64(out);
            });
        }

        // -- console --------------------------------------------------------

        readConsoleOutput(maxLength: bigint): Uint8Array {
            return withFrame((frame) => {
                const length = frame.out(8);
                // A null buffer is the emulator's query mode: it reports what
                // is buffered instead of consuming it, which is how a caller
                // that passed 0n asks for "whatever there is".
                let want = maxLength;
                if (want === 0n) {
                    check(
                        module._cm_read_console_output(
                            this.pointer,
                            0,
                            0n,
                            length,
                        ),
                    );
                    want = frame.readU64(length);
                    if (want === 0n) {
                        return new Uint8Array(0);
                    }
                }
                const data = frame.alloc(Number(want));
                check(
                    module._cm_read_console_output(
                        this.pointer,
                        data,
                        want,
                        length,
                    ),
                );
                return frame.readBytes(data, Number(frame.readU64(length)));
            });
        }

        writeConsoleInput(data: Uint8Array): bigint {
            return withFrame((frame) => {
                const written = frame.out(8);
                check(
                    module._cm_write_console_input(
                        this.pointer,
                        frame.bytes(data),
                        BigInt(data.length),
                        written,
                    ),
                );
                return frame.readU64(written);
            });
        }

        // -- running --------------------------------------------------------

        run(mcycleEnd: bigint): number {
            return withFrame((frame) => {
                const out = frame.out(4);
                check(module._cm_run(this.pointer, mcycleEnd, out));
                return frame.readU32(out);
            });
        }

        runUarch(uarchCycleEnd: bigint): number {
            return withFrame((frame) => {
                const out = frame.out(4);
                check(module._cm_run_uarch(this.pointer, uarchCycleEnd, out));
                return frame.readU32(out);
            });
        }

        resetUarch(): void {
            check(module._cm_reset_uarch(this.pointer));
        }

        // -- cmio -----------------------------------------------------------

        receiveCmioRequest(): {
            cmd: number;
            reason: number;
            data: Uint8Array;
        } {
            return withFrame((frame) => {
                // a first call with a null data buffer reports the length,
                // which beats keeping a 2 MB scratch buffer around
                const cmd = frame.out(1);
                const reason = frame.out(2);
                const length = frame.out(8);
                check(
                    module._cm_receive_cmio_request(
                        this.pointer,
                        cmd,
                        reason,
                        0,
                        length,
                    ),
                );

                const size = Number(frame.readU64(length));
                const data = frame.alloc(size);
                check(
                    module._cm_receive_cmio_request(
                        this.pointer,
                        cmd,
                        reason,
                        data,
                        length,
                    ),
                );

                return {
                    cmd: frame.readU8(cmd),
                    reason: frame.readU16(reason),
                    data: frame.readBytes(data, Number(frame.readU64(length))),
                };
            });
        }

        sendCmioResponse(
            reason: number,
            data: Uint8Array,
            revertRootHash: Uint8Array | null,
        ): void {
            withFrame((frame) => {
                check(
                    module._cm_send_cmio_response(
                        this.pointer,
                        reason,
                        frame.bytes(data),
                        BigInt(data.length),
                        frame.bytes(revertRootHash),
                    ),
                );
            });
        }

        // -- logging and verification ---------------------------------------

        logStep(mcycleCount: bigint, logFilename: string): number {
            return withFrame((frame) => {
                const out = frame.out(4);
                check(
                    module._cm_log_step(
                        this.pointer,
                        mcycleCount,
                        frame.string(logFilename),
                        out,
                    ),
                );
                return frame.readU32(out);
            });
        }

        logStepUarch(logType: number): string {
            return withFrame((frame) => {
                const out = frame.out(4);
                check(module._cm_log_step_uarch(this.pointer, logType, out));
                return frame.readStringAt(out);
            });
        }

        logResetUarch(logType: number): string {
            return withFrame((frame) => {
                const out = frame.out(4);
                check(module._cm_log_reset_uarch(this.pointer, logType, out));
                return frame.readStringAt(out);
            });
        }

        logSendCmioResponse(
            reason: number,
            data: Uint8Array,
            revertRootHash: Uint8Array,
            logType: number,
        ): string {
            return withFrame((frame) => {
                const out = frame.out(4);
                check(
                    module._cm_log_send_cmio_response(
                        this.pointer,
                        reason,
                        frame.bytes(data),
                        BigInt(data.length),
                        frame.bytes(revertRootHash),
                        logType,
                        out,
                    ),
                );
                return frame.readStringAt(out);
            });
        }

        verifyStepUarch(rootHashBefore: Uint8Array, log: string): Uint8Array {
            return verifyStepUarch(this.pointer, rootHashBefore, log);
        }

        verifyResetUarch(rootHashBefore: Uint8Array, log: string): Uint8Array {
            return verifyResetUarch(this.pointer, rootHashBefore, log);
        }

        verifySendCmioResponse(
            reason: number,
            data: Uint8Array,
            rootHashBefore: Uint8Array,
            log: string,
            revertRootHash: Uint8Array,
        ): Uint8Array {
            return verifySendCmioResponse(
                this.pointer,
                reason,
                data,
                rootHashBefore,
                log,
                revertRootHash,
            );
        }

        // -- remote machines ------------------------------------------------
        //
        // A machine served by cartesi-jsonrpc-machine needs a process and a
        // socket. src/jsonrpc reaches one over fetch instead.

        jsonrpcFork(): {
            machine: NativeMachine;
            address: string;
            pid: number;
        } {
            return unsupported("forking a machine server");
        }
        jsonrpcShutdownServer(): void {
            unsupported("shutting a machine server down");
        }
        jsonrpcRebindServer(): string {
            return unsupported("rebinding a machine server");
        }
        jsonrpcGetServerVersion(): string {
            return unsupported("querying a machine server");
        }
        jsonrpcEmancipateServer(): void {
            unsupported("emancipating a machine server");
        }
        jsonrpcSetTimeout(): void {
            unsupported("configuring a machine server");
        }
        jsonrpcGetTimeout(): number {
            return unsupported("configuring a machine server");
        }
        jsonrpcSetCleanupCall(): void {
            unsupported("configuring a machine server");
        }
        jsonrpcGetCleanupCall(): number {
            return unsupported("configuring a machine server");
        }
        jsonrpcGetServerAddress(): string {
            return unsupported("querying a machine server");
        }
        jsonrpcDelayNextRequest(): void {
            unsupported("configuring a machine server");
        }
    }

    // the standalone verifiers take a machine only to pick an implementation,
    // and accept a null pointer for local ones
    const verifyStepUarch = (
        machine: number,
        rootHashBefore: Uint8Array,
        log: string,
    ): Uint8Array =>
        withFrame((frame) => {
            const obtained = frame.out(HASH_SIZE);
            check(
                module._cm_verify_step_uarch(
                    machine,
                    frame.bytes(rootHashBefore),
                    frame.string(log),
                    obtained,
                ),
            );
            return frame.readBytes(obtained, HASH_SIZE);
        });

    const verifyResetUarch = (
        machine: number,
        rootHashBefore: Uint8Array,
        log: string,
    ): Uint8Array =>
        withFrame((frame) => {
            const obtained = frame.out(HASH_SIZE);
            check(
                module._cm_verify_reset_uarch(
                    machine,
                    frame.bytes(rootHashBefore),
                    frame.string(log),
                    obtained,
                ),
            );
            return frame.readBytes(obtained, HASH_SIZE);
        });

    const verifySendCmioResponse = (
        machine: number,
        reason: number,
        data: Uint8Array,
        rootHashBefore: Uint8Array,
        log: string,
        revertRootHash: Uint8Array,
    ): Uint8Array =>
        withFrame((frame) => {
            const obtained = frame.out(HASH_SIZE);
            check(
                module._cm_verify_send_cmio_response(
                    machine,
                    reason,
                    frame.bytes(data),
                    BigInt(data.length),
                    frame.bytes(rootHashBefore),
                    frame.string(log),
                    frame.bytes(revertRootHash),
                    obtained,
                ),
            );
            return frame.readBytes(obtained, HASH_SIZE);
        });

    const addon: NativeAddon = {
        getLastErrorMessage(): string {
            return module.UTF8ToString(module._cm_get_last_error_message());
        },

        getVersion(): bigint {
            return module._cm_get_version();
        },

        machineNew(): NativeMachine {
            return withFrame((frame) => {
                const out = frame.out(4);
                check(module._cm_new(out));
                return new WasmMachine(frame.readPointer(out));
            });
        },

        machineCreateNew(
            config: string,
            runtimeConfig: string | null,
            dir: string | null,
        ): NativeMachine {
            return withFrame((frame) => {
                const out = frame.out(4);
                check(
                    module._cm_create_new(
                        frame.string(config),
                        frame.string(runtimeConfig),
                        frame.string(dir),
                        out,
                    ),
                );
                return new WasmMachine(frame.readPointer(out));
            });
        },

        machineLoadNew(
            dir: string,
            runtimeConfig: string | null,
            sharing: number = 0,
        ): NativeMachine {
            return withFrame((frame) => {
                const out = frame.out(4);
                check(
                    module._cm_load_new(
                        frame.string(dir),
                        frame.string(runtimeConfig),
                        sharing,
                        out,
                    ),
                );
                return new WasmMachine(frame.readPointer(out));
            });
        },

        getDefaultConfig(): string {
            return withFrame((frame) => {
                const out = frame.out(4);
                check(module._cm_get_default_config(0, out));
                return frame.readStringAt(out);
            });
        },

        getRegAddress(reg: number): bigint {
            return withFrame((frame) => {
                const out = frame.out(8);
                check(module._cm_get_reg_address(0, reg, out));
                return frame.readU64(out);
            });
        },

        getAddressName(paddr: bigint): string {
            return withFrame((frame) => {
                const out = frame.out(4);
                check(module._cm_get_address_name(0, paddr, out));
                return frame.readStringAt(out);
            });
        },

        verifyStep(
            rootHashBefore: Uint8Array,
            logFilename: string,
            mcycleCount: bigint,
        ): Uint8Array {
            return withFrame((frame) => {
                const obtained = frame.out(HASH_SIZE);
                check(
                    module._cm_verify_step(
                        frame.bytes(rootHashBefore),
                        frame.string(logFilename),
                        mcycleCount,
                        obtained,
                    ),
                );
                return frame.readBytes(obtained, HASH_SIZE);
            });
        },

        verifyStepUarch(rootHashBefore: Uint8Array, log: string): Uint8Array {
            return verifyStepUarch(0, rootHashBefore, log);
        },

        verifyResetUarch(rootHashBefore: Uint8Array, log: string): Uint8Array {
            return verifyResetUarch(0, rootHashBefore, log);
        },

        verifySendCmioResponse(
            reason: number,
            data: Uint8Array,
            rootHashBefore: Uint8Array,
            log: string,
            revertRootHash: Uint8Array,
        ): Uint8Array {
            return verifySendCmioResponse(
                0,
                reason,
                data,
                rootHashBefore,
                log,
                revertRootHash,
            );
        },

        jsonrpcSpawnServer(): {
            machine: NativeMachine;
            boundAddress: string;
            pid: number;
        } {
            return unsupported("spawning a machine server");
        },

        jsonrpcConnectServer(): NativeMachine {
            return unsupported("connecting to a machine server");
        },
    };

    return addon;
};

/**
 * Builds the binding for an instantiated module. Machines created through it
 * live in that module's heap, so machines from different modules cannot be
 * mixed.
 */
export const createWasmAddon = (module: CartesiMachineModule): NativeAddon =>
    createBinding(module);
