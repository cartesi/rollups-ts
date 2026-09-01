---
"@cartesi/client": major
"@cartesi/codec": major
"@cartesi/react": major
---

regenerate the contracts from rollups-contracts 3.0.0-alpha.10. Every deployment address changed, on the livenets and the devnet alike, so any address read from these packages must be taken again — `inputBoxAddress`, the portal addresses `decodeDeposit` dispatches on, and the factory addresses among them. No ABI changed, and `@cartesi/client` and `@cartesi/react` additionally generate the ERC-165, ERC-20, ERC-721 and ERC-1155 interfaces the release now publishes.
