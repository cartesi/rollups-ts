import {
    type GetApplicationReturnType as GetApplicationReturnTypeRpc,
    type GetEpochReturnType as GetEpochReturnTypeRpc,
    type GetInputReturnType as GetInputReturnTypeRpc,
    type GetOutputReturnType as GetOutputReturnTypeRpc,
    type GetReportReturnType as GetReportReturnTypeRpc,
    type Pagination as PaginationRpc,
} from "@cartesi/rpc";
import { getAddress, Hash, Hex, hexToBigInt } from "viem";
import {
    GetApplicationReturnType,
    GetEpochReturnType,
    GetInputReturnType,
    GetOutputReturnType,
    GetReportReturnType,
    Pagination,
} from "./actions";

export const paginationConverter = (pagination: PaginationRpc): Pagination => {
    return {
        limit: pagination.limit,
        offset: pagination.offset,
        totalCount: pagination.total_count,
    };
};

export const applicationConverter = (
    application: GetApplicationReturnTypeRpc,
): GetApplicationReturnType => {
    return {
        name: application.name,
        applicationAddress: getAddress(application.iapplication_address),
        consensusAddress: getAddress(application.iconsensus_address),
        inputBoxAddress: getAddress(application.iinputbox_address),
        templateHash: application.template_hash as Hash,
        templateUri: application.template_uri,
        epochLength: application.epoch_length,
        dataAvailability: application.data_availability as Hex,
        state: application.state,
        reason: application.reason,
        inputBoxBlock: hexToBigInt(application.iinputbox_block as Hex),
        lastInputCheckBlock: hexToBigInt(
            application.last_input_check_block as Hex,
        ),
        lastOutputCheckBlock: hexToBigInt(
            application.last_output_check_block as Hex,
        ),
        processedInputs: application.processed_inputs,
        createdAt: new Date(application.created_at),
        updatedAt: new Date(application.updated_at),
        executionParameters: {
            snapshotPolicy: application.execution_parameters.snapshot_policy,
            snapshotRetention:
                application.execution_parameters.snapshot_retention,
            advanceIncCycles:
                application.execution_parameters.advance_inc_cycles,
            advanceMaxCycles:
                application.execution_parameters.advance_max_cycles,
            inspectIncCycles:
                application.execution_parameters.inspect_inc_cycles,
            inspectMaxCycles:
                application.execution_parameters.inspect_max_cycles,
            advanceIncDeadline:
                application.execution_parameters.advance_inc_deadline,
            advanceMaxDeadline:
                application.execution_parameters.advance_max_deadline,
            inspectIncDeadeline:
                application.execution_parameters.inspect_inc_deadeline,
            inspectMaxDeadline:
                application.execution_parameters.inspect_max_deadline,
            loadDeadline: application.execution_parameters.load_deadline,
            storeDeadline: application.execution_parameters.store_deadline,
            fastDeadline: application.execution_parameters.fast_deadline,
            maxConcurrentInspects:
                application.execution_parameters.max_concurrent_inspects,
            createdAt: new Date(application.execution_parameters.created_at),
            updatedAt: new Date(application.execution_parameters.updated_at),
        },
    };
};

export const epochConverter = (
    epoch: GetEpochReturnTypeRpc,
): GetEpochReturnType => {
    return {
        index: hexToBigInt(epoch.index as Hex),
        firstBlock: hexToBigInt(epoch.first_block as Hex),
        lastBlock: hexToBigInt(epoch.last_block as Hex),
        claimHash: epoch.claim_hash as Hash,
        claimTransactionHash: epoch.claim_transaction_hash as Hash,
        status: epoch.status,
        virtualIndex: hexToBigInt(epoch.virtual_index as Hex),
        createdAt: new Date(epoch.created_at),
        updatedAt: new Date(epoch.updated_at),
    };
};

export const inputConverter = (
    input: GetInputReturnTypeRpc,
): GetInputReturnType => {
    return {
        epochIndex: hexToBigInt(input.epoch_index as Hex),
        index: hexToBigInt(input.index as Hex),
        blockNumber: hexToBigInt(input.block_number as Hex),
        rawData: input.raw_data as Hex,
        decodedData: {
            chainId: hexToBigInt(input.decoded_data.chain_id as Hex),
            applicationContract: getAddress(
                input.decoded_data.application_contract,
            ),
            sender: getAddress(input.decoded_data.sender),
            blockNumber: hexToBigInt(input.decoded_data.block_number as Hex),
            blockTimestamp: hexToBigInt(
                input.decoded_data.block_timestamp as Hex,
            ),
            prevRandao: hexToBigInt(input.decoded_data.prev_randao as Hex),
            index: hexToBigInt(input.decoded_data.index as Hex),
            payload: input.decoded_data.payload as Hex,
        },
        status: input.status,
        machineHash: input.machine_hash as Hash,
        outputsHash: input.outputs_hash as Hash,
        transactionReference: input.transaction_reference as Hash,
        createdAt: new Date(input.created_at),
        updatedAt: new Date(input.updated_at),
    };
};

export const outputConverter = (
    output: GetOutputReturnTypeRpc,
): GetOutputReturnType => {
    return {
        inputIndex: hexToBigInt(output.input_index as Hex),
        index: hexToBigInt(output.index as Hex),
        rawData: output.raw_data as Hex,
        decodedData: {
            index: output.decoded_data.index,
            type: output.decoded_data.type,
            payload: output.decoded_data.payload as Hex,
        },
        hash: output.hash as Hash,
        outputHashesSiblings: output.output_hashes_siblings.map(
            (hash) => hash as Hash,
        ),
        executionTransactionHash: output.execution_transaction_hash as Hash,
        createdAt: new Date(output.created_at),
        updatedAt: new Date(output.updated_at),
    };
};

export const reportConverter = (
    report: GetReportReturnTypeRpc,
): GetReportReturnType => {
    return {
        inputIndex: hexToBigInt(report.input_index as Hex),
        index: hexToBigInt(report.index as Hex),
        rawData: report.raw_data as Hex,
        createdAt: new Date(report.created_at),
        updatedAt: new Date(report.updated_at),
    };
};
