import { http } from "viem";
import { createCartesiPublicClient } from "../src";

async function main() {
    // create cartesi public client to L2 with RPC url
    const publicClientL2 = createCartesiPublicClient({
        transport: http("http://127.0.0.1:6751/rpc"),
    });

    const { data: applications } = await publicClientL2.listApplications();
    if (applications[0]) {
        // application address
        const application = applications[0].applicationAddress;

        // list epochs
        const epochs = await publicClientL2.listEpochs({
            application,
        });
        console.log(epochs);
    }
}

main();
