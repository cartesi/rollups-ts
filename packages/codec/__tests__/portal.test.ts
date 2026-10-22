import * as Hex from "ox/Hex";
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

// Portal deposit payloads are packed-encoded by the rollups contracts
// `InputEncoding` library, so there is no ABI to decode against and the
// layouts below are the contract's, mirrored by hand. Every expected payload
// is a frozen literal rather than something rebuilt here with an encoder:
// a literal cannot drift with whichever library does the encoding, it reads
// in the diff, and it is the only form that still pins these layouts if the
// implementation is rewritten on top of a different one. The layout each
// literal encodes is in the comment above it, and each was generated from the
// implementation at the time it was added, never typed out.

const token = "0x67742FF5B2B762503fF0A92738C6FC2ea4a4d182" as const;
const sender = "0x92cc14432c1F82622493aBd64D99Ea8A3000a7c7" as const;

// sender (20) ‖ value (32) ‖ execLayerData
const etherPayload =
    "0x92cc14432c1f82622493abd64d99ea8a3000a7c700000000000000000000000000000000000000000000000000000000075bcd15deadbeef" as const;

// token (20) ‖ sender (20) ‖ value (32) ‖ execLayerData
const erc20Payload =
    "0x67742ff5b2b762503ff0a92738c6fc2ea4a4d18292cc14432c1f82622493abd64d99ea8a3000a7c70000000000000000000000000000000000000000000000000de0b6b3a7640000deadbeef" as const;

// token (20) ‖ sender (20) ‖ tokenId (32) ‖
// abi.encode(baseLayerData, execLayerData)
const erc721Payload =
    "0x67742ff5b2b762503ff0a92738c6fc2ea4a4d18292cc14432c1f82622493abd64d99ea8a3000a7c7000000000000000000000000000000000000000000000000000000000000002a000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000002abcd0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000004deadbeef00000000000000000000000000000000000000000000000000000000" as const;

// token (20) ‖ sender (20) ‖ tokenId (32) ‖ value (32) ‖
// abi.encode(baseLayerData, execLayerData)
const erc1155SinglePayload =
    "0x67742ff5b2b762503ff0a92738c6fc2ea4a4d18292cc14432c1f82622493abd64d99ea8a3000a7c7000000000000000000000000000000000000000000000000000000000000002a0000000000000000000000000000000000000000000000000000000000000007000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000002abcd0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000004deadbeef00000000000000000000000000000000000000000000000000000000" as const;

// token (20) ‖ sender (20) ‖
// abi.encode(tokenIds, values, baseLayerData, execLayerData)
const erc1155BatchPayload =
    "0x67742ff5b2b762503ff0a92738c6fc2ea4a4d18292cc14432c1f82622493abd64d99ea8a3000a7c700000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000018000000000000000000000000000000000000000000000000000000000000001c000000000000000000000000000000000000000000000000000000000000000030000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000030000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000006400000000000000000000000000000000000000000000000000000000000000c8000000000000000000000000000000000000000000000000000000000000012c0000000000000000000000000000000000000000000000000000000000000002abcd0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000004deadbeef00000000000000000000000000000000000000000000000000000000" as const;

// payloads at exactly the minimum size each decoder accepts, where the data
// tail is empty. For Ether and ERC-20 the tail is the raw execLayerData, so
// an empty one is valid; for the three with an abi.encode'd tail there is
// nothing to decode and they must raise instead.
const etherMinPayload =
    "0x92cc14432c1f82622493abd64d99ea8a3000a7c70000000000000000000000000000000000000000000000000000000000000000" as const;
const erc20MinPayload =
    "0x67742ff5b2b762503ff0a92738c6fc2ea4a4d18292cc14432c1f82622493abd64d99ea8a3000a7c70000000000000000000000000000000000000000000000000000000000000000" as const;
const erc721MinPayload =
    "0x67742ff5b2b762503ff0a92738c6fc2ea4a4d18292cc14432c1f82622493abd64d99ea8a3000a7c70000000000000000000000000000000000000000000000000000000000000000" as const;
const erc1155SingleMinPayload =
    "0x67742ff5b2b762503ff0a92738c6fc2ea4a4d18292cc14432c1f82622493abd64d99ea8a3000a7c700000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" as const;
const erc1155BatchMinPayload =
    "0x67742ff5b2b762503ff0a92738c6fc2ea4a4d18292cc14432c1f82622493abd64d99ea8a3000a7c7" as const;

