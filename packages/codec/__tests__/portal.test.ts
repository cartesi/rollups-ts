import {
    concat,
    encodeAbiParameters,
    getAddress,
    type Hex,
    numberToHex,
} from "viem";
import { describe, expect, it } from "vitest";
import {
    type BatchERC1155Deposit,
    decodeBatchERC1155Deposit,
    decodeERC20Deposit,
    decodeERC721Deposit,
    decodeEtherDeposit,
    decodeSingleERC1155Deposit,
    encodeBatchERC1155Deposit,
    encodeERC20Deposit,
    encodeERC721Deposit,
    encodeEtherDeposit,
    encodeSingleERC1155Deposit,
    type ERC20Deposit,
    type ERC721Deposit,
    type EtherDeposit,
    type SingleERC1155Deposit,
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
    const deposit: ERC20Deposit = {
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
        expect(encodeERC20Deposit(deposit)).toEqual(payload.toLowerCase());
    });

    it("should decode", () => {
        expect(decodeERC20Deposit(payload)).toEqual(deposit);
    });

    it("should roundtrip with empty execLayerData", () => {
        const original: ERC20Deposit = {
            token,
            sender,
            value: 1n,
            execLayerData: "0x",
        };
        expect(decodeERC20Deposit(encodeERC20Deposit(original))).toEqual(
            original,
        );
    });

    it("should throw on a payload that is too short", () => {
        expect(() => decodeERC20Deposit("0xdeadbeef")).toThrow(
            "invalid ERC-20 deposit payload",
        );
    });
});

describe("erc721 deposit", () => {
    const deposit: ERC721Deposit = {
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
        expect(encodeERC721Deposit(deposit)).toEqual(payload.toLowerCase());
    });

    it("should decode", () => {
        expect(decodeERC721Deposit(payload)).toEqual(deposit);
    });

    it("should roundtrip with empty data", () => {
        const original: ERC721Deposit = {
            token,
            sender,
            tokenId: 0n,
            baseLayerData: "0x",
            execLayerData: "0x",
        };
        expect(decodeERC721Deposit(encodeERC721Deposit(original))).toEqual(
            original,
        );
    });

    it("should throw on a payload that is too short", () => {
        expect(() => decodeERC721Deposit("0xdeadbeef")).toThrow(
            "invalid ERC-721 deposit payload",
        );
    });

    it("should throw on a payload with a malformed data tail", () => {
        expect(() =>
            decodeERC721Deposit(
                concat([token, sender, numberToHex(42n, { size: 32 })]),
            ),
        ).toThrow();
    });
});

describe("erc1155 single deposit", () => {
    const deposit: SingleERC1155Deposit = {
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
        expect(encodeSingleERC1155Deposit(deposit)).toEqual(
            payload.toLowerCase(),
        );
    });

    it("should decode", () => {
        expect(decodeSingleERC1155Deposit(payload)).toEqual(deposit);
    });

    it("should throw on a payload that is too short", () => {
        expect(() => decodeSingleERC1155Deposit("0xdeadbeef")).toThrow(
            "invalid ERC-1155 single deposit payload",
        );
    });
});

describe("erc1155 batch deposit", () => {
    const deposit: BatchERC1155Deposit = {
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
        expect(encodeBatchERC1155Deposit(deposit)).toEqual(
            payload.toLowerCase(),
        );
    });

    it("should decode", () => {
        expect(decodeBatchERC1155Deposit(payload)).toEqual(deposit);
    });

    it("should roundtrip with empty lists", () => {
        const original: BatchERC1155Deposit = {
            token,
            sender,
            tokenIds: [],
            values: [],
            baseLayerData: "0x",
            execLayerData: "0x",
        };
        expect(
            decodeBatchERC1155Deposit(encodeBatchERC1155Deposit(original)),
        ).toEqual(original);
    });

    it("should throw on a payload that is too short", () => {
        expect(() => decodeBatchERC1155Deposit("0xdeadbeef")).toThrow(
            "invalid ERC-1155 batch deposit payload",
        );
    });
});
