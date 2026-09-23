import type {
    Application as ApplicationRpc,
    BondEvent as BondEventRpc,
    CommitmentSnapshot as CommitmentSnapshotRpc,
    Commitment as CommitmentRpc,
    DelegateCallVoucher as DelegateCallVoucherRpc,
    Epoch as EpochRpc,
    Input as InputRpc,
    LeafMatchSeal as LeafMatchSealRpc,
    MatchAdvanced as MatchAdvancedRpc,
    MatchBisectionSnapshot as MatchBisectionSnapshotRpc,
    MatchSnapshot as MatchSnapshotRpc,
    Match as MatchRpc,
    NodeInfo as NodeInfoRpc,
    Notice as NoticeRpc,
    Output as OutputRpc,
    Pagination as PaginationRpc,
    Report as ReportRpc,
    TournamentCreationEvent as TournamentCreationEventRpc,
    TournamentSnapshot as TournamentSnapshotRpc,
    Tournament as TournamentRpc,
    Voucher as VoucherRpc,
    Withdrawal as WithdrawalRpc,
} from "@cartesi/rpc";
import { getAddress, hexToBigInt, hexToNumber } from "viem";
import type {
    Application,
    BondEvent,
    Commitment,
    CommitmentSnapshot,
    DelegateCallVoucher,
    Epoch,
    Input,
    LeafMatchSeal,
    Match,
    MatchAdvanced,
    MatchSnapshot,
    NodeInfo,
    Notice,
    Output,
    Pagination,
    Report,
    Tournament,
    TournamentCreationEvent,
    TournamentSnapshot,
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
        txBufferDataBlock: epoch.tx_buffer_data_block,
        txBufferProof: epoch.tx_buffer_proof,
        iflagsYDataBlock: epoch.iflags_y_data_block,
        iflagsYProof: epoch.iflags_y_proof,
        htifTohostDataBlock: epoch.htif_tohost_data_block,
        htifTohostProof: epoch.htif_tohost_proof,
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

const tournamentCreationEventConverter = (
    event: TournamentCreationEventRpc,
): TournamentCreationEvent => {
    return {
        blockNumber: hexToBigInt(event.block_number),
        txHash: event.tx_hash,
        logIndex: hexToBigInt(event.log_index),
    };
};

const tournamentSnapshotConverter = (
    snapshot: TournamentSnapshotRpc,
): TournamentSnapshot => {
    return {
        asOfBlock: hexToBigInt(snapshot.as_of_block),
        standing: snapshot.standing,
        acceptsJoins: snapshot.accepts_joins,
        candidate: snapshot.candidate,
        winnerCommitment: snapshot.winner_commitment,
        finalStateHash: snapshot.final_state_hash,
        parentCommitment: snapshot.parent_commitment,
        finishedAtBlock: hexToBigInt(snapshot.finished_at_block),
        winnerExpiresAt: hexToBigInt(snapshot.winner_expires_at),
        innerResult: snapshot.inner_result
            ? {
                  disposition: snapshot.inner_result.disposition,
                  parentCommitment: snapshot.inner_result.parent_commitment,
                  pausedAllowance: hexToBigInt(
                      snapshot.inner_result.paused_allowance,
                  ),
              }
            : null,
        bondRecovery: {
            disposition: snapshot.bond_recovery.disposition,
            claimer: snapshot.bond_recovery.claimer
                ? getAddress(snapshot.bond_recovery.claimer)
                : null,
            payment: snapshot.bond_recovery.payment
                ? hexToBigInt(snapshot.bond_recovery.payment)
                : null,
        },
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
        createdAt: new Date(tournament.created_at),
        updatedAt: new Date(tournament.updated_at),
        initialHash: tournament.initial_hash,
        baseCycle: hexToBigInt(tournament.base_cycle),
        kind: tournament.kind,
        startInstant: hexToBigInt(tournament.start_instant),
        allowance: hexToBigInt(tournament.allowance),
        creationEvent: tournament.creation_event
            ? tournamentCreationEventConverter(tournament.creation_event)
            : null,
        snapshot: tournamentSnapshotConverter(tournament.snapshot),
    };
};

const commitmentSnapshotConverter = (
    snapshot: CommitmentSnapshotRpc,
): CommitmentSnapshot => {
    return {
        asOfBlock: hexToBigInt(snapshot.as_of_block),
        claimer: getAddress(snapshot.claimer),
        clockRunning: snapshot.clock_running,
        clockDeadline: hexToBigInt(snapshot.clock_deadline),
        clockAllowance: hexToBigInt(snapshot.clock_allowance),
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
        logIndex: hexToBigInt(commitment.log_index),
        snapshot: commitmentSnapshotConverter(commitment.snapshot),
    };
};

const leafMatchSealConverter = (seal: LeafMatchSealRpc): LeafMatchSeal => {
    return {
        eliminableAt: hexToBigInt(seal.eliminable_at),
        blockNumber: hexToBigInt(seal.block_number),
        txHash: seal.tx_hash,
        logIndex: hexToBigInt(seal.log_index),
    };
};

// the phase-specific halves of a match snapshot are narrowed by `phase`, so the
// fields every phase shares are converted once and the arms add their own
const matchBisectionBaseConverter = (bisection: MatchBisectionSnapshotRpc) => {
    return {
        revealingParent: bisection.revealing_parent,
        waitingLeft: bisection.waiting_left,
        waitingRight: bisection.waiting_right,
        segmentStartPosition: hexToBigInt(bisection.segment_start_position),
        segmentStartCycle: hexToBigInt(bisection.segment_start_cycle),
        responder: bisection.responder,
    };
};

const matchSnapshotConverter = (snapshot: MatchSnapshotRpc): MatchSnapshot => {
    const common = {
        asOfBlock: hexToBigInt(snapshot.as_of_block),
        timeoutOutcome: snapshot.timeout_outcome,
        deferredCharge: hexToBigInt(snapshot.deferred_charge),
    };
    switch (snapshot.phase) {
        case "UNINITIALIZED": {
            return {
                ...common,
                phase: snapshot.phase,
                bisection: null,
                sealed: null,
            };
        }
        case "BISECTING": {
            return {
                ...common,
                phase: snapshot.phase,
                bisection: {
                    ...matchBisectionBaseConverter(snapshot.bisection),
                    currentHeight: hexToBigInt(
                        snapshot.bisection.current_height,
                    ),
                },
                sealed: null,
            };
        }
        case "READY_TO_SEAL": {
            return {
                ...common,
                phase: snapshot.phase,
                bisection: {
                    ...matchBisectionBaseConverter(snapshot.bisection),
                    currentHeight: null,
                },
                sealed: null,
            };
        }
        case "SEALED": {
            return {
                ...common,
                phase: snapshot.phase,
                bisection: null,
                sealed: {
                    agreeState: snapshot.sealed.agree_state,
                    divergencePosition: hexToBigInt(
                        snapshot.sealed.divergence_position,
                    ),
                    divergenceCycle: hexToBigInt(
                        snapshot.sealed.divergence_cycle,
                    ),
                    finalStateOne: snapshot.sealed.final_state_one,
                    finalStateTwo: snapshot.sealed.final_state_two,
                },
            };
        }
    }
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
        logIndex: hexToBigInt(match.log_index),
        eliminableAt: hexToBigInt(match.eliminable_at),
        leafSeal: match.leaf_seal
            ? leafMatchSealConverter(match.leaf_seal)
            : null,
        deletionLogIndex: match.deletion_log_index
            ? hexToBigInt(match.deletion_log_index)
            : null,
        snapshot: matchSnapshotConverter(match.snapshot),
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
        logIndex: hexToBigInt(matchAdvanced.log_index),
        segmentStartPosition: hexToBigInt(matchAdvanced.segment_start_position),
        eliminableAt: hexToBigInt(matchAdvanced.eliminable_at),
    };
};

