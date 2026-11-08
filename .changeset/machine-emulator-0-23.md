---
"@cartesi/machine": minor
---

target cartesi-machine emulator 0.23: `create` takes the sharing mode of a machine created on disk (`SharingMode.All` by default, as before), `removeStored` takes a `RemoveMode` so that the directory an interrupted store leaves behind can be removed (`RemoveMode.Forced`), `clearHashTree` and the `clear_hash_tree` runtime option rebuild the hash tree from scratch, and the WebAssembly module ABI goes to 3. The WebAssembly and HTTP bindings now default `store` to `SharingMode.All`, as the Node binding and the documentation already did
