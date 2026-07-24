import {
    type Account,
    type Chain,
    type Client,
    type HttpTransport,
    type Transport,
    getAddress,
    isAddress,
    isHex,
} from "viem";
import { signTypedData } from "viem/actions";
import {
    sequencerDomainName,
    sequencerDomainVersion,
    sequencerTransactionTypes,
} from "./constants.js";
import {
    SequencerRequestError,
    SequencerResponseError,
    SequencerTransactionRejectedError,
} from "./errors.js";
import type {
    SequencerErrorResponse,
    SequencerTransactionReceipt,
    SequencerTransactionParameters,
    SignSequencerTransactionParameters,
    SignedSequencerTransaction,
    SubmitSequencerTransactionParameters,
} from "./types.js";

type SequencerActionClient<
    transport extends HttpTransport = HttpTransport,
    chain extends Chain = Chain,
    account extends Account = Account,
> = Client<transport, chain, account> & {
    application: `0x${string}`;
    walletClient?: object | undefined;
};

const assertUnsignedInteger = (
    value: number,
    maximum: number,
    name: string,
) => {
    if (!Number.isInteger(value) || value < 0 || value > maximum) {
        throw new RangeError(
            `${name} must be an integer between 0 and ${maximum}`,
        );
    }
};

export const signSequencerTransaction = async <
    transport extends HttpTransport,
    chain extends Chain,
    clientAccount extends Account,
>(
    client: SequencerActionClient<transport, chain, clientAccount>,
    parameters: SignSequencerTransactionParameters,
): Promise<SignedSequencerTransaction> => {
    const { data, maxFee, nonce } = parameters;
    const accountValue = parameters.account ?? client.account;
    const account =
        typeof accountValue === "string"
            ? ({
                  address: getAddress(accountValue),
                  type: "json-rpc",
              } as const)
            : accountValue;

    assertUnsignedInteger(nonce, 0xffff_ffff, "nonce");
    assertUnsignedInteger(maxFee, 0xffff, "maxFee");
    if (!isHex(data))
        throw new TypeError("data must be a 0x-prefixed hex value");
    const canSignLocally =
        "signTypedData" in account &&
        typeof account.signTypedData === "function";
    if (!canSignLocally && !client.walletClient) {
        throw new TypeError(
            "walletClient is required to sign with a JSON-RPC account",
        );
    }

    const message = { data, max_fee: maxFee, nonce };
    const signingClient = (client.walletClient ?? client) as Client<
        Transport,
        Chain,
        Account | undefined
    >;
    const signature = await signTypedData(signingClient, {
        account,
        domain: {
            chainId: client.chain.id,
            name: sequencerDomainName,
            verifyingContract: client.application,
            version: sequencerDomainVersion,
        },
        message,
        primaryType: "UserOp",
        types: sequencerTransactionTypes,
    });

    return {
        message,
        sender: account.address,
        signature,
    };
};

const isErrorResponse = (value: unknown): value is SequencerErrorResponse => {
    if (!value || typeof value !== "object") return false;
    const response = value as Record<string, unknown>;
    return (
        response.ok === false &&
        typeof response.code === "string" &&
        typeof response.message === "string"
    );
};

const isSuccessResponse = (
    value: unknown,
): value is SequencerTransactionReceipt => {
    if (!value || typeof value !== "object") return false;
    const response = value as Record<string, unknown>;
    return (
        response.ok === true &&
        typeof response.nonce === "number" &&
        typeof response.sender === "string" &&
        isAddress(response.sender)
    );
};

export const submitSequencerTransaction = async <
    transport extends HttpTransport,
    chain extends Chain,
    account extends Account,
>(
    client: SequencerActionClient<transport, chain, account>,
    { transaction }: SubmitSequencerTransactionParameters,
): Promise<SequencerTransactionReceipt> => {
    const baseUrl = client.transport.url;
    if (!baseUrl) {
        throw new TypeError(
            'sequencer HTTP transport requires an explicit URL: http("...")',
        );
    }

    const url = `${baseUrl.replace(/\/$/, "")}/tx`;
    const fetchOptions = client.transport.fetchOptions;
    const headers = new Headers(fetchOptions?.headers);
    headers.set("content-type", "application/json");

    let response: Response;
    try {
        response = await fetch(url, {
            ...fetchOptions,
            body: JSON.stringify(transaction),
            headers,
            method: "POST",
            signal:
                fetchOptions?.signal ??
                AbortSignal.timeout(client.transport.timeout ?? 10_000),
        });
    } catch (error) {
        throw new SequencerRequestError({
            cause: error instanceof Error ? error : undefined,
            url,
        });
    }

    let body: string;
    try {
        body = await response.text();
    } catch (error) {
        throw new SequencerRequestError({
            cause: error instanceof Error ? error : undefined,
            url,
        });
    }
    let json: unknown;
    try {
        json = JSON.parse(body);
    } catch {
        throw new SequencerResponseError({
            body,
            status: response.status,
            url,
        });
    }

    if (!response.ok) {
        if (isErrorResponse(json)) {
            throw new SequencerTransactionRejectedError({
                body: json,
                status: response.status,
                url,
            });
        }
        throw new SequencerResponseError({
            body,
            status: response.status,
            url,
        });
    }

    if (!isSuccessResponse(json)) {
        throw new SequencerResponseError({
            body,
            status: response.status,
            url,
        });
    }

    return { ...json, sender: getAddress(json.sender) };
};

export const sendSequencerTransaction = async <
    transport extends HttpTransport,
    chain extends Chain,
    account extends Account,
>(
    client: SequencerActionClient<transport, chain, account>,
    parameters: SequencerTransactionParameters,
): Promise<SequencerTransactionReceipt> => {
    const transaction = await signSequencerTransaction(client, parameters);
    return submitSequencerTransaction(client, { transaction });
};
