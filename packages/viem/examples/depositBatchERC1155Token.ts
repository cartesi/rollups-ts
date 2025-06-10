import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { foundry } from "viem/chains";
import {
    createCartesiPublicClient,
    getInputsAdded,
    walletActionsL1,
} from "../src";

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

    // create extended wallet client to chain default url
    const walletClient = createWalletClient({
        chain,
        transport: http(),
    }).extend(walletActionsL1());

    // token address
    const token = "0xc6582A9b48F211Fa8c2B5b16CB615eC39bcA653B";

    const { data: applications } = await publicClientL2.listApplications();

    if (applications[0]) {
        // application address
        const application = applications[0].applicationAddress;

        // send input transaction
        const hash = await walletClient.depositBatchERC1155Token({
            account,
            application,
            baseLayerData: "0x",
            chain,
            execLayerData: "0x",
            token,
            values: [1n],
            tokenIds: [1n],
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

            // get notice 0 produced by application
            const outputs = await publicClientL2.listOutputs({
                application,
                inputIndex,
            });

            console.log(outputs);
        }
    }
}

main();
