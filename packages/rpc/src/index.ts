import { JSONRPCClient, type TypedJSONRPCClient } from "json-rpc-2.0";
import type { Methods } from "./methods.js";

export * from "./types.js";

export type ClientOptions = {
    uri: string;
    token?: string;
};

export type CartesiClient = TypedJSONRPCClient<Methods>;

export const createClient = (options: ClientOptions): CartesiClient => {
    const { uri, token } = options;
    const client = new JSONRPCClient((jsonRPCRequest) => {
        // setup auth headers, if token is provided
        const headers: HeadersInit = { "content-type": "application/json" };
        if (token) {
            headers.authorization = `Bearer ${token}`;
        }

        fetch(uri, {
            method: "POST",
            headers,
            body: JSON.stringify(jsonRPCRequest),
        }).then((response) => {
            if (response.status === 200) {
                return response
                    .json()
                    .then((jsonRPCResponse) => client.receive(jsonRPCResponse));
            }
            if (jsonRPCRequest.id !== undefined) {
                return Promise.reject(new Error(response.statusText));
            }
        });
    });
    return client;
};
