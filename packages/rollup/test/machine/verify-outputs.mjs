// Verifies the outputs/reports produced by the cartesi-machine run against
// what test/machine/app.mjs is expected to emit for the inputs in fixtures.mjs.
// The outputs are decoded with @cartesi/codec, so this also checks that the
// blobs libcmt encoded in C match the rollups-contracts ABIs.
//
//   node test/machine/verify-outputs.mjs test/machine/work

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { decodeOutput } from "@cartesi/codec";
import { getAddress } from "viem";

import { ADVANCES, QUERY } from "./fixtures.mjs";

const dir = process.argv[2];
if (!dir) {
    console.error("usage: node verify-outputs.mjs <work-dir>");
    process.exit(1);
}

const read = (name) => fs.readFileSync(path.join(dir, name));

// The outputs of input %i, in emission order. The "%o" of the output pattern is
// the *global* output index across all accepted inputs (it was per-input before
// cartesi-machine 0.21), so resolve the files by listing and sorting on it
// instead of assuming where each input's numbering starts.
const outputsOf = (i) =>
    fs
        .readdirSync(dir)
        .map((name) => [name, new RegExp(`^input-${i}-output-(\\d+)\\.bin$`)])
        .map(([name, re]) => [name, re.exec(name)])
        .filter(([, match]) => match !== null)
        .sort(([, a], [, b]) => Number(a[1]) - Number(b[1]))
        .map(([name]) => read(name));

ADVANCES.forEach((advance, i) => {
    // app.mjs emits, in order: notice, voucher, report 0
    const [notice, voucher, ...rest] = outputsOf(i).map(decodeOutput);
    assert.equal(rest.length, 0, `input ${i}: unexpected extra outputs`);

    assert.equal(notice.type, "Notice", `input ${i}: output 0 is not a notice`);
    assert.deepEqual(
        Buffer.from(notice.payload),
        advance.payload,
        `input ${i}: notice payload mismatch`,
    );

    assert.equal(
        voucher.type,
        "Voucher",
        `input ${i}: output 1 is not a voucher`,
    );
    assert.equal(
        voucher.destination,
        getAddress(advance.msgSender),
        `input ${i}: voucher destination mismatch`,
    );
    assert.equal(
        voucher.value,
        advance.index,
        `input ${i}: voucher value mismatch`,
    );
    assert.deepEqual(
        Buffer.from(voucher.payload),
        advance.payload,
        `input ${i}: voucher payload mismatch`,
    );

    // the "%o" of the report pattern is still the per-input report index
    assert.equal(
        read(`input-${i}-report-0.bin`).toString(),
        `advance index=${advance.index} chainId=${advance.chainId}`,
        `input ${i}: report mismatch`,
    );
    console.log(`input ${i}: notice, voucher and report OK`);
});

assert.deepEqual(
    read("query-report-0.bin"),
    QUERY,
    "inspect: query report mismatch",
);
console.log("inspect: query report OK");

console.log("all machine outputs verified");
