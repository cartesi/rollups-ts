---
"@cartesi/wagmi-plugin": minor
---

bump the default rollups-contracts release from v3.0.0-alpha.6 to v3.0.0-alpha.8, updating `DEFAULT_VERSION`, the tarball URLs (release assets are now named `cartesi-rollups-contracts-<version>-*.tar.gz`) and their SHA-256 hashes

deployment addresses are now read from the plaintext `<chainId>/<Contract>.txt` files introduced in 3.0.0-alpha.8, which deprecates the JSON ones. The JSON files are no longer read at all, so `deployments` must point at a 3.0.0-alpha.8 (or later) tarball; an earlier one fails with an explicit error instead of generating contracts without addresses.
