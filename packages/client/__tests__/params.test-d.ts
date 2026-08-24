import { describe, expectTypeOf, it } from "vitest";
import type {
    EpochStatus,
    ListEpochsParams,
    ListOutputsParams,
    NonEmptyArray,
    OutputType,
} from "../src/types/actions.js";

const application = "0x0000000000000000000000000000000000000001";

// The node rejects an empty filter list with invalid params, so the list-valued
// filters are typed as non-empty arrays and an empty literal must not compile.
describe("list filters", () => {
    it("accepts a single value or a non-empty list of statuses", () => {
        expectTypeOf<ListEpochsParams["status"]>().toEqualTypeOf<
            EpochStatus | NonEmptyArray<EpochStatus> | undefined
        >();

        const single: ListEpochsParams = { application, status: "OPEN" };
        const many: ListEpochsParams = {
            application,
            status: ["OPEN", "CLOSED"],
        };
        expectTypeOf(single).toExtend<ListEpochsParams>();
        expectTypeOf(many).toExtend<ListEpochsParams>();
    });

    it("rejects an empty list of statuses", () => {
        // @ts-expect-error an empty status list is not a valid filter
        const empty: ListEpochsParams = { application, status: [] };
        expectTypeOf(empty).toExtend<ListEpochsParams>();
    });

    it("accepts a single value or a non-empty list of output types", () => {
        expectTypeOf<ListOutputsParams["outputType"]>().toEqualTypeOf<
            OutputType | NonEmptyArray<OutputType> | undefined
        >();

        const single: ListOutputsParams = {
            application,
            outputType: "Voucher",
        };
        const many: ListOutputsParams = {
            application,
            outputType: ["Voucher", "DelegateCallVoucher"],
        };
        expectTypeOf(single).toExtend<ListOutputsParams>();
        expectTypeOf(many).toExtend<ListOutputsParams>();
    });

    it("rejects an empty list of output types", () => {
        // @ts-expect-error an empty output type list is not a valid filter
        const empty: ListOutputsParams = { application, outputType: [] };
        expectTypeOf(empty).toExtend<ListOutputsParams>();
    });
});
