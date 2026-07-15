import { getAddress, slice } from "viem";
import { describe, expect, it } from "vitest";
import { decodeInput, encodeInput, type Input } from "../src/input.js";

// canonical calldata of Inputs.EvmAdvance(1, 0x...2, 0x...3, 4, 5, 6, 7, 0xdeadbeef)
const encodedInput =
    "0x415bf363000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000050000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000700000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000004deadbeef00000000000000000000000000000000000000000000000000000000" as const;

const input: Input = {
    chainId: 1n,
    appContract: "0x0000000000000000000000000000000000000002",
    msgSender: "0x0000000000000000000000000000000000000003",
    blockNumber: 4n,
    blockTimestamp: 5n,
    prevRandao: 6n,
    index: 7n,
    payload: "0xdeadbeef",
};

describe("input", () => {
    it("should encode an input as an EvmAdvance call", () => {
        expect(encodeInput(input)).toEqual(encodedInput);
    });

    it("should use the EvmAdvance function selector", () => {
        expect(slice(encodeInput(input), 0, 4)).toEqual("0x415bf363");
    });

    it("should decode an EvmAdvance call", () => {
        expect(decodeInput(encodedInput)).toEqual(input);
    });

    it("should roundtrip an input through encode and decode", () => {
        const original: Input = {
            chainId: 31337n,
            appContract: getAddress(
                "0x67742ff5b2b762503ff0a92738c6fc2ea4a4d182",
            ),
            msgSender: getAddress("0x92cc14432c1f82622493abd64d99ea8a3000a7c7"),
            blockNumber: 123456789n,
            blockTimestamp: 1744255407n,
            prevRandao: 2n ** 200n,
            index: 42n,
            payload: "0x",
        };
        expect(decodeInput(encodeInput(original))).toEqual(original);
    });

    it("should return checksummed addresses", () => {
        const decoded = decodeInput(
            encodeInput({
                ...input,
                appContract: "0x67742ff5b2b762503ff0a92738c6fc2ea4a4d182",
            }),
        );
        expect(decoded.appContract).toEqual(
            getAddress("0x67742ff5b2b762503ff0a92738c6fc2ea4a4d182"),
        );
    });

    it("should throw on data with an unknown function selector", () => {
        expect(() => decodeInput("0xdeadbeef")).toThrow();
    });
});
