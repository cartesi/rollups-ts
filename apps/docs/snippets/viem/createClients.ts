import {
    createCartesiPublicClient,
    publicActionsL1,
    walletActionsL1,
} from "@cartesi/viem";
import { createPublicClient, createWalletClient, http } from "viem";
import { cannon } from "viem/chains";

const main = async () => {
    const chain = cannon;

    // create public client with extra L1 actions
    const publicClient = createPublicClient({
        chain,
        transport: http(),
    }).extend(publicActionsL1());

    // create wallet client with extra L1 actions
    const walletClient = createWalletClient({
        chain,
        transport: http(),
    }).extend(walletActionsL1());

    // create cartesi public client to L2 with RPC url
    const publicClientL2 = createCartesiPublicClient({
        transport: http("http://127.0.0.1:6751/rpc"),
    });
};

main();
