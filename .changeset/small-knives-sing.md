---
"@cartesi/rpc": patch
---

**`cartesi_listEpochs`**: Updated `status` param to accept either a single `EpochStatus` or a non-empty array (`minItems: 1`). Added optional `from` and `to` inclusive range parameters (`HexNumber`).
