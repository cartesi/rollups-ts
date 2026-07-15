---
"@cartesi/viem": major
---

Remove custom L1 actions in favor of plain viem contract actions.

The `addInput`, `depositEther`, `depositERC20Tokens`, `depositERC721Token`, `depositSingleERC1155Token`, `depositBatchERC1155Token`, `executeOutput`, `validateOutput` actions, all `estimate*Gas` actions, and the `walletActionsL1` / `publicActionsL1` decorators were removed. Use viem's own `writeContract` / `readContract` / `estimateContractGas` with the typed ABIs and addresses exported by `@cartesi/viem/abi`, the generated actions and hooks of `@cartesi/wagmi`, or generate your own code with `@cartesi/wagmi-plugin`.

The new `toEVM` export converts an `Output` returned by the node API into the arguments of `IApplication.executeOutput` / `IApplication.validateOutput`. Note that `IApplication.validateOutput` reverts when the output is invalid, unlike the removed `validateOutput` action which returned `false`.
