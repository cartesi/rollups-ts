import {
    type ClientConfig,
    type Prettify,
    type Transport,
    createClient,
} from "viem";
import {
    type PublicCartesiRpcSchema,
    publicActionsL2,
} from "../decorators/publicL2.js";

// Define a simpler type that doesn't use the generic parameters for account
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

export type CartesiPublicClient = ReturnType<typeof createCartesiPublicClient>;
