import { cartesi } from "@cartesi/client/chains";
import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import {
    createCartesiPublicClient,
    getOutputsExecuted,
    toOutputArgs,
} from "../src";
import { iApplicationAbi } from "../src/rollups";

async function main() {
    const chain = cartesi;
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
    const walletClient = createWalletClient({
        account,
        chain,
        transport: http(),
    });

    // application address
    const applications = await publicClientL2.listApplications();
    if (applications.data[0]) {
        const application = applications.data[0].applicationAddress;

        // output index
        const outputIndex = 0n;

        const output = await publicClientL2.getOutput({
            application,
            outputIndex,
        });
        console.log(output);

        // convert output to `IApplication.executeOutput` arguments
        const args = toOutputArgs(output);

        // validateOutput reverts if the output is invalid
        await publicClient.readContract({
            abi: iApplicationAbi,
            address: application,
            functionName: "validateOutput",
            args,
        });

        // execute output
        const hash = await walletClient.writeContract({
            abi: iApplicationAbi,
            address: application,
            functionName: "executeOutput",
            args,
        });

        // wait for receipt
        const receipt = await publicClient.waitForTransactionReceipt({
            hash,
            timeout: 6000,
        });

        // get output index from receipt
        const [execution] = getOutputsExecuted(receipt);
        if (execution) {
            console.log(`Output ${execution.outputIndex} executed`);
        }
    }
}

main();
