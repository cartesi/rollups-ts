---
"@cartesi/react": patch
---

Carry the node JSON-RPC changes of `@cartesi/client` through the hooks.

No hook changed: each one infers its result from the client action it wraps, so
the new shapes arrive on their own. What that means for consumers:

- `useEpoch`, `useEpochByVirtualIndex` and `useEpochs` no longer expose
  `outputsMerkleRoot`/`outputsMerkleProof`, and expose the new TX-buffer,
  `iflags.Y` and HTIF `tohost` data blocks and proofs instead.
- `useInput`, `useInputs` and `useWaitForInput` expose `txBufferDataBlock`
  where the data previously had `outputsHash` — a change of meaning, not just
  a rename.
- The `InputStatus` and `ApplicationStatus` unions the data carries gained
  members, so an exhaustive `switch` over either no longer compiles.
- `useWaitForInput` inherits the `rejectErrors` change: it now fails on any
  status that is neither `NONE` nor `ACCEPTED`.
