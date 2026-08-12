# @cartesi/machine

## 1.0.0-alpha.0

### Major Changes

-   8adc8cd: Add `@cartesi/machine`, Node.js bindings for the Cartesi Machine emulator, imported from `@deroll/cm`. A native N-API addon over the official emulator distribution's static libraries, for creating, running, snapshotting and inspecting machines in-process or out-of-process over JSON-RPC, plus a rollups machine driving advance and inspect requests. Prebuilt per-platform packages bundle the addon and the `cartesi-jsonrpc-machine` server. Documented under `/machine` in the docs site.
