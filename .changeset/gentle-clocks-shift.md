---
"@cartesi/client": major
"@cartesi/react": major
---

regenerate the PRT contracts from dave 3.0.0-beta.1. Every PRT address changed, `DaveAppFactory`, `CartesiStateTransition` and `MultiLevelTournamentFactory` among them, and `calculateDaveAppAddress` returns other addresses than before for the same arguments. The state transition now qualifies Cartesi Machine v0.23, so templates built with v0.22 are refused.
