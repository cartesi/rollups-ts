---
"@cartesi/machine": patch
---

read the snapshot tarballs other tars write: sparse entries, pax extended headers and GNU long names

A stored machine is the worst case for tar. A RAM image and drives that are mostly untouched are files full of holes, and libarchive — the `tar` on macOS — records those sparsely without being asked, in GNU's 1.0 format, where the name in the entry header is a decoy (`GNUSparseFile.0/ram.bin`) and the real one is in a pax record. `writeSnapshot` wrote the decoy and dropped the file, so `load()` failed later with `unable to open backing file '…/0000000080000000-8000000.bin': No such file or directory`. GNU tar's own `--sparse` broke it differently: the continuation blocks holding the sparse map were read as a header, which failed the checksum.

All three sparse dialects are now expanded (GNU 1.0, 0.1 and old-GNU `S`), pax extended headers are parsed for `path` and the `GNU.sparse.*` records, and GNU long-name entries are honoured. Two silences are gone with them: an archive that stops early is refused instead of unpacking as far as it got — which is how a truncated download turned into a missing-file error much later — and an entry the reader cannot represent is refused instead of skipped. Entries that reach outside the snapshot directory are refused outright.
