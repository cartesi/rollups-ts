---
"@cartesi/rpc": patch
---

Update RPC types and methods. It has breaking changes.

- Added new EpochStatus [CLAIM_REJECTED, CLAIM_FORECLOSED]
- Rename ApplicationState to ApplicationStatus. It has a new union [OK, FAILED, DIVERGED, CORRUPTED]. ENABLED and DISABLED states were removed.
- Application has a new property called `enabled`.
- Added new fields to the Application type.
- New Withdrawal type added.
- Added new json rpc methods [cartesi_getWithdrawal, cartesi_listWithdrawals]
