# @cartesi/machine

Node.js bindings for the [Cartesi Machine](https://github.com/cartesi/machine-emulator) emulator.

The package is a native N-API addon linked against the static libraries (`libcartesi.a`, `libcartesi_jsonrpc.a`) of the official [machine-emulator](https://github.com/cartesi/machine-emulator) distribution. Prebuilt platform packages also bundle the distribution's `cartesi-jsonrpc-machine` server executable, which `spawn()` uses automatically (override with the `CARTESI_JSONRPC_MACHINE` environment variable).

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

### slirp

The official `libcartesi.a` is built with libslirp support (virtio net-user networking). By default the addon stubs those symbols out, so it has no libslirp dependency and machines configured with a `net-user` virtio device fail at runtime. Build with `CARTESI_SLIRP=yes` to link the real libslirp instead.

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

## Scripts

```shell
pnpm build             # bundle the TypeScript layer (tsdown)
pnpm build:native      # rebuild the native addon (node-gyp rebuild)
pnpm package:platform  # assemble npm/<platform>-<arch> prebuilt package
pnpm test              # vitest
```

The native build links against an installed emulator distribution (see build requirements above), and so do the tests — they create machines and spawn JSON-RPC servers, so they only run where the addon could be built.

## License

Licensed under [Apache-2.0](../../LICENSE). The machine-emulator static libraries the addon links against are licensed under LGPL-3.0-or-later; their source is available at [cartesi/machine-emulator](https://github.com/cartesi/machine-emulator), and the addon source shipped in this package allows relinking against a modified version. The per-platform packages, which bundle emulator binaries, are published as `(Apache-2.0 AND LGPL-3.0-or-later)`.
