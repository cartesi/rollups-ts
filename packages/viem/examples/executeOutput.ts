import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { cannon } from "viem/chains";
import {
    createCartesiPublicClient,
    getOutputsExecuted,
    publicActionsL1,
    walletActionsL1,
} from "../src";

async function main() {
    const chain = cannon;
    const account = privateKeyToAccount(
        "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
    );

    // create public client to chain default url
    const publicClient = createPublicClient({
        chain,
        transport: http(),
    }).extend(publicActionsL1());

    // create cartesi public client to L2 with RPC url
    const publicClientL2 = createCartesiPublicClient({
        transport: http("http://localhost:8080/rpc"),
    });

    // create extended wallet client to chain default url
    const walletClient = createWalletClient({
        chain,
        transport: http(),
    }).extend(walletActionsL1());

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

        const isValid = await publicClient.validateOutput({
            application,
            output,
        });

        if (!isValid) {
            throw new Error(`Output ${output.index} is invalid`);
        }

        // execute output
        const hash = await walletClient.executeOutput({
            account,
            application,
            chain,
            output,
        });

        // wait for receipt
        const receipt = await publicClient.waitForTransactionReceipt({
            hash,
            timeout: 6000,
        });

        // get input index from receipt
        const [execution] = getOutputsExecuted(receipt);
        if (execution) {
            console.log(`Output ${execution.outputIndex} executed`);
        }
    }
}

main();
