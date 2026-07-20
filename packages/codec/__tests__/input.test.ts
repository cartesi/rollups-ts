import { bytesToHex, getAddress, hexToBytes, slice } from "viem";
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

describe("input (byte array)", () => {
    const encodedInputBytes = hexToBytes(encodedInput);
    const inputBytes: Input<Uint8Array> = {
        ...input,
        payload: hexToBytes("0xdeadbeef"),
    };

    it("should decode an EvmAdvance call from a byte array", () => {
        expect(decodeInput(encodedInputBytes)).toEqual(inputBytes);
    });

    it("should return the payload as a zero-copy view of the data", () => {
        const decoded = decodeInput(encodedInputBytes);
        expect(decoded.payload.buffer).toBe(encodedInputBytes.buffer);
        expect(decoded.payload.byteOffset).toBe(4 + 9 * 32);
        expect(decoded.payload.length).toBe(4);
    });

    it("should decode from a Buffer", () => {
        const decoded = decodeInput(Buffer.from(encodedInput.slice(2), "hex"));
        expect(bytesToHex(decoded.payload)).toEqual("0xdeadbeef");
        expect(decoded.chainId).toEqual(input.chainId);
        expect(decoded.appContract).toEqual(input.appContract);
    });

    it("should encode to a byte array", () => {
        expect(encodeInput(input, "bytes")).toEqual(encodedInputBytes);
        expect(encodeInput(inputBytes, "bytes")).toEqual(encodedInputBytes);
    });

    it("should encode a byte array payload to hex", () => {
        expect(encodeInput(inputBytes)).toEqual(encodedInput);
        expect(encodeInput(inputBytes, "hex")).toEqual(encodedInput);
    });

    it("should roundtrip an input through encode and decode", () => {
        const original: Input<Uint8Array> = {
            chainId: 31337n,
            appContract: getAddress(
                "0x67742ff5b2b762503ff0a92738c6fc2ea4a4d182",
            ),
            msgSender: getAddress("0x92cc14432c1f82622493abd64d99ea8a3000a7c7"),
            blockNumber: 123456789n,
            blockTimestamp: 1744255407n,
            prevRandao: 2n ** 200n,
            index: 42n,
            payload: new Uint8Array(),
        };
        expect(decodeInput(encodeInput(original, "bytes"))).toEqual(original);
    });

    it("should throw on a byte array with an unknown function selector", () => {
        expect(() => decodeInput(hexToBytes("0xdeadbeef"))).toThrow();
    });

    it("should throw on values out of uint256 range", () => {
        expect(() => encodeInput({ ...input, chainId: -1n }, "bytes")).toThrow(
            "out of uint256 range",
        );
        expect(() =>
            encodeInput({ ...input, chainId: 2n ** 256n }, "bytes"),
        ).toThrow("out of uint256 range");
    });
});
