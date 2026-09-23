export type PaginationParams = {
    limit?: number;
    /**
     * Number of items to skip. Bounded by the node to a signed 64-bit integer,
     * comfortably above `Number.MAX_SAFE_INTEGER`; a larger value is rejected
     * with invalid params.
     *
     * The node does not meter the cost of traversing an offset, so a deep one
     * over a broad filter can still make the database scan and discard rows
     * before the requested page.
     */
    offset?: number;
    descending?: boolean;
};

/**
 * An array with at least one element.
 *
 * The node rejects an empty filter list with invalid params, so the list-valued
 * filters use this instead of a plain array to turn that into a type error.
 */
export type NonEmptyArray<T> = [T, ...T[]];

/**
 * Inclusive index range shared by the listing methods that are indexed by a
 * sequential number (epochs, inputs, outputs and reports).
 */
export type RangeParams = {
    /** Inclusive lower bound on the index (hex encoded). */
    from?: HexNumber;
    /** Inclusive upper bound on the index (hex encoded). */
    to?: HexNumber;
};

export type Address = `0x${string}`;
export type Hash = `0x${string}`;
export type Hex = `0x${string}`;
export type HexNumber = `0x${string}`;
/**
 * An exact uint256 quantity in canonical hexadecimal form, up to 2^256-1. It is a
 * string because the node never encodes one as a JSON number.
 */
export type Uint256 = `0x${string}`;
export type DateTime = string;

export type Pagination = {
    total_count: number;
    limit: number;
    offset: number;
};

type PaginatedReturnType<T> = {
    data: T[];
    pagination: Pagination;
};

export type EpochStatus =
    | "OPEN"
    | "CLOSED"
    | "INPUTS_PROCESSED"
    | "CLAIM_COMPUTED"
    | "CLAIM_SUBMITTED"
    | "CLAIM_STAGED"
    | "CLAIM_ACCEPTED"
    | "CLAIM_REJECTED"
    | "CLAIM_FORECLOSED";

/**
 * Outcome of running an input through the machine. `NONE` means the input has
 * not completed yet; the rest are terminal.
 *
 * The node once reported a set of resource-limit statuses
 * (`OUTPUTS_LIMIT_EXCEEDED`, `REPORTS_LIMIT_EXCEEDED`, `CYCLE_LIMIT_EXCEEDED`,
 * `TIME_LIMIT_EXCEEDED`, `PAYLOAD_LENGTH_LIMIT_EXCEEDED`); they are no longer
 * part of the union, and `OVERFLOW` is not a drop-in replacement for any of
 * them.
 */
export type InputStatus =
    | "NONE"
    | "ACCEPTED"
    | "REJECTED"
    | "EXCEPTION"
    | "MACHINE_HALTED"
    | "OVERFLOW"
    | "UNEXPECTED_YIELD";

export type ConsensusType = "AUTHORITY" | "QUORUM" | "PRT";

/**
 * The node's finality contract for blockchain-derived data: the block tag up to
 * which it reads and acts on chain state. Data exposed by the node carries the
 * stability guarantees of this tag.
 */
export type DefaultBlock = "FINALIZED" | "SAFE" | "LATEST" | "PENDING";

export type ApplicationStatus =
    | "OK"
    | "FAILED"
    | "DIVERGED"
    | "CORRUPTED"
    | "GUEST_EXCEPTION"
    | "MACHINE_HALTED"
    | "MCYCLE_OVERFLOW"
    | "UNEXPECTED_YIELD";

export type SnapshotPolicy = "NONE" | "EVERY_INPUT" | "EVERY_EPOCH";

export type DeletionReason =
    | "STEP"
    | "TIMEOUT"
    | "CHILD_TOURNAMENT"
    | "NOT_DELETED";

export type WinnerCommitment = "NONE" | "ONE" | "TWO";

export type TournamentKind = "LEAF" | "NON_LEAF";

export type TournamentStandingState =
    | "MATCHES_ACTIVE"
    | "AWAITING_CLOSURE"
    | "ROOT_WINNER"
    | "ROOT_FAILED"
    | "INNER_WINNER"
    | "INNER_ELIMINABLE_NO_WINNER"
    | "INNER_ELIMINABLE_WINNER_EXPIRED";

