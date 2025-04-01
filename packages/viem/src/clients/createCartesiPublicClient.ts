import { Client, ClientConfig, createClient, Prettify, Transport } from "viem";
import {
    publicActionsL2,
    PublicCartesiRpcSchema,
} from "../decorators/publicL2.js";

// Define a simpler type that doesn't use the generic parameters for account
export type CartesiPublicClient<transport extends Transport = Transport> =
    Prettify<Client<transport, undefined, undefined, PublicCartesiRpcSchema>>;

export type CartesiPublicClientConfig<transport extends Transport = Transport> =
    Prettify<
        ClientConfig<transport, undefined, undefined, PublicCartesiRpcSchema>
    >;

export const createCartesiPublicClient = <
    transport extends Transport = Transport,
>(
    parameters: CartesiPublicClientConfig<transport>,
) => {
    const client = createClient<
        transport,
        undefined,
        undefined,
        PublicCartesiRpcSchema
    >(parameters);
    return client.extend(publicActionsL2());
};
