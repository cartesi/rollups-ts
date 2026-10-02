---
"@cartesi/rpc": patch
---

Track the terminal machine outcomes and state proofs the node added to its
JSON-RPC API.

`Epoch` loses `outputs_merkle_root` and `outputs_merkle_proof` — the node no
longer serves the outputs Merkle root — and gains three data-block/proof pairs,
each proved against `machine_hash`: `tx_buffer_data_block`/`tx_buffer_proof`
for the CMIO TX buffer, `iflags_y_data_block`/`iflags_y_proof` for the
`iflags.Y` register, and `htif_tohost_data_block`/`htif_tohost_proof` for the
HTIF `tohost` register.

`Input.outputs_hash` is now `tx_buffer_data_block`. This is a change of
meaning, not a rename: the field was a digest of the input's outputs and is now
the 32-byte CMIO TX-buffer memory block of the machine state the input
produced.

`InputStatus` gains the terminal `OVERFLOW` and `UNEXPECTED_YIELD` — new
outcomes, not replacements for the resource-limit statuses the node removed
earlier. `ApplicationStatus` gains `GUEST_EXCEPTION`, `MACHINE_HALTED`,
`MCYCLE_OVERFLOW` and `UNEXPECTED_YIELD`. An exhaustive `switch` over either
union no longer compiles.

`Application.reason` is non-null for every status but `OK`, where it was
previously documented as non-null only for `FAILED`, `DIVERGED` and
`CORRUPTED`. Foreclosure is still reported via `foreclose_block`, not via
`status`.
