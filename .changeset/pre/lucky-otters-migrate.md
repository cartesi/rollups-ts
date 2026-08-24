---
"@cartesi/client": major
"@cartesi/react": major
"@cartesi/codec": major
---

upgrade the generated contracts to rollups-contracts 3.0.0-alpha.9

-   deployment addresses changed for every contract on every chain
-   `ERC` is now spelled `Erc` in contract names since 3.0.0-alpha.7, so the generated ABI, address and hook identifiers follow: `ISafeERC20Transfer` becomes `ISafeErc20Transfer`, and the portal deposit functions become `depositErc20Tokens`, `depositErc721Token`, `depositSingleErc1155Token` and `depositBatchErc1155Token` (`erc20PortalAbi` and friends keep their names)
-   the `DataAvailability` library was removed from rollups-contracts in 3.0.0-alpha.7, so its ABI is no longer generated; `@cartesi/client` keeps decoding the node's `data_availability` field against a local copy of it, leaving the `Application.dataAvailability` shape unchanged
-   the release artifacts are restricted to the contracts clients are expected to use, so `@cartesi/client` and `@cartesi/react` no longer curate a list of contracts to generate and now cover the whole set: `RefundOutputBuilder`, deployed as a core contract, and the devnet `TestFungibleToken`, `TestNonFungibleToken`, `TestMultiToken` and `TestUsdc` tokens join the previously generated contracts
-   addresses now cover the local devnet (chain 31337) too, so the devnet-only contracts — the test tokens and `TestUsdWithdrawalOutputBuilder` — carry an address, and the core contracts keep their single collapsed address, since the devnet deploys them at the same addresses as the livenets
