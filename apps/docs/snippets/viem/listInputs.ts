import { createCartesiPublicClient } from "@cartesi/viem";
import { http } from "viem";

const main = async () => {
    // create cartesi public client to L2 with RPC url
    const publicClientL2 = createCartesiPublicClient({
        transport: http("http://localhost:8080/rpc"),
    });

    const { data: inputs } = await publicClientL2.listInputs({
        application: "0x0974CC873dF893B302f6be7ecf4F9D4b1A15C366",
    });
};

main();
