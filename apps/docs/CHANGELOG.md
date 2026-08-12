# @cartesi/docs

## 0.0.1-alpha.3

### Patch Changes

-   8adc8cd: Add `@cartesi/machine`, Node.js bindings for the Cartesi Machine emulator, imported from `@deroll/cm`. A native N-API addon over the official emulator distribution's static libraries, for creating, running, snapshotting and inspecting machines in-process or out-of-process over JSON-RPC, plus a rollups machine driving advance and inspect requests. Prebuilt per-platform packages bundle the addon and the `cartesi-jsonrpc-machine` server. Documented under `/machine` in the docs site.
-   9e88910: Add `@cartesi/rollup`, Node.js bindings for libcmt (the Cartesi Machine guest rollup library), imported from `@deroll/cmio`. Lets applications running inside a Cartesi Machine handle advance/inspect requests and emit vouchers, notices, reports and exceptions without the rollup HTTP server. Documented under `/rollup` in the docs site.

## 0.0.1-alpha.2

### Patch Changes

-   45043f5: Add new cartesi_listInputs optional query parameter transaction_hash.

## 0.0.1-alpha.1

### Patch Changes

-   b42bd2d: Update references to jsonrpc-discover.json file from tag alpha.3 to alpha.10.

## 0.0.1-alpha.0

### Patch Changes

-   c0f29cb: replace LastAcceptedEpoch with LastAcceptedEpochIndex
