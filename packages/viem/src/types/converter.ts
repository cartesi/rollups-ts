import {
    Application,
    Epoch,
    Input,
    Output,
    Report,
    type Pagination as PaginationRpc,
} from "@cartesi/rpc";
import { decodeFunctionData, getAddress, Hex, hexToBigInt } from "viem";
import { dataAvailabilityAbi } from "../rollups.js";
import {
    DataAvailability,
    GetApplicationReturnType,
    GetEpochReturnType,
    GetInputReturnType,
    GetOutputReturnType,
    GetReportReturnType,
    Pagination,
} from "./actions.js";

export const paginationConverter = (pagination: PaginationRpc): Pagination => {
    return {
        limit: pagination.limit,
        offset: pagination.offset,
        totalCount: pagination.total_count,
    };
};

const parseDataAvailability = (data: Hex): DataAvailability => {
    const { functionName, args } = decodeFunctionData({
        abi: dataAvailabilityAbi,
        data,
    });
    switch (functionName) {
        case "InputBox": {
            const [inputBoxAddress] = args;
            return {
                type: functionName,
                inputBoxAddress,
            };
        }
        case "InputBoxAndEspresso": {
            const [inputBoxAddress, fromBlock, namespaceId] = args;
            return {
                type: functionName,
                inputBoxAddress: getAddress(inputBoxAddress),
                fromBlock,
                namespaceId,
            };
        }
    }
};

export const applicationConverter = (
    application: Application,
): GetApplicationReturnType => {
    return {
        name: application.name,
        applicationAddress: getAddress(application.iapplication_address),
        consensusAddress: getAddress(application.iconsensus_address),
        inputBoxAddress: getAddress(application.iinputbox_address),
        templateHash: application.template_hash,
        epochLength: hexToBigInt(application.epoch_length),
        dataAvailability: parseDataAvailability(application.data_availability),
        state: application.state,
        reason: application.reason,
        inputBoxBlock: hexToBigInt(application.iinputbox_block),
        lastInputCheckBlock: hexToBigInt(application.last_input_check_block),
        lastOutputCheckBlock: hexToBigInt(application.last_output_check_block),
        processedInputs: hexToBigInt(application.processed_inputs),
        createdAt: new Date(application.created_at),
        updatedAt: new Date(application.updated_at),
        executionParameters: {
            snapshotPolicy: application.execution_parameters.snapshot_policy,
            advanceIncCycles: hexToBigInt(
                application.execution_parameters.advance_inc_cycles,
            ),
            advanceMaxCycles: hexToBigInt(
                application.execution_parameters.advance_max_cycles,
            ),
            inspectIncCycles: hexToBigInt(
                application.execution_parameters.inspect_inc_cycles,
            ),
            inspectMaxCycles: hexToBigInt(
                application.execution_parameters.inspect_max_cycles,
            ),
            advanceIncDeadline: hexToBigInt(
                application.execution_parameters.advance_inc_deadline,
            ),
            advanceMaxDeadline: hexToBigInt(
                application.execution_parameters.advance_max_deadline,
            ),
            inspectIncDeadline: hexToBigInt(
                application.execution_parameters.inspect_inc_deadline,
            ),
            inspectMaxDeadline: hexToBigInt(
                application.execution_parameters.inspect_max_deadline,
            ),
            loadDeadline: hexToBigInt(
                application.execution_parameters.load_deadline,
            ),
            storeDeadline: hexToBigInt(
                application.execution_parameters.store_deadline,
            ),
            fastDeadline: hexToBigInt(
                application.execution_parameters.fast_deadline,
            ),
            maxConcurrentInspects:
                application.execution_parameters.max_concurrent_inspects,
            createdAt: new Date(application.execution_parameters.created_at),
            updatedAt: new Date(application.execution_parameters.updated_at),
        },
    };
};

export const epochConverter = (epoch: Epoch): GetEpochReturnType => {
    return {
        index: hexToBigInt(epoch.index),
        firstBlock: hexToBigInt(epoch.first_block),
        lastBlock: hexToBigInt(epoch.last_block),
        claimHash: epoch.claim_hash,
        claimTransactionHash: epoch.claim_transaction_hash,
        status: epoch.status,
        virtualIndex: hexToBigInt(epoch.virtual_index),
        createdAt: new Date(epoch.created_at),
        updatedAt: new Date(epoch.updated_at),
    };
};

export const inputConverter = (input: Input): GetInputReturnType => {
    return {
        epochIndex: hexToBigInt(input.epoch_index),
        index: hexToBigInt(input.index),
        blockNumber: hexToBigInt(input.block_number),
        rawData: input.raw_data,
        decodedData: {
            chainId: hexToBigInt(input.decoded_data.chain_id as Hex),
            applicationContract: getAddress(
                input.decoded_data.application_contract,
            ),
            sender: getAddress(input.decoded_data.sender),
            blockNumber: hexToBigInt(input.decoded_data.block_number),
            blockTimestamp: hexToBigInt(input.decoded_data.block_timestamp),
            prevRandao: hexToBigInt(input.decoded_data.prev_randao as Hex),
            index: hexToBigInt(input.decoded_data.index),
            payload: input.decoded_data.payload,
        },
        status: input.status,
        machineHash: input.machine_hash,
        outputsHash: input.outputs_hash,
        transactionReference: input.transaction_reference,
        createdAt: new Date(input.created_at),
        updatedAt: new Date(input.updated_at),
    };
};

export const outputConverter = (output: Output): GetOutputReturnType => {
    return {
        inputIndex: hexToBigInt(output.input_index),
        index: hexToBigInt(output.index),
        rawData: output.raw_data,
        decodedData: {
            index: hexToBigInt(output.decoded_data.index),
            type: output.decoded_data.type,
            payload: output.decoded_data.payload,
        },
        hash: output.hash,
        outputHashesSiblings: output.output_hashes_siblings,
        executionTransactionHash: output.execution_transaction_hash,
        createdAt: new Date(output.created_at),
        updatedAt: new Date(output.updated_at),
    };
};

export const reportConverter = (report: Report): GetReportReturnType => {
    return {
        inputIndex: hexToBigInt(report.input_index),
        index: hexToBigInt(report.index),
        rawData: report.raw_data,
        createdAt: new Date(report.created_at),
        updatedAt: new Date(report.updated_at),
    };
};
