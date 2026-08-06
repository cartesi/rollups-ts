// Writes the cmio input/query binaries consumed by cartesi-machine
// (--cmio-advance-state / --cmio-inspect-state) into the given directory.
//
//   node test/machine/encode-inputs.mjs test/machine/work

import fs from "node:fs";
import path from "node:path";

import { encodeInput } from "@cartesi/codec";

import { ADVANCES, QUERY } from "./fixtures.mjs";

const dir = process.argv[2];
if (!dir) {
    console.error("usage: node encode-inputs.mjs <output-dir>");
    process.exit(1);
}

ADVANCES.forEach((advance, i) => {
    const file = path.join(dir, `input-${i}.bin`);
    fs.writeFileSync(file, encodeInput(advance, "bytes"));
    console.log(`wrote ${file} (${advance.payload.length}-byte payload)`);
});

const queryFile = path.join(dir, "query.bin");
fs.writeFileSync(queryFile, QUERY);
console.log(`wrote ${queryFile}`);
