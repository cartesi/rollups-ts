---
"@cartesi/react": patch
---

Generate the PRT contract hooks.

`wagmi.config.ts` now passes `prt: true`, so the generated hooks cover dave's
contracts alongside the core rollups ones. Nothing generated before changes;
this only adds.

The pair worth naming is `useSimulateTournamentTryRecoveringBond` and
`useWriteTournamentTryRecoveringBond`. `tryRecoveringBond()` takes no arguments
and is `nonpayable`, so any account can claim a finished tournament's bond once
`tournament.snapshot.bondRecovery` reports `RECOVERABLE` — simulate at the
tournament's address, then write.

`daveAppFactory` and `multiLevelTournamentFactory` are deployed per chain,
because the tournament parameters depend on the chain's block time, so their
generated hooks resolve the address from the connected chain or from a `chainId`
you pass. They cover the eight public chains plus the devnet (31337); dave
publishes nothing for cannon (13370), so a hook for those two has no address
there.
