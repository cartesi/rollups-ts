# @cartesi/codec

## 1.0.0-alpha.0

### Major Changes

-   f7c9d3b: first release of the codec package, with isomorphic utility functions to decode (and encode, for testing) data compliant with the rollups contracts `Inputs` and `Outputs` interfaces, and portal deposit payloads packed-encoded by the `InputEncoding` library

### Minor Changes

-   cc25b1a: Support byte arrays alongside hex strings in all codec functions. Decode functions (`decodeInput`, `decodeOutput`, `decodeDeposit` and the portal deposit decoders) now also accept a `Uint8Array` (including subclasses like the Node.js `Buffer`), returning variable-size byte fields (`payload`, `execLayerData`, `baseLayerData`) as zero-copy subarrays of the input — no hex conversion or copying. Encode functions take an optional `to` parameter (`"hex"`, the default, or `"bytes"`) selecting the representation of the encoded data, and accept their byte fields in either representation. Hex in, hex out behavior is unchanged.
