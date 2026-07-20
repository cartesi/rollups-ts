import { getAddress, hexToBytes, slice } from "viem";
import { describe, expect, it } from "vitest";
import {
    decodeOutput,
    type DelegateCallVoucher,
    encodeDelegateCallVoucher,
    encodeNotice,
    encodeOutput,
    encodeVoucher,
    type Notice,
    type Output,
    type Voucher,
} from "../src/output.js";

// canonical calldata of Outputs.Notice(0xdeadbeef)
const encodedNotice =
    "0xc258d6e500000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000004deadbeef00000000000000000000000000000000000000000000000000000000" as const;

// canonical calldata of Outputs.Voucher(0x...1, 2, 0xdeadbeef)
const encodedVoucher =
    "0x237a816f0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000004deadbeef00000000000000000000000000000000000000000000000000000000" as const;

// canonical calldata of Outputs.DelegateCallVoucher(0x...1, 0xdeadbeef)
const encodedDelegateCallVoucher =
    "0x10321e8b000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000004deadbeef00000000000000000000000000000000000000000000000000000000" as const;

const notice: Notice = { type: "Notice", payload: "0xdeadbeef" };

const voucher: Voucher = {
    type: "Voucher",
    destination: "0x0000000000000000000000000000000000000001",
    value: 2n,
    payload: "0xdeadbeef",
};

const delegateCallVoucher: DelegateCallVoucher = {
    type: "DelegateCallVoucher",
    destination: "0x0000000000000000000000000000000000000001",
    payload: "0xdeadbeef",
};

describe("output", () => {
    it("should encode a notice", () => {
        expect(encodeNotice(notice)).toEqual(encodedNotice);
        expect(encodeOutput(notice)).toEqual(encodedNotice);
        expect(slice(encodedNotice, 0, 4)).toEqual("0xc258d6e5");
    });

    it("should encode a voucher", () => {
        expect(encodeVoucher(voucher)).toEqual(encodedVoucher);
        expect(encodeOutput(voucher)).toEqual(encodedVoucher);
        expect(slice(encodedVoucher, 0, 4)).toEqual("0x237a816f");
    });

    it("should encode a delegate call voucher", () => {
        expect(encodeDelegateCallVoucher(delegateCallVoucher)).toEqual(
            encodedDelegateCallVoucher,
        );
        expect(encodeOutput(delegateCallVoucher)).toEqual(
            encodedDelegateCallVoucher,
        );
        expect(slice(encodedDelegateCallVoucher, 0, 4)).toEqual("0x10321e8b");
    });

    it("should decode a notice", () => {
        expect(decodeOutput(encodedNotice)).toEqual(notice);
    });

    it("should decode a voucher", () => {
        expect(decodeOutput(encodedVoucher)).toEqual(voucher);
    });

    it("should decode a delegate call voucher", () => {
        expect(decodeOutput(encodedDelegateCallVoucher)).toEqual(
            delegateCallVoucher,
        );
    });

    it("should roundtrip outputs through encode and decode", () => {
        const destination = getAddress(
            "0x67742ff5b2b762503ff0a92738c6fc2ea4a4d182",
        );
        const outputs = [
            { type: "Notice", payload: "0x" },
            {
                type: "Voucher",
                destination,
                value: 0n,
                payload: "0x095ea7b3",
            },
            {
                type: "DelegateCallVoucher",
                destination,
                payload: "0x",
            },
        ] as const;
        for (const output of outputs) {
            expect(decodeOutput(encodeOutput(output))).toEqual(output);
        }
    });

    it("should throw on data with an unknown function selector", () => {
        expect(() => decodeOutput("0x415bf363")).toThrow();
    });
});

describe("output (byte array)", () => {
    const payloadBytes = hexToBytes("0xdeadbeef");
    const noticeBytes: Notice<Uint8Array> = {
        type: "Notice",
        payload: payloadBytes,
    };
    const voucherBytes: Voucher<Uint8Array> = {
        ...voucher,
        payload: payloadBytes,
    };
    const delegateCallVoucherBytes: DelegateCallVoucher<Uint8Array> = {
        ...delegateCallVoucher,
        payload: payloadBytes,
    };

    it("should decode a notice from a byte array", () => {
        expect(decodeOutput(hexToBytes(encodedNotice))).toEqual(noticeBytes);
    });

    it("should decode a voucher from a byte array", () => {
        expect(decodeOutput(hexToBytes(encodedVoucher))).toEqual(voucherBytes);
    });

    it("should decode a delegate call voucher from a byte array", () => {
        expect(decodeOutput(hexToBytes(encodedDelegateCallVoucher))).toEqual(
            delegateCallVoucherBytes,
        );
    });

    it("should return the payload as a zero-copy view of the data", () => {
        const data = hexToBytes(encodedNotice);
        const decoded = decodeOutput(data);
        expect(decoded.payload.buffer).toBe(data.buffer);
        expect(decoded.payload.byteOffset).toBe(4 + 2 * 32);
        expect(decoded.payload.length).toBe(4);
    });

    it("should encode outputs to byte arrays", () => {
        expect(encodeNotice(noticeBytes, "bytes")).toEqual(
            hexToBytes(encodedNotice),
        );
        expect(encodeVoucher(voucher, "bytes")).toEqual(
            hexToBytes(encodedVoucher),
        );
        expect(encodeDelegateCallVoucher(delegateCallVoucher, "bytes")).toEqual(
            hexToBytes(encodedDelegateCallVoucher),
        );
        expect(encodeOutput(voucherBytes, "bytes")).toEqual(
            hexToBytes(encodedVoucher),
        );
    });

    it("should encode byte array payloads to hex", () => {
        expect(encodeOutput(noticeBytes)).toEqual(encodedNotice);
        expect(encodeOutput(voucherBytes)).toEqual(encodedVoucher);
        expect(encodeOutput(delegateCallVoucherBytes)).toEqual(
            encodedDelegateCallVoucher,
        );
    });

    it("should roundtrip outputs through encode and decode", () => {
        const destination = getAddress(
            "0x67742ff5b2b762503ff0a92738c6fc2ea4a4d182",
        );
        const outputs: Output<Uint8Array>[] = [
            { type: "Notice", payload: new Uint8Array() },
            {
                type: "Voucher",
                destination,
                value: 0n,
                payload: hexToBytes("0x095ea7b3"),
            },
            {
                type: "DelegateCallVoucher",
                destination,
                payload: new Uint8Array(),
            },
        ];
        for (const output of outputs) {
            expect(decodeOutput(encodeOutput(output, "bytes"))).toEqual(output);
        }
    });

    it("should throw on a byte array with an unknown function selector", () => {
        expect(() => decodeOutput(hexToBytes("0x415bf363"))).toThrow();
    });
});
