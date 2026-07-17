---
"@cartesi/wagmi": minor
---

include the server URL in all publicL2 query keys. Every hook's react-query key is now prefixed with the client's node URL (`[serverUrl, method, params]`), so caches no longer collide when an app points at more than one Cartesi node (e.g. a server switcher). The URL comes from the client's transport (falling back to `client.uid` for custom transports without one), so the cache survives provider remounts and revives when switching back to a previously used server.

**Breaking for consumers that build query keys by hand**: the key shape changed, so any manual `queryClient.invalidateQueries`/`removeQueries`/`setQueryData` call with a hardcoded key like `["input", ...]` must be rebuilt. Use the now-exported `*Options` factories (e.g. `inputOptions(client, params).queryKey`) or the exported `serverUrl(client)` helper to construct keys; hooks are unaffected.
