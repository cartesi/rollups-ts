# Cartesi Machine Playground

A page that builds a Cartesi Machine from a form and boots it in the tab —
kernel, filesystems, drives, entrypoint, environment, console — with the
guest's terminal on the other half of the screen. The emulator is
`@cartesi/machine/wasm`, running in a worker; the Next.js server it is served
from does one thing besides serving the page, which is fetch guest images the
browser is not allowed to fetch itself.

```bash
pnpm --filter @cartesi/cm-playground dev
```

Then open <http://localhost:3000>.

This app depends on the **published** `@cartesi/machine`, not on the one in
this workspace. The published package carries the emulator module inside it,
so building and deploying the app needs no emulator installation, no Docker and
no compiler — which is the whole point: it is deployable from a checkout. The
cost is that the app does not exercise local changes to `packages/machine`;
bump the version in `package.json` to pick those up once they are released.

The first thing to do in the page is give it a kernel and a filesystem. The
Images panel has both; **fetch** puts one in the library, and they are kept in
IndexedDB, so that happens once per browser rather than once per reload.

## What it is for

Everything the emulator will accept, in one place, where the effect of changing
it is a boot away:

- **Images** — the release kernel and rootfs by name, any URL, or a local file.
- **Machine** — RAM size, the root filesystem, and any number of extra flash
  drives (label, image, size, start, read-only), which the guest sees as
  `/dev/pmem1` and up.
- **Boot** — entrypoint, environment variables, working directory, user,
  hostname, an init script, and the kernel command line if the generated one is
  not what you want.
- **Console** — interactive or not, VirtIO or HTIF, and how eagerly output is
  flushed.
- **Advanced** — `iunrep`, `imcyclemax`, soft yield, and a cycle limit for the
  page's own run loop.

The **Configuration** panel shows the `MachineConfig` and `MachineRuntimeConfig`
the form adds up to, which is exactly what `create()` is called with. It is
worth reading: the form is a convenience, and the JSON is the truth.

## Where the images come from

`/api/images` fetches a release asset and hands it back on this origin, because
the page cannot read one itself: GitHub serves release assets with no
`access-control-allow-origin` — on the redirect and on the storage it points at
— so the browser refuses the response before the page sees a status. A request
to this app's own server has no such rule to answer to. The body is streamed
through rather than buffered; a rootfs is a third of a gigabyte.

`src/images/hosts.ts` names the sites it will do that for, and both halves read
it: a proxy that fetches whatever it is handed is a way into whatever network
it runs in. A URL anywhere else is fetched by the browser directly and needs
that site's own headers to allow it — or, failing that, download the file and
add it with **add a file**.

## How the terminal works

There is no pseudo-terminal layer and nothing suspends. The runtime
configuration points the console at buffers, `run` returns
`BreakReason.ConsoleOutput` when the guest has printed and
`BreakReason.ConsoleInput` when it wants a keystroke, and `runner.worker.ts`
drains one buffer and fills the other between slices of cycles. xterm.js sits at
the other end with nothing in between — the guest is running Linux and does its
own echoing, line editing and `Ctrl+C`.

With the VirtIO console the guest also learns the window size, so resizing the
browser reaches it as `SIGWINCH` and `stty size` agrees with what is on screen.
The HTIF console cannot do that, and is there because it needs no device.

## Determinism

An interactive machine is an unreproducible one (`iunrep = 1`), which the
emulator insists on before it will accept console input at all: keystrokes and
their timing are not part of the machine state, so a machine that reads them
cannot be replayed.

Turn Interactive off and the machine is reproducible again — same root hash as
the native binding, for the same configuration and cycle count.

## Notes

- The emulator module comes with the published package, and the bundler
  splits it into a chunk of its own, fetched on the first boot rather than
  with the page.
- Machines run in a worker, because `run` occupies the thread it is called on.
- The page is entirely a client component: it talks to IndexedDB, a worker and
  a terminal, and there is nothing here a server could usefully render first.
- Images live in this browser's IndexedDB. Removing one from the library frees
  the space; nothing is uploaded anywhere.
