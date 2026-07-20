import {
    concat,
    encodeAbiParameters,
    getAddress,
    type Hex,
    hexToBytes,
    numberToHex,
} from "viem";
import { describe, expect, it } from "vitest";
import {
    type Erc1155BatchDeposit,
    decodeErc1155BatchDeposit,
    decodeErc20Deposit,
    decodeErc721Deposit,
    decodeEtherDeposit,
    decodeErc1155SingleDeposit,
    encodeErc1155BatchDeposit,
    encodeErc20Deposit,
    encodeErc721Deposit,
    encodeEtherDeposit,
    encodeErc1155SingleDeposit,
    type Erc20Deposit,
    type Erc721Deposit,
    type EtherDeposit,
    type Erc1155SingleDeposit,
} from "../src/portal.js";

const token = getAddress("0x67742ff5b2b762503ff0a92738c6fc2ea4a4d182");
const sender = getAddress("0x92cc14432c1f82622493abd64d99ea8a3000a7c7");

// abi.encode(baseLayerData, execLayerData) tail of ERC-721/1155 deposits
const dataTail = (baseLayerData: Hex, execLayerData: Hex): Hex =>
    encodeAbiParameters(
        [{ type: "bytes" }, { type: "bytes" }],
        [baseLayerData, execLayerData],
    );

describe("ether deposit", () => {
    const deposit: EtherDeposit = {
        sender,
        value: 123456789n,
        execLayerData: "0xdeadbeef",
    };

    // packed layout: sender (20) ‖ value (32) ‖ execLayerData
    const payload = concat([
        sender,
        numberToHex(123456789n, { size: 32 }),
        "0xdeadbeef",
    ]);

    it("should encode", () => {
        expect(encodeEtherDeposit(deposit)).toEqual(payload.toLowerCase());
    });

    it("should decode", () => {
        expect(decodeEtherDeposit(payload)).toEqual(deposit);
    });

    it("should roundtrip with empty execLayerData", () => {
        const original: EtherDeposit = {
            sender,
            value: 0n,
            execLayerData: "0x",
        };
        expect(decodeEtherDeposit(encodeEtherDeposit(original))).toEqual(
            original,
        );
    });

    it("should throw on a payload that is too short", () => {
        expect(() => decodeEtherDeposit("0xdeadbeef")).toThrow(
            "invalid Ether deposit payload",
        );
    });
});

describe("erc20 deposit", () => {
    const deposit: Erc20Deposit = {
        token,
        sender,
        value: 1000000000000000000n,
        execLayerData: "0xdeadbeef",
    };

    // packed layout: token (20) ‖ sender (20) ‖ value (32) ‖ execLayerData
    const payload = concat([
        token,
        sender,
        numberToHex(1000000000000000000n, { size: 32 }),
        "0xdeadbeef",
    ]);

    it("should encode", () => {
        expect(encodeErc20Deposit(deposit)).toEqual(payload.toLowerCase());
    });

    it("should decode", () => {
        expect(decodeErc20Deposit(payload)).toEqual(deposit);
    });

    it("should roundtrip with empty execLayerData", () => {
        const original: Erc20Deposit = {
            token,
            sender,
            value: 1n,
            execLayerData: "0x",
        };
        expect(decodeErc20Deposit(encodeErc20Deposit(original))).toEqual(
            original,
        );
    });

    it("should throw on a payload that is too short", () => {
        expect(() => decodeErc20Deposit("0xdeadbeef")).toThrow(
            "invalid ERC-20 deposit payload",
        );
    });
});

describe("erc721 deposit", () => {
    const deposit: Erc721Deposit = {
        token,
        sender,
        tokenId: 42n,
        baseLayerData: "0xabcd",
        execLayerData: "0xdeadbeef",
    };

    // packed layout: token (20) ‖ sender (20) ‖ tokenId (32) ‖
    // abi.encode(baseLayerData, execLayerData)
    const payload = concat([
        token,
        sender,
        numberToHex(42n, { size: 32 }),
        dataTail("0xabcd", "0xdeadbeef"),
    ]);

    it("should encode", () => {
        expect(encodeErc721Deposit(deposit)).toEqual(payload.toLowerCase());
    });

    it("should decode", () => {
        expect(decodeErc721Deposit(payload)).toEqual(deposit);
    });

    it("should roundtrip with empty data", () => {
        const original: Erc721Deposit = {
            token,
            sender,
            tokenId: 0n,
            baseLayerData: "0x",
            execLayerData: "0x",
        };
        expect(decodeErc721Deposit(encodeErc721Deposit(original))).toEqual(
            original,
        );
    });

    it("should throw on a payload that is too short", () => {
        expect(() => decodeErc721Deposit("0xdeadbeef")).toThrow(
            "invalid ERC-721 deposit payload",
        );
    });

    it("should throw on a payload with a malformed data tail", () => {
        expect(() =>
            decodeErc721Deposit(
                concat([token, sender, numberToHex(42n, { size: 32 })]),
            ),
        ).toThrow();
    });
});

