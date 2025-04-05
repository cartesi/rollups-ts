import { createClient } from "@cartesi/rpc";

const client = createClient({ uri: "http://127.0.0.1:8080/rpc" });

// @noErrors
client.request("cartesi_listApplications", { limit: 50, offset: 0 });
//              ^|
