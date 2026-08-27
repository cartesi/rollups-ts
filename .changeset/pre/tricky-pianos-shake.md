---
"@cartesi/rpc": major
"@cartesi/client": major
"@cartesi/react": major
---

Track the JSON-RPC API changes of rollups-node.

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
