---
"@cartesi/wagmi-plugin": minor
---

add the `prt` option to `rollupsContracts`, which additionally generates the PRT (Permissionless Refereed Tournaments) contracts from a [dave](https://github.com/cartesi/dave) release, defaulting to v3.0.0-alpha.4. PRT Rollups is a superset of the core rollups contracts — same `InputBox`, portals and factories, at the same addresses — so this adds to what `rollupsContracts()` generates rather than replacing it: dave does not rebuild the rollups contracts, so their ABIs still come from the `artifacts` tarball, while the addresses come from the dave release, which covers both.

A contract built by more than one of the tarballs is generated once, and its ABIs are compared as unordered sets of canonicalized entries, so that equivalent ABIs are not reported as conflicting because the compiler emitted their entries in a different order. Extraction directories are also now removed when a sibling download fails, not only when every download succeeds.
