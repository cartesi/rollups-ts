# Cartesi viem extension

Viem provides an [extension mechanism to clients](https://viem.sh/docs/clients/custom) that can provide a convenient and familiar API for application developers based on L2 solutions.

This extension provides L2 actions to interact with the Cartesi Rollups Node, and typed ABIs and addresses of the Cartesi Rollups smart contracts for L1 operations.

## PublicClient L2

The following methods are provided to interact with the Cartesi Rollups Node.

- listApplications
- listEpochs
- listInputs
- listOutputs
- listReports
- getApplication
- getEpoch
- getInput
- getOutput
- getReport
- getProcessedInputCount
- getLastAcceptedEpochIndex
- waitForInput

## L1 operations

Direct inputs such as deposits are sent to the base layer (L1). Those are regular contract interactions, best served by viem's own [contract actions](https://viem.sh/docs/contract/writeContract) combined with the typed ABIs and deployment addresses exported by `@cartesi/viem/abi`:

```typescript
import { inputBoxAbi, inputBoxAddress } from "@cartesi/viem/abi";

const hash = await walletClient.writeContract({
    abi: inputBoxAbi,
    address: inputBoxAddress,
    functionName: "addInput",
    args: [application, payload],
});
```

Users of [wagmi](https://wagmi.sh) can use the generated actions and React hooks from `@cartesi/wagmi`, or generate their own code using the `@cartesi/wagmi-plugin` plugin for `@wagmi/cli`.

## Sequencer transactions

Application transactions can be signed as EIP-712 `UserOp` messages and sent through a dedicated Cartesi sequencer client. For injected wallets such as MetaMask, pass a Wallet Client that the sequencer client can use only for signing:

```typescript
import { createSequencerClient } from "@cartesi/viem/sequencer";
import { createWalletClient, custom, http, stringToHex } from "viem";
import { foundry } from "viem/chains";

const [account] = await window.ethereum.request({
    method: "eth_requestAccounts",
});
const walletClient = createWalletClient({
    chain: foundry,
    transport: custom(window.ethereum),
});
const sequencerClient = createSequencerClient({
    account,
    application: "0x1111111111111111111111111111111111111111",
    chain: foundry,
    transport: http("http://127.0.0.1:3000"),
    walletClient,
});

const confirmation = await sequencerClient.sendTransaction({
    data: stringToHex("hello"), // application-defined SSZ method payload
    maxFee: 1200, // uint16 log-space fee exponent
    nonce: 0, // uint32 application nonce
});
```

For a local viem account, pass the account directly and omit `walletClient`. `sendTransaction` signs with the sequencer's canonical EIP-712 domain (`CartesiAppSequencer`, version `1`, the configured chain id and application address), submits to `POST /tx`, and resolves after the sequencer returns its soft confirmation. `signTransaction` and `submitTransaction` are also available when signing and submission need to happen separately.

The sequencer currently does not expose nonce or fee-discovery endpoints. Applications should obtain those values from their application state or indexer. Submission is not retried automatically because a timed-out request may already have been committed.

## Utilities

- getInputsAdded: get the input(s) added to the InputBox given a `TransactionReceipt`.
- getOutputsExecuted: get the output(s) executed by an application given a `TransactionReceipt`.
- toOutputArgs: convert an `Output` returned by the node API into the arguments of `IApplication.executeOutput` / `IApplication.validateOutput`.

```typescript
const receipt = await publicClient.waitForTransactionReceipt({ hash });
const [inputAdded] = getInputsAdded(receipt);
```

## Example

Find below a complete example of sending an input and waiting for its effect on L2.

```typescript
import { createCartesiPublicClient, getInputsAdded } from "@cartesi/viem";
import { inputBoxAbi, inputBoxAddress } from "@cartesi/viem/abi";
import { createPublicClient, createWalletClient, http, stringToHex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { foundry } from "viem/chains";

async function main() {
    const chain = foundry;
    const account = privateKeyToAccount(
        "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
    );

    // create public client to chain default url
    const publicClient = createPublicClient({ chain, transport: http() });

    // create cartesi public client to L2 with RPC url
    const publicClientL2 = createCartesiPublicClient({
        transport: http("http://127.0.0.1:6751/rpc"),
    });

    // create wallet client to chain default url
    const walletClient = createWalletClient({ account, chain, transport: http() });

    // application address
    const application = "0xab7528bb862fb57e8a2bcd567a2e929a0be56a5e";

    // send input transaction
    const hash = await walletClient.writeContract({
        abi: inputBoxAbi,
        address: inputBoxAddress,
        functionName: "addInput",
        args: [application, stringToHex("hello")],
    });

    // wait for receipt
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    // get input index from receipt
    const [inputAdded] = getInputsAdded(receipt);
    if (inputAdded) {
        const { index: inputIndex } = inputAdded;

        // wait for input to be processed
        const input = await publicClientL2.waitForInput({
            application,
            inputIndex,
        });
        console.log(input);
    }
}

main();
```
