import { createPublicClient, createWalletClient, http, parseUnits } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { cannon } from "viem/chains";
import {
    createCartesiPublicClient,
    getInputsAdded,
    walletActionsL1,
} from "../src";

async function main() {
    const chain = cannon;
    const account = privateKeyToAccount(
        "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
    );

    // create public client to chain default url
    const publicClient = createPublicClient({ chain, transport: http() });

    // create cartesi public client to L2 with RPC url
    const publicClientL2 = createCartesiPublicClient({
        transport: http("http://localhost:8080/rpc"),
    });

    // create extended wallet client to chain default url
    const walletClient = createWalletClient({
        chain,
        transport: http(),
    }).extend(walletActionsL1());

    // token address
    const token = "0x92C6bcA388E99d6B304f1Af3c3Cd749Ff0b591e2";

    const { data: applications } = await publicClientL2.listApplications();
    if (applications[0]) {
        // application address
        const application = applications[0].applicationAddress;

        // send deposit transaction
        const hash = await walletClient.depositERC20Tokens({
            account,
            application,
            chain,
            token,
            amount: parseUnits("1", 18),
            execLayerData: "0x",
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
