---
"@cartesi/cm-playground": minor
---

load and store machine snapshots: the playground now takes a machine from a stored one as well as from the form, and hands back a snapshot of whatever it is running

A snapshot is the directory `cartesi-machine --store=<dir>` writes, tarred up. **Load a snapshot** fetches one from a URL or a file, unpacks it into the emulator's filesystem and `load()`s it, resuming at the cycle it was stored at rather than booting from scratch — gunzipping it first if it needs it, and finding the machine through a wrapping directory when the tarball has one. **Store**, in the run bar, catches the machine as it stands: it is packed, gzipped (a fresh machine is mostly untouched memory, so this is a factor of hundreds) and filed in the snapshot library, from where it loads again or downloads as a `.tar.gz` that `tar -xzf` opens.

Neither copy outlives what needs it — a snapshot is as big as the machine inside it, so the unpacked directory goes as soon as `load()` has read it and the stored one as soon as it has been tarred. The run statistics follow the machine: a loaded one starts at the cycle it was stored at, so the speed and the cycle limit both count from where this run began.
