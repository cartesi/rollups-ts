// What the emulator's JSON looks like on this side: hashes are base64, and
// u64 values are JSON numbers that may not survive JSON.parse. Shared by the
// machine wrapper (whose collect calls answer in JSON) and the JSON-RPC
// client (which speaks nothing else); plain btoa/atob, so it runs anywhere.
import {
    BreakReason,
    type McycleRootHashes,
    type UarchCycleRootHashes,
} from "./cartesi-machine.js";
import type { Base64Hash, PartialBundle } from "./types.js";

export const toBase64 = (bytes: Uint8Array): string => {
    let binary = "";
    for (const byte of bytes) {
        binary += String.fromCharCode(byte);
    }
    return btoa(binary);
};

export const fromBase64 = (text: string): Uint8Array => {
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
export const parseJson = (text: string): unknown =>
    JSON.parse(
        text.replace(/([:[,]\s*)(-?\d{16,})(?=\s*[,\]}])/g, '$1"$2"'),
    ) as unknown;

export const toBigInt = (value: unknown): bigint =>
    BigInt(value as string | number);

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

/** Break reasons cross JSON as names, not numbers. */
export const toBreakReason = (name: unknown): BreakReason => {
    const known = BREAK_REASONS[name as string];
    if (known === undefined) {
        throw new Error(`@cartesi/machine: unknown break reason ${name}`);
    }
    return known;
};

export const toBase64Hashes = (hashes: Uint8Array[]): Base64Hash[] =>
    hashes.map(toBase64);

export const fromBase64Hashes = (hashes: unknown): Uint8Array[] =>
    (hashes as Base64Hash[]).map(fromBase64);

/** The result of collect_mcycle_root_hashes, as the C API writes it. */
export const toMcycleRootHashes = (value: unknown): McycleRootHashes => {
    const result = value as {
        hashes: Base64Hash[];
        mcycle_phase: number | string;
        break_reason: string;
        partial_bundle?: PartialBundle;
        console_io_error?: string;
    };
    return {
        hashes: fromBase64Hashes(result.hashes),
        mcyclePhase: toBigInt(result.mcycle_phase),
        breakReason: toBreakReason(result.break_reason),
        ...(result.partial_bundle !== undefined && {
            partialBundle: result.partial_bundle,
        }),
        ...(result.console_io_error !== undefined && {
            consoleIoError: result.console_io_error,
        }),
    };
};

/** The result of collect_uarch_cycle_root_hashes, as the C API writes it. */
export const toUarchCycleRootHashes = (
    value: unknown,
): UarchCycleRootHashes => {
    const result = value as {
        hashes: Base64Hash[];
        mcycle_hash_offsets: number[];
        break_reason: string;
    };
    return {
        hashes: fromBase64Hashes(result.hashes),
        mcycleHashOffsets: result.mcycle_hash_offsets,
        breakReason: toBreakReason(result.break_reason),
    };
};
