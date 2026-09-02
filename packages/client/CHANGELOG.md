# @cartesi/client

## 2.0.0-alpha.37

### Major Changes

- 2891af1: regenerate the contracts from rollups-contracts 3.0.0-alpha.10. Every deployment address changed, on the livenets and the devnet alike, so any address read from these packages must be taken again — `inputBoxAddress`, the portal addresses `decodeDeposit` dispatches on, and the factory addresses among them. No ABI changed, and `@cartesi/client` and `@cartesi/react` additionally generate the ERC-165, ERC-20, ERC-721 and ERC-1155 interfaces the release now publishes.

## 2.0.0-alpha.36

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
  - @cartesi/rpc@2.0.0-alpha.26

## 2.0.0-alpha.35

### Major Changes

-   38f0751: upgrade the generated contracts to rollups-contracts 3.0.0-alpha.9

    -   deployment addresses changed for every contract on every chain
    -   `ERC` is now spelled `Erc` in contract names since 3.0.0-alpha.7, so the generated ABI, address and hook identifiers follow: `ISafeERC20Transfer` becomes `ISafeErc20Transfer`, and the portal deposit functions become `depositErc20Tokens`, `depositErc721Token`, `depositSingleErc1155Token` and `depositBatchErc1155Token` (`erc20PortalAbi` and friends keep their names)
    -   the `DataAvailability` library was removed from rollups-contracts in 3.0.0-alpha.7, so its ABI is no longer generated; `@cartesi/client` keeps decoding the node's `data_availability` field against a local copy of it, leaving the `Application.dataAvailability` shape unchanged
    -   the release artifacts are restricted to the contracts clients are expected to use, so `@cartesi/client` and `@cartesi/react` no longer curate a list of contracts to generate and now cover the whole set: `RefundOutputBuilder`, deployed as a core contract, and the devnet `TestFungibleToken`, `TestNonFungibleToken`, `TestMultiToken` and `TestUsdc` tokens join the previously generated contracts
    -   addresses now cover the local devnet (chain 31337) too, so the devnet-only contracts — the test tokens and `TestUsdWithdrawalOutputBuilder` — carry an address, and the core contracts keep their single collapsed address, since the devnet deploys them at the same addresses as the livenets

## 2.0.0-alpha.34

### Minor Changes

-   e4cf760: Rename the package from `@cartesi/viem` to `@cartesi/client`. Update imports from `@cartesi/viem` to `@cartesi/client`, including the subpath entrypoints (`@cartesi/client/abi`, `@cartesi/client/actions`, `@cartesi/client/chains`); the exported actions, clients, decorators, and types are unchanged.

### Patch Changes

-   b4de9f1: bump dependencies
-   Updated dependencies [b4de9f1]
    -   @cartesi/rpc@2.0.0-alpha.25

## 2.0.0-alpha.33

### Major Changes

-   6b3cf3b: Remove custom L1 actions in favor of plain viem contract actions.

    The `addInput`, `depositEther`, `depositERC20Tokens`, `depositERC721Token`, `depositSingleERC1155Token`, `depositBatchERC1155Token`, `executeOutput`, `validateOutput` actions, all `estimate*Gas` actions, and the `walletActionsL1` / `publicActionsL1` decorators were removed. Use viem's own `writeContract` / `readContract` / `estimateContractGas` with the typed ABIs and addresses exported by `@cartesi/viem/abi`, the generated actions and hooks of `@cartesi/wagmi`, or generate your own code with `@cartesi/wagmi-plugin`.

    The new `toOutputArgs` export converts an `Output` returned by the node API into the arguments of `IApplication.executeOutput` / `IApplication.validateOutput`. Note that `IApplication.validateOutput` reverts when the output is invalid, unlike the removed `validateOutput` action which returned `false`.

### Minor Changes

