---
"@cartesi/machine": minor
---

run machines in the browser: `@cartesi/machine/wasm` binds the same API to libcartesi compiled by Emscripten (identical root hashes to the native build, at roughly its speed), `@cartesi/machine/worker` proxies that API into a worker so a page stays responsive, and `connectHttp()` drives a `cartesi-jsonrpc-machine` server over fetch. Local rollups machines now roll a rejected input back through a snapshot instead of leaving the machine dirty, and stored machines move as tar archives.

`readConsoleOutput()` and `writeConsoleInput()` expose the emulator's host-driven console, which is what an interactive terminal is made of: point the runtime configuration's console at the buffers and `run` returns `ConsoleOutput` when the guest has printed and `ConsoleInput` when it is waiting for a keystroke. `HtifConsoleMask` names the `htif.iconsole` bits that give a guest a keyboard.

Two source-level changes come with it: byte blobs in the public types are `Uint8Array` rather than `Buffer` (a `Buffer` still satisfies them, but `data.toString("utf-8")` on a result becomes `new TextDecoder().decode(data)`), and the constructors — `create`, `load`, `empty`, `verifyStep` and the rest — are exported by the package entry point rather than by `src/cartesi-machine.ts`, which is now declarations only. Importing from `@cartesi/machine` is unaffected.
