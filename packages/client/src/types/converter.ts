import type {
    Application as ApplicationRpc,
    Commitment as CommitmentRpc,
    DelegateCallVoucher as DelegateCallVoucherRpc,
    Epoch as EpochRpc,
    Input as InputRpc,
    MatchAdvanced as MatchAdvancedRpc,
    Match as MatchRpc,
    NodeInfo as NodeInfoRpc,
    Notice as NoticeRpc,
    Output as OutputRpc,
    Pagination as PaginationRpc,
    Report as ReportRpc,
    Tournament as TournamentRpc,
    Voucher as VoucherRpc,
    Withdrawal as WithdrawalRpc,
} from "@cartesi/rpc";
import {
    type Hex,
    decodeFunctionData,
    getAddress,
    hexToBigInt,
    hexToNumber,
} from "viem";
import type {
    Application,
    Commitment,
    DataAvailability,
    DelegateCallVoucher,
    Epoch,
    Input,
    Match,
    MatchAdvanced,
    NodeInfo,
    Notice,
    Output,
    Pagination,
    Report,
    Tournament,
    Voucher,
    Withdrawal,
} from "./actions.js";

export const paginationConverter = (pagination: PaginationRpc): Pagination => {
    return {
        limit: pagination.limit,
        offset: pagination.offset,
        totalCount: pagination.total_count,
    };
};

