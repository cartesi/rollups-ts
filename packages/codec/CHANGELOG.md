# @cartesi/codec

## 1.0.0-alpha.4

### Major Changes

- 2891af1: regenerate the contracts from rollups-contracts 3.0.0-alpha.10. Every deployment address changed, on the livenets and the devnet alike, so any address read from these packages must be taken again — `inputBoxAddress`, the portal addresses `decodeDeposit` dispatches on, and the factory addresses among them. No ABI changed, and `@cartesi/client` and `@cartesi/react` additionally generate the ERC-165, ERC-20, ERC-721 and ERC-1155 interfaces the release now publishes.

## 1.0.0-alpha.3

### Patch Changes

- e00fb19: ship the Apache-2.0 licence with the package: every tarball now carries `LICENSE` and `NOTICE`, and the packages that declared no `license` field (`client`, `codec`, `rpc`, `react`, `wagmi-plugin`) declare `Apache-2.0`

## 1.0.0-alpha.2

### Major Changes

-   38f0751: upgrade the generated contracts to rollups-contracts 3.0.0-alpha.9

    -   deployment addresses changed for every contract on every chain
    -   `ERC` is now spelled `Erc` in contract names since 3.0.0-alpha.7, so the generated ABI, address and hook identifiers follow: `ISafeERC20Transfer` becomes `ISafeErc20Transfer`, and the portal deposit functions become `depositErc20Tokens`, `depositErc721Token`, `depositSingleErc1155Token` and `depositBatchErc1155Token` (`erc20PortalAbi` and friends keep their names)
    -   the `DataAvailability` library was removed from rollups-contracts in 3.0.0-alpha.7, so its ABI is no longer generated; `@cartesi/client` keeps decoding the node's `data_availability` field against a local copy of it, leaving the `Application.dataAvailability` shape unchanged
    -   the release artifacts are restricted to the contracts clients are expected to use, so `@cartesi/client` and `@cartesi/react` no longer curate a list of contracts to generate and now cover the whole set: `RefundOutputBuilder`, deployed as a core contract, and the devnet `TestFungibleToken`, `TestNonFungibleToken`, `TestMultiToken` and `TestUsdc` tokens join the previously generated contracts
    -   addresses now cover the local devnet (chain 31337) too, so the devnet-only contracts — the test tokens and `TestUsdWithdrawalOutputBuilder` — carry an address, and the core contracts keep their single collapsed address, since the devnet deploys them at the same addresses as the livenets

## 1.0.0-alpha.1

### Patch Changes

-   b4de9f1: bump dependencies

## 1.0.0-alpha.0

### Major Changes

-   f7c9d3b: first release of the codec package, with isomorphic utility functions to decode (and encode, for testing) data compliant with the rollups contracts `Inputs` and `Outputs` interfaces, and portal deposit payloads packed-encoded by the `InputEncoding` library

### Minor Changes

-   cc25b1a: Support byte arrays alongside hex strings in all codec functions. Decode functions (`decodeInput`, `decodeOutput`, `decodeDeposit` and the portal deposit decoders) now also accept a `Uint8Array` (including subclasses like the Node.js `Buffer`), returning variable-size byte fields (`payload`, `execLayerData`, `baseLayerData`) as zero-copy subarrays of the input — no hex conversion or copying. Encode functions take an optional `to` parameter (`"hex"`, the default, or `"bytes"`) selecting the representation of the encoded data, and accept their byte fields in either representation. Hex in, hex out behavior is unchanged.
