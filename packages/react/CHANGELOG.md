# @cartesi/react

## 2.0.0-alpha.41

### Major Changes

- 2891af1: regenerate the contracts from rollups-contracts 3.0.0-alpha.10. Every deployment address changed, on the livenets and the devnet alike, so any address read from these packages must be taken again — `inputBoxAddress`, the portal addresses `decodeDeposit` dispatches on, and the factory addresses among them. No ABI changed, and `@cartesi/client` and `@cartesi/react` additionally generate the ERC-165, ERC-20, ERC-721 and ERC-1155 interfaces the release now publishes.

### Patch Changes

- Updated dependencies [2891af1]
  - @cartesi/client@2.0.0-alpha.37

## 2.0.0-alpha.40

### Major Changes

- 07e4357: Track the JSON-RPC API changes of rollups-node.
  
  New methods:
  
  - `cartesi_getEpochByVirtualIndex` — fetch an epoch by its dense insertion rank, exposed as `getEpochByVirtualIndex` / `useEpochByVirtualIndex`.
  - `cartesi_getExecutedOutputCount` and `cartesi_getPendingExecutableOutputCount`, exposed as `getExecutedOutputCount` / `useExecutedOutputCount` and `getPendingExecutableOutputCount` / `usePendingExecutableOutputCount`. The executed count is monotone and meant to be polled for change detection; the pending count is a gauge and is not.
  - `cartesi_getNodeInfo` — chain ID, node version and the node's default block tag in one call, exposed as `getNodeInfo` / `useNodeInfo`. It replaces `getChainId` and `getNodeVersion`, which the node deprecated and which are now marked `@deprecated`.
  
  New filters on the listing methods:
  
  - `from` and `to`, an inclusive index range, on `listEpochs`, `listInputs`, `listOutputs` and `listReports`.
  - `listEpochs` takes a list of statuses (`status?: EpochStatus | NonEmptyArray<EpochStatus>`), so unsettled epochs can be watched by filtering on the non-terminal ones.
  - `listOutputs` takes a list of output types (`outputType?: OutputType | NonEmptyArray<OutputType>`) and a new `executed?: boolean` filter. Because executions happen out of index order, `executed` must not be used to build a resume cursor keyed on the output index — poll `getExecutedOutputCount` instead.
  
  The node rejects an empty filter list with invalid params, so both list-valued filters use the new `NonEmptyArray` type exported by `@cartesi/rpc` (and re-exported by `@cartesi/client`): `status: []` and `outputType: []` are compile errors rather than failed requests.
  
  Input completion changes:
  
  - `InputStatus` lost its resource-limit members. The node collapsed `OUTPUTS_LIMIT_EXCEEDED`, `REPORTS_LIMIT_EXCEEDED`, `CYCLE_LIMIT_EXCEEDED`, `TIME_LIMIT_EXCEEDED` and `PAYLOAD_LENGTH_LIMIT_EXCEEDED` into the remaining outcomes, so the union is now `NONE | ACCEPTED | REJECTED | EXCEPTION | MACHINE_HALTED`. Code that switches on the removed members no longer compiles; `waitForInput` with `rejectErrors` now aborts on `EXCEPTION`, `MACHINE_HALTED` and `REJECTED`, which is every terminal status other than `ACCEPTED`.
  - `Input` gained `exceptionData: Hex | null` (`exception_data` on the wire), the raw guest-provided CMIO exception payload. It is non-null only when `status` is `EXCEPTION`, and an empty payload is `0x`. The bytes are passed through undecoded.
  
  Breaking changes:
  
  - `cartesi_getMatchAdvanced` was renamed to `cartesi_getMatchAdvance`, following the node. The `getMatchAdvanced` action is now `getMatchAdvance`, the `useMatchAdvanced` hook is now `useMatchAdvance` (with `matchAdvanceOptions` / `matchAdvanceQueryKey`), and `GetMatchAdvancedParams` / `GetMatchAdvancedReturnType` are now `GetMatchAdvanceParams` / `GetMatchAdvanceReturnType`.
  - The node's application-level error codes moved out of the JSON-RPC reserved range: application not found is now `-31002` (was `-32002`) and resource not found is now `-31001` (was `-32001`). `@cartesi/rpc` exports them as `errorCodes`, along with the new batch (`-32040`), timeout (`-32070`), response-size-limit (`-31003`) and batch-list-work (`-31004`) codes, plus the `maxBatchSize`, `maxBatchListWork` and `defaultListLimit` constants that bound a batch.