// the node reports the data availability of an application as a call to one
// of these functions; rollups-contracts dropped the `DataAvailability` library
// in 3.0.0-alpha.7 (applications now advertise their input box directly), so
// the ABI is kept here instead of being generated from the contracts
const dataAvailabilityAbi = [
    {
        type: "function",
        name: "InputBox",
        inputs: [{ name: "inputBox", type: "address" }],
        outputs: [],
        stateMutability: "nonpayable",
    },
    {
        type: "function",
        name: "InputBoxAndEspresso",
        inputs: [
            { name: "inputBox", type: "address" },
            { name: "fromBlock", type: "uint256" },
            { name: "namespaceId", type: "uint32" },
        ],
        outputs: [],
        stateMutability: "nonpayable",
    },
] as const;

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
    application: ApplicationRpc,
): Application => {
    return {
        name: application.name,
        applicationAddress: getAddress(application.iapplication_address),
        consensusAddress: getAddress(application.iconsensus_address),
        inputBoxAddress: getAddress(application.iinputbox_address),
        templateHash: application.template_hash,
        epochLength: hexToBigInt(application.epoch_length),
        claimStagingPeriod: hexToBigInt(application.claim_staging_period),
        withdrawalConfig: {
            guardian: getAddress(application.withdrawal_config.guardian),
            log2LeavesPerAccount: hexToBigInt(
                application.withdrawal_config.log2_leaves_per_account,
            ),
            log2MaxNumOfAccounts: hexToBigInt(
                application.withdrawal_config.log2_max_num_of_accounts,
            ),
            accountsDriveStartIndex: hexToBigInt(
                application.withdrawal_config.accounts_drive_start_index,
            ),
            withdrawalOutputBuilder: getAddress(
                application.withdrawal_config.withdrawal_output_builder,
            ),
        },
        dataAvailability: parseDataAvailability(application.data_availability),
        consensusType: application.consensus_type,
        status: application.status,
        enabled: application.enabled,
        reason: application.reason,
        inputBoxBlock: hexToBigInt(application.iinputbox_block),
        lastEpochCheckBlock: hexToBigInt(application.last_epoch_check_block),
        lastInputCheckBlock: hexToBigInt(application.last_input_check_block),
        lastOutputCheckBlock: hexToBigInt(application.last_output_check_block),
        lastTournamentCheckBlock: hexToBigInt(
            application.last_tournament_check_block,
        ),
        lastForecloseCheckBlock: hexToBigInt(
            application.last_foreclose_check_block,
        ),
        lastAccountsDriveProvedCheckBlock: hexToBigInt(
            application.last_accounts_drive_proved_check_block,
        ),
        lastWithdrawalCheckBlock: hexToBigInt(
            application.last_withdrawal_check_block,
        ),
        processedInputs: hexToBigInt(application.processed_inputs),
        forecloseBlock: hexToBigInt(application.foreclose_block),
        forecloseTransaction: application.foreclose_transaction,
        accountsDriveProvedBlock: hexToBigInt(
            application.accounts_drive_proved_block,
        ),
        accountsDriveProvedTransaction:
            application.accounts_drive_proved_transaction,
        accountsDriveMerkleRoot: application.accounts_drive_merkle_root,
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

export const epochConverter = (epoch: EpochRpc): Epoch => {
    return {
        index: hexToBigInt(epoch.index),
        firstBlock: hexToBigInt(epoch.first_block),
        lastBlock: hexToBigInt(epoch.last_block),
        inputIndexLowerBound: hexToBigInt(epoch.input_index_lower_bound),
        inputIndexUpperBound: hexToBigInt(epoch.input_index_upper_bound),
        tournamentAddress: epoch.tournament_address
            ? getAddress(epoch.tournament_address)
            : null,
        machineHash: epoch.machine_hash,
        outputsMerkleRoot: epoch.outputs_merkle_root,
        outputsMerkleProof: epoch.outputs_merkle_proof,
        commitment: epoch.commitment,
        commitmentProof: epoch.commitment_proof,
        claimTransactionHash: epoch.claim_transaction_hash,
        status: epoch.status,
        stagedAtBlock: epoch.staged_at_block
            ? hexToBigInt(epoch.staged_at_block)
            : null,
        virtualIndex: hexToBigInt(epoch.virtual_index),
        createdAt: new Date(epoch.created_at),
        updatedAt: new Date(epoch.updated_at),
    };
};

export const tournamentConverter = (tournament: TournamentRpc): Tournament => {
    return {
        epochIndex: hexToBigInt(tournament.epoch_index),
        address: getAddress(tournament.address),
        parentTournamentAddress: tournament.parent_tournament_address
            ? getAddress(tournament.parent_tournament_address)
            : null,
        parentMatchIdHash: tournament.parent_match_id_hash,
        maxLevel: hexToBigInt(tournament.max_level),
        level: hexToBigInt(tournament.level),
        log2step: hexToBigInt(tournament.log2step),
        height: hexToBigInt(tournament.height),
        winnerCommitment: tournament.winner_commitment,
        finalStateHash: tournament.final_state_hash,
        finishedAtBlock: hexToBigInt(tournament.finished_at_block),
        createdAt: new Date(tournament.created_at),
        updatedAt: new Date(tournament.updated_at),
    };
};

export const commitmentConverter = (commitment: CommitmentRpc): Commitment => {
    return {
        epochIndex: hexToBigInt(commitment.epoch_index),
        tournamentAddress: getAddress(commitment.tournament_address),
        commitment: commitment.commitment,
        finalStateHash: commitment.final_state_hash,
        submitterAddress: getAddress(commitment.submitter_address),
        blockNumber: hexToBigInt(commitment.block_number),
        txHash: commitment.tx_hash,
        createdAt: new Date(commitment.created_at),
        updatedAt: new Date(commitment.updated_at),
    };
};

export const matchConverter = (match: MatchRpc): Match => {
    return {
        epochIndex: hexToBigInt(match.epoch_index),
        tournamentAddress: getAddress(match.tournament_address),
        idHash: match.id_hash,
        commitmentOne: match.commitment_one,
        commitmentTwo: match.commitment_two,
        leftOfTwo: match.left_of_two,
        blockNumber: hexToBigInt(match.block_number),
        txHash: match.tx_hash,
        winnerCommitment: match.winner_commitment,
        deletionReason: match.deletion_reason,
        deletionBlockNumber: match.deletion_block_number
            ? hexToBigInt(match.deletion_block_number)
            : null,
        deletionTxHash: match.deletion_tx_hash,
        createdAt: new Date(match.created_at),
        updatedAt: new Date(match.updated_at),
    };
};

export const matchAdvancedConverter = (
    matchAdvanced: MatchAdvancedRpc,
): MatchAdvanced => {
    return {
        epochIndex: hexToBigInt(matchAdvanced.epoch_index),
        tournamentAddress: getAddress(matchAdvanced.tournament_address),
        idHash: matchAdvanced.id_hash,
        otherParent: matchAdvanced.other_parent,
        leftNode: matchAdvanced.left_node,
        blockNumber: hexToBigInt(matchAdvanced.block_number),
        txHash: matchAdvanced.tx_hash,
        createdAt: new Date(matchAdvanced.created_at),
        updatedAt: new Date(matchAdvanced.updated_at),
    };
};

export const inputConverter = (input: InputRpc): Input => {
    return {
        epochIndex: hexToBigInt(input.epoch_index),
        index: hexToBigInt(input.index),
        blockNumber: hexToBigInt(input.block_number),
        rawData: input.raw_data,
        decodedData: input.decoded_data
            ? {
                  chainId: hexToBigInt(input.decoded_data.chain_id),
                  applicationContract: getAddress(
                      input.decoded_data.application_contract,
                  ),
                  sender: getAddress(input.decoded_data.sender),
                  blockNumber: hexToBigInt(input.decoded_data.block_number),
                  blockTimestamp: hexToBigInt(
                      input.decoded_data.block_timestamp,
                  ),
                  prevRandao: hexToBigInt(input.decoded_data.prev_randao),
                  index: hexToBigInt(input.decoded_data.index),
                  payload: input.decoded_data.payload,
              }
            : null,
        status: input.status,
        exceptionData: input.exception_data,
        machineHash: input.machine_hash,
        outputsHash: input.outputs_hash,
        transactionHash: input.transaction_hash,
        logIndex: hexToBigInt(input.log_index),
        createdAt: new Date(input.created_at),
        updatedAt: new Date(input.updated_at),
    };
};

const parseOutputDecodedData = (
    output: NoticeRpc | VoucherRpc | DelegateCallVoucherRpc,
): Notice | Voucher | DelegateCallVoucher => {
    switch (output.type) {
        case "Notice": {
            return {
                type: "Notice",
                payload: output.payload,
            };
        }
        case "Voucher": {
            return {
                type: "Voucher",
                payload: output.payload,
                destination: getAddress(output.destination),
                value: hexToBigInt(output.value),
            };
        }
        case "DelegateCallVoucher": {
            return {
                type: "DelegateCallVoucher",
                payload: output.payload,
                destination: getAddress(output.destination),
            };
        }
    }
};

export const outputConverter = (output: OutputRpc): Output => {
    return {
        epochIndex: hexToBigInt(output.epoch_index),
        inputIndex: hexToBigInt(output.input_index),
        index: hexToBigInt(output.index),
        rawData: output.raw_data,
        decodedData: output.decoded_data
            ? parseOutputDecodedData(output.decoded_data)
            : null,
        hash: output.hash,
        outputHashesSiblings: output.output_hashes_siblings,
        executionTransactionHash: output.execution_transaction_hash,
        createdAt: new Date(output.created_at),
        updatedAt: new Date(output.updated_at),
    };
};

export const reportConverter = (report: ReportRpc): Report => {
    return {
        epochIndex: hexToBigInt(report.epoch_index),
        inputIndex: hexToBigInt(report.input_index),
        index: hexToBigInt(report.index),
        rawData: report.raw_data,
        createdAt: new Date(report.created_at),
        updatedAt: new Date(report.updated_at),
    };
};

export const nodeInfoConverter = (nodeInfo: NodeInfoRpc): NodeInfo => {
    return {
        chainId: hexToNumber(nodeInfo.chain_id),
        version: nodeInfo.version,
        defaultBlock: nodeInfo.default_block,
    };
};

export const withdrawalConverter = (withdrawal: WithdrawalRpc): Withdrawal => {
    return {
        accountIndex: hexToBigInt(withdrawal.account_index),
        account: withdrawal.account,
        output: withdrawal.output,
        blockNumber: hexToBigInt(withdrawal.block_number),
        transactionHash: withdrawal.transaction_hash,
        logIndex: hexToBigInt(withdrawal.log_index),
        createdAt: new Date(withdrawal.created_at),
        updatedAt: new Date(withdrawal.updated_at),
    };
};
