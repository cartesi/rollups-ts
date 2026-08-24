---
"@cartesi/rollup": minor
---

add `chain` and `broadcast`, which fold several handlers into the single one `run` takes per request kind: `chain` offers the request to each in turn and stops at the first that accepts, `broadcast` offers it to all of them. Composed handlers must return a real `boolean` — inside a composition the return value is a claim on the request, not the input's verdict, so unlike `run` (where a handler that returns nothing accepts) a missing answer has no sensible default and is a type error, and a `TypeError` for callers without types. `run` itself is unchanged. Also exports the handler types the composers work with: `RequestHandler`, `AdvanceRequestHandler` and `InspectRequestHandler`
