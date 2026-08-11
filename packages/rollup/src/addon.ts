import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import nodeGypBuild from "node-gyp-build";

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
