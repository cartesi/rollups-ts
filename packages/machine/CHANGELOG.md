# @cartesi/machine

## 1.0.0-alpha.1

### Minor Changes

- 43428ef: run machines in the browser: `@cartesi/machine/wasm` binds the same API to libcartesi compiled by Emscripten (identical root hashes to the native build, at roughly its speed), `@cartesi/machine/worker` proxies that API into a worker so a page stays responsive, and `connectHttp()` drives a `cartesi-jsonrpc-machine` server over fetch. Local rollups machines now roll a rejected input back through a snapshot instead of leaving the machine dirty, and stored machines move as tar archives.
  
  `readConsoleOutput()` and `writeConsoleInput()` expose the emulator's host-driven console, which is what an interactive terminal is made of: point the runtime configuration's console at the buffers and `run` returns `ConsoleOutput` when the guest has printed and `ConsoleInput` when it is waiting for a keystroke. `HtifConsoleMask` names the `htif.iconsole` bits that give a guest a keyboard.
  
  Two source-level changes come with it: byte blobs in the public types are `Uint8Array` rather than `Buffer` (a `Buffer` still satisfies them, but `data.toString("utf-8")` on a result becomes `new TextDecoder().decode(data)`), and the constructors — `create`, `load`, `empty`, `verifyStep` and the rest — are exported by the package entry point rather than by `src/cartesi-machine.ts`, which is now declarations only. Importing from `@cartesi/machine` is unaffected.

### Patch Changes

- e00fb19: ship the Apache-2.0 licence with the package: every tarball now carries `LICENSE` and `NOTICE`, and the packages that declared no `license` field (`client`, `codec`, `rpc`, `react`, `wagmi-plugin`) declare `Apache-2.0`
- 43428ef: guest networking: a machine with a virtio `net-user` device now works, instead of taking the process down
  
  The addon never linked libslirp — the library behind user-mode networking — and stubbed out the symbols `libcartesi.a` references, so a machine configured with a network device called a stub that `abort()`ed. It now defines those symbols itself and loads the real library on the first call, which means a prebuilt addon gains networking wherever libslirp is installed (`apt install libslirp0`, `brew install libslirp`, or `CARTESI_SLIRP_LIB` for a copy elsewhere) with no rebuild, and reports a `MachineError` naming what to install where it is not. `CARTESI_SLIRP=yes` still links it directly.
  
  `getSlirpVersion()` reports which of the two you have — `null` in the WebAssembly build, which has no networking at all. `NET_INIT`, `NET_USER`, `ipv4()` and `hostfwd()` cover the guest side: the addresses libslirp fixes, the commands that bring `eth0` up, and the port forwarding that is the only way into a machine behind a NAT.

## 1.0.0-alpha.0

### Major Changes

-   8adc8cd: Add `@cartesi/machine`, Node.js bindings for the Cartesi Machine emulator, imported from `@deroll/cm`. A native N-API addon over the official emulator distribution's static libraries, for creating, running, snapshotting and inspecting machines in-process or out-of-process over JSON-RPC, plus a rollups machine driving advance and inspect requests. Prebuilt per-platform packages bundle the addon and the `cartesi-jsonrpc-machine` server. Documented under `/machine` in the docs site.
