import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import nodeGypBuild from "node-gyp-build";
import type { RollupDriver } from "./types.js";

/**
 * Raw N-API surface (see native/addon.cc). Byte arguments must already be
 * Buffers/Uint8Arrays of the exact length libcmt expects, output indexes come
 * back as bigint, and failures throw an Error carrying `errno` (the negative
 * libcmt errno) and `syscall` (the libcmt call that failed).
 */
export interface NativeRollup {
    finish(accept: boolean): NativeRollupRequest;
    emitVoucher(destination: Buffer, value: Buffer, payload: Buffer): bigint;
    emitDelegateCallVoucher(destination: Buffer, payload: Buffer): bigint;
    emitNotice(payload: Buffer): bigint;
    emitReport(payload: Buffer): void;
    emitException(payload: Buffer): void;
    progress(value: number): void;
    gio(domain: number, id: Buffer): NativeGioResponse;
    loadMerkle(path: string): void;
    saveMerkle(path: string): void;
    resetMerkle(): void;
    close(): void;
}

export interface NativeAdvanceRequest {
    type: "advance";
    chainId: bigint;
    appContract: Buffer;
    msgSender: Buffer;
    blockNumber: bigint;
    blockTimestamp: bigint;
    prevRandao: Buffer;
    index: bigint;
    payload: Buffer;
}

export interface NativeInspectRequest {
    type: "inspect";
    payload: Buffer;
}

export type NativeRollupRequest = NativeAdvanceRequest | NativeInspectRequest;

export interface NativeGioResponse {
    responseCode: number;
    responseData: Buffer;
}

export interface NativeAddon {
    Rollup: new () => NativeRollup;
    /** The libcmt IO driver this addon was built against. See {@link driver}. */
    driver: RollupDriver;
}

// Package root: walk up from this file (dist/ when bundled, src/ when executed
// from sources) until the directory containing binding.gyp.
const findPackageRoot = (dir: string): string => {
    let current = dir;
    for (;;) {
        if (existsSync(join(current, "binding.gyp"))) {
            return current;
        }
        const parent = dirname(current);
        if (parent === current) {
            throw new Error(`could not find package root from ${dir}`);
        }
        current = parent;
    }
};

export const addon = nodeGypBuild(findPackageRoot(__dirname)) as NativeAddon;

/**
 * The libcmt IO driver this addon was built against: `"ioctl"` for the real
 * Cartesi Machine driver (riscv64), `"mock"` for the file-based simulation used
 * on development hosts.
 *
 * It is decided by `binding.gyp` from the target architecture, at build time —
 * not by the environment, so it is the truth about which half of libcmt is
 * running, where `CMT_INPUTS` being set is only a hint.
 */
export const driver: RollupDriver = addon.driver;
