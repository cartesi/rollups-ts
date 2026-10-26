---
"@cartesi/codec": minor
---

Build on [ox](https://oxlib.sh) instead of viem.

`decodeInput` and `decodeOutput` now raise ox's `AbiItem.NotFoundError` where
they raised viem's `AbiFunctionSignatureNotFoundError`, for data whose leading
four bytes match no function of the `Inputs`/`Outputs` interface. Both the hex
and the byte array path raise it, as before, and the message still carries the
offending selector; code matching the old class with `instanceof` has to
change. Data that starts with a known selector but is too short to decode
likewise raises ox's error rather than viem's.

viem is no longer a peer dependency, so there is nothing to install alongside
this package. Every exported type is unchanged: ox's `Hex.Hex`, `Bytes.Bytes`
and `Address.Address` are the types viem exposes as `Hex`, `ByteArray` and
`Address`, so code that types codec values with viem's types still compiles.

The package now requires Node 22.12 or newer. ox publishes no CommonJS build,
so the `require` entry point reaches it through `require(esm)`, which is
unflagged from that version on; the ESM entry point is unaffected.
