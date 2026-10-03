---
"@cartesi/client": patch
---

Type `Match.deletionBlockNumber` as `bigint`, no longer nullable, mirroring
`@cartesi/rpc`.

The node reports `0x0` for a match that is not deleted, and the converter
already turned that into `0n` rather than `null`, so the runtime value is
unchanged; only the type now says so. A `null` check on it was dead code.
