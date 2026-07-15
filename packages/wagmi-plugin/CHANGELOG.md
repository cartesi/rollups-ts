# @cartesi/wagmi-plugin

## 1.0.0-alpha.1

### Patch Changes

-   dccf64a: apply `include`/`exclude` to all contracts, deployed or not: when neither is given all contracts in the artifacts are included, `include` narrows generation to the matching contracts, and `exclude` is applied after `include`. Deployed contracts are no longer implicitly included, so configs relying on that must list them in `include`.

## 1.0.0-alpha.0

### Major Changes

-   e8cf85b: first public release of the wagmi CLI plugin for Cartesi Rollups contracts, with `artifacts` and `deployments` defaulting to the rollups-contracts v3.0.0-alpha.6 GitHub release tarballs (hash-verified)
