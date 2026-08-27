// The Emscripten module: libcartesi compiled to WebAssembly, exporting the C
// API verbatim (see wasm/Makefile). This file types that surface and loads it;
// the marshalling lives in addon.ts.

/** Emscripten's virtual filesystem, as much of it as the binding needs. */
export interface EmscriptenFS {
    mkdir(path: string, mode?: number): void;
    mkdirTree(path: string, mode?: number): void;
    writeFile(
        path: string,
        data: Uint8Array | string,
        options?: { flags?: string },
    ): void;
    readFile(
        path: string,
        options?: { encoding?: "binary" | "utf8"; flags?: string },
    ): Uint8Array;
    readdir(path: string): string[];
    unlink(path: string): void;
    rmdir(path: string): void;
    stat(path: string): { size: number; mode: number };
    isDir(mode: number): boolean;
    isFile(mode: number): boolean;
    analyzePath(path: string): { exists: boolean };
}

/**
 * The module object a factory call resolves to. Only the exports the binding
 * uses are declared; heap views are re-read on every access because memory
 * growth replaces them.
 */
export interface CartesiMachineModule {
    HEAPU8: Uint8Array;
    HEAPU16: Uint16Array;
    HEAPU32: Uint32Array;
    HEAPU64: BigUint64Array;
    FS: EmscriptenFS;

    UTF8ToString(ptr: number, maxBytesToRead?: number): string;
    stringToUTF8(str: string, ptr: number, maxBytesToWrite: number): void;
    lengthBytesUTF8(str: string): number;

    _malloc(size: number): number;
    _free(ptr: number): void;

    _cmw_abi_version(): number;
    _cmw_emulator_version(): bigint;

    // machine lifecycle
    _cm_new(newMachine: number): number;
    _cm_clone_empty(machine: number, newMachine: number): number;
    _cm_is_empty(machine: number, out: number): number;
    _cm_is_jsonrpc_machine(machine: number, out: number): number;
    _cm_delete(machine: number): void;
    _cm_create(
        machine: number,
        config: number,
        runtimeConfig: number,
        dir: number,
    ): number;
    _cm_create_new(
        config: number,
        runtimeConfig: number,
        dir: number,
        newMachine: number,
    ): number;
    _cm_load(
        machine: number,
        dir: number,
        runtimeConfig: number,
        sharing: number,
    ): number;
    _cm_load_new(
        dir: number,
        runtimeConfig: number,
        sharing: number,
        newMachine: number,
    ): number;
    _cm_store(machine: number, dir: number, sharing: number): number;
    _cm_clone_stored(machine: number, fromDir: number, toDir: number): number;
    _cm_rename_stored(machine: number, fromDir: number, toDir: number): number;
    _cm_remove_stored(machine: number, dir: number): number;
    _cm_sync_stored(machine: number, dir: number): number;
    _cm_destroy(machine: number): number;

    // configuration and introspection
    _cm_get_version(): bigint;
    _cm_get_last_error_message(): number;
    _cm_get_default_config(machine: number, out: number): number;
    _cm_get_reg_address(machine: number, reg: number, out: number): number;
    _cm_get_address_name(machine: number, paddr: bigint, out: number): number;
    _cm_set_runtime_config(machine: number, runtimeConfig: number): number;
    _cm_get_runtime_config(machine: number, out: number): number;
    _cm_replace_memory_range(machine: number, rangeConfig: number): number;
    _cm_get_initial_config(machine: number, out: number): number;
    _cm_get_address_ranges(machine: number, out: number): number;

    // hashes and proofs
    _cm_get_root_hash(machine: number, hash: number): number;
    _cm_read_revert_root_hash(machine: number, hash: number): number;
    _cm_write_revert_root_hash(machine: number, hash: number): number;
    _cm_get_node_hash(
        machine: number,
        address: bigint,
        log2Size: number,
        hash: number,
    ): number;
    _cm_get_proof(
        machine: number,
        address: bigint,
        log2TargetSize: number,
        log2RootSize: number,
        out: number,
    ): number;
    _cm_verify_hash_tree(machine: number, out: number): number;
    _cm_get_hash_tree_stats(
        machine: number,
        clear: number,
        out: number,
    ): number;

