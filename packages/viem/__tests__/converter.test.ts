import { Application } from "@cartesi/rpc";
import { getAddress } from "viem";
import { describe, expect, it } from "vitest";
import { applicationConverter } from "../src/types/converter.js";

describe("converter", () => {
    it("should convert the application", () => {
        const rpcApplication: Application = {
            name: "0x67742ff5b2b762503ff0a92738c6fc2ea4a4d182",
            iapplication_address: "0x67742ff5b2b762503ff0a92738c6fc2ea4a4d182",
            iconsensus_address: "0x92cc14432c1f82622493abd64d99ea8a3000a7c7",
            iinputbox_address: "0xb6b39fb3dd926a9e3fbc7a129540eebea3016a6c",
            template_hash:
                "0x3b57a86b635d433eb923dc86fa6f9832f15a88f89cfa7d8d45f568dbb6cf992e",
            data_availability: "0xb12c9ede",
            state: "ENABLED",
            created_at: "2025-04-10T03:23:27.450183Z",
            updated_at: "2025-04-10T04:03:28.755635Z",
            execution_parameters: {
                advance_inc_cycles: "0x400000",
                advance_max_cycles: "0x3fffffffffffffff",
                inspect_inc_cycles: "0x400000",
                inspect_max_cycles: "0x3fffffffffffffff",
                advance_inc_deadline: "0x2540be400",
                advance_max_deadline: "0x29e8d60800",
                inspect_inc_deadline: "0x2540be400",
                inspect_max_deadline: "0x29e8d60800",
                load_deadline: "0x45d964b800",
                store_deadline: "0x29e8d60800",
                fast_deadline: "0x12a05f200",
                snapshot_policy: "NONE",
                max_concurrent_inspects: 10,
                created_at: "2025-04-10T03:23:27.450183Z",
                updated_at: "2025-04-10T03:23:27.450183Z",
            },
            iinputbox_block: "0x1",
            last_input_check_block: "0x1f3",
            last_output_check_block: "0x1f3",
            epoch_length: "0x2d0",
            processed_inputs: "0x0",
        };
        const application = applicationConverter(rpcApplication);
        expect(application).toBeDefined();
        expect(application.applicationAddress).toBe(
            getAddress(rpcApplication.iapplication_address),
        );
    });
});