export const bondEventConverter = (bondEvent: BondEventRpc): BondEvent => {
    const common = {
        epochIndex: hexToBigInt(bondEvent.epoch_index),
        tournamentAddress: getAddress(bondEvent.tournament_address),
        blockNumber: hexToBigInt(bondEvent.block_number),
        txHash: bondEvent.tx_hash,
        logIndex: hexToBigInt(bondEvent.log_index),
        createdAt: new Date(bondEvent.created_at),
        updatedAt: new Date(bondEvent.updated_at),
    };
    switch (bondEvent.type) {
        case "PARTIAL_BOND_REFUND": {
            return {
                ...common,
                type: bondEvent.type,
                refund: {
                    recipient: getAddress(bondEvent.refund.recipient),
                    value: hexToBigInt(bondEvent.refund.value),
                    success: bondEvent.refund.success,
                },
                recovery: null,
            };
        }
        case "BOND_RECOVERED": {
            return {
                ...common,
                type: bondEvent.type,
                refund: null,
                recovery: {
                    commitment: bondEvent.recovery.commitment,
                    claimer: getAddress(bondEvent.recovery.claimer),
                    payment: hexToBigInt(bondEvent.recovery.payment),
                    burned: hexToBigInt(bondEvent.recovery.burned),
                },
            };
        }
    }
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
        txBufferDataBlock: input.tx_buffer_data_block,
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
