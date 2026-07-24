import {
    type Account,
    type Address,
    type Chain,
    type Client,
    type ClientConfig,
    type HttpTransport,
    type ParseAccount,
    type Prettify,
    type Transport,
    type WalletClient,
    createClient,
} from "viem";
import {
    sendSequencerTransaction,
    signSequencerTransaction,
    submitSequencerTransaction,
} from "../sequencer/actions.js";
import type {
    SequencerActions,
    SequencerTransactionParameters,
    SubmitSequencerTransactionParameters,
} from "../sequencer/types.js";

export type SequencerClientConfig<
    transport extends HttpTransport = HttpTransport,
    chain extends Chain = Chain,
    accountOrAddress extends Account | Address = Account | Address,
    walletTransport extends Transport = Transport,
    walletAccount extends Account | undefined = Account | undefined,
> = Prettify<
    Omit<
        ClientConfig<transport, chain, accountOrAddress>,
        "account" | "chain" | "transport" | "type"
    > & {
        /** Account used to sign EIP-712 user operations. */
        account: accountOrAddress;
        /** Application address used as the EIP-712 verifying contract. */
        application: Address;
        /** L1 chain whose id is included in the EIP-712 domain. */
        chain: chain;
        /** Viem HTTP transport pointed at the sequencer API. */
        transport: transport;
        /** Wallet Client used to sign for a JSON-RPC account such as MetaMask. */
        walletClient?:
            | WalletClient<walletTransport, chain, walletAccount>
            | undefined;
    }
>;

export type SequencerClient<
    transport extends HttpTransport = HttpTransport,
    chain extends Chain = Chain,
    accountOrAddress extends Account | Address = Account | Address,
    walletTransport extends Transport = Transport,
    walletAccount extends Account | undefined = Account | undefined,
> = Prettify<
    Client<transport, chain, ParseAccount<accountOrAddress>> &
        SequencerActions & {
            application: Address;
            walletClient?:
                | WalletClient<walletTransport, chain, walletAccount>
                | undefined;
        }
>;

export const createSequencerClient = <
    transport extends HttpTransport,
    chain extends Chain,
    accountOrAddress extends Account | Address,
    walletTransport extends Transport = Transport,
    walletAccount extends Account | undefined = Account | undefined,
>(
    parameters: SequencerClientConfig<
        transport,
        chain,
        accountOrAddress,
        walletTransport,
        walletAccount
    >,
): SequencerClient<
    transport,
    chain,
    accountOrAddress,
    walletTransport,
    walletAccount
> => {
    const { application, walletClient, ...clientParameters } = parameters;
    if (
        walletClient?.chain &&
        walletClient.chain.id !== clientParameters.chain.id
    ) {
        throw new TypeError(
            `walletClient chain id ${walletClient.chain.id} does not match sequencer chain id ${clientParameters.chain.id}`,
        );
    }
    const client = createClient({
        ...clientParameters,
        key: parameters.key ?? "sequencer",
        name: parameters.name ?? "Cartesi Sequencer Client",
        type: "sequencerClient",
    });
    const actionClient = Object.assign(client, {
        application,
        walletClient,
    });

    return Object.assign(actionClient, {
        sendTransaction: (parameters: SequencerTransactionParameters) =>
            sendSequencerTransaction(actionClient, parameters),
        signTransaction: (parameters: SequencerTransactionParameters) =>
            signSequencerTransaction(actionClient, parameters),
        submitTransaction: (parameters: SubmitSequencerTransactionParameters) =>
            submitSequencerTransaction(actionClient, parameters),
    }) as SequencerClient<
        transport,
        chain,
        accountOrAddress,
        walletTransport,
        walletAccount
    >;
};