-   58f793a: align types with the node's OpenRPC schema: rename `Input.transaction_reference` to `transaction_hash`, add `Input.log_index`, add `Report.epochIndex` to the viem `Report` type, make `Commitment.submitterAddress` non-nullable, and tighten `chain_id`, `prev_randao` and `cartesi_getChainId` result types to hex-encoded values

### Patch Changes

-   45043f5: Add new cartesi_listInputs optional query parameter transaction_hash.
-   Updated dependencies [45043f5]
-   Updated dependencies [58f793a]
    -   @cartesi/rpc@2.0.0-alpha.24

## 2.0.0-alpha.32

### Patch Changes

-   ba44c32: migration from tsup to tsdown
-   ba44c32: bump dependencies
-   ba44c32: migration to typescript 6
-   ea5f62f: excluding several imported contracts
-   Updated dependencies [ba44c32]
-   Updated dependencies [ba44c32]
-   Updated dependencies [ba44c32]
-   Updated dependencies [cf2ffe4]
    -   @cartesi/rpc@2.0.0-alpha.23

## 2.0.0-alpha.31

### Patch Changes

-   Updated dependencies [123f24b]
    -   @cartesi/rpc@2.0.0-alpha.22

## 2.0.0-alpha.30

### Patch Changes

-   6f8cbf9: Implement the new methods getWithdrawal and listWithdrawals including the new withdrawal converter. Also update the application-converter.
-   76ea041: Upgrade rollups-contracts to version 3.0.0-alpha.6. The dependencies on Cannon and NPM packages were removed.
    The information is collected from a GitHub release.
-   Updated dependencies [c99de89]
    -   @cartesi/rpc@2.0.0-alpha.21

## 2.0.0-alpha.29

### Patch Changes

-   c096acf: adding nullable to some RPC return fields
-   f950a4a: bump dependencies
-   9b690ab: Bump @cartesi/rollups package to v2.2.0 and cannon inspection to lookup version 2.2.0
-   Updated dependencies [c096acf]
-   Updated dependencies [f950a4a]
-   Updated dependencies [0285ea5]
    -   @cartesi/rpc@2.0.0-alpha.20

## 2.0.0-alpha.28

### Patch Changes

-   060c58f: fix build

## 2.0.0-alpha.27

### Patch Changes

-   55f18c4: bump dependencies

## 2.0.0-alpha.26

### Patch Changes

-   bb7f20e: Change chainId from 13370 to 31337
-   Updated dependencies [bb7f20e]
    -   @cartesi/rpc@2.0.0-alpha.19

## 2.0.0-alpha.25

### Patch Changes

-   f8ae86a: rename claim_hash to outputs_merkle_root
-   Updated dependencies [f8ae86a]
    -   @cartesi/rpc@2.0.0-alpha.18

## 2.0.0-alpha.24

### Patch Changes

-   de930c1: fix list params

## 2.0.0-alpha.23

### Patch Changes

-   7f99c5e: fix missing listTournaments params

## 2.0.0-alpha.22

### Patch Changes

-   7c629af: fix match winner commitment definition
-   Updated dependencies [7c629af]
    -   @cartesi/rpc@2.0.0-alpha.17

## 2.0.0-alpha.21

### Patch Changes

-   af101d3: Defining enum types
-   Updated dependencies [af101d3]
    -   @cartesi/rpc@2.0.0-alpha.16

## 2.0.0-alpha.20

### Patch Changes

-   86238a5: Fix nullable results
-   Updated dependencies [86238a5]
    -   @cartesi/rpc@2.0.0-alpha.15

## 2.0.0-alpha.19

### Patch Changes

-   ec3cfa1: RPC changes
-   Updated dependencies [ec3cfa1]
    -   @cartesi/rpc@2.0.0-alpha.14

## 2.0.0-alpha.18

### Patch Changes

-   d2357b8: tournament winner
-   Updated dependencies [d2357b8]
    -   @cartesi/rpc@2.0.0-alpha.13

## 2.0.0-alpha.17

### Patch Changes

