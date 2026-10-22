import * as Bytes from "ox/Bytes";
import * as Hex from "ox/Hex";
import { describe, expect, it } from "vitest";
import {
    abiBytesSize,
    abiUint256ArraySize,
    asBytes,
    asHex,
    ceilWord,
    hasSelector,
    readAbiBytes,
    readAbiUint256Array,
    readAddress,
    readAddressWord,
    readUint256,
    WORD,
    writeAbiBytes,
    writeAbiUint256Array,
    writeAddress,
    writeAddressWord,
    writeBytes,
    writePaddedBytes,
    writeUint256,
} from "../src/bytes.js";

// These readers and writers are hand-rolled: no ABI library stands behind
// them, so nothing but these tests says their offsets are right. The codecs
// that use them only exercise the offsets their own layouts happen to need,
// which leaves the bounds checks and the padding rules uncovered — and those
// are exactly the parts that go wrong silently, by returning a subarray of the
// wrong length rather than by throwing.

const address = "0x67742FF5B2B762503fF0A92738C6FC2ea4a4d182";

describe("ceilWord", () => {
    it.each([
        [0, 0],
        [1, 32],
        [31, 32],
        [32, 32],
        [33, 64],
        [64, 64],
        [65, 96],
    ])("should round %i up to %i", (length, expected) => {
        expect(ceilWord(length)).toEqual(expected);
    });
});

describe("size helpers", () => {
    it.each([
        [0, WORD],
        [1, 2 * WORD],
        [32, 2 * WORD],
        [33, 3 * WORD],
    ])("should size a %i byte abi bytes field as %i", (length, expected) => {
        expect(abiBytesSize(new Uint8Array(length))).toEqual(expected);
    });

    it.each([
        [0, WORD],
        [1, 2 * WORD],
        [3, 4 * WORD],
    ])(
        "should size a %i element abi uint256 array as %i",
        (length, expected) => {
            expect(abiUint256ArraySize(new Array(length).fill(0n))).toEqual(
                expected,
            );
        },
    );
});

describe("representation normalizers", () => {
    it("should pass a byte array through asBytes", () => {
        const bytes = Hex.toBytes("0xdeadbeef");
        expect(asBytes(bytes)).toBe(bytes);
    });

    it("should convert hex to bytes with asBytes", () => {
        expect(asBytes("0xdeadbeef")).toEqual(Hex.toBytes("0xdeadbeef"));
    });

    it("should pass hex through asHex", () => {
        expect(asHex("0xdeadbeef")).toEqual("0xdeadbeef");
    });

    it("should convert bytes to hex with asHex", () => {
        expect(asHex(Hex.toBytes("0xdeadbeef"))).toEqual("0xdeadbeef");
    });

    it("should round empty values through both", () => {
        expect(asBytes("0x")).toEqual(new Uint8Array());
        expect(asHex(new Uint8Array())).toEqual("0x");
    });
});

describe("hasSelector", () => {
    const selector = Hex.toBytes("0xdeadbeef");

    it("should match data starting with the selector", () => {
        expect(hasSelector(Hex.toBytes("0xdeadbeef0011"), selector)).toBe(true);
    });

    it("should not match data starting with another selector", () => {
        expect(hasSelector(Hex.toBytes("0xdeadbeee0011"), selector)).toBe(
            false,
        );
    });

    // every() reads past the end as undefined rather than throwing, so a
    // truncated blob has to come back false instead of matching
    it("should not match data shorter than the selector", () => {
        expect(hasSelector(Hex.toBytes("0xdead"), selector)).toBe(false);
        expect(hasSelector(new Uint8Array(), selector)).toBe(false);
    });
});

describe("addresses", () => {
    it("should read a checksummed address", () => {
        const data = Hex.toBytes(address.toLowerCase() as `0x${string}`);
        expect(readAddress(data, 0)).toEqual(address);
    });

    it("should read an address right-aligned in a word", () => {
        const data = new Uint8Array(WORD);
        data.set(Hex.toBytes(address), WORD - 20);
        expect(readAddressWord(data, 0)).toEqual(address);
    });

    it("should throw reading an address out of bounds", () => {
        expect(() => readAddress(Hex.toBytes("0xdeadbeef"), 0)).toThrow(
            "data out of bounds: expected at least 20 bytes, got 4",
        );
    });

    it("should write an address and return the next offset", () => {
        const data = new Uint8Array(20);
        expect(writeAddress(data, 0, address)).toEqual(20);
        expect(Bytes.toHex(data)).toEqual(address.toLowerCase());
    });

    it("should write an address right-aligned in a word", () => {
        const data = new Uint8Array(WORD);
        expect(writeAddressWord(data, 0, address)).toEqual(WORD);
        expect(data.subarray(0, WORD - 20)).toEqual(new Uint8Array(12));
        expect(Bytes.toHex(data.subarray(WORD - 20))).toEqual(
            address.toLowerCase(),
        );
    });
});

describe("uint256", () => {
    it.each([0n, 1n, 255n, 256n, 2n ** 200n, 2n ** 256n - 1n])(
        "should roundtrip %s",
        (value) => {
            const data = new Uint8Array(WORD);
            expect(writeUint256(data, 0, value)).toEqual(WORD);
            expect(readUint256(data, 0)).toEqual(value);
        },
    );

    it("should write big-endian", () => {
        const data = new Uint8Array(WORD);
        writeUint256(data, 0, 1n);
        expect(data[WORD - 1]).toEqual(1);
        expect(data[0]).toEqual(0);
    });

    it.each([-1n, 2n ** 256n])(
        "should throw on %s, out of uint256 range",
        (value) => {
            expect(() => writeUint256(new Uint8Array(WORD), 0, value)).toThrow(
                "number out of uint256 range",
            );
        },
    );

    it("should throw reading a uint256 out of bounds", () => {
        expect(() => readUint256(new Uint8Array(WORD - 1), 0)).toThrow(
            "data out of bounds: expected at least 32 bytes, got 31",
        );
    });
});

