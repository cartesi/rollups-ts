---
"@cartesi/client": patch
---

Add `listStandingChanges` and `getStandingChange`, and the dave 3.0.0-alpha.6 PRT fields.

`listStandingChanges` lists a tournament's `StandingChanged` events in log order;
pass `descending: true` and `limit: 1` for the latest one. Its `resultAt` and
`winnerExpiresAt` are prospective instants, not proof that the tournament has
finished. `Tournament` gains `bondValue` and `contestedFinalStateOne`/`Two`,
`Match` and `MatchAdvanced` gain `responderDeadline` (plus `currentHeight` on the
advance), and `LeafMatchSeal` gains the sealed divergence and both deadlines.