export type MatchPhase =
    | "UNINITIALIZED"
    | "BISECTING"
    | "READY_TO_SEAL"
    | "SEALED";

export type CommitmentSide = "ONE" | "TWO";

export type MatchTimeoutOutcome =
    | "NONE"
    | "ONE_WINS"
    | "TWO_WINS"
    | "ELIMINATE_BOTH";

export type InnerTournamentDisposition = "UNSETTLED" | "WINNER" | "ELIMINABLE";

export type BondDisposition =
    | "TOURNAMENT_RUNNING"
    | "NO_WINNER"
    | "RECOVERABLE"
    | "RECOVERED";

export type BondEventType = "PARTIAL_BOND_REFUND" | "BOND_RECOVERED";

export type GetApplicationParams = { application: string | Address };

export type Application = {
    name: string;
    iapplication_address: Address;
    iconsensus_address: Address;
    iinputbox_address: Address;
    template_hash: Hash;
    epoch_length: HexNumber;
    claim_staging_period: HexNumber;
    withdrawal_config: WithdrawalConfig;
    consensus_type: ConsensusType;
    enabled: boolean;
    status: ApplicationStatus;
    /**
     * Human-readable terminal or failure description. Null only while `status`
     * is `OK`. Foreclosure is reported separately via `foreclose_block`, not
     * via `status`.
     */
    reason?: string | null;
    iinputbox_block: HexNumber;
    last_epoch_check_block: HexNumber;
    last_input_check_block: HexNumber;
    last_output_check_block: HexNumber;
    last_tournament_check_block: HexNumber;
    last_foreclose_check_block: HexNumber;
    last_accounts_drive_proved_check_block: HexNumber;
    last_withdrawal_check_block: HexNumber;
    processed_inputs: HexNumber;
    foreclose_block: HexNumber;
    foreclose_transaction: Hash;
    accounts_drive_proved_block: HexNumber;
    accounts_drive_proved_transaction: Hash;
    accounts_drive_merkle_root: Hash;
    created_at: DateTime;
    updated_at: DateTime;
    execution_parameters: {
        snapshot_policy: SnapshotPolicy;
        advance_inc_cycles: HexNumber;
        advance_max_cycles: HexNumber;
        inspect_inc_cycles: HexNumber;
        inspect_max_cycles: HexNumber;
        advance_inc_deadline: HexNumber;
        advance_max_deadline: HexNumber;
        inspect_inc_deadline: HexNumber;
        inspect_max_deadline: HexNumber;
        load_deadline: HexNumber;
        store_deadline: HexNumber;
        fast_deadline: HexNumber;
        max_concurrent_inspects: number;
        created_at: DateTime;
        updated_at: DateTime;
    };
};

export type WithdrawalConfig = {
    guardian: Address;
    log2_leaves_per_account: HexNumber;
    log2_max_num_of_accounts: HexNumber;
    accounts_drive_start_index: HexNumber;
    withdrawal_output_builder: Address;
};

export type GetApplicationReturnType = {
    data: Application;
};

export type GetEpochParams = {
    application: string | Address;
    epoch_index: HexNumber;
};

export type Epoch = {
    index: HexNumber;
    first_block: HexNumber;
    last_block: HexNumber;
    input_index_lower_bound: HexNumber;
    input_index_upper_bound: HexNumber;
    machine_hash: Hash | null;
    /** The 32-byte CMIO TX-buffer memory block in the proved machine state. */
    tx_buffer_data_block: Hash | null;
    /**
     * Merkle siblings proving the TX-buffer data block against `machine_hash`.
     */
    tx_buffer_proof: Hash[] | null;
    /** The 32-byte memory block containing the machine `iflags.Y` register. */
    iflags_y_data_block: Hash | null;
    /**
     * Merkle siblings proving the `iflags.Y` data block against `machine_hash`.
     */
    iflags_y_proof: Hash[] | null;
    /** The 32-byte memory block containing the machine HTIF `tohost` register. */
    htif_tohost_data_block: Hash | null;
    /**
     * Merkle siblings proving the HTIF `tohost` data block against
     * `machine_hash`.
     */
    htif_tohost_proof: Hash[] | null;
    commitment: Hash | null;
    commitment_proof: Hash[] | null;
    claim_transaction_hash: Hash | null;
    tournament_address: Address | null;
    status: EpochStatus;
    staged_at_block: HexNumber | null;
    virtual_index: HexNumber;
    created_at: DateTime;
    updated_at: DateTime;
};

