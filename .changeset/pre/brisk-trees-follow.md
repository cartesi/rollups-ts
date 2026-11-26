---
"@cartesi/wagmi-plugin": patch
---

Move the default dave release to 3.0.0-beta.1.

It is a new deployment generation built against rollups-contracts 3.0.0-beta.1, so every PRT address moves along with the rollups contracts it shares. dave's own `IApplicationFactory` gains the reserved deployment functions, and no other ABI changed.
