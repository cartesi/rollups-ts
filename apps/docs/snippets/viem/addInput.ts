import {
    createCartesiPublicClient,
    getInputsAdded,
    walletActionsL1,
} from "@cartesi/viem";
import {
    createPublicClient,
    createWalletClient,
    http,
    stringToHex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { cannon } from "viem/chains";

async function main() {
    const chain = cannon;
    const account = privateKeyToAccount(
        "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
    );

    // create public client to chain default url
    const publicClient = createPublicClient({ chain, transport: http() });

    // create cartesi public client to L2 with RPC url
    const publicClientL2 = createCartesiPublicClient({
        transport: http("http://127.0.0.1:6751/rpc"),
    });

    // create extended wallet client to chain default url
    const walletClient = createWalletClient({
        chain,
        transport: http(),
    }).extend(walletActionsL1());

    // application address
    const { data: applications } = await publicClientL2.listApplications();
    if (applications[0]) {
        const application = applications[0].applicationAddress;

        // input payload
        const payload = stringToHex("hello");

        // send input transaction
        const hash = await walletClient.addInput({
            account,
            application,
            chain,
            payload,
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

            // get outputs produced by application
            const outputs = await publicClientL2.listOutputs({
                application,
                inputIndex,
            });
            console.log(outputs);
        }
    }
}

main();
