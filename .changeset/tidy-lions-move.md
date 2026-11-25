---
"@cartesi/client": major
"@cartesi/codec": major
"@cartesi/react": major
---

regenerate the contracts from rollups-contracts 3.0.0-beta.1. Every deployment address changed, on the livenets and the devnet alike, so any address read from these packages must be taken again — `inputBoxAddress`, the portal addresses `decodeDeposit` dispatches on, and the factory addresses among them. No existing ABI changed. `@cartesi/client` and `@cartesi/react` additionally generate the reserved deployment functions the application and authority factories gain (`newReservedApplication`, `calculateReservedApplicationAddress`, `newReservedAuthority`, `calculateReservedAuthorityAddress`).