export type GetEpochReturnType = {
    data: Epoch;
};

export type GetEpochByVirtualIndexParams = {
    application: string | Address;
    virtual_index: HexNumber;
};

export type GetEpochByVirtualIndexReturnType = {
    data: Epoch;
};

export type GetLastAcceptedEpochIndexParams = { application: string | Address };

export type GetLastAcceptedEpochIndexReturnType = {
    data: HexNumber;
};

export type GetInputParams = {
    application: string | Address;
    input_index: HexNumber;
};

export type Input = {
    epoch_index: HexNumber;
    index: HexNumber;
    block_number: HexNumber;
    raw_data: Hex;
    decoded_data: {
        chain_id: HexNumber;
        application_contract: Address;
        sender: Address;
        block_number: HexNumber;
        block_timestamp: HexNumber;
        prev_randao: Hex;
        index: HexNumber;
        payload: Hex;
    } | null;
    status: InputStatus;
    /**
     * Raw guest-provided CMIO exception payload. Non-null only when `status` is
     * `EXCEPTION`; an empty payload is encoded as `0x`.
     */
    exception_data: Hex | null;
    machine_hash: Hash | null;
    /**
     * The 32-byte CMIO TX-buffer memory block in the machine state this input
     * produced. Replaces the former `outputs_hash`, which was a digest of the
     * input's outputs rather than a memory block.
     */
    tx_buffer_data_block: Hash | null;
    transaction_hash: Hash;
    log_index: HexNumber;
    created_at: DateTime;
    updated_at: DateTime;
};

export type GetInputReturnType = {
    data: Input;
};

export type GetOutputParams = {
    application: string | Address;
    output_index: HexNumber;
};

export type Notice = {
    type: "Notice";
    payload: Hex;
};

export type Voucher = {
    type: "Voucher";
    destination: Address;
    value: HexNumber;
    payload: Hex;
};

export type DelegateCallVoucher = {
    type: "DelegateCallVoucher";
    destination: Address;
    payload: Hex;
};

export type Output = {
    epoch_index: HexNumber;
    input_index: HexNumber;
    index: HexNumber;
    raw_data: Hex;
    decoded_data: Notice | Voucher | DelegateCallVoucher | null;
    hash: Hash | null;
    output_hashes_siblings: Hash[] | null;
    execution_transaction_hash: Hash | null;
    created_at: DateTime;
    updated_at: DateTime;
};

export type GetOutputReturnType = {
    data: Output;
};

export type GetProcessedInputCountParams = { application: string | Address };

export type GetProcessedInputCountReturnType = {
    data: HexNumber;
};

export type GetExecutedOutputCountParams = { application: string | Address };

export type GetExecutedOutputCountReturnType = {
    data: HexNumber;
};

export type GetPendingExecutableOutputCountParams = {
    application: string | Address;
};

export type GetPendingExecutableOutputCountReturnType = {
    data: HexNumber;
};

export type GetReportParams = {
    application: string | Address;
    report_index: HexNumber;
};

export type Report = {
    epoch_index: HexNumber;
    input_index: HexNumber;
    index: HexNumber;
    raw_data: Hex;
    created_at: DateTime;
    updated_at: DateTime;
};

export type GetReportReturnType = {
    data: Report;
};

export type ListApplicationsParams = PaginationParams;

export type ListApplicationsReturnType = PaginatedReturnType<Application>;

export type ListEpochsParams = PaginationParams &
    RangeParams & {
        application: string | Address;
        /**
         * Filter by one status or by a non-empty list of statuses (OR
         * semantics).
         */
        status?: EpochStatus | NonEmptyArray<EpochStatus>;
    };

