---
"@cartesi/machine": minor
---

target cartesi-machine emulator 0.22: bind the `collectMcycleRootHashes`, `collectMcycleBundle`, `collectUarchCycleRootHashes` and `collectUarchCycleBundle` root hash collection calls and `getUarchPristineHash`, add the uarch state range to `PmaConstant` and `mark_pages_dirty` to `BackingStoreConfig`, pass CMIO response lengths as the `uint32_t` the C API now takes (wasm module ABI 2), and spawn the JSON-RPC server of the installation a source-built addon links against rather than a prebuilt package's
