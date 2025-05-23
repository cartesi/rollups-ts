import type { Application, Output } from "@cartesi/rpc";
import { getAddress, hexToBigInt } from "viem";
import { describe, expect, it } from "vitest";
import {
    applicationConverter,
    outputConverter,
} from "../src/types/converter.js";

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
        expect(application.consensusAddress).toBe(
            getAddress(rpcApplication.iconsensus_address),
        );
        expect(application.dataAvailability).toBe("InputBox");
        expect(application.epochLength).toBe(
            hexToBigInt(rpcApplication.epoch_length),
        );
        expect(application.inputBoxAddress).toBe(
            getAddress(rpcApplication.iinputbox_address),
        );
        expect(application.lastInputCheckBlock).toBe(
            hexToBigInt(rpcApplication.last_input_check_block),
        );
        expect(application.lastOutputCheckBlock).toBe(
            hexToBigInt(rpcApplication.last_output_check_block),
        );
        expect(application.processedInputs).toBe(
            hexToBigInt(rpcApplication.processed_inputs),
        );
        expect(application.state).toBe(rpcApplication.state);
        expect(application.templateHash).toBe(rpcApplication.template_hash);
        expect(application.executionParameters).toBeDefined();
        expect(application.executionParameters.advanceIncCycles).toBe(
            hexToBigInt(rpcApplication.execution_parameters.advance_inc_cycles),
        );
        expect(application.executionParameters.advanceMaxCycles).toBe(
            hexToBigInt(rpcApplication.execution_parameters.advance_max_cycles),
        );
        expect(application.executionParameters.inspectIncCycles).toBe(
            hexToBigInt(rpcApplication.execution_parameters.inspect_inc_cycles),
        );
        expect(application.executionParameters.inspectMaxCycles).toBe(
            hexToBigInt(rpcApplication.execution_parameters.inspect_max_cycles),
        );
        expect(application.executionParameters.advanceIncDeadline).toBe(
            hexToBigInt(
                rpcApplication.execution_parameters.advance_inc_deadline,
            ),
        );
        expect(application.executionParameters.advanceMaxDeadline).toBe(
            hexToBigInt(
                rpcApplication.execution_parameters.advance_max_deadline,
            ),
        );
        expect(application.executionParameters.inspectIncDeadline).toBe(
            hexToBigInt(
                rpcApplication.execution_parameters.inspect_inc_deadline,
            ),
        );
        expect(application.executionParameters.inspectMaxDeadline).toBe(
            hexToBigInt(
                rpcApplication.execution_parameters.inspect_max_deadline,
            ),
        );
        expect(application.executionParameters.loadDeadline).toBe(
            hexToBigInt(rpcApplication.execution_parameters.load_deadline),
        );
        expect(application.executionParameters.storeDeadline).toBe(
            hexToBigInt(rpcApplication.execution_parameters.store_deadline),
        );
        expect(application.executionParameters.fastDeadline).toBe(
            hexToBigInt(rpcApplication.execution_parameters.fast_deadline),
        );
        expect(application.executionParameters.maxConcurrentInspects).toBe(
            rpcApplication.execution_parameters.max_concurrent_inspects,
        );
        expect(application.executionParameters.snapshotPolicy).toBe(
            rpcApplication.execution_parameters.snapshot_policy,
        );
        expect(application.createdAt).toStrictEqual(
            new Date(rpcApplication.created_at),
        );
        expect(application.updatedAt).toStrictEqual(
            new Date(rpcApplication.updated_at),
        );
        expect(application.reason).toBeUndefined();
    });

    it("should convert the output", () => {
        const rpcOutput: Output = {
            epoch_index: "0x5",
            input_index: "0x0",
            index: "0x0",
            raw_data:
                "0xc258d6e5000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000154e756d626572206f6620616476616e6365733a20310000000000000000000000",
            hash: "0x3d214a7bb9a61c872cfc218727bb7af38bd73471270ab5f5abdac864d85b838d",
            output_hashes_siblings: [
                "0x0000000000000000000000000000000000000000000000000000000000000000",
                "0xad3228b676f7d3cd4284a5443f17f1962b36e491b30a40b2405849e597ba5fb5",
                "0xb4c11951957c6f8f642c4af61cd6b24640fec6dc7fc607ee8206a99e92410d30",
                "0x21ddb9a356815c3fac1026b6dec5df3124afbadb485c9ba5a3e3398a04b7ba85",
                "0xe58769b32a1beaf1ea27375a44095a0d1fb664ce2dd358e7fcbfb78c26a19344",
                "0x0eb01ebfc9ed27500cd4dfc979272d1f0913cc9f66540d7e8005811109e1cf2d",
                "0x887c22bd8750d34016ac3c66b5ff102dacdd73f6b014e710b51e8022af9a1968",
                "0xffd70157e48063fc33c97a050f7f640233bf646cc98d9524c6b92bcf3ab56f83",
                "0x9867cc5f7f196b93bae1e27e6320742445d290f2263827498b54fec539f756af",
                "0xcefad4e508c098b9a7e1d8feb19955fb02ba9675585078710969d3440f5054e0",
                "0xf9dc3e7fe016e050eff260334f18a5d4fe391d82092319f5964f2e2eb7c1c3a5",
                "0xf8b13a49e282f609c317a833fb8d976d11517c571d1221a265d25af778ecf892",
                "0x3490c6ceeb450aecdc82e28293031d10c7d73bf85e57bf041a97360aa2c5d99c",
                "0xc1df82d9c4b87413eae2ef048f94b4d3554cea73d92b0f7af96e0271c691e2bb",
                "0x5c67add7c6caf302256adedf7ab114da0acfe870d449a3a489f781d659e8becc",
                "0xda7bce9f4e8618b6bd2f4132ce798cdc7a60e7e1460a7299e3c6342a579626d2",
                "0x2733e50f526ec2fa19a22b31e8ed50f23cd1fdf94c9154ed3a7609a2f1ff981f",
                "0xe1d3b5c807b281e4683cc6d6315cf95b9ade8641defcb32372f1c126e398ef7a",
                "0x5a2dce0a8a7f68bb74560f8f71837c2c2ebbcbf7fffb42ae1896f13f7c7479a0",
                "0xb46a28b6f55540f89444f63de0378e3d121be09e06cc9ded1c20e65876d36aa0",
                "0xc65e9645644786b620e2dd2ad648ddfcbf4a7e5b1a3a4ecfe7f64667a3f0b7e2",
                "0xf4418588ed35a2458cffeb39b93d26f18d2ab13bdce6aee58e7b99359ec2dfd9",
                "0x5a9c16dc00d6ef18b7933a6f8dc65ccb55667138776f7dea101070dc8796e377",
                "0x4df84f40ae0c8229d0d6069e5c8f39a7c299677a09d367fc7b05e3bc380ee652",
                "0xcdc72595f74c7b1043d0e1ffbab734648c838dfb0527d971b602bc216c9619ef",
                "0x0abf5ac974a1ed57f4050aa510dd9c74f508277b39d7973bb2dfccc5eeb0618d",
                "0xb8cd74046ff337f0a7bf2c8e03e10f642c1886798d71806ab1e888d9e5ee87d0",
                "0x838c5655cb21c6cb83313b5a631175dff4963772cce9108188b34ac87c81c41e",
                "0x662ee4dd2dd7b2bc707961b1e646c4047669dcb6584f0d8d770daf5d7e7deb2e",
                "0x388ab20e2573d171a88108e79d820e98f26c0b84aa8b2f4aa4968dbb818ea322",
                "0x93237c50ba75ee485f4c22adf2f741400bdf8d6a9cc7df7ecae576221665d735",
                "0x8448818bb4ae4562849e949e17ac16e0be16688e156b5cf15e098c627c0056a9",
                "0x27ae5ba08d7291c96c8cbddcc148bf48a6d68c7974b94356f53754ef6171d757",
                "0xbf558bebd2ceec7f3c5dce04a4782f88c2c6036ae78ee206d0bc5289d20461a2",
                "0xe21908c2968c0699040a6fd866a577a99a9d2ec88745c815fd4a472c789244da",
                "0xae824d72ddc272aab68a8c3022e36f10454437c1886f3ff9927b64f232df414f",
                "0x27e429a4bef3083bc31a671d046ea5c1f5b8c3094d72868d9dfdc12c7334ac5f",
                "0x743cc5c365a9a6a15c1f240ac25880c7a9d1de290696cb766074a1d83d927816",
                "0x4adcf616c3bfabf63999a01966c998b7bb572774035a63ead49da73b5987f347",
                "0x75786645d0c5dd7c04a2f8a75dcae085213652f5bce3ea8b9b9bedd1cab3c5e9",
                "0xb88b152c9b8a7b79637d35911848b0c41e7cc7cca2ab4fe9a15f9c38bb4bb939",
                "0x0c4e2d8ce834ffd7a6cd85d7113d4521abb857774845c4291e6f6d010d97e318",
                "0x5bc799d83e3bb31501b3da786680df30fbc18eb41cbce611e8c0e9c72f69571c",
                "0xa10d3ef857d04d9c03ead7c6317d797a090fa1271ad9c7addfbcb412e9643d4f",
                "0xb33b1809c42623f474055fa9400a2027a7a885c8dfa4efe20666b4ee27d7529c",
                "0x134d7f28d53f175f6bf4b62faa2110d5b76f0f770c15e628181c1fcc18f970a9",
                "0xc34d24b2fc8c50ca9c07a7156ef4e5ff4bdf002eda0b11c1d359d0b59a546807",
                "0x04dbb9db631457879b27e0dfdbe50158fd9cf9b4cf77605c4ac4c95bd65fc9f6",
                "0xf9295a686647cb999090819cda700820c282c613cedcd218540bbc6f37b01c65",
                "0x67c4a1ea624f092a3a5cca2d6f0f0db231972fce627f0ecca0dee60f17551c5f",
                "0x8fdaeb5ab560b2ceb781cdb339361a0fbee1b9dffad59115138c8d6a70dda9cc",
                "0xc1bf0bbdd7fee15764845db875f6432559ff8dbc9055324431bc34e5b93d15da",
                "0x307317849eccd90c0c7b98870b9317c15a5959dcfb84c76dcc908c4fe6ba9212",
                "0x6339bf06e458f6646df5e83ba7c3d35bc263b3222c8e9040068847749ca8e8f9",
                "0x5045e4342aeb521eb3a5587ec268ed3aa6faf32b62b0bc41a9d549521f406fc3",
                "0x08601d83cdd34b5f7b8df63e7b9a16519d35473d0b89c317beed3d3d9424b253",
                "0x84e35c5d92171376cae5c86300822d729cd3a8479583bef09527027dba5f1126",
                "0x3c5cbbeb3834b7a5c1cba9aa5fee0c95ec3f17a33ec3d8047fff799187f5ae20",
                "0x40bbe913c226c34c9fbe4389dd728984257a816892b3cae3e43191dd291f0eb5",
                "0x14af5385bcbb1e4738bbae8106046e6e2fca42875aa5c000c582587742bcc748",
                "0x72f29656803c2f4be177b1b8dd2a5137892b080b022100fde4e96d93ef8c96ff",
                "0xd06f27061c734d7825b46865d00aa900e5cc3a3672080e527171e1171aa5038a",
                "0x28203985b5f2d87709171678169739f957d2745f4bfa5cc91e2b4bd9bf483b40",
            ],
            execution_transaction_hash: null,
            created_at: "2025-04-09T20:19:11.806381Z",
            updated_at: "2025-04-09T20:19:20.768135Z",
            decoded_data: {
                type: "Notice",
                payload: "0x4e756d626572206f6620616476616e6365733a2031",
            },
        };

        const output = outputConverter(rpcOutput);
        expect(output).toBeDefined();
        expect(output.epochIndex).toBe(hexToBigInt(rpcOutput.epoch_index));
        expect(output.inputIndex).toBe(hexToBigInt(rpcOutput.input_index));
        expect(output.index).toBe(hexToBigInt(rpcOutput.index));
        expect(output.rawData).toBe(rpcOutput.raw_data);
        expect(output.hash).toBe(rpcOutput.hash);
        expect(output.outputHashesSiblings).toStrictEqual(
            rpcOutput.output_hashes_siblings,
        );
        expect(output.executionTransactionHash).toBeNull();
        expect(output.createdAt).toStrictEqual(new Date(rpcOutput.created_at));
        expect(output.updatedAt).toStrictEqual(new Date(rpcOutput.updated_at));
        expect(output.decodedData).toBeDefined();
        expect(output.decodedData.type).toBe(rpcOutput.decoded_data.type);
        expect(output.decodedData.payload).toBe(rpcOutput.decoded_data.payload);
    });
});
