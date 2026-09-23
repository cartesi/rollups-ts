---
"@cartesi/client": patch
---

Mirror the `@cartesi/rpc` changes for the node's PRT read models and bond events.

`Tournament`, `Commitment` and `Match` gain a `snapshot`: current contract state
read at a stated `snapshot.asOfBlock`, beside the immutable event fields they
already carried. `tournament.winnerCommitment`, `finalStateHash` and
`finishedAtBlock` move to `tournament.snapshot`, and reading them there is not the
same thing as reading a settled result — an expired inner candidate is still
`snapshot.candidate` without being `snapshot.winnerCommitment`, and two calls do
not add up to one consistent snapshot. `Tournament` also gains `initialHash`,
`baseCycle`, `kind`, `startInstant`, `allowance` and `creationEvent`, which is
null for a root tournament.

`Match` gains `eliminableAt`, `leafSeal`, `deletionLogIndex` and a `MatchSnapshot`
discriminated on `phase`; `Commitment` and `MatchAdvanced` gain `logIndex`, and
`MatchAdvanced` also `segmentStartPosition` and its own `eliminableAt`.
`MatchSnapshot` and the new `BondEvent` are discriminated unions, so `bisection`
and `sealed` — and `refund` and `recovery` — narrow on the discriminant instead of
being nullable fields you have to test one by one.

`getMatchAdvance` takes `txHash` and `logIndex` instead of `parent`. This is not a
rename: repeated other-parent hashes stay distinct events, so the parent hash
never identified one advance. Take both values from the `MatchAdvanced` records
`listMatchAdvances` returns.

`Application.dataAvailability` is gone, along with the `DataAvailability`,
`DataAvailabilityInputBox` and `DataAvailabilityInputBoxAndEspresso` types and the
locally kept ABI that decoded them. The node no longer serves the field, so there
is nothing left to decode; an application's input box is on
`Application.inputBoxAddress`.

Two actions are new. `listBondEvents` lists an application's partial-refund and
bond-recovery events, ordered by block number and block-global log index, and
`getBondEvent` fetches one by `txHash` and `logIndex`. A failed partial refund
records the value that was requested rather than a payment — check `refund.success`
before treating `refund.value` as money that moved — and a failed terminal bond
transfer emits no recovery event at all, staying recoverable in the tournament
snapshot.