### Patch Changes

- e00fb19: ship the Apache-2.0 licence with the package: every tarball now carries `LICENSE` and `NOTICE`, and the packages that declared no `license` field (`client`, `codec`, `rpc`, `react`, `wagmi-plugin`) declare `Apache-2.0`
- Updated dependencies [e00fb19]
- Updated dependencies [07e4357]
  - @cartesi/client@2.0.0-alpha.36

## 2.0.0-alpha.39

### Major Changes

-   38f0751: upgrade the generated contracts to rollups-contracts 3.0.0-alpha.9

    -   deployment addresses changed for every contract on every chain
    -   `ERC` is now spelled `Erc` in contract names since 3.0.0-alpha.7, so the generated ABI, address and hook identifiers follow: `ISafeERC20Transfer` becomes `ISafeErc20Transfer`, and the portal deposit functions become `depositErc20Tokens`, `depositErc721Token`, `depositSingleErc1155Token` and `depositBatchErc1155Token` (`erc20PortalAbi` and friends keep their names)
    -   the `DataAvailability` library was removed from rollups-contracts in 3.0.0-alpha.7, so its ABI is no longer generated; `@cartesi/client` keeps decoding the node's `data_availability` field against a local copy of it, leaving the `Application.dataAvailability` shape unchanged
    -   the release artifacts are restricted to the contracts clients are expected to use, so `@cartesi/client` and `@cartesi/react` no longer curate a list of contracts to generate and now cover the whole set: `RefundOutputBuilder`, deployed as a core contract, and the devnet `TestFungibleToken`, `TestNonFungibleToken`, `TestMultiToken` and `TestUsdc` tokens join the previously generated contracts
    -   addresses now cover the local devnet (chain 31337) too, so the devnet-only contracts — the test tokens and `TestUsdWithdrawalOutputBuilder` — carry an address, and the core contracts keep their single collapsed address, since the devnet deploys them at the same addresses as the livenets

### Patch Changes

-   Updated dependencies [38f0751]
    -   @cartesi/client@2.0.0-alpha.35

## 2.0.0-alpha.38

### Minor Changes

-   1facfb5: Rename the package from `@cartesi/wagmi` to `@cartesi/react`. Update imports from `@cartesi/wagmi` to `@cartesi/react`; the exported hooks, providers, and query-key helpers are unchanged. The `@cartesi/wagmi-plugin` package (the `@wagmi/cli` plugin) is unaffected and keeps its name.

### Patch Changes

-   b4de9f1: bump dependencies
-   dfeccf7: Make the `params` argument optional for `useChainId` and `useNodeVersion`, so they can be called with no argument (`useChainId()` instead of `useChainId({})`). Both hooks only accept the optional query-options object, so the empty object was never required. The change is backward compatible.
-   Updated dependencies [b4de9f1]
-   Updated dependencies [e4cf760]
    -   @cartesi/client@2.0.0-alpha.34

## 2.0.0-alpha.37

### Minor Changes

-   284b85b: include the server URL in all publicL2 query keys. Every hook's react-query key is now prefixed with the client's node URL (`[serverUrl, method, params]`), so caches no longer collide when an app points at more than one Cartesi node (e.g. a server switcher). The URL comes from the client's transport (falling back to `client.uid` for custom transports without one), so the cache survives provider remounts and revives when switching back to a previously used server.

    Also exports a `*QueryKey(client, params)` constructor for every method (`inputQueryKey`, `epochQueryKey`, `outputsQueryKey`, …) alongside the `*Options` factories and the `serverUrl(client)` helper. These are the supported way to build keys for manual `queryClient` operations: they own the URL prefix and the bigint-to-string normalization the keys depend on, so callers no longer have to reproduce that (a hand-built `inputIndex: 5n` would silently fail to match the stored `"5"`). Each `*Options` factory now builds its key through the matching `*QueryKey`, so the two can never drift.

    **Breaking for consumers that build query keys by hand**: the key shape changed, so any manual `queryClient.invalidateQueries`/`removeQueries`/`setQueryData` call with a hardcoded key like `["input", ...]` must be rebuilt via the exported `*QueryKey`/`*Options` constructors (or the `serverUrl(client)` helper for coarse, server-wide invalidation like `invalidateQueries({ queryKey: [serverUrl(client)] })`). Hooks are unaffected.

