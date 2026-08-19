---
"@cartesi/wagmi-plugin": minor
---

bump the default rollups-contracts release from v3.0.0-alpha.6 to v3.0.0-alpha.9, updating `DEFAULT_VERSION`, the tarball URLs (release assets are now named `cartesi-rollups-contracts-<version>-*.tar.gz`) and their SHA-256 hashes

deployment addresses are now read from the plaintext `<chainId>/<Contract>.txt` files introduced in 3.0.0-alpha.8, which deprecates the JSON ones. The JSON files are no longer read at all, so `deployments` must point at a 3.0.0-alpha.8 (or later) tarball; an earlier one fails with an explicit error instead of generating contracts without addresses.

generate the devnet (chain 31337) addresses as well, read from the release's anvil tarball through the new `anvil` option (`DEFAULT_ANVIL`, alongside `DEFAULT_ANVIL_VERSION`). It defaults to the `DEFAULT_VERSION` release tarball and can be set to `false` to generate livenet addresses only. This is what brings in the devnet-only test tokens and the `TestUsdWithdrawalOutputBuilder`, whose ABI is aliased to `IUsdWithdrawalOutputBuilder` because the release publishes no artifact for the concrete contract it instantiates.
