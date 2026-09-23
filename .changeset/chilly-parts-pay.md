---
"@cartesi/react": patch
---

Carry the PRT and bond-event changes of `@cartesi/client` through the hooks.

`useMatchAdvance` is the only existing hook whose own signature moved: it takes
`txHash` and `logIndex` where it took `parent`, and both are gated by `skipToken`
and stringified into the query key. Its params come from the records
`useMatchAdvances` returns, since repeated other-parent hashes stay distinct
events and the parent hash never identified one advance.

Every other hook infers its result from the client action it wraps, so the new
shapes arrive on their own. What that means for consumers:

- `useTournament` and `useTournaments` no longer expose `winnerCommitment`,
  `finalStateHash` or `finishedAtBlock` at the top level. They are on
  `snapshot`, together with the tournament's standing, candidate and bond
  recovery, and what you read there is current contract state at
  `snapshot.asOfBlock` rather than a settled result.
- `useCommitment`, `useCommitments`, `useMatch` and `useMatches` gain `logIndex`
  and a `snapshot` of their own — the commitment's live claimer and clocks, the
  match's phase payload.
- `useMatchAdvance` and `useMatchAdvances` gain `logIndex`,
  `segmentStartPosition` and `eliminableAt`.
- `useApplication` and `useApplications` no longer expose `dataAvailability`;
  the node stopped serving it.
- A match snapshot and a bond event are discriminated unions, so narrow on
  `snapshot.phase` or `event.type` before reading `bisection`, `sealed`,
  `refund` or `recovery`.

`useBondEvents` and `useBondEvent` are new, wrapping the actions of the same
name.
