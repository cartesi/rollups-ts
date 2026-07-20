---
"@cartesi/rpc": minor
"@cartesi/viem": minor
---

align types with the node's OpenRPC schema: rename `Input.transaction_reference` to `transaction_hash`, add `Input.log_index`, add `Report.epochIndex` to the viem `Report` type, make `Commitment.submitterAddress` non-nullable, and tighten `chain_id`, `prev_randao` and `cartesi_getChainId` result types to hex-encoded values
