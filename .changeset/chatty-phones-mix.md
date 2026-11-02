---
"@cartesi/wagmi-plugin": patch
---

Move the default dave release to 3.0.0-alpha.6.

It is a new deployment generation: every PRT address moves, while the rollups
contracts keep their 3.0.0-alpha.10 addresses. alpha.6 publishes OP Mainnet, Base,
their Sepolia testnets and the Arbitrum chains in a separate
`deployment-addresses-experimental` asset. The new `prt.experimentalDeployments`
option reads it by default, so those chains keep their entries; pass `false` to
generate only Ethereum mainnet, Sepolia and the devnet.
