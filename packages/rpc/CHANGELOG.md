# @cartesi/rpc

## 2.0.0-alpha.26

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

## 2.0.0-alpha.25

### Patch Changes

-   b4de9f1: bump dependencies

## 2.0.0-alpha.24

### Minor Changes

-   58f793a: align types with the node's OpenRPC schema: rename `Input.transaction_reference` to `transaction_hash`, add `Input.log_index`, add `Report.epochIndex` to the viem `Report` type, make `Commitment.submitterAddress` non-nullable, and tighten `chain_id`, `prev_randao` and `cartesi_getChainId` result types to hex-encoded values

### Patch Changes

-   45043f5: Add new cartesi_listInputs optional query parameter transaction_hash.

## 2.0.0-alpha.23

### Patch Changes

-   ba44c32: migration from tsup to tsdown
-   ba44c32: bump dependencies
-   ba44c32: migration to typescript 6
-   cf2ffe4: propagate transport failures (network errors, non-200 responses, invalid JSON) to pending requests instead of hanging forever

## 2.0.0-alpha.22

### Patch Changes

-   123f24b: Add REPORTS_LIMIT_EXCEEDED to the InputStatus union type.

## 2.0.0-alpha.21

### Patch Changes

-   c99de89: Update RPC types and methods. It has breaking changes.

    -   Added new EpochStatus [CLAIM_REJECTED, CLAIM_FORECLOSED]
    -   Rename ApplicationState to ApplicationStatus. It has a new union [OK, FAILED, DIVERGED, CORRUPTED]. ENABLED and DISABLED states were removed.
    -   Application has a new property called `enabled`.
    -   Added new fields to the Application type.
    -   New Withdrawal type added.
    -   Added new json rpc methods [cartesi_getWithdrawal, cartesi_listWithdrawals]

## 2.0.0-alpha.20

### Patch Changes

-   c096acf: adding nullable to some RPC return fields
-   f950a4a: bump dependencies
-   0285ea5: Add new application state FAILED.

## 2.0.0-alpha.19

### Patch Changes

-   bb7f20e: Change chainId from 13370 to 31337

## 2.0.0-alpha.18

### Patch Changes

-   f8ae86a: rename claim_hash to outputs_merkle_root

## 2.0.0-alpha.17

### Patch Changes

-   7c629af: fix match winner commitment definition

## 2.0.0-alpha.16

### Patch Changes

-   af101d3: Defining enum types

## 2.0.0-alpha.15

### Patch Changes

-   86238a5: Fix nullable results

## 2.0.0-alpha.14

### Patch Changes

-   ec3cfa1: RPC changes

## 2.0.0-alpha.13

### Patch Changes

-   d2357b8: tournament winner

## 2.0.0-alpha.12

### Patch Changes

-   b9a2482: PRT methods

## 2.0.0-alpha.11

### Patch Changes

-   9cffb8b: fix return type of cartesi_getProcessedInputCount

## 2.0.0-alpha.10

### Patch Changes

-   365dabb: reverting back to tsup

## 2.0.0-alpha.9

### Patch Changes

-   15915c3: new cartesi_getNodeVersion and cartesi_getChainId methods
-   8c498fd: add descending optional parameter
-   2ab9548: tsdown packaging

## 2.0.0-alpha.8

### Patch Changes

-   5e00d57: fix module resolution

## 2.0.0-alpha.7

### Patch Changes

-   7ce81ae: fix output type: output_hashes_siblings is nullable

## 2.0.0-alpha.6

### Patch Changes

-   715df3f: bump dependencies
-   7e06ba6: lint

## 2.0.0-alpha.5

### Patch Changes

-   871fb13: fix packaging and bump dependencies

## 2.0.0-alpha.4

### Patch Changes

-   967147d: fix type of output_type

## 2.0.0-alpha.3

### Patch Changes

-   c0f29cb: replace LastAcceptedEpoch with LastAcceptedEpochIndex

## 2.0.0-alpha.2

### Patch Changes

-   f4caca5: fix output typings

## 2.0.0-alpha.1

### Patch Changes

-   1dbff18: fix execution_parameters fields types
-   2d39391: make reason optional

## 2.0.0-alpha.0

### Major Changes

-   c45c0c7: first v2-alpha version
