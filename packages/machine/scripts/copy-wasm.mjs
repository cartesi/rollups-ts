#!/usr/bin/env node
// Places the Emscripten module where the built bundles expect it.
//
// src/wasm/module.ts imports the module with a relative specifier that tsdown
// keeps (it is external) but rewrites to stay relative to whichever output
// file ends up holding it — an entry point or a shared chunk. So the
// destinations are read back out of the built files rather than assumed.
// Running from sources needs no copy: there the specifier resolves to
// src/wasm/ directly.
//
// A checkout that has not run `pnpm build:wasm` still builds — only the
// browser entry point needs the module, and it reports the miss when loaded.
// A release cannot be that lenient: the module ships inside the tarball, so a
// publish sets CARTESI_REQUIRE_WASM and the miss becomes an error instead.
import {
    copyFileSync,
    existsSync,
    mkdirSync,
    readFileSync,
    readdirSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const source = join(root, "src", "wasm", "cartesi-machine.mjs");
const dist = join(root, "dist");

const required = /^(1|true|yes)$/i.test(process.env.CARTESI_REQUIRE_WASM ?? "");

if (!existsSync(source)) {
    if (required) {
        throw new Error(
            `${source} is missing and CARTESI_REQUIRE_WASM is set: this build ` +
                "would produce a package without its WebAssembly module. Run " +
                "`pnpm build:wasm`, or restore the module from the release " +
                "workflow's machine-wasm artifact.",
        );
    }
    console.warn(
        "@cartesi/machine: no WebAssembly module to bundle " +
            "(run `pnpm build:wasm` to build one); the Node build is unaffected",
    );
    process.exit(0);
}

const IMPORT =
    /(?:import|require)\(\s*["'`](\.[^"'`]*cartesi-machine\.mjs)["'`]\s*\)/g;

const scripts = readdirSync(dist, { recursive: true, encoding: "utf8" }).filter(
    (entry) => entry.endsWith(".js") || entry.endsWith(".cjs"),
);

const targets = new Set();
for (const script of scripts) {
    const file = join(dist, script);
    for (const [, specifier] of readFileSync(file, "utf8").matchAll(IMPORT)) {
        targets.add(resolve(dirname(file), specifier));
    }
}

if (targets.size === 0) {
    throw new Error(
        `no import of the WebAssembly module found under ${dist}: the bundler ` +
            "either inlined it or renamed it, and this copy would be silently unused",
    );
}

for (const target of targets) {
    mkdirSync(dirname(target), { recursive: true });
    copyFileSync(source, target);
}
