---
"@cartesi/machine": patch
---

guest networking: a machine with a virtio `net-user` device now works, instead of taking the process down

The addon never linked libslirp — the library behind user-mode networking — and stubbed out the symbols `libcartesi.a` references, so a machine configured with a network device called a stub that `abort()`ed. It now defines those symbols itself and loads the real library on the first call, which means a prebuilt addon gains networking wherever libslirp is installed (`apt install libslirp0`, `brew install libslirp`, or `CARTESI_SLIRP_LIB` for a copy elsewhere) with no rebuild, and reports a `MachineError` naming what to install where it is not. `CARTESI_SLIRP=yes` still links it directly.

`getSlirpVersion()` reports which of the two you have — `null` in the WebAssembly build, which has no networking at all. `NET_INIT`, `NET_USER`, `ipv4()` and `hostfwd()` cover the guest side: the addresses libslirp fixes, the commands that bring `eth0` up, and the port forwarding that is the only way into a machine behind a NAT.
