---
"@cartesi/rpc": patch
---

Track the PRT read-model changes the node made to its JSON-RPC API.

`Tournament`, `Commitment` and `Match` stop being flat rows of event data and gain
a `snapshot`: current contract state, read at a stated `as_of_block`, beside the
immutable event fields. `Tournament` therefore loses `winner_commitment`,
`final_state_hash` and `finished_at_block` to `snapshot`, and what you read there
is the tournament as of that block rather than a settled historical result — an
expired inner candidate is still a candidate, and separate calls do not add up to
one snapshot. `Tournament` also gains `initial_hash`, `base_cycle`, `kind`,
`start_instant`, `allowance` and `creation_event`, which is null for a root.

`Match` gains `eliminable_at`, `leaf_seal`, `deletion_log_index` and a
`MatchSnapshot` discriminated on `phase`; `Commitment` and `MatchAdvanced` gain
`log_index`, and `MatchAdvanced` also `segment_start_position` and its own
`eliminable_at`. `commitment_one`, `commitment_two`, `left_of_two`, `other_parent`
and `left_node` are now `Hash` rather than a loose byte array, and
`deletion_tx_hash` is nullable.

`cartesi_getMatchAdvance` is keyed by `tx_hash` and `log_index` instead of
`parent`. This is not a rename: repeated other-parent hashes stay distinct events,
so the parent hash never identified an advance on its own. Take both values from
`cartesi_listMatchAdvances`.

`Application` loses `data_availability`. The node no longer serves it, so there is
nothing left to decode.

Two methods are new. `cartesi_listBondEvents` lists partial-refund and
bond-recovery events for an application, ordered by block number and block-global
log index, and `cartesi_getBondEvent` fetches one by `tx_hash` and `log_index`. A
failed partial refund records the value that was requested, not a payment, and a
failed terminal bond transfer emits no recovery event at all — it stays
recoverable in the tournament snapshot. `BondEvent` is discriminated on `type`, so
`refund` and `recovery` are never both present.

`Uint256` is a new scalar for the exact uint256 quantities these types carry. The
node's `BondEventNotFound` reuses code `-31001`, which `errorCodes.resourceNotFound`
already names.
