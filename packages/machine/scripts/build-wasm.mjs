#!/usr/bin/env node
// Produces src/wasm/cartesi-machine.mjs, the Emscripten module the browser
// binding drives. Two ways to get there:
//
//   pnpm build:wasm
//       builds wasm/builder.Dockerfile, which pins both the Emscripten
//       toolchain and the emulator release. This is what CI and releases use.
//
//   CARTESI_WASM_PREFIX=/path/to/prefix pnpm build:wasm
//       links against a wasm libcartesi already installed at that prefix,
//       using the Emscripten toolchain on the PATH. For iterating on the
//       module without a ~10 minute emulator rebuild each time.
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const wasmDir = join(root, "wasm");
const outDir = join(root, "src", "wasm");
const output = join(outDir, "cartesi-machine.mjs");

const run = (command, args, options = {}) =>
    execFileSync(command, args, { stdio: "inherit", ...options });

mkdirSync(outDir, { recursive: true });

const prefix = process.env.CARTESI_WASM_PREFIX;
if (prefix) {
    run("make", ["-C", wasmDir, `PREFIX=${prefix}`]);
    copyFileSync(join(wasmDir, "build", "cartesi-machine.mjs"), output);
} else {
    // buildx writes the artifact stage straight into src/wasm, so nothing has
    // to be copied out of a container afterwards
    run("docker", [
        "buildx",
        "build",
        "--file",
        join(wasmDir, "builder.Dockerfile"),
        "--target",
        "artifact",
        "--output",
        `type=local,dest=${outDir}`,
        wasmDir,
    ]);
}

const { size } = statSync(output);
console.log(`${output} (${(size / 1024 / 1024).toFixed(1)} MB)`);