describe("erc1155 single deposit", () => {
    const deposit: Erc1155SingleDeposit = {
        token,
        sender,
        tokenId: 42n,
        value: 7n,
        baseLayerData: "0xabcd",
        execLayerData: "0xdeadbeef",
    };

    // packed layout: token (20) ‖ sender (20) ‖ tokenId (32) ‖ value (32) ‖
    // abi.encode(baseLayerData, execLayerData)
    const payload = concat([
        token,
        sender,
        numberToHex(42n, { size: 32 }),
        numberToHex(7n, { size: 32 }),
        dataTail("0xabcd", "0xdeadbeef"),
    ]);

    it("should encode", () => {
        expect(encodeErc1155SingleDeposit(deposit)).toEqual(
            payload.toLowerCase(),
        );
    });

    it("should decode", () => {
        expect(decodeErc1155SingleDeposit(payload)).toEqual(deposit);
    });

    it("should throw on a payload that is too short", () => {
        expect(() => decodeErc1155SingleDeposit("0xdeadbeef")).toThrow(
            "invalid ERC-1155 single deposit payload",
        );
    });
});

describe("erc1155 batch deposit", () => {
    const deposit: Erc1155BatchDeposit = {
        token,
        sender,
        tokenIds: [1n, 2n, 3n],
        values: [100n, 200n, 300n],
        baseLayerData: "0xabcd",
        execLayerData: "0xdeadbeef",
    };

    // packed layout: token (20) ‖ sender (20) ‖
    // abi.encode(tokenIds, values, baseLayerData, execLayerData)
    const payload = concat([
        token,
        sender,
        encodeAbiParameters(
            [
                { type: "uint256[]" },
                { type: "uint256[]" },
                { type: "bytes" },
                { type: "bytes" },
            ],
            [[1n, 2n, 3n], [100n, 200n, 300n], "0xabcd", "0xdeadbeef"],
        ),
    ]);

    it("should encode", () => {
        expect(encodeErc1155BatchDeposit(deposit)).toEqual(
            payload.toLowerCase(),
        );
    });

    it("should decode", () => {
        expect(decodeErc1155BatchDeposit(payload)).toEqual(deposit);
    });

    it("should roundtrip with empty lists", () => {
        const original: Erc1155BatchDeposit = {
            token,
            sender,
            tokenIds: [],
            values: [],
            baseLayerData: "0x",
            execLayerData: "0x",
        };
        expect(
            decodeErc1155BatchDeposit(encodeErc1155BatchDeposit(original)),
        ).toEqual(original);
    });

    it("should throw on a payload that is too short", () => {
        expect(() => decodeErc1155BatchDeposit("0xdeadbeef")).toThrow(
            "invalid ERC-1155 batch deposit payload",
        );
    });
});

