# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository overview

pnpm + Turborepo monorepo of Cartesi Rollups TypeScript libraries. Requires Node >= 22 and pnpm (see `packageManager` in package.json). Shared dependency versions are pinned in the `catalog:` section of `pnpm-workspace.yaml`.

## Commands

- `pnpm build` — build all packages (turbo; for viem/wagmi this runs codegen first, see below)
- `pnpm dev` — watch mode (tsdown --watch) across packages
- `pnpm lint` — `biome check` in each package
- `pnpm check-types` — TypeScript type checking
- Tests (only `@cartesi/viem` has tests, via vitest):
  - `pnpm --filter @cartesi/viem test` — watch mode
  - `pnpm --filter @cartesi/viem test:coverage` — single run with coverage
  - Single test: `pnpm --filter @cartesi/viem exec vitest run __tests__/converter.test.ts`
- Releases use changesets: `pnpm changeset` to add one; versioning/publishing is `pnpm version-packages` / `pnpm release`. Packages are currently on 2.0.0-alpha prereleases.

Formatting/linting is Biome (`biome.json` at root): 4-space indent, double quotes. All packages are ESM (`"type": "module"`) and use `.js` extensions on relative imports (NodeNext resolution). Builds are done with tsdown, emitting dual ESM/CJS to `dist/`.

## Architecture

Dependency chain: `@cartesi/rpc` → `@cartesi/viem` → `@cartesi/wagmi`, with `@cartesi/wagmi-plugin` supporting codegen.

- **packages/rpc (`@cartesi/rpc`)** — Typed JSON-RPC client for the Cartesi node API. `types.ts` and `methods.ts` are hand-written mirrors of the node's `cartesi_*` JSON-RPC methods. Wire types are raw: hex-string quantities and snake_case field names.

- **packages/viem (`@cartesi/viem`)** — viem extension, structured like viem itself:
  - `src/actions/` — one file per action. **L2 actions** (getInput, listOutputs, waitForInput, …) call `cartesi_*` RPC methods on a Cartesi node through a viem transport. L1 contract interactions are done with plain viem contract actions using the generated ABIs/addresses exported via the `@cartesi/viem/abi` entrypoint (plus the `toOutputArgs` output-conversion helper).
  - `src/types/converter.ts` — converts raw RPC wire types (hex/snake_case, from `@cartesi/rpc`) into friendly types (bigint/camelCase, defined in `src/types/actions.ts` and `src/types/output.ts`). New RPC-backed actions follow this pattern: request with raw params, convert the response.
  - `src/decorators/` — `publicActionsL2` (Cartesi node RPC schema + actions); `src/clients/createCartesiPublicClient.ts` creates a viem client bound to the Cartesi RPC schema.
  - `src/rollups.ts` is **generated** — do not edit by hand (see Codegen).

- **packages/wagmi (`@cartesi/wagmi`)** — React hooks. `src/publicL2/` wraps each viem L2 action in a TanStack Query hook (`useInput`, `useOutputs`, …), using the `CartesiPublicClient` from `provider.tsx` (`CartesiProvider` / `useCartesiClient`). `src/generated.ts` is **generated** contract hooks.

- **packages/wagmi-plugin (`@cartesi/wagmi-plugin`)** — the `rollupsContracts` `@wagmi/cli` plugin, which downloads a rollups-contracts release (build artifacts + deployment addresses tarballs, hash-verified) into the OS temp dir and emits contracts with ABIs and addresses (single address when identical across chains, per-chain otherwise). `artifacts`/`deployments` default to the release pinned by `DEFAULT_VERSION` in `src/plugin.ts`. Supports `include`/`exclude` by contract name; deployed contracts are always included unless excluded.

- **apps/docs** — vocs documentation site (`pnpm --filter @cartesi/docs dev`).

### Codegen (viem and wagmi packages)

`pnpm build` in these packages runs `codegen` (= `wagmi generate`) before compiling. Each package's `wagmi.config.ts` uses the `rollupsContracts` plugin from `@cartesi/wagmi-plugin` to produce `src/rollups.ts` (viem) / `src/generated.ts` (wagmi) straight from the pinned rollups-contracts release tarballs; downloads are cached in the OS temp dir.

Both packages use the plugin's default `artifacts`/`deployments`. To bump the rollups-contracts version, update `DEFAULT_VERSION` and the SHA-256 hashes in `packages/wagmi-plugin/src/plugin.ts`.
