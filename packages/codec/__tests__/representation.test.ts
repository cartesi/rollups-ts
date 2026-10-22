import { bytesToHex, type Hex } from "viem";
import { describe, expect, it } from "vitest";
import { asHex } from "../src/bytes.js";
import { decodeInput, encodeInput, type Input } from "../src/input.js";
import { decodeOutput, encodeOutput, type Output } from "../src/output.js";
import {
    decodeErc1155BatchDeposit,
    decodeErc1155SingleDeposit,
    decodeErc20Deposit,
    decodeErc721Deposit,
    decodeEtherDeposit,
    encodeErc1155BatchDeposit,
    encodeErc1155SingleDeposit,
    encodeErc20Deposit,
    encodeErc721Deposit,
    encodeEtherDeposit,
    type Erc1155BatchDeposit,
    type Erc1155SingleDeposit,
    type Erc20Deposit,
    type Erc721Deposit,
    type EtherDeposit,
} from "../src/portal.js";

// Every codec here has two independent implementations: the hex one, which
// delegates to an ABI library, and the byte array one, which is hand-rolled
// against the same fixed layout so that a payload can be decoded without a
// hex conversion and carry zero-copy views of the data. Nothing forces them
// to agree. The per-codec suites check the pair where it was convenient to;
// this table checks it for all nine, so a layout fixed on one path cannot
// quietly diverge on the other.

const token = "0x67742FF5B2B762503fF0A92738C6FC2ea4a4d182" as const;
const sender = "0x92cc14432c1F82622493aBd64D99Ea8A3000a7c7" as const;

// decoding from a byte array yields Uint8Array byte fields where decoding
// from hex yields hex strings, so the two are compared in hex
const toHexFields = (decoded: object): Record<string, unknown> =>
    Object.fromEntries(
        Object.entries(decoded).map(([key, value]) => [
            key,
            value instanceof Uint8Array ? bytesToHex(value) : value,
        ]),
    );

type Case = {
    name: string;
    hex: () => Hex;
    bytes: () => Uint8Array;
    fromHex: () => object;
    decodeBytes: (data: Uint8Array) => object;
};

const input: Input = {
    chainId: 31337n,
    appContract: token,
    msgSender: sender,
    blockNumber: 123456789n,
    blockTimestamp: 1744255407n,
    prevRandao: 2n ** 200n,
    index: 42n,
    payload: "0xdeadbeef",
};

const notice: Output = { type: "Notice", payload: "0xdeadbeef" };
const voucher: Output = {
    type: "Voucher",
    destination: token,
    value: 2n,
    payload: "0xdeadbeef",
};
const delegateCallVoucher: Output = {
    type: "DelegateCallVoucher",
    destination: token,
    payload: "0xdeadbeef",
};

const ether: EtherDeposit = {
    sender,
    value: 123456789n,
    execLayerData: "0xdeadbeef",
};
const erc20: Erc20Deposit = {
    token,
    sender,
    value: 1000000000000000000n,
    execLayerData: "0xdeadbeef",
};
const erc721: Erc721Deposit = {
    token,
    sender,
    tokenId: 42n,
    baseLayerData: "0xabcd",
    execLayerData: "0xdeadbeef",
};
const erc1155Single: Erc1155SingleDeposit = {
    token,
    sender,
    tokenId: 42n,
    value: 7n,
    baseLayerData: "0xabcd",
    execLayerData: "0xdeadbeef",
};
const erc1155Batch: Erc1155BatchDeposit = {
    token,
    sender,
    tokenIds: [1n, 2n, 3n],
    values: [100n, 200n, 300n],
    baseLayerData: "0xabcd",
    execLayerData: "0xdeadbeef",
};

const cases: Case[] = [
    {
        name: "input",
        hex: () => encodeInput(input),
        bytes: () => encodeInput(input, "bytes"),
        fromHex: () => decodeInput(encodeInput(input)),
        decodeBytes: (data) => decodeInput(data),
    },
    {
        name: "notice",
        hex: () => encodeOutput(notice),
        bytes: () => encodeOutput(notice, "bytes"),
        fromHex: () => decodeOutput(encodeOutput(notice)),
        decodeBytes: (data) => decodeOutput(data),
    },
    {
        name: "voucher",
        hex: () => encodeOutput(voucher),
        bytes: () => encodeOutput(voucher, "bytes"),
        fromHex: () => decodeOutput(encodeOutput(voucher)),
        decodeBytes: (data) => decodeOutput(data),
    },
    {
        name: "delegate call voucher",
        hex: () => encodeOutput(delegateCallVoucher),
        bytes: () => encodeOutput(delegateCallVoucher, "bytes"),
        fromHex: () => decodeOutput(encodeOutput(delegateCallVoucher)),
        decodeBytes: (data) => decodeOutput(data),
    },
    {
        name: "ether deposit",
        hex: () => encodeEtherDeposit(ether),
        bytes: () => encodeEtherDeposit(ether, "bytes"),
        fromHex: () => decodeEtherDeposit(encodeEtherDeposit(ether)),
        decodeBytes: (data) => decodeEtherDeposit(data),
    },
    {
        name: "erc20 deposit",
        hex: () => encodeErc20Deposit(erc20),
        bytes: () => encodeErc20Deposit(erc20, "bytes"),
        fromHex: () => decodeErc20Deposit(encodeErc20Deposit(erc20)),
        decodeBytes: (data) => decodeErc20Deposit(data),
    },
    {
        name: "erc721 deposit",
        hex: () => encodeErc721Deposit(erc721),
        bytes: () => encodeErc721Deposit(erc721, "bytes"),
        fromHex: () => decodeErc721Deposit(encodeErc721Deposit(erc721)),
        decodeBytes: (data) => decodeErc721Deposit(data),
    },
    {
        name: "erc1155 single deposit",
        hex: () => encodeErc1155SingleDeposit(erc1155Single),
        bytes: () => encodeErc1155SingleDeposit(erc1155Single, "bytes"),
        fromHex: () =>
            decodeErc1155SingleDeposit(
                encodeErc1155SingleDeposit(erc1155Single),
            ),
        decodeBytes: (data) => decodeErc1155SingleDeposit(data),
    },
    {
        name: "erc1155 batch deposit",
        hex: () => encodeErc1155BatchDeposit(erc1155Batch),
        bytes: () => encodeErc1155BatchDeposit(erc1155Batch, "bytes"),
        fromHex: () =>
            decodeErc1155BatchDeposit(encodeErc1155BatchDeposit(erc1155Batch)),
        decodeBytes: (data) => decodeErc1155BatchDeposit(data),
    },
];

describe.each(cases)("$name", ({ hex, bytes, fromHex, decodeBytes }) => {
    it("should encode to the same bytes in both representations", () => {
        expect(asHex(bytes())).toEqual(hex());
    });

    it("should decode both representations to the same fields", () => {
        expect(toHexFields(decodeBytes(bytes()))).toEqual(fromHex());
    });

    // Node hands out Buffers, which are Uint8Array views over a pooled
    // buffer at a non-zero byteOffset. Every offset in the byte array path is
    // relative to the view, so a Buffer has to decode like a plain array.
    it("should decode a Buffer the same as a byte array", () => {
        const buffer = Buffer.from(hex().slice(2), "hex");
        expect(toHexFields(decodeBytes(buffer))).toEqual(fromHex());
    });
});
