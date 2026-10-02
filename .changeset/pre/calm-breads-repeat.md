---
"@cartesi/wagmi-plugin": patch
---

Export `prtInternals`, the PRT contracts an application has no use for.

Pass it as `exclude` alongside `prt: true` to generate only the surface a
consumer calls:

```ts
rollupsContracts({ prt: true, exclude: prtInternals });
```

It covers three kinds of contract: `Tournament` and `DaveConsensus`, which are
reached through `ITournament` and `IDaveConsensus` because an application holds
the address of a tournament the factory created rather than of a published
deployment; `IOwnable` and `ERC165`, which are generic plumbing; and fourteen
libraries and error-only ABIs with no functions and no events at all.

Nothing is excluded by default, so what `rollupsContracts()` generates is
unchanged.
