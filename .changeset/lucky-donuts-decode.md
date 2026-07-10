---
"@cartesi/viem": minor
---

Add portal deposit decoding utilities: `getPortal`, `decodeDeposit`, and per-portal `decodeEtherDeposit`/`decodeERC20Deposit`/`decodeERC721Deposit`/`decodeERC1155SingleDeposit`/`decodeERC1155BatchDeposit` — pure isomorphic functions decoding portal input payloads per InputEncoding.sol, exported from the package root and the new `@cartesi/viem/portal` subpath. Malformed payloads throw `InvalidDepositPayloadError`.
