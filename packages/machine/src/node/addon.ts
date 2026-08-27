import { chmodSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import nodeGypBuild from "node-gyp-build";

import type { NativeAddon } from "../native.js";

// -----------------------------------------------------------------------------
// Native addon loading
// -----------------------------------------------------------------------------

// Package root: walk up from this file (dist/ when bundled, src/node/ when
// executed from sources) until the directory containing binding.gyp.
const findPackageRoot = (dir: string): string => {
    let current = dir;
    while (true) {
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
const packageRoot = findPackageRoot(__dirname);

/**
 * Prebuilt binaries ship in per-platform packages (esbuild-style), declared
 * as optionalDependencies of the published @cartesi/machine so only the matching
 * one is installed.
 */
const platformPackage = `@cartesi/machine-${process.platform}-${process.arch}`;

// works in both output formats (require is not defined in the ESM bundle)
const require_ = createRequire(join(__dirname, "index.js"));

const loadAddon = (): NativeAddon => {
    // A local build wins: node-gyp-build resolves build/ (and prebuilds/)
    // under the package root, present when the addon was compiled from source
    // (repo checkout, or the install-time fallback compile).
    try {
        return nodeGypBuild(packageRoot) as NativeAddon;
    } catch (buildError) {
        // Published installs resolve the platform-specific prebuilt package,
        // whose main is the addon itself.
        try {
            return require_(platformPackage) as NativeAddon;
        } catch {
            throw new Error(
                `@cartesi/machine: no native binding available; expected the ${platformPackage} package (unsupported platform?) or a source build (requires an installed cartesi-machine emulator distribution)`,
                { cause: buildError },
            );
        }
    }
};

export const addon = loadAddon();

// -----------------------------------------------------------------------------
// Bundled JSON-RPC server binary
// -----------------------------------------------------------------------------

/**
 * cm_jsonrpc_spawn_server() launches the executable named by the
 * CARTESI_JSONRPC_MACHINE environment variable, falling back to
 * `cartesi-jsonrpc-machine` on the PATH. The prebuilt platform package
 * bundles the server executable; point the environment variable at it so
 * spawn works out of the box. Source builds rely on the emulator
 * installation the addon was linked against, whose server is on the PATH.
 */
export function ensureJsonrpcServerBinary(): void {
    if (process.env.CARTESI_JSONRPC_MACHINE) {
        return;
    }
    try {
        const platformPackageDir = dirname(
            require_.resolve(`${platformPackage}/package.json`),
        );
        const bundled = join(platformPackageDir, "cartesi-jsonrpc-machine");
        if (existsSync(bundled)) {
            try {
                // some installers do not preserve the executable bit
                chmodSync(bundled, 0o755);
            } catch {
                // best effort: spawn fails later with a clearer error
            }
            process.env.CARTESI_JSONRPC_MACHINE = bundled;
        }
    } catch {
        // platform package not installed:
        // cm_jsonrpc_spawn_server searches the PATH
    }
}
