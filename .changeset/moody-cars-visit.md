---
"@cartesi/react": patch
---

Stop generating the PRT contracts an application has no use for.

Codegen now excludes `prtInternals`, the same list `@cartesi/client` excludes,
so the two packages agree on which contracts exist. This cuts the generated
output from 1745 exports to 1535 and the package's declaration file from
19.7 MB to 15.0 MB, which also brings the build back within the memory a 2 GB
Node heap allows.

What this removes:

- The `Tournament` hooks, ABI, address and config. Claim a bond through
  `useWriteITournamentTryRecoveringBond` and
  `useSimulateITournamentTryRecoveringBond`, passing the address of the
  tournament: a tournament is created per dispute by
  `MultiLevelTournamentFactory`, so the generated address was one devnet
  instance, never the contract a consumer calls. `ITournament` declares the
  same eight events and all but one of the functions: the ERC-165
  `supportsInterface` probe is on the concrete contract only.
- The `DaveConsensus` hooks and ABI — likewise `IDaveConsensus`, with the
  consensus address of the application.
- The `IOwnable` and `ERC165` hooks and ABIs, which are generic plumbing.
- Fourteen libraries and error-only ABIs with no functions and no events at
  all, which generated an ABI and no hooks: `AddressErrors`,
  `ApplicationChecker`, `IApplicationChecker`, `IApplicationFactoryErrors`,
  `BinaryMerkleTreeErrors`, `Clones`, `Create2`, `Errors`,
  `IRefundOutputBuilderErrors`, `ISentryErrors`,
  `IWithdrawalOutputBuilderErrors`, `LibMath`, `MachineValidationErrors` and
  `SafeCast`.

Every other hook, ABI and address is unchanged, `daveAppFactory` and
`multiLevelTournamentFactory` included, as are all of the `publicL2` hooks.
