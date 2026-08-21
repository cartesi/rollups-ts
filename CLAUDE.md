# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository overview

pnpm + Turborepo monorepo of Cartesi Rollups TypeScript libraries. Requires Node >= 22 and pnpm (see `packageManager` in package.json). Shared dependency versions are pinned in the `catalog:` section of `pnpm-workspace.yaml`.

`@cartesi/rollup` is a native addon whose libcmt sources come from the `packages/rollup/deps/machine-guest-tools` git submodule, and its `install` script compiles that addon. So a clone needs `git submodule update --init` before `pnpm install`, and CI checkouts need `submodules: recursive`.

## Commands

- `pnpm build` — build all packages (turbo; for client/react this runs codegen first, see below)
- `pnpm dev` — watch mode (tsdown --watch) across packages
- `pnpm lint` — `biome check` in each package
- `pnpm check-types` — TypeScript type checking
- `pnpm lint:licenses` — dependency licence gate (`scripts/audit-licenses.mjs`). Resolves every coordinate pinned in `pnpm-lock.yaml` at its **locked** version, not the registry's `latest`, and enforces `.license-policy.json`. Licences are read from `node_modules/.pnpm` where they are on disk; the ~180 optional dependencies pnpm skips as platform-incompatible (`@esbuild/*`, `@rollup/*`, …) are fetched from the registry, since no single-platform install can provide them. Anything missing that pnpm did *not* skip is treated as a broken install and fails hard rather than being resolved from the network. Exit codes: 0 clean, 1 policy violation, 2 unresolved, 3 bad policy file. `node scripts/render-license-report.mjs` renders the emitted JSON as a browsable HTML report. CI runs it in `.github/workflows/license-check.yaml`
- Tests (`@cartesi/client`, `@cartesi/codec`, `@cartesi/machine`, `@cartesi/react` and `@cartesi/rollup` have tests, via vitest):
  - `pnpm test` — run every suite once (turbo `test:run`, restricted to `packages/*`; builds each package's prerequisites first)
  - `pnpm test:coverage` — the same, with coverage
  - `pnpm --filter @cartesi/client test` — watch mode
  - `pnpm --filter @cartesi/client test:coverage` — single run with coverage
  - Single test: `pnpm --filter @cartesi/client exec vitest run __tests__/converter.test.ts`
  - Every suite runs against `src`. In the two native packages (`@cartesi/machine`, `@cartesi/rollup`) that still needs the addon compiled, which `pnpm i` does; the C/C++ sources live in `native/`, outside the TypeScript `src/` the coverage globs point at
  - `@cartesi/machine`'s suite needs an installed cartesi-machine emulator distribution (its addon links against it and the tests spawn its JSON-RPC server); without one `pnpm i` skips the native build and the suite fails to load
  - CI (`.github/workflows/ci.yaml`) runs all of it on every PR, on linux x64/arm64 and darwin arm64. Two platforms the release workflow prebuilds for are deliberately not covered: darwin-x64 (no Intel macOS runner) and riscv64, whose end-to-end test runs under emulation in the `machine` workflow.
- Releases use changesets: `pnpm changeset` to add one; versioning/publishing is `pnpm version-packages` / `pnpm release`. Packages are currently on 2.0.0-alpha prereleases.

Formatting/linting is Biome (`biome.json` at root): 4-space indent, double quotes. All packages are ESM (`"type": "module"`) and use `.js` extensions on relative imports (NodeNext resolution). Builds are done with tsdown, emitting dual ESM/CJS to `dist/`.

## Architecture

Dependency chain: `@cartesi/rpc` → `@cartesi/client` → `@cartesi/react`, with `@cartesi/wagmi-plugin` supporting codegen.

- **packages/rpc (`@cartesi/rpc`)** — Typed JSON-RPC client for the Cartesi node API. `types.ts` and `methods.ts` are hand-written mirrors of the node's `cartesi_*` JSON-RPC methods. Wire types are raw: hex-string quantities and snake_case field names.

- **packages/client (`@cartesi/client`)** — viem extension, structured like viem itself:
  - `src/actions/` — one file per action. **L2 actions** (getInput, listOutputs, waitForInput, …) call `cartesi_*` RPC methods on a Cartesi node through a viem transport. L1 contract interactions are done with plain viem contract actions using the generated ABIs/addresses exported via the `@cartesi/client/abi` entrypoint (plus the `toOutputArgs` output-conversion helper).
  - `src/types/converter.ts` — converts raw RPC wire types (hex/snake_case, from `@cartesi/rpc`) into friendly types (bigint/camelCase, defined in `src/types/actions.ts` and `src/types/output.ts`). New RPC-backed actions follow this pattern: request with raw params, convert the response.
  - `src/decorators/` — `publicActionsL2` (Cartesi node RPC schema + actions); `src/clients/createCartesiPublicClient.ts` creates a viem client bound to the Cartesi RPC schema.
  - `src/rollups.ts` is **generated** — do not edit by hand (see Codegen).

- **packages/react (`@cartesi/react`)** — React hooks. `src/publicL2/` wraps each viem L2 action in a TanStack Query hook (`useInput`, `useOutputs`, …), using the `CartesiPublicClient` from `provider.tsx` (`CartesiProvider` / `useCartesiClient`). `src/generated.ts` is **generated** contract hooks.

- **packages/codec (`@cartesi/codec`)** — isomorphic encode/decode of input and output blobs, which are ABI-encoded calls to the rollups contracts `Inputs` (`EvmAdvance`) and `Outputs` (`Notice`, `Voucher`, `DelegateCallVoucher`) interfaces, and of portal deposit payloads (`src/portal.ts`), which are packed-encoded per the rollups contracts `InputEncoding` library. `src/rollups.ts` is **generated** (see Codegen); depends only on viem (peer) and abitype.

- **packages/rollup (`@cartesi/rollup`)** — Node-API native addon over [libcmt](https://github.com/cartesi/machine-guest-tools/tree/main/sys-utils/libcmt), the guest rollup library, for applications running *inside* a Cartesi Machine (the guest side of what `@cartesi/codec` encodes off-chain). Imported from `@deroll/cmio`. The C++ half is `native/addon.cc` (raw N-API surface, exact-length Buffers, errno-carrying errors); the TypeScript half wraps it in the `Rollup` class (`src/rollup.ts`), coercing bytes/addresses/u256 in `src/convert.ts` and normalizing libcmt failures into `RollupError` in `src/errors.ts`. `binding.gyp` selects the flavor by target arch: on riscv64 it links the real libcmt (`-l:libcmt.a`, override with `LIBCMT_LIB`), everywhere else it compiles libcmt's mock IO driver from the submodule into the addon (`LIBCMT_DIR`). The API is synchronous on purpose — `finish`/`gio` yield the machine, pausing the whole guest. Prebuilds for linux-x64/arm64/riscv64 and darwin-x64/arm64 are built by the release workflow and collected into the package before it is packed; `test/machine/` is an end-to-end test of the riscv64 build inside a real Cartesi Machine, run by the `machine` workflow.

- **packages/wagmi-plugin (`@cartesi/wagmi-plugin`)** — the `rollupsContracts` `@wagmi/cli` plugin, which downloads a rollups-contracts release (build artifacts + deployment addresses tarballs, hash-verified) and emits contracts with ABIs and addresses (single address when identical across chains, per-chain otherwise). The tarballs are downloaded and extracted to a throwaway temp dir on each run, and nothing is cached between runs — they are a few hundred KB. `artifacts`/`deployments` default to the release pinned by `DEFAULT_VERSION` in `src/plugin.ts`. Supports `include`/`exclude` by contract name (or regex), applied to all contracts alike: when neither is given all contracts in the artifacts are included, `include` narrows the set, and `exclude` is applied after `include`.

- **apps/docs** — vocs documentation site (`pnpm --filter @cartesi/docs dev`).

### Codegen (client, react and codec packages)

`pnpm build` in these packages runs `codegen` (= `wagmi generate`) before compiling. Each package's `wagmi.config.ts` uses the `rollupsContracts` plugin from `@cartesi/wagmi-plugin` to produce `src/rollups.ts` (client, codec) / `src/generated.ts` (react) straight from the pinned rollups-contracts release tarballs, which are downloaded on each run.

Both packages use the plugin's default `artifacts`/`deployments`. To bump the rollups-contracts version, update `DEFAULT_VERSION` and the SHA-256 hashes in `packages/wagmi-plugin/src/plugin.ts`.
