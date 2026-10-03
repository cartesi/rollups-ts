---
"@cartesi/rpc": patch
---

Type `Match.deletion_block_number` as `HexNumber`, no longer nullable.

The node always serializes it as a quantity, `0x0` while the match is not
deleted, so the `null` the type allowed never came over the wire. It is the
odd one out of the three deletion fields: `deletion_tx_hash` and
`deletion_log_index` are still `null` until the match is deleted. Test
`deletion_reason` against `NOT_DELETED`, not this field against zero.