export type ListEpochsReturnType = PaginatedReturnType<Epoch>;

export type ListTournamentsParams = PaginationParams & {
    application: string | Address;
    epoch_index?: HexNumber;
    level?: HexNumber;
    parent_tournament_address?: Address;
    parent_match_id_hash?: Hash;
};

export type TournamentCreationEvent = {
    block_number: HexNumber;
    tx_hash: Hash;
    log_index: HexNumber;
};

export type TournamentInnerResult = {
    disposition: InnerTournamentDisposition;
    parent_commitment: Hash | null;
    /** Remaining carryover allowance, in blocks, at `as_of_block`. */
    paused_allowance: HexNumber;
};

/**
 * Claimer and payment are present only for a `RECOVERABLE` disposition, where a
 * zero payment is still a valid value.
 */
export type TournamentBondRecovery = {
    disposition: BondDisposition;
    claimer: Address | null;
    payment: Uint256 | null;
};

/**
 * Current contract state, not historical winner data: an expired inner candidate
 * stays a candidate without being a current winner. Separate API calls do not add
 * up to a single snapshot.
 */
export type TournamentSnapshot = {
    /** The block at which every view in this snapshot was read. */
    as_of_block: HexNumber;
    standing: TournamentStandingState;
    accepts_joins: boolean;
    candidate: Hash | null;
    winner_commitment: Hash | null;
    final_state_hash: Hash | null;
    parent_commitment: Hash | null;
    /** Completion block, or zero while the tournament is unfinished. */
    finished_at_block: HexNumber;
    /** Expiry block of a live inner winner; zero for every other standing. */
    winner_expires_at: HexNumber;
    inner_result: TournamentInnerResult | null;
    bond_recovery: TournamentBondRecovery;
};

export type Tournament = {
    epoch_index: HexNumber;
    address: Address;
    parent_tournament_address: Address | null;
    parent_match_id_hash: Hash | null;
    max_level: HexNumber;
    level: HexNumber;
    log2step: HexNumber;
    height: HexNumber;
    created_at: DateTime;
    updated_at: DateTime;
    initial_hash: Hash;
    base_cycle: Uint256;
    kind: TournamentKind;
    /** The block the tournament was created in. */
    start_instant: HexNumber;
    /** Initial clock allowance, in blocks. */
    allowance: HexNumber;
    creation_event: TournamentCreationEvent | null;
    snapshot: TournamentSnapshot;
};

export type ListTournamentsReturnType = PaginatedReturnType<Tournament>;

export type GetTournamentParams = {
    application: string | Address;
    address: Address;
};

export type GetTournamentReturnType = {
    data: Tournament;
};

export type ListCommitmentsParams = PaginationParams & {
    application: string | Address;
    epoch_index?: HexNumber;
    tournament_address?: Address;
};

export type CommitmentSnapshot = {
    as_of_block: HexNumber;
    /**
     * Current claimer, which can be zero after elimination or recovery. The
     * original submitter stays on `Commitment.submitter_address`.
     */
    claimer: Address;
    clock_running: boolean;
    /** Responder expiry block while the clock runs; zero while it is paused. */
    clock_deadline: HexNumber;
    /**
     * Paused allowance, in blocks. A retained clock does not on its own prove
     * that the commitment is live.
     */
    clock_allowance: HexNumber;
};

export type Commitment = {
    epoch_index: HexNumber;
    tournament_address: Address;
    commitment: Hash;
    final_state_hash: Hash;
    submitter_address: Address;
    block_number: HexNumber;
    tx_hash: Hash;
    created_at: DateTime;
    updated_at: DateTime;
    log_index: HexNumber;
    snapshot: CommitmentSnapshot;
};

export type ListCommitmentsReturnType = PaginatedReturnType<Commitment>;

export type GetCommitmentParams = {
    application: string | Address;
    epoch_index: HexNumber;
    tournament_address: Address;
    commitment: Hash;
};

export type GetCommitmentReturnType = {
    data: Commitment;
};

