import type { Address } from "abitype";
import { describe, expectTypeOf, it } from "vitest";
import type { Deposit, Erc1155BatchDeposit } from "../src/portal.js";
import { decodeDeposit } from "../src/portal.js";
import type {
    DelegateCallVoucher,
    Notice,
    Output,
    Voucher,
} from "../src/output.js";
import { decodeOutput, encodeOutput } from "../src/output.js";
import type { Input } from "../src/input.js";
import { decodeInput, encodeInput } from "../src/input.js";
import type { To } from "../src/types.js";

// Every type this package exports is derived: the field names and types of
// `Input` and `Output` are inferred from the `Inputs`/`Outputs` ABIs through
// `ParamsToObject`, and the decode/encode overloads thread the `Hex` vs
// `Uint8Array` choice through all of them. None of that is exercised by a
// runtime assertion, so these are the only tests that cover it.
//
// The assertions deliberately name the structural types — `0x${string}`,
// `Uint8Array`, abitype's `Address` — rather than a library's aliases for
// them. That is what the exported types have to resolve to for a consumer
// typing them with viem's `Hex`, `ByteArray` and `Address` to keep compiling,
// and stating it structurally means the pin holds whichever library the
// implementation is built on.

type Hex = `0x${string}`;

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

describe("Input", () => {
    it("maps the EvmAdvance arguments to a field per parameter", () => {
        expectTypeOf<Input>().toEqualTypeOf<{
            chainId: bigint;
            appContract: Address;
            msgSender: Address;
            blockNumber: bigint;
            blockTimestamp: bigint;
            prevRandao: bigint;
            index: bigint;
            payload: Hex;
        }>();
    });

    it("resolves its field types to the structural primitives", () => {
        expectTypeOf<Input["payload"]>().toEqualTypeOf<`0x${string}`>();
        expectTypeOf<
            Input<Uint8Array>["payload"]
        >().toEqualTypeOf<Uint8Array>();
        expectTypeOf<Input["appContract"]>().toEqualTypeOf<Address>();
        expectTypeOf<Input["chainId"]>().toEqualTypeOf<bigint>();
    });

    it("follows the bytes parameter only for the payload", () => {
        expectTypeOf<Input<Uint8Array>["chainId"]>().toEqualTypeOf<bigint>();
        expectTypeOf<
            Input<Uint8Array>["appContract"]
        >().toEqualTypeOf<Address>();
    });
});

describe("Output", () => {
    it("is discriminated over exactly the Outputs functions", () => {
        expectTypeOf<Output["type"]>().toEqualTypeOf<
            "Notice" | "Voucher" | "DelegateCallVoucher"
        >();
        expectTypeOf<Output>().toEqualTypeOf<
            Notice | Voucher | DelegateCallVoucher
        >();
    });

    it("maps each variant's arguments to a field per parameter", () => {
        expectTypeOf<Notice>().toEqualTypeOf<{
            type: "Notice";
            payload: Hex;
        }>();
        expectTypeOf<Voucher>().toEqualTypeOf<{
            type: "Voucher";
            destination: Address;
            value: bigint;
            payload: Hex;
        }>();
        expectTypeOf<DelegateCallVoucher>().toEqualTypeOf<{
            type: "DelegateCallVoucher";
            destination: Address;
            payload: Hex;
        }>();
    });

    it("resolves a destination to the structural address type", () => {
        expectTypeOf<Voucher["destination"]>().toEqualTypeOf<Address>();
        expectTypeOf<
            DelegateCallVoucher["destination"]
        >().toEqualTypeOf<Address>();
    });

    it("narrows on the type discriminant", () => {
        const output = { type: "Notice", payload: "0x" } as Output;
        if (output.type === "Voucher") {
            expectTypeOf(output.destination).toEqualTypeOf<Address>();
            expectTypeOf(output.value).toEqualTypeOf<bigint>();
        }
        if (output.type === "Notice") {
            // @ts-expect-error a notice carries no destination
            output.destination;
        }
    });
});

// Each decode and encode function is overloaded three ways, so that a hex
// argument yields hex fields, a byte array yields byte array fields, and a
// value of unknown representation yields the union. Getting those return
// types wrong is invisible at run time.
describe("decode overloads", () => {
    const hexOrBytes = "0x" as Hex | Uint8Array;

    it("threads the representation of the data through decodeInput", () => {
        expectTypeOf(decodeInput("0x")).toEqualTypeOf<Input>();
        expectTypeOf(decodeInput(new Uint8Array())).toEqualTypeOf<
            Input<Uint8Array>
        >();
        expectTypeOf(decodeInput(hexOrBytes)).toEqualTypeOf<
            Input<Hex | Uint8Array>
        >();
    });

    it("threads the representation of the data through decodeOutput", () => {
        expectTypeOf(decodeOutput("0x")).toEqualTypeOf<Output>();
        expectTypeOf(decodeOutput(new Uint8Array())).toEqualTypeOf<
            Output<Uint8Array>
        >();
        expectTypeOf(decodeOutput(hexOrBytes)).toEqualTypeOf<
            Output<Hex | Uint8Array>
        >();
    });

    it("decodes a deposit to the union or undefined", () => {
        const input = {
            msgSender: "0x0000000000000000000000000000000000000001",
            payload: "0x",
        } as const;
        expectTypeOf(decodeDeposit(input)).toEqualTypeOf<Deposit | undefined>();
        expectTypeOf(
            decodeDeposit({ ...input, payload: new Uint8Array() }),
        ).toEqualTypeOf<Deposit<Uint8Array> | undefined>();
    });

    it("keeps a batch deposit's lists readonly", () => {
        expectTypeOf<Erc1155BatchDeposit["tokenIds"]>().toEqualTypeOf<
            readonly bigint[]
        >();
        expectTypeOf<Erc1155BatchDeposit["values"]>().toEqualTypeOf<
            readonly bigint[]
        >();
    });
});

describe("encode overloads", () => {
    const to = "hex" as To;

    it("returns hex by default, bytes on request, the union for either", () => {
        expectTypeOf(encodeInput(input)).toEqualTypeOf<Hex>();
        expectTypeOf(encodeInput(input, "bytes")).toEqualTypeOf<Uint8Array>();
        expectTypeOf(encodeInput(input, to)).toEqualTypeOf<Hex | Uint8Array>();
    });

    it("does the same for encodeOutput", () => {
        const notice: Output = { type: "Notice", payload: "0xdeadbeef" };
        expectTypeOf(encodeOutput(notice)).toEqualTypeOf<Hex>();
        expectTypeOf(encodeOutput(notice, "bytes")).toEqualTypeOf<Uint8Array>();
        expectTypeOf(encodeOutput(notice, to)).toEqualTypeOf<
            Hex | Uint8Array
        >();
    });
});
