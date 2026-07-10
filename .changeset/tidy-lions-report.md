---
"@cartesi/rpc": patch
---

propagate transport failures (network errors, non-200 responses, invalid JSON) to pending requests instead of hanging forever