// an ERC-721 deposit whose baseLayerData is 3 bytes and execLayerData 33, so
// the tail exercises right-padding and a field spanning two words. Every
// other fixture here has a tail of 2 or 4 bytes.
const erc721WidePayload =
    "0x67742ff5b2b762503ff0a92738c6fc2ea4a4d18292cc14432c1f82622493abd64d99ea8a3000a7c7000000000000000000000000000000000000000000000000000000000000002a000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000003abcdef00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000021ababababababababababababababababababababababababababababababababab00000000000000000000000000000000000000000000000000000000000000" as const;

const zeroDataError = 'Cannot decode zero data ("0x") with ABI parameters.';

describe("ether deposit", () => {
    const deposit: EtherDeposit = {
        sender,
        value: 123456789n,
        execLayerData: "0xdeadbeef",
    };

    it("should encode", () => {
        expect(encodeEtherDeposit(deposit)).toEqual(etherPayload);
    });

    it("should decode", () => {
        expect(decodeEtherDeposit(etherPayload)).toEqual(deposit);
    });

    // the packed encoding lowercases addresses, so the checksummed spelling
    // of a mixed-case address must not survive into the payload
    it("should lowercase the sender in the packed encoding", () => {
        const encoded = encodeEtherDeposit(deposit);
        expect(encoded).toContain(sender.slice(2).toLowerCase());
        expect(encoded).not.toContain(sender.slice(2));
    });

    it("should decode a payload spelled with a checksummed address", () => {
        const checksummed = etherPayload.replace(
            sender.slice(2).toLowerCase(),
            sender.slice(2),
        ) as `0x${string}`;
        expect(decodeEtherDeposit(checksummed)).toEqual(deposit);
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

    // the raw tail is empty at exactly the minimum size, which is the one
    // place a decoder must return "0x" rather than slice past the end
    it("should decode an empty tail at exactly the minimum size", () => {
        expect(decodeEtherDeposit(etherMinPayload).execLayerData).toEqual("0x");
        expect(
            decodeEtherDeposit(Hex.toBytes(etherMinPayload)).execLayerData,
        ).toEqual(new Uint8Array());
    });

    it("should throw on a payload that is too short", () => {
        expect(() => decodeEtherDeposit("0xdeadbeef")).toThrow(
            "invalid Ether deposit payload: expected at least 52 bytes, got 4",
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

    it("should encode", () => {
        expect(encodeErc20Deposit(deposit)).toEqual(erc20Payload);
    });

    it("should decode", () => {
        expect(decodeErc20Deposit(erc20Payload)).toEqual(deposit);
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

    it("should decode an empty tail at exactly the minimum size", () => {
        expect(decodeErc20Deposit(erc20MinPayload).execLayerData).toEqual("0x");
        expect(
            decodeErc20Deposit(Hex.toBytes(erc20MinPayload)).execLayerData,
        ).toEqual(new Uint8Array());
    });

    it("should throw on a payload that is too short", () => {
        expect(() => decodeErc20Deposit("0xdeadbeef")).toThrow(
            "invalid ERC-20 deposit payload: expected at least 72 bytes, got 4",
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

    it("should encode", () => {
        expect(encodeErc721Deposit(deposit)).toEqual(erc721Payload);
    });

    it("should decode", () => {
        expect(decodeErc721Deposit(erc721Payload)).toEqual(deposit);
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

    // a 3-byte field followed by a 33-byte one: right-padding on both, and a
    // field that spans two words
    it("should roundtrip data that is not word-aligned", () => {
        const wide: Erc721Deposit = {
            token,
            sender,
            tokenId: 42n,
            baseLayerData: "0xabcdef",
            execLayerData: `0x${"ab".repeat(33)}`,
        };
        expect(encodeErc721Deposit(wide)).toEqual(erc721WidePayload);
        expect(decodeErc721Deposit(erc721WidePayload)).toEqual(wide);
    });

    it("should throw on a payload that is too short", () => {
        expect(() => decodeErc721Deposit("0xdeadbeef")).toThrow(
            "invalid ERC-721 deposit payload: expected at least 72 bytes, got 4",
        );
    });

    // long enough to pass the size guard, but with no abi.encode'd tail to
    // decode. viem and ox word this identically, so the message is pinned.
    it("should throw on a payload with a malformed data tail", () => {
        expect(() => decodeErc721Deposit(erc721MinPayload)).toThrow(
            zeroDataError,
        );
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

    it("should encode", () => {
        expect(encodeErc1155SingleDeposit(deposit)).toEqual(
            erc1155SinglePayload,
        );
    });

    it("should decode", () => {
        expect(decodeErc1155SingleDeposit(erc1155SinglePayload)).toEqual(
            deposit,
        );
    });

    it("should roundtrip with empty data", () => {
        const original: Erc1155SingleDeposit = {
            token,
            sender,
            tokenId: 0n,
            value: 0n,
            baseLayerData: "0x",
            execLayerData: "0x",
        };
        expect(
            decodeErc1155SingleDeposit(encodeErc1155SingleDeposit(original)),
        ).toEqual(original);
    });

    it("should throw on a payload that is too short", () => {
        expect(() => decodeErc1155SingleDeposit("0xdeadbeef")).toThrow(
            "invalid ERC-1155 single deposit payload: expected at least 104 bytes, got 4",
        );
    });

    it("should throw on a payload with a malformed data tail", () => {
        expect(() =>
            decodeErc1155SingleDeposit(erc1155SingleMinPayload),
        ).toThrow(zeroDataError);
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

    it("should encode", () => {
        expect(encodeErc1155BatchDeposit(deposit)).toEqual(erc1155BatchPayload);
    });

    it("should decode", () => {
        expect(decodeErc1155BatchDeposit(erc1155BatchPayload)).toEqual(deposit);
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
            "invalid ERC-1155 batch deposit payload: expected at least 40 bytes, got 4",
        );
    });

    it("should throw on a payload with a malformed data tail", () => {
        expect(() => decodeErc1155BatchDeposit(erc1155BatchMinPayload)).toThrow(
            zeroDataError,
        );
    });
});

describe("deposits (byte array)", () => {
    const execLayerData = Hex.toBytes("0xdeadbeef");
    const baseLayerData = Hex.toBytes("0xabcd");

    it("should decode and encode an Ether deposit", () => {
        const deposit: EtherDeposit<Uint8Array> = {
            sender,
            value: 123456789n,
            execLayerData,
        };
        expect(decodeEtherDeposit(Hex.toBytes(etherPayload))).toEqual(deposit);
        expect(encodeEtherDeposit(deposit, "bytes")).toEqual(
            Hex.toBytes(etherPayload),
        );
        expect(encodeEtherDeposit(deposit)).toEqual(etherPayload);
    });

    it("should decode and encode an ERC-20 deposit", () => {
        const deposit: Erc20Deposit<Uint8Array> = {
            token,
            sender,
            value: 1000000000000000000n,
            execLayerData,
        };
        expect(decodeErc20Deposit(Hex.toBytes(erc20Payload))).toEqual(deposit);
        expect(encodeErc20Deposit(deposit, "bytes")).toEqual(
            Hex.toBytes(erc20Payload),
        );
    });

    it("should return execLayerData as a zero-copy view of the payload", () => {
        const payload = Hex.toBytes(erc20Payload);
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
        expect(decodeErc721Deposit(Hex.toBytes(erc721Payload))).toEqual(
            deposit,
        );
        expect(encodeErc721Deposit(deposit, "bytes")).toEqual(
            Hex.toBytes(erc721Payload),
        );
        expect(encodeErc721Deposit(deposit)).toEqual(erc721Payload);
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
        expect(
            decodeErc1155SingleDeposit(Hex.toBytes(erc1155SinglePayload)),
        ).toEqual(deposit);
        expect(encodeErc1155SingleDeposit(deposit, "bytes")).toEqual(
            Hex.toBytes(erc1155SinglePayload),
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
        expect(
            decodeErc1155BatchDeposit(Hex.toBytes(erc1155BatchPayload)),
        ).toEqual(deposit);
        expect(encodeErc1155BatchDeposit(deposit, "bytes")).toEqual(
            Hex.toBytes(erc1155BatchPayload),
        );
        expect(encodeErc1155BatchDeposit(deposit)).toEqual(erc1155BatchPayload);
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
        const short = Hex.toBytes("0xdeadbeef");
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
            decodeErc721Deposit(Hex.toBytes(erc721MinPayload)),
        ).toThrow("data out of bounds");
    });
});