describe("deposits (byte array)", () => {
    const execLayerData = hexToBytes("0xdeadbeef");
    const baseLayerData = hexToBytes("0xabcd");

    it("should decode and encode an Ether deposit", () => {
        const deposit: EtherDeposit<Uint8Array> = {
            sender,
            value: 123456789n,
            execLayerData,
        };
        const payload = concat([
            sender,
            numberToHex(123456789n, { size: 32 }),
            "0xdeadbeef",
        ]);
        expect(decodeEtherDeposit(hexToBytes(payload))).toEqual(deposit);
        expect(encodeEtherDeposit(deposit, "bytes")).toEqual(
            hexToBytes(payload),
        );
        expect(encodeEtherDeposit(deposit)).toEqual(payload.toLowerCase());
    });

    it("should decode and encode an ERC-20 deposit", () => {
        const deposit: Erc20Deposit<Uint8Array> = {
            token,
            sender,
            value: 1000000000000000000n,
            execLayerData,
        };
        const payload = concat([
            token,
            sender,
            numberToHex(1000000000000000000n, { size: 32 }),
            "0xdeadbeef",
        ]);
        expect(decodeErc20Deposit(hexToBytes(payload))).toEqual(deposit);
        expect(encodeErc20Deposit(deposit, "bytes")).toEqual(
            hexToBytes(payload),
        );
    });

    it("should return execLayerData as a zero-copy view of the payload", () => {
        const payload = hexToBytes(
            concat([
                token,
                sender,
                numberToHex(1n, { size: 32 }),
                "0xdeadbeef",
            ]),
        );
        const decoded = decodeErc20Deposit(payload);
        expect(decoded.execLayerData.buffer).toBe(payload.buffer);
        expect(decoded.execLayerData.byteOffset).toBe(72);
        expect(decoded.execLayerData.length).toBe(4);
    });

    it("should decode and encode an ERC-721 deposit", () => {
        const deposit: Erc721Deposit<Uint8Array> = {
            token,
            sender,
            tokenId: 42n,
            baseLayerData,
            execLayerData,
        };
        const payload = concat([
            token,
            sender,
            numberToHex(42n, { size: 32 }),
            dataTail("0xabcd", "0xdeadbeef"),
        ]);
        expect(decodeErc721Deposit(hexToBytes(payload))).toEqual(deposit);
        expect(encodeErc721Deposit(deposit, "bytes")).toEqual(
            hexToBytes(payload),
        );
        expect(encodeErc721Deposit(deposit)).toEqual(payload.toLowerCase());
    });

    it("should decode and encode an ERC-1155 single deposit", () => {
        const deposit: Erc1155SingleDeposit<Uint8Array> = {
            token,
            sender,
            tokenId: 42n,
            value: 7n,
            baseLayerData,
            execLayerData,
        };
        const payload = concat([
            token,
            sender,
            numberToHex(42n, { size: 32 }),
            numberToHex(7n, { size: 32 }),
            dataTail("0xabcd", "0xdeadbeef"),
        ]);
        expect(decodeErc1155SingleDeposit(hexToBytes(payload))).toEqual(
            deposit,
        );
        expect(encodeErc1155SingleDeposit(deposit, "bytes")).toEqual(
            hexToBytes(payload),
        );
    });

    it("should decode and encode an ERC-1155 batch deposit", () => {
        const deposit: Erc1155BatchDeposit<Uint8Array> = {
            token,
            sender,
            tokenIds: [1n, 2n, 3n],
            values: [100n, 200n, 300n],
            baseLayerData,
            execLayerData,
        };
        const payload = concat([
            token,
            sender,
            encodeAbiParameters(
                [
                    { type: "uint256[]" },
                    { type: "uint256[]" },
                    { type: "bytes" },
                    { type: "bytes" },
                ],
                [[1n, 2n, 3n], [100n, 200n, 300n], "0xabcd", "0xdeadbeef"],
            ),
        ]);
        expect(decodeErc1155BatchDeposit(hexToBytes(payload))).toEqual(deposit);
        expect(encodeErc1155BatchDeposit(deposit, "bytes")).toEqual(
            hexToBytes(payload),
        );
        expect(encodeErc1155BatchDeposit(deposit)).toEqual(
            payload.toLowerCase(),
        );
    });

    it("should roundtrip deposits with empty data", () => {
        const erc721: Erc721Deposit<Uint8Array> = {
            token,
            sender,
            tokenId: 0n,
            baseLayerData: new Uint8Array(),
            execLayerData: new Uint8Array(),
        };
        expect(
            decodeErc721Deposit(encodeErc721Deposit(erc721, "bytes")),
        ).toEqual(erc721);
        const batch: Erc1155BatchDeposit<Uint8Array> = {
            token,
            sender,
            tokenIds: [],
            values: [],
            baseLayerData: new Uint8Array(),
            execLayerData: new Uint8Array(),
        };
        expect(
            decodeErc1155BatchDeposit(
                encodeErc1155BatchDeposit(batch, "bytes"),
            ),
        ).toEqual(batch);
    });

    it("should throw on a payload that is too short", () => {
        const short = hexToBytes("0xdeadbeef");
        expect(() => decodeEtherDeposit(short)).toThrow(
            "invalid Ether deposit payload",
        );
        expect(() => decodeErc20Deposit(short)).toThrow(
            "invalid ERC-20 deposit payload",
        );
        expect(() => decodeErc721Deposit(short)).toThrow(
            "invalid ERC-721 deposit payload",
        );
        expect(() => decodeErc1155SingleDeposit(short)).toThrow(
            "invalid ERC-1155 single deposit payload",
        );
        expect(() => decodeErc1155BatchDeposit(short)).toThrow(
            "invalid ERC-1155 batch deposit payload",
        );
    });

    it("should throw on a payload with a malformed data tail", () => {
        expect(() =>
            decodeErc721Deposit(
                hexToBytes(
                    concat([token, sender, numberToHex(42n, { size: 32 })]),
                ),
            ),
        ).toThrow("data out of bounds");
    });
});
