import { createCartesiPublicClient } from "@cartesi/viem";
import { cartesi } from "@cartesi/viem/chains";
import { createPublicClient, createWalletClient, http } from "viem";

const main = async () => {
    const chain = cartesi;

    // create public client
    const publicClient = createPublicClient({
        chain,
        transport: http(),
    });

    // create wallet client
    const walletClient = createWalletClient({
        chain,
        transport: http(),
    });

    // create cartesi public client to L2 with RPC url
    const publicClientL2 = createCartesiPublicClient({
        transport: http("http://127.0.0.1:6751/rpc"),
    });
};

main();
