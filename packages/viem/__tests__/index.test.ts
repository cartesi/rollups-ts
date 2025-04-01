import {
    createPublicClient,
    createWalletClient,
    http,
    zeroAddress,
    zeroHash,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { cannon } from "viem/chains";
import { describe, it } from "vitest";
import { getInputsAdded, publicActionsL1, walletActionsL1 } from "../src";
import { createCartesiClient } from "../src/clients/createCartesiPublicClient";
import { AddInput2Parameters } from "../src/decorators/walletL1";
import { inputBoxAbi, inputBoxAddress } from "../src/rollups";

describe("viem extension", () => {
    it("getInputIndex", async () => {
        const rpcUrl = "http://localhost:8545";
        const cartesiRpcUrl = "http://localhost:8080/rpc";
        const application = "0x0000000000000000000000000000000000000000";
        const account = privateKeyToAccount(
            "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
        );
        const chain = cannon;

        const publicClient = createPublicClient({
            chain,
            transport: http(rpcUrl),
        }).extend(publicActionsL1());

        const publicClientL2 = createCartesiClient({
            transport: http(cartesiRpcUrl),
        });

        const walletClient = createWalletClient({ transport: http() }).extend(
            walletActionsL1(),
        );

        // const inputNumber = await publicClientL2.inputNumber([]);

        /*
        const { request: request_ } = await publicClient.simulateAddInput({
            args: [zeroAddress, zeroHash],
        });
        const hash = await walletClient.addInput(request);
        */

        // prepare an addInput
        const { request } = await publicClient.simulateContract({
            account,
            abi: inputBoxAbi,
            address: inputBoxAddress,
            functionName: "addInput",
            args: [application, zeroHash],
        });

        // send an input
        const hash = await walletClient.writeContract(request);

        // wait for the transaction receipt
        const receipt = await publicClient.waitForTransactionReceipt({ hash });

        // get the input index from the transaction receipt
        const [inputAdded] = getInputsAdded(receipt);

        if (inputAdded) {
            const { index } = inputAdded;
            const { data: outputs } = await publicClientL2.listOutputs({
                application,
                inputIndex: index,
            });
        }

        const p: AddInput2Parameters = {
            account,
            chain: cannon,
            request: {
                application: zeroAddress,
                payload: zeroHash,
            },
        };
        const hash2 = await walletClient.addInput({
            // account,
            args: [zeroAddress, zeroHash],
            // abi: inputBoxAbi,
            // address: inputBoxAddress,
            // functionName: "addInput",
            // chain: foundry,
        });

        // addInput
        /*
        const { request: request2 } = await publicClient.simulateAddInput({
            account,
            args: [zeroAddress, zeroHash],
        });
        await walletClient.addInput(request2);
        */
    });
});
