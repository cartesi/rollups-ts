---
"@cartesi/client": patch
---

Add the PRT factories to the `cartesi` devnet chain.

`cartesi.contracts` from `@cartesi/client/chains` gains `daveAppFactory` and
`multiLevelTournamentFactory`, so a devnet application can be deployed through
PRT without hand-writing an address.

Both entries are the devnet (31337) address and nothing else. dave deploys these
two per chain, because the tournament parameters depend on the chain's block
time, so there is no single address to put on a chain record. On any other chain
read `daveAppFactoryAddress[chainId]` and
`multiLevelTournamentFactoryAddress[chainId]` from `@cartesi/client/abi`, which
is the public way to reach them; `cartesi.contracts` is for the devnet only.
