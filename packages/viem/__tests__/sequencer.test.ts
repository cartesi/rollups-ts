import {
    createWalletClient,
    custom,
    getAddress,
    http,
    recoverTypedDataAddress,
    stringToHex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { foundry, mainnet } from "viem/chains";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
    type SequencerTransactionRejectedError,
    createSequencerClient,
    sequencerDomainName,
    sequencerDomainVersion,
    sequencerTransactionTypes,
    signSequencerTransaction,
} from "../src/index.js";

const account = privateKeyToAccount(
    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
);
const application = "0x1111111111111111111111111111111111111111";

const createClient = () =>
    createSequencerClient({
        account,
        application,
        chain: foundry,
        transport: http("http://127.0.0.1:3000"),
    });

const typedData = {
    domain: {
        chainId: foundry.id,
        name: sequencerDomainName,
        verifyingContract: application,
        version: sequencerDomainVersion,
    },
    message: { data: "0x1234", max_fee: 1200, nonce: 0 },
    primaryType: "UserOp",
    types: sequencerTransactionTypes,
} as const;

afterEach(() => {
    vi.unstubAllGlobals();
});

describe("sequencer client", () => {
    it("signs the canonical sequencer UserOp EIP-712 type locally", async () => {
        const client = createClient();
        const transaction = await client.signTransaction({
            data: stringToHex("hello"),
            maxFee: 1200,
            nonce: 7,
        });

        expect(client.type).toBe("sequencerClient");
        expect(client.application).toBe(application);
        expect(transaction.message).toEqual({
            data: stringToHex("hello"),
            max_fee: 1200,
            nonce: 7,
        });
        expect(transaction.sender).toBe(account.address);
        await expect(
            recoverTypedDataAddress({
                domain: typedData.domain,
                message: transaction.message,
                primaryType: typedData.primaryType,
                signature: transaction.signature,
                types: typedData.types,
            }),
        ).resolves.toBe(account.address);

        await expect(
            signSequencerTransaction(client, {
                data: "0x",
                maxFee: 1200,
                nonce: 8,
            }),
        ).resolves.toMatchObject({ sender: account.address });
    });

    it("signs and submits a transaction to POST /tx", async () => {
        const fetchMock = vi.fn().mockResolvedValue(
            new Response(
                JSON.stringify({
                    nonce: 0,
                    ok: true,
                    sender: account.address.toLowerCase(),
                }),
                {
                    headers: { "content-type": "application/json" },
                    status: 200,
                },
            ),
        );
        vi.stubGlobal("fetch", fetchMock);

        const receipt = await createClient().sendTransaction({
            data: "0x1234",
            maxFee: 1200,
            nonce: 0,
        });

        expect(receipt).toEqual({
            nonce: 0,
            ok: true,
            sender: getAddress(account.address),
        });
        expect(fetchMock).toHaveBeenCalledOnce();
        const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
        expect(url).toBe("http://127.0.0.1:3000/tx");
        expect(init.method).toBe("POST");
        expect(new Headers(init.headers).get("content-type")).toBe(
            "application/json",
        );

        const body = JSON.parse(init.body as string);
        expect(body).toMatchObject({
            message: { data: "0x1234", max_fee: 1200, nonce: 0 },
            sender: account.address,
        });
        expect(body.signature).toMatch(/^0x[0-9a-f]{130}$/);
    });

    it("supports separate signing and submission", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue(
                new Response(
                    JSON.stringify({
                        nonce: 0,
                        ok: true,
                        sender: account.address,
                    }),
                    { status: 200 },
                ),
            ),
        );
        const client = createClient();
        const transaction = await client.signTransaction({
            data: "0x1234",
            maxFee: 1200,
            nonce: 0,
        });

        await expect(
            client.submitTransaction({ transaction }),
        ).resolves.toMatchObject({ ok: true, sender: account.address });
    });

    it("exposes structured sequencer rejection errors", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue(
                new Response(
                    JSON.stringify({
                        code: "OVERLOADED",
                        message: "queue full",
                        ok: false,
                    }),
                    { status: 429 },
                ),
            ),
        );

        const promise = createClient().sendTransaction({
            data: "0x",
            maxFee: 1200,
            nonce: 0,
        });

        await expect(promise).rejects.toMatchObject({
            code: "OVERLOADED",
            details: "queue full",
            name: "SequencerTransactionRejectedError",
            status: 429,
        } satisfies Partial<SequencerTransactionRejectedError>);
    });

    it("rejects values that do not fit the protocol integer widths", async () => {
        const client = createClient();

        await expect(
            client.signTransaction({ data: "0x", maxFee: 65_536, nonce: 0 }),
        ).rejects.toThrow("maxFee must be an integer between 0 and 65535");
        await expect(
            client.signTransaction({ data: "0x", maxFee: 0, nonce: -1 }),
        ).rejects.toThrow("nonce must be an integer between 0 and 4294967295");
    });

    it("signs through a MetaMask-compatible EIP-1193 Wallet Client", async () => {
        const signature = await account.signTypedData(typedData);
        const request = vi.fn().mockResolvedValue(signature);
        const walletClient = createWalletClient({
            chain: foundry,
            transport: custom({ request }),
        });
        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue(
                new Response(
                    JSON.stringify({
                        nonce: 0,
                        ok: true,
                        sender: account.address,
                    }),
                    { status: 200 },
                ),
            ),
        );
        const client = createSequencerClient({
            account: account.address,
            application,
            chain: foundry,
            transport: http("http://127.0.0.1:3000"),
            walletClient,
        });

        const receipt = await client.sendTransaction({
            data: "0x1234",
            maxFee: 1200,
            nonce: 0,
        });

        expect(receipt).toMatchObject({
            nonce: 0,
            ok: true,
            sender: account.address,
        });
        expect(request.mock.calls[0]?.[0]).toEqual(
            expect.objectContaining({ method: "eth_signTypedData_v4" }),
        );
    });

    it("requires a Wallet Client for JSON-RPC accounts", async () => {
        const client = createSequencerClient({
            account: account.address,
            application,
            chain: foundry,
            transport: http("http://127.0.0.1:3000"),
        });

        await expect(
            client.signTransaction({ data: "0x", maxFee: 1200, nonce: 0 }),
        ).rejects.toThrow(
            "walletClient is required to sign with a JSON-RPC account",
        );
    });

    it("rejects a Wallet Client configured for another chain", () => {
        const walletClient = createWalletClient({
            chain: mainnet,
            transport: custom({ request: vi.fn() }),
        });

        expect(() =>
            createSequencerClient({
                account: account.address,
                application,
                // @ts-expect-error Verify the runtime guard for JavaScript callers.
                chain: foundry,
                transport: http("http://127.0.0.1:3000"),
                walletClient,
            }),
        ).toThrow(
            "walletClient chain id 1 does not match sequencer chain id 31337",
        );
    });
});
