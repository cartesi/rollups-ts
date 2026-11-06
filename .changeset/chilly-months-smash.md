---
"@cartesi/rpc": patch
---

Mirror the node's standing changes and the dave 3.0.0-alpha.6 PRT fields.

Adds `cartesi_listStandingChanges` and `cartesi_getStandingChange`, which return
the `StandingChanged` history of one tournament. `Tournament` gains `bond_value`
and `contested_final_state_one`/`_two`; `Match` and `MatchAdvanced` gain
`responder_deadline`, and `MatchAdvanced` also `current_height`; `LeafMatchSeal`
gains the sealed divergence (`agree_state`, `divergence_position`,
`final_state_one`/`_two`) and both deadlines.
