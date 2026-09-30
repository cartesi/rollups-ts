---
"@cartesi/client": patch
---

Mirror the `INVALID_OUTPUTS_ROOT` status the node added.

`InputStatus` and `ApplicationStatus` each gain `INVALID_OUTPUTS_ROOT`, widening
the unions `Input.status` and `Application.status` carry. Both are re-exported
from `@cartesi/rpc` and the converter passes `status` through untouched, so
nothing in this package's source changed.

Additive on the wire, breaking for a consumer whose `switch` over either union
is exhaustive — the same caveat the earlier additions to these unions carry.

`waitForInput` needs no change and neither does your call to it. `rejectErrors`
aborts on any status that is neither `NONE` nor `ACCEPTED`, so it treats a
status the node adds later as a failure rather than mistaking it for success.
That is why it was written by exclusion.