export type ListMatchesParams = PaginationParams & {
    application: string | Address;
    epoch_index?: HexNumber;
    tournament_address?: Address;
};

export type LeafMatchSeal = {
    /** The immutable deadline from `LeafMatchSealed`. */
    eliminable_at: HexNumber;
    block_number: HexNumber;
    tx_hash: Hash;
    log_index: HexNumber;
};

type MatchBisectionSnapshotBase = {
    revealing_parent: Hash;
    waiting_left: Hash;
    waiting_right: Hash;
    segment_start_position: Uint256;
    segment_start_cycle: Uint256;
    responder: CommitmentSide;
};

export type MatchBisectionSnapshot = MatchBisectionSnapshotBase & {
    current_height: HexNumber | null;
};

/** Sealed values are in commitment-side order, not in reveal order. */
export type MatchSealedSnapshot = {
    agree_state: Hash;
    divergence_position: Uint256;
    divergence_cycle: Uint256;
    final_state_one: Hash;
    final_state_two: Hash;
};

/**
 * Current match state. A deleted match is `UNINITIALIZED` and carries no phase
 * payload, while its deletion facts stay on the match itself; a sealed non-leaf
 * match has no local timeout outcome, because its child tournament controls
 * progress.
 */
export type MatchSnapshot = {
    as_of_block: HexNumber;
    timeout_outcome: MatchTimeoutOutcome;
    /**
     * Deferred charge, in blocks, from the timeout classifier at `as_of_block`.
     */
    deferred_charge: HexNumber;
} & (
    | { phase: "UNINITIALIZED"; bisection: null; sealed: null }
    | {
          phase: "BISECTING";
          bisection: MatchBisectionSnapshotBase & { current_height: HexNumber };
          sealed: null;
      }
    | {
          phase: "READY_TO_SEAL";
          bisection: MatchBisectionSnapshotBase & { current_height: null };
          sealed: null;
      }
    | { phase: "SEALED"; bisection: null; sealed: MatchSealedSnapshot }
);

export type Match = {
    epoch_index: HexNumber;
    tournament_address: Address;
    id_hash: Hash;
    commitment_one: Hash;
    commitment_two: Hash;
    left_of_two: Hash;
    block_number: HexNumber;
    tx_hash: Hash;
    winner_commitment: WinnerCommitment;
    deletion_reason: DeletionReason;
    deletion_block_number: HexNumber | null;
    deletion_tx_hash: Hash | null;
    created_at: DateTime;
    updated_at: DateTime;
    log_index: HexNumber;
    /**
     * The immutable `MatchCreated` deadline, not the current responder deadline.
     */
    eliminable_at: HexNumber;
    leaf_seal: LeafMatchSeal | null;
    deletion_log_index: HexNumber | null;
    snapshot: MatchSnapshot;
};

export type ListMatchesReturnType = PaginatedReturnType<Match>;

export type GetMatchParams = {
    application: string | Address;
    epoch_index: HexNumber;
    tournament_address: Address;
    id_hash: Hash;
};

export type GetMatchReturnType = {
    data: Match;
};

/**
 * `descending` reverses both the block-number and the log-index ordering of the
 * results.
 */
export type ListMatchAdvancesParams = PaginationParams & {
    application: string | Address;
    epoch_index: HexNumber;
    tournament_address: Address;
    id_hash: Hash;
};

export type MatchAdvanced = {
    epoch_index: HexNumber;
    tournament_address: Address;
    id_hash: Hash;
    other_parent: Hash;
    left_node: Hash;
    block_number: HexNumber;
    tx_hash: Hash;
    created_at: DateTime;
    updated_at: DateTime;
    log_index: HexNumber;
    segment_start_position: Uint256;
    /** The immutable both-sides elimination deadline this advance reports. */
    eliminable_at: HexNumber;
};

export type ListMatchAdvancesReturnType = PaginatedReturnType<MatchAdvanced>;

/**
 * A match advance is keyed by the transaction hash and block-global log index of
 * its event, both of which `cartesi_listMatchAdvances` returns: repeated
 * other-parent hashes stay distinct events, so the parent hash alone does not
 * identify one.
 */