-   1b4585b: fix commitments list

## 2.0.0-alpha.16

### Patch Changes

-   c396f9e: PRT methods
-   Updated dependencies [b9a2482]
    -   @cartesi/rpc@2.0.0-alpha.12

## 2.0.0-alpha.15

### Patch Changes

-   9cffb8b: fix return type of cartesi_getProcessedInputCount
-   Updated dependencies [9cffb8b]
    -   @cartesi/rpc@2.0.0-alpha.11

## 2.0.0-alpha.14

### Patch Changes

-   365dabb: reverting back to tsup
-   Updated dependencies [365dabb]
    -   @cartesi/rpc@2.0.0-alpha.10

## 2.0.0-alpha.13

### Patch Changes

-   8c498fd: add descending optional parameter
-   2ab9548: tsdown packaging
-   34017b2: New getNodeVersion and getChainId methods
-   1ae67fb: add all rollups abis to package
-   Updated dependencies [15915c3]
-   Updated dependencies [8c498fd]
-   Updated dependencies [2ab9548]
    -   @cartesi/rpc@2.0.0-alpha.9

## 2.0.0-alpha.12

### Patch Changes

-   a6a79d7: definition of cartesi chain
-   4946810: add dataAvailability info
-   9b3fa22: Bump dependencies
-   Updated dependencies [5e00d57]
    -   @cartesi/rpc@2.0.0-alpha.8

## 2.0.0-alpha.11

### Patch Changes

-   e63018a: bump rollups-contracts to 2.0.0
-   7a88f7e: bump dependencies
-   3ff8e20: fix files in package

## 2.0.0-alpha.10

### Patch Changes

-   aaf61ca: fix queries with optional fields

## 2.0.0-alpha.9

### Patch Changes

-   7ce81ae: fix output type: output_hashes_siblings is nullable
-   Updated dependencies [7ce81ae]
    -   @cartesi/rpc@2.0.0-alpha.7

## 2.0.0-alpha.8

### Patch Changes

-   715df3f: bump dependencies
-   7e06ba6: lint
-   Updated dependencies [715df3f]
-   Updated dependencies [7e06ba6]
    -   @cartesi/rpc@2.0.0-alpha.6

## 2.0.0-alpha.7

### Patch Changes

-   871fb13: fix packaging and bump dependencies
-   Updated dependencies [871fb13]
    -   @cartesi/rpc@2.0.0-alpha.5

## 2.0.0-alpha.6

### Patch Changes

-   7bc3da2: type for OutputType
-   Updated dependencies [967147d]
    -   @cartesi/rpc@2.0.0-alpha.4

## 2.0.0-alpha.5

### Patch Changes

-   c0f29cb: replace LastAcceptedEpoch with LastAcceptedEpochIndex
-   Updated dependencies [c0f29cb]
    -   @cartesi/rpc@2.0.0-alpha.3

## 2.0.0-alpha.4

### Patch Changes

-   2cefdee: adding some types

## 2.0.0-alpha.3

### Patch Changes

-   f4caca5: fix output typings
-   Updated dependencies [f4caca5]
    -   @cartesi/rpc@2.0.0-alpha.2

## 2.0.0-alpha.2

### Patch Changes

-   1044dae: fix dataAvailability parsing
-   604c8e6: Fix executionParameters fields types
-   fd69855: fix CartesiPublicClient type definition
-   adc342b: export additional types
-   07a529e: make reason optional
-   Updated dependencies [1dbff18]
-   Updated dependencies [2d39391]
    -   @cartesi/rpc@2.0.0-alpha.1

## 2.0.0-alpha.1

### Patch Changes

-   1dbb582: fix wagmi cli config
-   1b203cf: remove unused graphql lib

## 2.0.0-alpha.0

### Major Changes

-   8a1982e: initial version

### Patch Changes

-   Updated dependencies [c45c0c7]
    -   @cartesi/rpc@2.0.0-alpha.0
