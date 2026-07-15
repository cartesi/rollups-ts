---
"@cartesi/wagmi-plugin": patch
---

apply `include`/`exclude` to all contracts, deployed or not: when neither is given all contracts in the artifacts are included, `include` narrows generation to the matching contracts, and `exclude` is applied after `include`. Deployed contracts are no longer implicitly included, so configs relying on that must list them in `include`.
