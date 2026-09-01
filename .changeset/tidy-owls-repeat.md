---
"@cartesi/wagmi-plugin": patch
---

upgrade modern-tar to 0.8.4. Its 0.8.0 breaking changes are all in the web entrypoint, which this package does not use: the `unpackTar` signature, its options and its path-traversal guards are unchanged.
