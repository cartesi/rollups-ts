---
"@cartesi/wagmi-plugin": patch
---

Move the default PRT release to dave `v3.0.0-alpha.5`.

`PRT_DEFAULT_VERSION` and the three tarball hashes move to alpha.5. For this
package the release is a version-and-hash bump: every contract ABI is identical
to alpha.4, and the dave commits since are node-side.

The pairing is unchanged. alpha.5 is still deployed against the
rollups-contracts `v3.0.0-alpha.10` release that `artifacts` defaults to, and
every address the two releases share matches on all eight public chains, so the
cross-check that guards a mismatched pairing passes. The devnet tarball is still
anvil `1.5.1`, so `PRT_DEFAULT_ANVIL_VERSION` stays.

`prt.artifacts`, `prt.deployments` and `prt.anvil` still point wherever you aim
them, so pinning alpha.4 is a matter of passing its three tarballs — the
documented example does exactly that.