### Patch Changes

-   45043f5: Add new cartesi_listInputs optional query parameter transaction_hash.
-   Updated dependencies [45043f5]
-   Updated dependencies [58f793a]
-   Updated dependencies [6b3cf3b]
    -   @cartesi/viem@2.0.0-alpha.33

## 2.0.0-alpha.36

### Patch Changes

-   ba44c32: migration from tsup to tsdown
-   ba44c32: bump dependencies
-   ba44c32: migration to typescript 6
-   ea5f62f: excluding several imported contracts
-   Updated dependencies [ba44c32]
-   Updated dependencies [ba44c32]
-   Updated dependencies [ba44c32]
-   Updated dependencies [ea5f62f]
    -   @cartesi/viem@2.0.0-alpha.32

## 2.0.0-alpha.35

### Patch Changes

-   @cartesi/viem@2.0.0-alpha.31

## 2.0.0-alpha.34

### Patch Changes

-   76ea041: Upgrade rollups-contracts to version 3.0.0-alpha.6. The dependencies on Cannon and NPM packages were removed.
    The information is collected from a GitHub release.
-   aa37bb7: Add react hooks for get-withdrawal and list-withdrawals JSON-RPC API methods.
-   Updated dependencies [6f8cbf9]
-   Updated dependencies [76ea041]
    -   @cartesi/viem@2.0.0-alpha.30

## 2.0.0-alpha.33

### Patch Changes

-   f950a4a: bump dependencies
-   9b690ab: Bump @cartesi/rollups package to v2.2.0 and cannon inspection to lookup version 2.2.0
-   Updated dependencies [c096acf]
-   Updated dependencies [f950a4a]
-   Updated dependencies [9b690ab]
    -   @cartesi/viem@2.0.0-alpha.29

## 2.0.0-alpha.32

### Patch Changes

-   060c58f: fix build
-   Updated dependencies [060c58f]
    -   @cartesi/viem@2.0.0-alpha.28

## 2.0.0-alpha.31

### Patch Changes

-   55f18c4: bump dependencies
-   Updated dependencies [55f18c4]
    -   @cartesi/viem@2.0.0-alpha.27

## 2.0.0-alpha.30

### Patch Changes

-   bb7f20e: Change chainId from 13370 to 31337
-   Updated dependencies [bb7f20e]
    -   @cartesi/viem@2.0.0-alpha.26

## 2.0.0-alpha.29

### Patch Changes

-   bb045dc: bump wagmi

## 2.0.0-alpha.28

### Patch Changes

-   f8ae86a: rename claim_hash to outputs_merkle_root
-   Updated dependencies [f8ae86a]
    -   @cartesi/viem@2.0.0-alpha.25

## 2.0.0-alpha.27

### Patch Changes

-   Updated dependencies [de930c1]
    -   @cartesi/viem@2.0.0-alpha.24

## 2.0.0-alpha.26

### Patch Changes

-   Updated dependencies [7f99c5e]
    -   @cartesi/viem@2.0.0-alpha.23

## 2.0.0-alpha.25

### Patch Changes

-   d6dfa9e: use client banner

## 2.0.0-alpha.24

### Patch Changes

-   977964e: mark provider as client

## 2.0.0-alpha.23

### Patch Changes

-   Updated dependencies [7c629af]
    -   @cartesi/viem@2.0.0-alpha.22

## 2.0.0-alpha.22

### Patch Changes

-   41b7c93: Fix hooks params check

## 2.0.0-alpha.21

### Patch Changes

-   af101d3: Defining enum types
-   Updated dependencies [af101d3]
    -   @cartesi/viem@2.0.0-alpha.21

## 2.0.0-alpha.20

### Patch Changes

-   86238a5: Fix nullable results
-   Updated dependencies [86238a5]
    -   @cartesi/viem@2.0.0-alpha.20

## 2.0.0-alpha.19

