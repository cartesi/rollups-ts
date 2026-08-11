import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { type Input, decodeOutput, encodeInput } from "@cartesi/codec";
import { getAddress } from "viem";
import { describe, expect, it } from "vitest";

// the suite runs against the sources, so coverage maps onto them directly;
// `src/addon.ts` walks up to the package root to find the addon, so it loads
// the same `.node` `dist` would. `test/machine/` covers the packed `dist` end
// to end inside a real Cartesi Machine.
import { Rollup, RollupError } from "../src/index.js";

// Inputs are encoded and outputs decoded with @cartesi/codec, whose codecs are
// derived from the rollups-contracts ABIs. libcmt encodes and decodes the same
// blobs in C, so every assertion here doubles as a conformance check between
// the two implementations.

// keep mock by-product files (none.gio-0.bin etc.) out of the repo
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "cartesi-rollup-"));
process.chdir(tmp);

const ADVANCE: Input<Uint8Array> = {
    chainId: 31337n,
    appContract: getAddress(`0x${"02".repeat(20)}`),
    msgSender: getAddress(`0x${"03".repeat(20)}`),
    blockNumber: 456n,
    blockTimestamp: 1700000000n,
    prevRandao: 0xdeadbeefn,
    index: 7n,
    payload: Buffer.from("hello from the chain"),
};

const advanceInput = (payload?: Buffer): Uint8Array =>
    encodeInput(payload ? { ...ADVANCE, payload } : ADVANCE, "bytes");

const writeInputs = (
    name: string,
    inputs: [number, string, Uint8Array][],
): string => {
    const dir = path.join(tmp, name);
    fs.mkdirSync(dir, { recursive: true });
    const spec = inputs
        .map(([reason, filename, data]) => {
            const file = path.join(dir, filename);
            fs.writeFileSync(file, data);
            return `${reason}:${file}`;
        })
        .join(",");
    process.env.CMT_INPUTS = spec;
    return dir;
};

/** Decode the output libcmt wrote while handling the input in `dir`. */
const readOutput = (dir: string, index: number) =>
    decodeOutput(
        fs.readFileSync(path.join(dir, `advance.output-${index}.bin`)),
    );

/** Run `fn`, expecting it to throw, and return the error it threw. */
const captureError = (fn: () => unknown): unknown => {
    try {
        fn();
    } catch (error) {
        return error;
    }
    throw new Error("expected the call to throw, but it returned");
};

