# @cartesi/wagmi-plugin

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