### Patch Changes

-   ec3cfa1: RPC changes
-   Updated dependencies [ec3cfa1]
    -   @cartesi/viem@2.0.0-alpha.19

## 2.0.0-alpha.18

### Patch Changes

-   d2357b8: tournament winner
-   Updated dependencies [d2357b8]
    -   @cartesi/viem@2.0.0-alpha.18

## 2.0.0-alpha.17

### Patch Changes

-   1b4585b: fix commitments list
-   Updated dependencies [1b4585b]
    -   @cartesi/viem@2.0.0-alpha.17

## 2.0.0-alpha.16

### Patch Changes

-   3d4cd7d: PRT methods
-   Updated dependencies [c396f9e]
    -   @cartesi/viem@2.0.0-alpha.16

## 2.0.0-alpha.15

### Patch Changes

-   Updated dependencies [9cffb8b]
    -   @cartesi/viem@2.0.0-alpha.15

## 2.0.0-alpha.14

### Patch Changes

-   365dabb: reverting back to tsup
-   Updated dependencies [365dabb]
    -   @cartesi/viem@2.0.0-alpha.14

## 2.0.0-alpha.13

### Patch Changes

-   2ab9548: tsdown packaging
-   10d725f: New useChainId and useNodeVersion hooks
-   Updated dependencies [8c498fd]
-   Updated dependencies [2ab9548]
-   Updated dependencies [34017b2]
-   Updated dependencies [1ae67fb]
    -   @cartesi/viem@2.0.0-alpha.13

## 2.0.0-alpha.12

### Patch Changes

-   9b3fa22: Bump dependencies
-   Updated dependencies [a6a79d7]
-   Updated dependencies [4946810]
-   Updated dependencies [9b3fa22]
    -   @cartesi/viem@2.0.0-alpha.12

## 2.0.0-alpha.11

### Patch Changes

-   e63018a: bump rollups-contracts to 2.0.0
-   7a88f7e: bump dependencies
-   3ff8e20: fix files in package
-   Updated dependencies [e63018a]
-   Updated dependencies [7a88f7e]
-   Updated dependencies [3ff8e20]
    -   @cartesi/viem@2.0.0-alpha.11

## 2.0.0-alpha.10

### Patch Changes

-   4cda2df: add useWaitForInput hook
-   Updated dependencies [aaf61ca]
    -   @cartesi/viem@2.0.0-alpha.10

## 2.0.0-alpha.9

### Patch Changes

-   Updated dependencies [7ce81ae]
    -   @cartesi/viem@2.0.0-alpha.9

## 2.0.0-alpha.8

### Patch Changes

-   715df3f: bump dependencies
-   7e06ba6: lint
-   68d9724: fix query keys, which must be serializable
-   Updated dependencies [715df3f]
-   Updated dependencies [7e06ba6]
    -   @cartesi/viem@2.0.0-alpha.8

## 2.0.0-alpha.7

### Patch Changes

-   871fb13: fix packaging and bump dependencies
-   Updated dependencies [871fb13]
    -   @cartesi/viem@2.0.0-alpha.7

## 2.0.0-alpha.6

### Patch Changes

-   3ac3cfe: exposing @tanstack/react-query options to hooks

## 2.0.0-alpha.5

### Patch Changes

-   Updated dependencies [7bc3da2]
    -   @cartesi/viem@2.0.0-alpha.6

## 2.0.0-alpha.4

### Patch Changes

-   de269ed: optional fields for hooks
-   c0f29cb: replace LastAcceptedEpoch with LastAcceptedEpochIndex
-   Updated dependencies [c0f29cb]
    -   @cartesi/viem@2.0.0-alpha.5

## 2.0.0-alpha.3

### Patch Changes

-   Updated dependencies [2cefdee]
    -   @cartesi/viem@2.0.0-alpha.4

## 2.0.0-alpha.2

### Patch Changes

-   59b3ef8: add missing export of useEpochs

## 2.0.0-alpha.1

### Patch Changes

-   f6eff04: fix packaging

## 2.0.0-alpha.0

### Major Changes

-   b0575c0: initial version

### Patch Changes

-   Updated dependencies [f4caca5]
    -   @cartesi/viem@2.0.0-alpha.3
