---
"@cartesi/react": patch
---

Make the `params` argument optional for `useChainId` and `useNodeVersion`, so they can be called with no argument (`useChainId()` instead of `useChainId({})`). Both hooks only accept the optional query-options object, so the empty object was never required. The change is backward compatible.
