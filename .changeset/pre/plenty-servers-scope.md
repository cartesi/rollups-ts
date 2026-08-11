---
"@cartesi/react": minor
---

include the server URL in all publicL2 query keys. Every hook's react-query key is now prefixed with the client's node URL (`[serverUrl, method, params]`), so caches no longer collide when an app points at more than one Cartesi node (e.g. a server switcher). The URL comes from the client's transport (falling back to `client.uid` for custom transports without one), so the cache survives provider remounts and revives when switching back to a previously used server.

Also exports a `*QueryKey(client, params)` constructor for every method (`inputQueryKey`, `epochQueryKey`, `outputsQueryKey`, …) alongside the `*Options` factories and the `serverUrl(client)` helper. These are the supported way to build keys for manual `queryClient` operations: they own the URL prefix and the bigint-to-string normalization the keys depend on, so callers no longer have to reproduce that (a hand-built `inputIndex: 5n` would silently fail to match the stored `"5"`). Each `*Options` factory now builds its key through the matching `*QueryKey`, so the two can never drift.

**Breaking for consumers that build query keys by hand**: the key shape changed, so any manual `queryClient.invalidateQueries`/`removeQueries`/`setQueryData` call with a hardcoded key like `["input", ...]` must be rebuilt via the exported `*QueryKey`/`*Options` constructors (or the `serverUrl(client)` helper for coarse, server-wide invalidation like `invalidateQueries({ queryKey: [serverUrl(client)] })`). Hooks are unaffected.
