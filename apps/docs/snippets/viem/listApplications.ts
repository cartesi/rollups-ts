import { createCartesiPublicClient } from "@cartesi/viem";
import { http } from "viem";

const main = async () => {
    // create cartesi public client to L2 with RPC url
    const publicClientL2 = createCartesiPublicClient({
        transport: http("http://localhost:8080/rpc"),
    });

    const { data: applications } = await publicClientL2.listApplications();
};

main();
