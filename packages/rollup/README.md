# Cartesi Rollup

Node.js bindings for [libcmt](https://github.com/cartesi/machine-guest-tools/tree/main/sys-utils/libcmt), the Cartesi Machine guest rollup library. It lets Node.js applications running inside a Cartesi Machine process rollup inputs (advances and inspects) and emit vouchers, notices, reports and exceptions — without going through the rollup HTTP server.

The package is a Node-API native addon:

- On **riscv64** (inside the Cartesi Machine) it statically links the real libcmt, which talks to the machine emulator through the kernel driver.
- On **other architectures** (your development host) it compiles libcmt's _mock_ IO driver, which simulates inputs and outputs via files, driven by the `CMT_INPUTS` and `CMT_DEBUG` environment variables.

The right flavor is selected automatically by target architecture, so the same application code runs unchanged on the host and in the machine.

The API is **fully synchronous** on purpose: calls that wait on the emulator (`finish`, `gio`) yield the machine, which pauses the entire guest — including the Node.js event loop — so there is nothing to run concurrently while they wait. On the host mock they return immediately.

## Installation

```sh
npm install @cartesi/rollup@alpha
```

While in pre-release, the library is published under the `alpha` npm tag. The `@alpha` suffix is required: without it npm resolves the `latest` tag, which does not point to the version documented here.

Prebuilt addons are published for linux-x64, linux-arm64, linux-riscv64, darwin-x64 and darwin-arm64. On any other platform the addon is compiled from the libcmt sources shipped in the tarball, which requires a C/C++ toolchain and Python (node-gyp).

## Usage

```js
import { Rollup } from "@cartesi/rollup";

const rollup = new Rollup();
await rollup.run({
    advance(request, rollup) {
        // request: { chainId, appContract, msgSender, blockNumber,
        //            blockTimestamp, prevRandao, index, payload }
        rollup.emitNotice(request.payload);
        rollup.emitVoucher({
            destination: request.msgSender,
            value: 0n,
            payload: "0xdeadbeef",
        });
        return true; // accept (default); return false to reject
    },
    inspect(request, rollup) {
        rollup.emitReport(request.payload);
    },
});
```

Or drive the loop yourself:

```js
const rollup = new Rollup();
let accept = true;
for (;;) {
    const request = rollup.finish({ accept });
    accept = handle(request); // your logic
}
```

Byte arguments accept `Buffer`, `Uint8Array` or 0x-prefixed hex strings. Addresses are returned as 0x-hex strings, payloads as `Buffer`, and numeric fields as `bigint`.

The JavaScript half of the binding is written in TypeScript (`src/*.ts`) and bundled with [tsdown](https://tsdown.dev) into `dist/`: an ESM entry point (`dist/index.js`), a CommonJS one (`dist/index.cjs`) and the type declarations for both, all generated from the same sources. So `const { Rollup } = require("@cartesi/rollup")` works too, and both entry points load the same native addon instance (the `.node` file goes through `require` either way, so Node's module cache keeps it a singleton).

### API

| Method                                            | Description                                                                                                          |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `new Rollup()`                                     | Opens the rollup device. Only **one** instance may be open at a time (`-EBUSY` otherwise); `close()` the previous one first. |
| `finish({ accept })`                               | Accepts/rejects the previous request, yields, and returns the next `{ type: 'advance' \| 'inspect', payload, ... }`.  |
| `emitVoucher({ destination, value, payload })`     | Emits `Voucher(address,uint256,bytes)`. Returns the output index.                                                    |
| `emitDelegateCallVoucher({ destination, payload })`| Emits `DelegateCallVoucher(address,bytes)`. Returns the output index.                                                |
| `emitNotice(payload)`                              | Emits `Notice(bytes)`. Returns the output index.                                                                     |
| `emitReport(payload)`                              | Emits a report (raw bytes, not in the outputs merkle tree).                                                          |
| `emitException(payload)`                           | Signals that the request could not be processed.                                                                     |
| `progress(value)`                                  | Reports progress (raw uint32).                                                                                       |
| `gio({ domain, id })`                              | Generic IO request; returns `{ responseCode, responseData }`.                                                        |
| `saveMerkle(file)` / `loadMerkle(file)` / `resetMerkle()` | Persist/restore/reset the outputs merkle tree.                                                                |
| `close()`                                          | Releases the device.                                                                                                 |
| `run({ advance, inspect })`                        | Convenience loop over `finish`; handlers may be async. Handler exceptions reject the input and are emitted as reports. |

Failed libcmt calls throw a `RollupError` with the negative errno in `error.errno` and the failed call in `error.syscall`.

The blobs this package emits and receives are the same ones [`@cartesi/codec`](../codec) encodes and decodes off-chain.

## Testing on the host (mock)

The mock injects inputs from files listed in `CMT_INPUTS` and writes outputs to files named after the input:

```sh
CMT_INPUTS="0:advance.bin,1:inspect.bin" node my-app.js
# -> advance.output-0.bin, advance.report-0.bin, ...
```

Reason `0` is advance (EVM-ABI encoded `EvmAdvance`), `1` is inspect (raw payload); any other reason is a gio reply with that response code. Set `CMT_DEBUG=yes` for verbose logging. See the [libcmt README](https://github.com/cartesi/machine-guest-tools/tree/main/sys-utils/libcmt#testing) for how to generate inputs with foundry's `cast`, or `__tests__/rollup.test.ts` here for a pure-JS encoder.

## Testing inside a Cartesi Machine

`test/machine/run.sh` tests the real riscv64 build end-to-end: it cross-builds the linux-riscv64 prebuild in Docker (mirroring CI), assembles a riscv64 Debian rootfs with Node.js and the packed package, boots it with [cartesi-machine](https://github.com/cartesi/machine-emulator), feeds ABI-encoded advance inputs and an inspect query via `--cmio-advance-state`/`--cmio-inspect-state`, and verifies the emitted outputs byte-for-byte. Requires Docker (with riscv64 emulation) and the `cartesi-machine` CLI (or set `CARTESI_MACHINE` to run it from the `cartesi/machine-emulator` docker image). Set `SKIP_PREBUILD=1`/`SKIP_ROOTFS=1` to reuse artifacts from a previous run. CI runs this in the `machine` workflow, on demand and weekly.

## Building

libcmt sources are expected at `deps/machine-guest-tools`, a git submodule of this repository, so a plain `pnpm install` at the repository root needs it checked out:

```sh
git submodule update --init   # fetch libcmt sources
pnpm install                  # uses a prebuild when available, otherwise compiles
pnpm --filter @cartesi/rollup build   # bundle the TypeScript half into dist/
pnpm --filter @cartesi/rollup test    # builds, then runs the suite against the mock
```

Override the libcmt location with `LIBCMT_DIR=/path/to/sys-utils/libcmt` (must resolve inside the package directory tree for gyp).

`build` only bundles the TypeScript sources; the native addon is compiled at install time by `node-gyp-build`. To recompile it explicitly use `pnpm --filter @cartesi/rollup build:native` (`node-gyp rebuild`).

On riscv64 the addon does not compile libcmt; it links the static library installed by the machine-guest-tools `.deb` (`-l:libcmt.a`, headers from `/usr/include/libcmt`). Override with `LIBCMT_LIB=/path/to/libcmt.a`.

### Prebuilds

`pnpm --filter @cartesi/rollup prebuild:native` produces `prebuilds/<platform>-<arch>/` via prebuildify; `node-gyp-build` picks them up at install time so consumers need no toolchain. Cross-building the riscv64 prebuild requires the riscv64 cross toolchain and a libcmt cross-built from the submodule (`make -C deps/machine-guest-tools/sys-utils/libcmt libcmt TOOLCHAIN_PREFIX=riscv64-linux-gnu-`); since libcmt 0.18.0 bundles the `cmio` ioctl ABI, the Cartesi Linux headers are no longer needed. See [`.github/workflows/release.yaml`](../../.github/workflows/release.yaml).

The release workflow builds the prebuilds for every supported platform and collects them into the package before `changeset publish` packs it, so a published version always ships them. A prebuild failure blocks the release.

## License

Licensed under [Apache 2.0](https://www.apache.org/licenses/LICENSE-2.0) — see the [LICENSE](../../LICENSE) file at the repository root. The vendored libcmt sources are Apache 2.0 as well, from [machine-guest-tools](https://github.com/cartesi/machine-guest-tools).
