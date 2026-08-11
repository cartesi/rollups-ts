---
"@cartesi/codec": minor
---

Support byte arrays alongside hex strings in all codec functions. Decode functions (`decodeInput`, `decodeOutput`, `decodeDeposit` and the portal deposit decoders) now also accept a `Uint8Array` (including subclasses like the Node.js `Buffer`), returning variable-size byte fields (`payload`, `execLayerData`, `baseLayerData`) as zero-copy subarrays of the input — no hex conversion or copying. Encode functions take an optional `to` parameter (`"hex"`, the default, or `"bytes"`) selecting the representation of the encoded data, and accept their byte fields in either representation. Hex in, hex out behavior is unchanged.
