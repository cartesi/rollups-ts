---
"@cartesi/wagmi-plugin": minor
---

move the default rollups-contracts to 3.0.0-beta.1, with new SHA-256 hashes for the artifacts, deployment addresses and anvil devnet tarballs. The release is additive: the application and authority factories gain reserved deterministic deployments (`newReservedApplication`, `calculateReservedApplicationAddress`, `newReservedAuthority`, `calculateReservedAuthorityAddress`), and no existing ABI changed.
