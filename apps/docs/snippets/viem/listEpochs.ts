import { createCartesiPublicClient } from "@cartesi/viem";
import { http } from "viem";

const main = async () => {
    // create cartesi public client to L2 with RPC url
    const publicClientL2 = createCartesiPublicClient({
        transport: http("http://127.0.0.1:6751/rpc"),
    });

    // list finalized epochs
    const { data: epochs } = await publicClientL2.listEpochs({
        application: "0x0974CC873dF893B302f6be7ecf4F9D4b1A15C366",
        status: "CLAIM_ACCEPTED",
    });
};

main();
