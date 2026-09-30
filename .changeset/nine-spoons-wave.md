---
"@cartesi/rpc": patch
---

Mirror the `INVALID_OUTPUTS_ROOT` status the node added.

`InputStatus` and `ApplicationStatus` each gain `INVALID_OUTPUTS_ROOT`. The node
added it to both `InputCompletionStatus` and `ApplicationStatus` in its OpenRPC
specification and attached no description to either, so what it reports is the
node's to define; this package only mirrors that the member exists.

Additive on the wire — an older client reading a node that reports it sees a
status it does not know rather than a malformed response. Breaking for a
consumer whose `switch` over either union is exhaustive, exactly as the earlier
additions to these unions were.