describe("rollup", () => {
    it("handles an advance request, outputs and reports", () => {
        const dir = writeInputs("advance", [
            [0, "advance.bin", advanceInput()],
        ]);
        const rollup = new Rollup();

        const request = rollup.finish();
        expect(request.type).toBe("advance");
        if (request.type !== "advance") return;
        expect(request.chainId).toBe(ADVANCE.chainId);
        // the binding returns addresses lowercased, the codec checksums them
        expect(request.appContract).toBe(ADVANCE.appContract.toLowerCase());
        expect(request.msgSender).toBe(ADVANCE.msgSender.toLowerCase());
        expect(request.blockNumber).toBe(ADVANCE.blockNumber);
        expect(request.blockTimestamp).toBe(ADVANCE.blockTimestamp);
        expect(request.prevRandao).toBe(ADVANCE.prevRandao);
        expect(request.index).toBe(ADVANCE.index);
        expect(request.payload).toEqual(Buffer.from(ADVANCE.payload));

        const destination = `0x${"aa".repeat(20)}` as const;
        const voucherPayload = Buffer.from("voucher-payload");
        const noticePayload = Buffer.from("notice-payload");
        const reportPayload = Buffer.from("report-payload");

        expect(
            rollup.emitVoucher({
                destination,
                value: 1000n,
                payload: voucherPayload,
            }),
        ).toBe(0n);
        expect(rollup.emitNotice(noticePayload)).toBe(1n);
        rollup.emitReport(reportPayload);
        rollup.progress(500);

        // outputs are EVM-ABI encoded by libcmt and stored next to the input file
        const voucher = readOutput(dir, 0);
        expect(voucher.type).toBe("Voucher");
        if (voucher.type === "Voucher") {
            expect(voucher.destination).toBe(getAddress(destination));
            expect(voucher.value).toBe(1000n);
            expect(Buffer.from(voucher.payload)).toEqual(voucherPayload);
        }

        const notice = readOutput(dir, 1);
        expect(notice.type).toBe("Notice");
        if (notice.type === "Notice") {
            expect(Buffer.from(notice.payload)).toEqual(noticePayload);
        }

        // reports are raw
        expect(fs.readFileSync(path.join(dir, "advance.report-0.bin"))).toEqual(
            reportPayload,
        );

        // no more inputs: finish throws a RollupError carrying the libcmt errno
        const error = captureError(() => rollup.finish());
        expect(error).toBeInstanceOf(RollupError);
        const rollupError = error as RollupError;
        expect(rollupError.message).toMatch(/cmt_rollup_finish failed/);
        expect(rollupError.errno).toBeLessThan(0);
        expect(rollupError.syscall).toBe("cmt_rollup_finish");

        rollup.close();
        expect(() => rollup.emitNotice(noticePayload)).toThrow(/closed/);
        rollup.close(); // idempotent
    });

    it("handles an inspect request", () => {
        const payload = Buffer.from("inspect-query");
        writeInputs("inspect", [[1, "inspect.bin", payload]]);
        const rollup = new Rollup();

        const request = rollup.finish();
        expect(request.type).toBe("inspect");
        expect(request.payload).toEqual(payload);

        rollup.emitReport(Buffer.from("inspect-response"));
        rollup.close();
    });

    it("emits a delegate call voucher", () => {
        const dir = writeInputs("dcv", [[0, "advance.bin", advanceInput()]]);
        const rollup = new Rollup();
        rollup.finish();

        const destination = `0x${"bb".repeat(20)}` as const;
        const payload = Buffer.from("delegate-payload");
        expect(rollup.emitDelegateCallVoucher({ destination, payload })).toBe(
            0n,
        );

        const output = readOutput(dir, 0);
        expect(output.type).toBe("DelegateCallVoucher");
        if (output.type === "DelegateCallVoucher") {
            expect(output.destination).toBe(getAddress(destination));
            expect(Buffer.from(output.payload)).toEqual(payload);
        }
        rollup.close();
    });

    it("emits an exception", () => {
        const dir = writeInputs("exception", [
            [0, "advance.bin", advanceInput()],
        ]);
        const rollup = new Rollup();
        rollup.finish();

        const payload = Buffer.from("something went wrong");
        rollup.emitException(payload);
        expect(
            fs.readFileSync(path.join(dir, "advance.exception-0.bin")),
        ).toEqual(payload);
        rollup.close();
    });

    it("performs a gio request", () => {
        const reply = Buffer.from("gio-reply-data");
        writeInputs("gio", [[42, "gio-reply.bin", reply]]);
        const rollup = new Rollup();

        const response = rollup.gio({
            domain: 0xfefe,
            id: Buffer.from("gio-request-id"),
        });
        expect(response.responseCode).toBe(42);
        expect(response.responseData).toEqual(reply);
        rollup.close();
    });

    it("saves, resets and loads the merkle tree", () => {
        writeInputs("merkle", [[0, "advance.bin", advanceInput()]]);
        const rollup = new Rollup();
        rollup.finish();
        rollup.emitNotice(Buffer.from("leaf"));

        const file = path.join(tmp, "merkle.bin");
        rollup.saveMerkle(file);
        expect(fs.statSync(file).size).toBeGreaterThan(0);
        rollup.resetMerkle();
        rollup.loadMerkle(file);
        rollup.close();

        // only one instance may be open at a time: libcmt returns -EBUSY otherwise
        const another = new Rollup();
        const busy = captureError(() => new Rollup()) as RollupError;
        expect(busy).toBeInstanceOf(RollupError);
        expect(busy.syscall).toBe("cmt_rollup_init");
        expect(busy.errno).toBe(-16);

        const missing = captureError(() =>
            another.loadMerkle(path.join(tmp, "missing", "merkle.bin")),
        ) as RollupError;
        expect(missing).toBeInstanceOf(RollupError);
        expect(missing.syscall).toBe("cmt_rollup_load_merkle");
        another.close();
    });

    it("drives handlers with the run loop until inputs are exhausted", async () => {
        const payloads = [
            Buffer.from("input-0"),
            Buffer.from("input-1"),
        ] as const;
        writeInputs("run", [
            [0, "a.bin", advanceInput(payloads[0])],
            [0, "b.bin", advanceInput(payloads[1])],
        ]);
        const rollup = new Rollup();

        const seen: Buffer[] = [];
        await expect(
            rollup.run({
                advance: (request) => {
                    seen.push(request.payload);
                },
            }),
        ).rejects.toThrow(/cmt_rollup_finish failed/);
        expect(seen).toEqual([...payloads]);
        rollup.close();
    });

    it("validates its arguments", () => {
        writeInputs("validation", [[0, "advance.bin", advanceInput()]]);
        const rollup = new Rollup();
        rollup.finish();

        expect(() => rollup.emitVoucher({ destination: "0x1234" })).toThrow(
            /destination must be 20 bytes/,
        );
        expect(() =>
            rollup.emitVoucher({ destination: "not-hex" as never }),
        ).toThrow(TypeError);
        expect(() =>
            rollup.emitVoucher({
                destination: `0x${"aa".repeat(20)}`,
                value: -1n,
            }),
        ).toThrow(RangeError);
        expect(() => rollup.emitNotice(42 as never)).toThrow(TypeError);
        rollup.close();
    });
});