describe("abi bytes", () => {
    // a dynamic field is reached through an offset pointer: a word holding
    // where the field starts, relative to a base, and at that position a
    // length word followed by the contents, right-padded to whole words. The
    // readers take the pointer, so a fixture has to carry one.
    const encode = (value: Uint8Array): Uint8Array => {
        const data = new Uint8Array(WORD + abiBytesSize(value));
        writeUint256(data, 0, BigInt(WORD));
        writeAbiBytes(data, WORD, value);
        return data;
    };

    it("should write the length word and return the next offset", () => {
        const value = Hex.toBytes("0xdeadbeef");
        const data = new Uint8Array(abiBytesSize(value));
        expect(writeAbiBytes(data, 0, value)).toEqual(2 * WORD);
        expect(readUint256(data, 0)).toEqual(4n);
        expect(data.subarray(WORD, WORD + 4)).toEqual(value);
    });

    it("should right-pad the contents with zeros", () => {
        const data = encode(Hex.toBytes("0xdeadbeef"));
        expect(data.subarray(2 * WORD + 4)).toEqual(new Uint8Array(WORD - 4));
    });

    it.each([0, 4, 5, 31, 32, 33])(
        "should read back a %i byte field at its exact length",
        (length) => {
            const value = new Uint8Array(length).fill(0xab);
            const data = encode(value);
            expect(readAbiBytes(data, 0, 0)).toEqual(value);
        },
    );

    it("should return a zero-copy view of the data", () => {
        const value = Hex.toBytes("0xdeadbeef");
        const data = encode(value);
        const read = readAbiBytes(data, 0, 0);
        expect(read.buffer).toBe(data.buffer);
        expect(read.byteOffset).toEqual(2 * WORD);
        expect(read.length).toEqual(4);
    });

    it("should resolve the offset pointer relative to the base", () => {
        // the same field one word further in, reached from a base of 32, so a
        // pointer of 32 lands at 64 rather than at 32
        const value = Hex.toBytes("0xdeadbeef");
        const data = new Uint8Array(2 * WORD + abiBytesSize(value));
        writeUint256(data, WORD, BigInt(WORD));
        writeAbiBytes(data, 2 * WORD, value);
        expect(readAbiBytes(data, WORD, WORD)).toEqual(value);
    });

    it("should throw on a field whose contents are truncated", () => {
        const data = encode(Hex.toBytes("0xdeadbeef")).subarray(
            0,
            2 * WORD + 2,
        );
        expect(() => readAbiBytes(data, 0, 0)).toThrow("data out of bounds");
    });

    // readSize refuses an offset or length that cannot be a JS number; it is
    // not exported, so this drives it through the length word
    it("should throw on a size that exceeds the safe integer range", () => {
        const data = new Uint8Array(WORD);
        writeUint256(data, 0, BigInt(Number.MAX_SAFE_INTEGER) + 1n);
        expect(() => readAbiBytes(data, 0, 0)).toThrow(
            "data offset or size out of bounds: 9007199254740992",
        );
    });
});

describe("abi uint256 array", () => {
    const encode = (values: readonly bigint[]): Uint8Array => {
        const data = new Uint8Array(WORD + abiUint256ArraySize(values));
        writeUint256(data, 0, BigInt(WORD));
        writeAbiUint256Array(data, WORD, values);
        return data;
    };

    it("should write the length word and one word per element", () => {
        const values = [1n, 2n, 3n];
        const data = new Uint8Array(abiUint256ArraySize(values));
        expect(writeAbiUint256Array(data, 0, values)).toEqual(4 * WORD);
        expect(readUint256(data, 0)).toEqual(3n);
        expect(readUint256(data, WORD)).toEqual(1n);
        expect(readUint256(data, 3 * WORD)).toEqual(3n);
    });

    it.each([[[]], [[0n]], [[1n, 2n, 3n]], [[2n ** 256n - 1n]]])(
        "should read back %s",
        (values) => {
            expect(readAbiUint256Array(encode(values), 0, 0)).toEqual(values);
        },
    );

    it("should throw on an array whose elements are truncated", () => {
        const data = encode([1n, 2n, 3n]).subarray(0, 4 * WORD);
        expect(() => readAbiUint256Array(data, 0, 0)).toThrow(
            "data out of bounds",
        );
    });
});

describe("raw writers", () => {
    it("should write bytes and return the offset past them", () => {
        const data = new Uint8Array(8);
        expect(writeBytes(data, 2, Hex.toBytes("0xdeadbeef"))).toEqual(6);
        expect(Bytes.toHex(data)).toEqual("0x0000deadbeef0000");
    });

    it("should pad to whole words and return the padded offset", () => {
        const data = new Uint8Array(2 * WORD);
        expect(writePaddedBytes(data, 0, Hex.toBytes("0xdeadbeef"))).toEqual(
            WORD,
        );
        expect(data.subarray(0, 4)).toEqual(Hex.toBytes("0xdeadbeef"));
        expect(data.subarray(4, WORD)).toEqual(new Uint8Array(WORD - 4));
    });

    it("should not pad a value that already fills whole words", () => {
        const value = Hex.toBytes(Hex.fromNumber(1n, { size: 32 }));
        expect(writePaddedBytes(new Uint8Array(WORD), 0, value)).toEqual(WORD);
    });
});
