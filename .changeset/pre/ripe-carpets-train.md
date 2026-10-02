---
"@cartesi/client": patch
---

Mirror the `@cartesi/rpc` changes for the node's terminal machine outcomes and
state proofs.

`Epoch` loses `outputsMerkleRoot` and `outputsMerkleProof` and gains
`txBufferDataBlock`/`txBufferProof`, `iflagsYDataBlock`/`iflagsYProof` and
`htifTohostDataBlock`/`htifTohostProof`, each proved against `machineHash`. The
node no longer serves the outputs Merkle root at all — read it from the L1
`Outputs` contract instead. The `outputsMerkleRoot` exported through
`@cartesi/client/abi` is a different thing and is unchanged.

`Input.outputsHash` is now `txBufferDataBlock`. This is a change of meaning,
not a rename: the field was a digest of the input's outputs and is now the
32-byte CMIO TX-buffer memory block of the machine state the input produced.
Renaming the property without revisiting what you do with the value is wrong.

`InputStatus` gains `OVERFLOW` and `UNEXPECTED_YIELD`; `ApplicationStatus`
gains `GUEST_EXCEPTION`, `MACHINE_HALTED`, `MCYCLE_OVERFLOW` and
`UNEXPECTED_YIELD`. An exhaustive `switch` over either union no longer
compiles. `reason` is non-null for every status but `OK`.

`waitForInput` with `rejectErrors` now aborts on any status that is neither
`NONE` nor `ACCEPTED`, so it covers the two new outcomes. It is checked by
exclusion rather than by listing the terminal statuses, so a status the node
adds later aborts instead of resolving as a success. `waitProcessing` still
governs `NONE` on its own.
