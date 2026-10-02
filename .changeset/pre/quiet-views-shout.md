---
"@cartesi/client": patch
---

Generate the PRT contracts.

`wagmi.config.ts` now passes `prt: true`, so `@cartesi/client/abi` carries dave's
contracts alongside the core rollups ones. PRT Rollups is a superset — same
`InputBox`, portals and factories, at the same addresses — so nothing that was
exported before changes; this only adds.

The one worth knowing about is `tournamentAbi`. `tryRecoveringBond()` takes no
arguments and is `nonpayable`, so anyone can claim a finished tournament's bond
once `tournament.snapshot.bondRecovery` says it is `RECOVERABLE`.

Note the shape of the new address exports. `daveAppFactoryAddress` and
`multiLevelTournamentFactoryAddress` are records keyed by chain ID rather than a
single address, because dave deploys those per chain — the tournament parameters
depend on the chain's block time. They cover the eight public chains plus the
devnet (31337); dave publishes nothing for cannon (13370), so there is no entry
for it. Everything dave shares with rollups-contracts keeps its single address.