export type GetMatchAdvanceParams = {
    application: string | Address;
    epoch_index: HexNumber;
    tournament_address: Address;
    id_hash: Hash;
    tx_hash: Hash;
    log_index: HexNumber;
};

export type GetMatchAdvanceReturnType = {
    data: MatchAdvanced;
};

/** Value is the refund that was requested; it was paid only if `success`. */
export type PartialBondRefund = {
    recipient: Address;
    value: Uint256;
    success: boolean;
};

export type BondRecovered = {
    commitment: Hash;
    claimer: Address;
    payment: Uint256;
    burned: Uint256;
};

export type BondEvent = {
    epoch_index: HexNumber;
    tournament_address: Address;
    block_number: HexNumber;
    tx_hash: Hash;
    log_index: HexNumber;
    created_at: DateTime;
    updated_at: DateTime;
} & (
    | { type: "PARTIAL_BOND_REFUND"; refund: PartialBondRefund; recovery: null }
    | { type: "BOND_RECOVERED"; refund: null; recovery: BondRecovered }
);

/**
 * `descending` reverses both the block-number and the log-index ordering of the
 * results.
 */
export type ListBondEventsParams = PaginationParams & {
    application: string | Address;
    epoch_index?: HexNumber;
    tournament_address?: Address;
};

export type ListBondEventsReturnType = PaginatedReturnType<BondEvent>;

export type GetBondEventParams = {
    application: string | Address;
    tx_hash: Hash;
    log_index: HexNumber;
};

export type GetBondEventReturnType = {
    data: BondEvent;
};

export type ListInputsParams = PaginationParams &
    RangeParams & {
        application: string | Address;
        epoch_index?: HexNumber;
        sender?: Address;
        transaction_hash?: Hash;
    };

export type ListInputsReturnType = PaginatedReturnType<Input>;

export type ListOutputsParams = PaginationParams &
    RangeParams & {
        application: string | Address;
        epoch_index?: HexNumber;
        input_index?: HexNumber;
        /**
         * Filter by one output type selector (the first 4 bytes of the raw
         * data) or by a non-empty list of selectors (OR semantics).
         */
        output_type?: Hex | NonEmptyArray<Hex>;
        voucher_address?: Address;
        /**
         * Filter by execution status: `true` selects outputs with an execution
         * transaction hash, `false` selects outputs without one.
         *
         * Executions are observed out of output-index order, so no resume
         * cursor over this filter — output index, pagination offset or executed
         * count alike — is sound. Poll `cartesi_getExecutedOutputCount` and
         * diff the pending set on change instead.
         */
        executed?: boolean;
    };

export type ListOutputsReturnType = PaginatedReturnType<Output>;

export type ListReportsParams = PaginationParams &
    RangeParams & {
        application: string | Address;
        epoch_index?: HexNumber;
        input_index?: HexNumber;
    };

export type ListReportsReturnType = PaginatedReturnType<Report>;

export type NodeInfo = {
    chain_id: HexNumber;
    version: string;
    default_block: DefaultBlock;
};

export type GetNodeInfoReturnType = {
    data: NodeInfo;
};

/** @deprecated use `GetNodeInfoReturnType` (`cartesi_getNodeInfo`) instead. */
export type GetChainIdReturnType = {
    data: HexNumber;
};

/** @deprecated use `GetNodeInfoReturnType` (`cartesi_getNodeInfo`) instead. */
export type GetNodeVersionReturnType = {
    data: string;
};

export type Withdrawal = {
    account_index: HexNumber;
    account: Hex;
    output: Hex;
    block_number: HexNumber;
    transaction_hash: Hash;
    log_index: HexNumber;
    created_at: DateTime;
    updated_at: DateTime;
};

export type ListWithdrawalsParams = PaginationParams & {
    application: string | Address;
    account_index?: HexNumber;
};

export type ListWithdrawalsReturnType = PaginatedReturnType<Withdrawal>;

export type GetWithdrawalParams = {
    application: string | Address;
    account_index: HexNumber;
};

export type GetWithdrawalReturnType = {
    data: Withdrawal;
};
