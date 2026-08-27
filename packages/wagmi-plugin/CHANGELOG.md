# @cartesi/wagmi-plugin

## 1.0.0-alpha.5

### Patch Changes

- e00fb19: ship the Apache-2.0 licence with the package: every tarball now carries `LICENSE` and `NOTICE`, and the packages that declared no `license` field (`client`, `codec`, `rpc`, `react`, `wagmi-plugin`) declare `Apache-2.0`

## 1.0.0-alpha.4

### Minor Changes

-   1eb2a24: bump the default rollups-contracts release from v3.0.0-alpha.6 to v3.0.0-alpha.9, updating `DEFAULT_VERSION`, the tarball URLs (release assets are now named `cartesi-rollups-contracts-<version>-*.tar.gz`) and their SHA-256 hashes

    deployment addresses are now read from the plaintext `<chainId>/<Contract>.txt` files introduced in 3.0.0-alpha.8, which deprecates the JSON ones. The JSON files are no longer read at all, so `deployments` must point at a 3.0.0-alpha.8 (or later) tarball; an earlier one fails with an explicit error instead of generating contracts without addresses.

    generate the devnet (chain 31337) addresses as well, read from the release's anvil tarball through the new `anvil` option (`DEFAULT_ANVIL`, alongside `DEFAULT_ANVIL_VERSION`). It defaults to the `DEFAULT_VERSION` release tarball and can be set to `false` to generate livenet addresses only. This is what brings in the devnet-only test tokens and the `TestUsdWithdrawalOutputBuilder`, whose ABI is aliased to `IUsdWithdrawalOutputBuilder` because the release publishes no artifact for the concrete contract it instantiates.

## 1.0.0-alpha.3

### Patch Changes

-   9b89834: stop caching the downloaded tarballs. Extracting them into the OS temporary directory and caching that left codegen unable to recover once a temporary directory cleaner had swept the extraction: a leftover directory made every later run fail with `ENOTEMPTY` while renaming a fresh extraction onto it, and a surviving completion marker over reaped contents made codegen silently resolve no contracts. The tarballs are a few hundred KB, so they are now simply downloaded on every run and extracted to a throwaway directory, removed once the contracts have been read. Generating contracts therefore always needs network access.

## 1.0.0-alpha.2

### Patch Changes

-   b4de9f1: bump dependencies

## 1.0.0-alpha.1

### Patch Changes

-   dccf64a: apply `include`/`exclude` to all contracts, deployed or not: when neither is given all contracts in the artifacts are included, `include` narrows generation to the matching contracts, and `exclude` is applied after `include`. Deployed contracts are no longer implicitly included, so configs relying on that must list them in `include`.

## 1.0.0-alpha.0

### Major Changes

-   e8cf85b: first public release of the wagmi CLI plugin for Cartesi Rollups contracts, with `artifacts` and `deployments` defaulting to the rollups-contracts v3.0.0-alpha.6 GitHub release tarballs (hash-verified)