    // state access
    _cm_read_word(machine: number, address: bigint, out: number): number;
    _cm_write_word(machine: number, address: bigint, value: bigint): number;
    _cm_read_reg(machine: number, reg: number, out: number): number;
    _cm_write_reg(machine: number, reg: number, value: bigint): number;
    _cm_read_memory(
        machine: number,
        paddr: bigint,
        data: number,
        length: bigint,
    ): number;
    _cm_write_memory(
        machine: number,
        paddr: bigint,
        data: number,
        length: bigint,
    ): number;
    _cm_read_virtual_memory(
        machine: number,
        address: bigint,
        data: number,
        length: bigint,
    ): number;
    _cm_write_virtual_memory(
        machine: number,
        address: bigint,
        data: number,
        length: bigint,
    ): number;
    _cm_translate_virtual_address(
        machine: number,
        vaddr: bigint,
        out: number,
    ): number;

    // console
    _cm_read_console_output(
        machine: number,
        data: number,
        maxLength: bigint,
        readLength: number,
    ): number;
    _cm_write_console_input(
        machine: number,
        data: number,
        length: bigint,
        writtenLength: number,
    ): number;

    // running
    _cm_run(machine: number, mcycleEnd: bigint, breakReason: number): number;
    _cm_run_uarch(
        machine: number,
        uarchCycleEnd: bigint,
        breakReason: number,
    ): number;
    _cm_reset_uarch(machine: number): number;

    // cmio
    _cm_receive_cmio_request(
        machine: number,
        cmd: number,
        reason: number,
        data: number,
        length: number,
    ): number;
    _cm_send_cmio_response(
        machine: number,
        reason: number,
        data: number,
        length: bigint,
        revertRootHash: number,
    ): number;

    // logging and verification
    _cm_log_step(
        machine: number,
        mcycleCount: bigint,
        logFilename: number,
        breakReason: number,
    ): number;
    _cm_log_step_uarch(machine: number, logType: number, out: number): number;
    _cm_log_reset_uarch(machine: number, logType: number, out: number): number;
    _cm_log_send_cmio_response(
        machine: number,
        reason: number,
        data: number,
        length: bigint,
        revertRootHash: number,
        logType: number,
        out: number,
    ): number;
    _cm_verify_step(
        rootHashBefore: number,
        logFilename: number,
        mcycleCount: bigint,
        obtained: number,
    ): number;
    _cm_verify_step_uarch(
        machine: number,
        rootHashBefore: number,
        log: number,
        obtained: number,
    ): number;
    _cm_verify_reset_uarch(
        machine: number,
        rootHashBefore: number,
        log: number,
        obtained: number,
    ): number;
    _cm_verify_send_cmio_response(
        machine: number,
        reason: number,
        data: number,
        length: bigint,
        rootHashBefore: number,
        log: number,
        revertRootHash: number,
        obtained: number,
    ): number;
}

/** What the generated module's default export is. */
export type CartesiMachineModuleFactory = (
    options?: Record<string, unknown>,
) => Promise<CartesiMachineModule>;

/** The ABI wasm/entry.c reports; bumped when the module's shape changes. */
export const EXPECTED_ABI_VERSION = 1;

export interface LoadModuleOptions {
    /**
     * The module factory, for callers that would rather resolve the asset
     * themselves — a bundler-specific import, a URL, a copy served from their
     * own origin. Defaults to the module built into the package.
     */
    factory?: CartesiMachineModuleFactory;

    /**
     * Passed to the Emscripten factory (`locateFile`, `wasmBinary`, `print`,
     * and friends).
     */
    moduleOptions?: Record<string, unknown>;
}

const loadBundledFactory = async (): Promise<CartesiMachineModuleFactory> => {
    try {
        const bundled = (await import("./cartesi-machine.mjs")) as {
            default: CartesiMachineModuleFactory;
        };
        return bundled.default;
    } catch (cause) {
        throw new Error(
            "@cartesi/machine: the WebAssembly module is missing. It is built by " +
                "`pnpm build:wasm` (see wasm/builder.Dockerfile) and shipped with the " +
                "published package; pass `factory` to load your own copy.",
            { cause },
        );
    }
};

/**
 * Instantiates the WebAssembly module. One instance holds all machines created
 * through it, so callers that want isolation (a machine per worker, say) load
 * one module per isolate.
 */
export const loadModule = async (
    options: LoadModuleOptions = {},
): Promise<CartesiMachineModule> => {
    const factory = options.factory ?? (await loadBundledFactory());
    const module = await factory(options.moduleOptions);

    const abi = module._cmw_abi_version();
    if (abi !== EXPECTED_ABI_VERSION) {
        throw new Error(
            `@cartesi/machine: WebAssembly module ABI ${abi} does not match the ` +
                `${EXPECTED_ABI_VERSION} this build expects`,
        );
    }

    return module;
};
