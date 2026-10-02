---
"@cartesi/client": patch
---

Stop generating the PRT contracts an application has no use for.

Codegen now excludes `prtInternals`, so `@cartesi/client/abi` carries only the
contracts a consumer calls. The same list is excluded in `@cartesi/react`, so
the two packages agree on which contracts exist.

What this removes:

- `tournamentAbi`, `tournamentAddress` and `tournamentConfig` — use
  `iTournamentAbi` with the address of the tournament you are acting on. A
  tournament is created per dispute by `MultiLevelTournamentFactory`, so the
  address that was generated here was one devnet instance, never the contract a
  consumer calls.
- `daveConsensusAbi` — likewise `iDaveConsensusAbi`, with the consensus address
  of the application. It had no generated address either way, being deployed
  per application rather than published.
- `iOwnableAbi` and `erc165Abi`, which are generic plumbing.
- Fourteen libraries and error-only ABIs with no functions and no events at
  all: `addressErrorsAbi`, `applicationCheckerAbi`, `iApplicationCheckerAbi`,
  `iApplicationFactoryErrorsAbi`, `binaryMerkleTreeErrorsAbi`, `clonesAbi`,
  `create2Abi`, `errorsAbi`, `iRefundOutputBuilderErrorsAbi`,
  `iSentryErrorsAbi`, `iWithdrawalOutputBuilderErrorsAbi`, `libMathAbi`,
  `machineValidationErrorsAbi` and `safeCastAbi`.

Every other contract, ABI and address is unchanged, `daveAppFactory` and
`multiLevelTournamentFactory` included.
