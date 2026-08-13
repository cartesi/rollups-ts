# @cartesi/rollup

## 1.0.0-alpha.1

### Major Changes

-   909197a: `Rollup.run` now resolves when the host mock runs out of inputs, instead of rejecting.

    The `finish` call sat outside the loop's `try`, so the failure libcmt's mock IO driver raises when the `CMT_INPUTS` list is exhausted — the normal end of a host test run — escaped as an unhandled rejection, and every successful run exited non-zero. `run` now catches it and returns.

    The mock reports exhaustion with two different errnos for the same condition, depending on how the last request ended: `-ENODATA` after an accepted one, `-ENOSYS` after a rejected one (`io-mock.c`, `mock_rx_accepted` vs `mock_rx_rejected`). Both are recognized, so applications that reject their last input also exit cleanly. The errno values are read from `node:os` rather than hardcoded, since they differ between Linux and macOS.

    Because `-ENOSYS` ("function not implemented") is a plausible genuine failure from a real device, it is only treated as an end of run when the addon was built against the mock driver. To make that check honest, the native addon now reports which libcmt IO driver it was compiled against, and the package exports it as `driver` (`"ioctl"` inside a Cartesi Machine, `"mock"` on a development host), typed `RollupDriver`. The driver is selected by `binding.gyp` from the target architecture at build time, so this is more reliable than sniffing `CMT_INPUTS`, and it makes the `-ENOSYS` special case provably unreachable in a real machine. Any other `finish` failure — including `-ENODATA` from a real device, where the loop is meant to run forever — still rejects.

    **Breaking (types):** `run` returns `Promise<void>` instead of `Promise<never>`. Code that relied on `never` (for control-flow narrowing after `await rollup.run(...)`, or assigning the result to a `never`-typed position) no longer type-checks. Host tests that wrapped the loop in a `.catch(() => {})` to swallow the exhaustion error can drop it — they now hide real errors instead.

### Minor Changes

-   ef98dd8: add `chain` and `broadcast`, which fold several handlers into the single one `run` takes per request kind: `chain` offers the request to each in turn and stops at the first that accepts, `broadcast` offers it to all of them. Composed handlers must return a real `boolean` — inside a composition the return value is a claim on the request, not the input's verdict, so unlike `run` (where a handler that returns nothing accepts) a missing answer has no sensible default and is a type error, and a `TypeError` for callers without types. `run` itself is unchanged. Also exports the handler types the composers work with: `RequestHandler`, `AdvanceRequestHandler` and `InspectRequestHandler`

## 1.0.0-alpha.0

### Major Changes

-   9e88910: Add `@cartesi/rollup`, Node.js bindings for libcmt (the Cartesi Machine guest rollup library), imported from `@deroll/cmio`. Lets applications running inside a Cartesi Machine handle advance/inspect requests and emit vouchers, notices, reports and exceptions without the rollup HTTP server. Documented under `/rollup` in the docs site.
