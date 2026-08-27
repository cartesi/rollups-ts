# @cartesi/machine

Bindings for the [Cartesi Machine](https://github.com/cartesi/machine-emulator) emulator, in Node and in the browser.

There are three ways to reach a machine, all of them the same API:

| | how | where |
| --- | --- | --- |
| `@cartesi/machine` | N-API addon, linked against the emulator distribution | Node |
| `@cartesi/machine/wasm` | libcartesi compiled to WebAssembly | browsers, Node, Deno, workers |
| `connectHttp()` | JSON-RPC over fetch, to a `cartesi-jsonrpc-machine` server | anywhere with fetch |

The Node binding is a native N-API addon linked against the static libraries (`libcartesi.a`, `libcartesi_jsonrpc.a`) of the official [machine-emulator](https://github.com/cartesi/machine-emulator) distribution. Prebuilt platform packages also bundle the distribution's `cartesi-jsonrpc-machine` server executable, which `spawn()` uses automatically (override with the `CARTESI_JSONRPC_MACHINE` environment variable).

This is the host side of the Cartesi Machine: it creates, runs, snapshots and inspects machines. The guest side — the rollup API available to an application running *inside* a machine — is [`@cartesi/rollup`](../rollup).

## Prebuilt platform packages

Published releases ship prebuilt binaries as per-platform packages (`@cartesi/machine-linux-x64`, `@cartesi/machine-linux-arm64`, `@cartesi/machine-darwin-x64`, `@cartesi/machine-darwin-arm64`), declared as `optionalDependencies` so the package manager installs only the one matching the host. Each contains the N-API addon **and** the `cartesi-jsonrpc-machine` server executable, so `spawn()` works without any toolchain. Resolution order at runtime: a local source build (`build/Release`) wins, then the platform package, and the server binary falls back to the `PATH`.

The `optionalDependencies` are injected at publish time (`scripts/inject-platform-deps.mjs`); the platform packages are assembled per-platform in CI (`scripts/package-platform.mjs`) and published by `scripts/publish-platform-packages.mjs` right before `@cartesi/machine` itself.

## Build requirements

On platforms without a prebuilt package, the install script compiles the addon from source, which requires:

- a C++ compiler and the usual node-gyp toolchain;
- an installed cartesi-machine emulator **0.21.x** distribution providing the C API headers and static libraries: the `machine-emulator` `.deb` from the [official releases](https://github.com/cartesi/machine-emulator/releases) on Debian/Ubuntu, or `brew install cartesi/tap/cartesi-machine-emulator` on macOS. Non-standard locations can be pointed at with the `CARTESI_INC` / `CARTESI_LIB` environment variables.

When no usable emulator installation is found, the install prints a warning and **skips** the native build instead of failing. That matters in this monorepo: contributors working on the other packages, and CI jobs that only build the docs, must be able to run `pnpm install` without the emulator. Loading the binding without it fails at `require()` time with a clear error.

Linking against the official static libraries (instead of compiling the emulator from source) keeps the binding independent of the emulator's build system, and means the consensus-relevant bits (uarch pristine state, hash tree) are exactly the official release's.

### Networking

A machine can have a VirtIO network device, which puts the guest behind libslirp's user-mode NAT — no privileges, no host configuration:

```ts
import { create, hostfwd, NET_INIT } from "@cartesi/machine";

const machine = create({
    // packets and their timing are not part of the machine state, so a
    // machine that has a network is an unreproducible one
    processor: { registers: { iunrep: 1 } },
    ram: { length: 0x10000000, backing_store: { data_filename: "linux.bin" } },
    flash_drive: [{ backing_store: { data_filename: "rootfs.ext2" } }],
    dtb: {
        // brings eth0 up on 10.0.2.15 and points DNS at 10.0.2.3
        init: NET_INIT,
        entrypoint: "curl -sI http://example.com",
    },
    virtio: [
        {
            type: "net-user",
            // the only way in: the guest is behind a NAT
            hostfwd: [hostfwd({ hostPort: 8080, guestPort: 80 })],
        },
    ],
});
```

The addresses are libslirp's and fixed (`NET_USER`): the guest is 10.0.2.15 on 10.0.2.0/24, the host is the gateway at 10.0.2.2, and 10.0.2.3 answers DNS.

**libslirp is loaded on demand.** The official `libcartesi.a` references it, but the addon defines those symbols itself and `dlopen`s the real library the first time a `net-user` device is created (`native/slirp-forward.cc`). So the package has no libslirp dependency — prebuilds included — until something asks for networking, and then it works with no rebuild as long as the library is installed:

- Debian/Ubuntu: `apt install libslirp0`
- macOS: `brew install libslirp`
- elsewhere, or for a copy the loader would not find: point `CARTESI_SLIRP_LIB` at the shared library.

`getSlirpVersion()` returns libslirp's version, or `null` when it cannot be loaded — in which case creating a machine with a `net-user` device throws a `MachineError` saying so. `CARTESI_SLIRP=yes` at build time links the library directly instead, which is what a static or vendored libslirp wants.

The other backend, `net-tuntap`, needs a host TUN/TAP interface and is Linux-only. The WebAssembly build has neither: `getSlirpVersion()` is `null` there and both device types are refused by the emulator itself.

## Usage

```ts
import { create, rollups, spawn } from "@cartesi/machine";

// local machine
const machine = create({ ram: { length: 0x4000000 } });
machine.run(1000n);

// remote machine (spawns the bundled cartesi-jsonrpc-machine server)
const remote = spawn();
remote.load("path/to/snapshot");

// rollups machine
const app = rollups("path/to/snapshot");
const { outputs, reports } = app.advance(input, { collect: true });
```

## In the browser

The WebAssembly build is the same TypeScript layer over the same emulator, compiled by Emscripten instead of linked (see [wasm/](wasm)). Machines it runs are the same machines: identical root hashes, proofs and access logs, at roughly the speed of the native build.

Bundlers resolve it through the `browser` condition; ask for it explicitly with `@cartesi/machine/wasm`. The module is instantiated asynchronously, so the constructors come from `init()`; everything after that is the same synchronous API.

```ts
import { init } from "@cartesi/machine/wasm";

const cartesi = await init();
const machine = cartesi.create({ ram: { length: 0x4000000 } });
machine.run(1000n);
```

A stored machine reaches the browser as bytes rather than a path — a tar of the directory `store()` writes, which `tar -cf` produces and reads:

```ts
const snapshot = await fetch("/app.tar").then((r) => r.arrayBuffer());
cartesi.writeSnapshot("/machines/app", new Uint8Array(snapshot));

const app = rollups(cartesi.load("/machines/app"));
const { outputs } = app.advance(input, { collect: true });
```

Rollups machines roll back a rejected input by storing a snapshot before each one, since there is no server to fork here; `noRollback: true` skips that copy when it is not needed.

### In a worker

`run()` occupies the thread it is called on, so a page that stays responsive runs the module in a worker. The client mirrors the API one thread over, with the same names and arguments:

```ts
import { connectWorker } from "@cartesi/machine/wasm";

const worker = new Worker(new URL("@cartesi/machine/worker", import.meta.url), {
    type: "module",
});
const cartesi = connectWorker(worker);

const machine = await cartesi.create({ ram: { length: 0x4000000 } });
await machine.run(1000n);
```

Machines stay in the worker and are addressed by handle, so passing one to `cartesi.rollups(machine)` works; call `machine.release()` when done with one, since each holds its memory ranges in the module's heap.

The three entry points into a machine are named for how they get there: `connect()` (Node, a machine server over the native client), `connectWorker()` (a module in a worker), and `connectHttp()` (a machine server over fetch).

### Driving a server instead

Nothing has to run in the page at all: `cartesi-jsonrpc-machine` answers JSON-RPC over HTTP with `Access-Control-Allow-Origin`, so a page can drive a machine on a server with only fetch.

```ts
import { connectHttp } from "@cartesi/machine";

const machine = connectHttp("http://127.0.0.1:8080");
await machine.load("/machines/app");
await machine.run();
```

## Building the WebAssembly module

`wasm/builder.Dockerfile` pins the Emscripten toolchain next to the emulator release and produces `src/wasm/cartesi-machine.mjs`, which the published package ships in `dist/`. The build lives in this repository — the tarball carries the module, not the means to rebuild it:

```shell
pnpm build:wasm                                  # docker, pinned toolchain
CARTESI_WASM_PREFIX=/path/to/prefix pnpm build:wasm   # local emsdk, for iterating
```

Three build settings are load-bearing, and the module misbehaves in specific ways without them: `-fwasm-exceptions` (libcartesi catches its own exceptions at the C API boundary, and Emscripten does not catch by default), `-DNO_MMAP` (MEMFS has no shared file mappings, so loading a stored machine fails), and `threads=no` (OpenMP is used only for parallel hash tree updates). `slirp=no` drops virtio net-user networking, as the addon does by default.

The WebAssembly build has no `spawn()` and no `connect()`: both need a process and sockets. Use `connectHttp()` for a machine in a server.

## Scripts

```shell
pnpm build             # bundle the TypeScript layer (tsdown)
pnpm build:native      # rebuild the native addon (node-gyp rebuild)
pnpm build:wasm        # build the emscripten module (docker)
pnpm package:platform  # assemble npm/<platform>-<arch> prebuilt package
pnpm test              # vitest, minus the WebAssembly suites
pnpm test:wasm         # only those: they need the module, but no emulator
```

The native build links against an installed emulator distribution (see build requirements above), and so do the tests — they create machines and spawn JSON-RPC servers, so they only run where the addon could be built.

## License

Licensed under [Apache-2.0](../../LICENSE). The machine-emulator static libraries the addon links against are licensed under LGPL-3.0-or-later; their source is available at [cartesi/machine-emulator](https://github.com/cartesi/machine-emulator), and the addon source shipped in this package allows relinking against a modified version. The per-platform packages, which bundle emulator binaries, are published as `(Apache-2.0 AND LGPL-3.0-or-later)`.
