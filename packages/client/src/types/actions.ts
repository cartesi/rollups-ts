import type {
    ApplicationStatus,
    ConsensusType,
    DefaultBlock,
    DeletionReason,
    EpochStatus,
    InputStatus,
    NonEmptyArray,
    SnapshotPolicy,
    WinnerCommitment,
} from "@cartesi/rpc";
import type { ExtractAbiFunctionNames } from "abitype";
import type { Address, Hash, Hex } from "viem";
import type { outputsAbi } from "../rollups";

export type {
    ApplicationStatus,
    ConsensusType,
    DefaultBlock,
    DeletionReason,
    EpochStatus,
    InputStatus,
    NonEmptyArray,
    SnapshotPolicy,
    WinnerCommitment,
};

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
 * Inclusive index range shared by the listing actions that are indexed by a
 * sequential number (epochs, inputs, outputs and reports).
 */
export type RangeParams = {
    /** Inclusive lower bound on the index. */
    from?: bigint;
    /** Inclusive upper bound on the index. */
    to?: bigint;
};

export type Pagination = {
    totalCount: number;
    limit: number;
    offset: number;
};

export type DataAvailabilityInputBox = {
    type: "InputBox";
    inputBoxAddress: Address;
};

export type DataAvailabilityInputBoxAndEspresso = {
    type: "InputBoxAndEspresso";
    inputBoxAddress: Address;
    fromBlock: bigint;
    namespaceId: number;
};

export type DataAvailability =
    | DataAvailabilityInputBox
    | DataAvailabilityInputBoxAndEspresso;

export type GetApplicationParams = { application: Address | string };

export type Application = {
    name: string;
    applicationAddress: Address;
    consensusAddress: Address;
    inputBoxAddress: Address;
    templateHash: Hash;
    epochLength: bigint;
    claimStagingPeriod: bigint;
    withdrawalConfig: {
        guardian: Address;
        log2LeavesPerAccount: bigint;
        log2MaxNumOfAccounts: bigint;
        accountsDriveStartIndex: bigint;
        withdrawalOutputBuilder: Address;
    };
    dataAvailability: DataAvailability;
    consensusType: ConsensusType;
    status: ApplicationStatus;
    enabled: boolean;
    reason?: string | null;
    inputBoxBlock: bigint;
    lastEpochCheckBlock: bigint;
    lastInputCheckBlock: bigint;
    lastOutputCheckBlock: bigint;
    lastTournamentCheckBlock: bigint;
    lastForecloseCheckBlock: bigint;
    lastAccountsDriveProvedCheckBlock: bigint;
    lastWithdrawalCheckBlock: bigint;
    processedInputs: bigint;
    forecloseBlock: bigint;
    forecloseTransaction: Hash;
    accountsDriveProvedBlock: bigint;
    accountsDriveProvedTransaction: Hash;
    accountsDriveMerkleRoot: Hash;
    createdAt: Date;
    updatedAt: Date;
    executionParameters: {
        snapshotPolicy: SnapshotPolicy;
        advanceIncCycles: bigint;
        advanceMaxCycles: bigint;
        inspectIncCycles: bigint;
        inspectMaxCycles: bigint;
        advanceIncDeadline: bigint;
        advanceMaxDeadline: bigint;
        inspectIncDeadline: bigint;
        inspectMaxDeadline: bigint;
        loadDeadline: bigint;
        storeDeadline: bigint;
        fastDeadline: bigint;
        maxConcurrentInspects: number;
        createdAt: Date;
        updatedAt: Date;
    };
};
export type GetApplicationReturnType = Application;

export type NodeInfo = {
    chainId: number;
    version: string;
    /**
     * The node's finality contract: the block tag up to which it reads and acts
     * on chain state. Everything the node exposes carries that tag's stability
     * guarantees.
     */
    defaultBlock: DefaultBlock;
};

export type GetNodeInfoReturnType = NodeInfo;

/** @deprecated use `getNodeInfo` instead. */
export type GetChainIdReturnType = number;

/** @deprecated use `getNodeInfo` instead. */
export type GetNodeVersionReturnType = string;

export type GetEpochParams = {
    application: Address | string;
    epochIndex: bigint;
};

export type Epoch = {
    index: bigint;
    firstBlock: bigint;
    lastBlock: bigint;
    inputIndexLowerBound: bigint;
    inputIndexUpperBound: bigint;
    machineHash: Hash | null;
    outputsMerkleRoot: Hash | null;
    outputsMerkleProof: Hash[] | null;
    tournamentAddress: Address | null;
    commitment: Hash | null;
    commitmentProof: Hash[] | null;
    claimTransactionHash: Hash | null;
    status: EpochStatus;
    stagedAtBlock: bigint | null;
    virtualIndex: bigint;
    createdAt: Date;
    updatedAt: Date;
};

export type GetEpochReturnType = Epoch;

export type GetEpochByVirtualIndexParams = {
    application: Address | string;
    /** Dense insertion rank of the epoch: 0, 1, 2, … with no gaps. */
    virtualIndex: bigint;
};

export type GetEpochByVirtualIndexReturnType = Epoch;

export type GetTournamentParams = {
    application: Address | string;
    address: Address;
};

export type Tournament = {
    epochIndex: bigint;
    address: Address;
    parentTournamentAddress: Address | null;
    parentMatchIdHash: Hash | null;
    maxLevel: bigint;
    level: bigint;
    log2step: bigint;
    height: bigint;
    winnerCommitment: Hash | null;
    finalStateHash: Hash | null;
    finishedAtBlock: bigint;
    createdAt: Date;
    updatedAt: Date;
};

export type GetTournamentReturnType = Tournament;

export type Commitment = {
    epochIndex: bigint;
    tournamentAddress: Address;
    commitment: Hash;
    finalStateHash: Hash;
    submitterAddress: Address;
    blockNumber: bigint;
    txHash: Hash;
    createdAt: Date;
    updatedAt: Date;
};

export type GetCommitmentParams = {
    application: Address | string;
    epochIndex: bigint;
    tournamentAddress: Address;
    commitment: Hash;
};

export type GetCommitmentReturnType = Commitment;

export type Match = {
    epochIndex: bigint;
    tournamentAddress: Address;
    idHash: Hash;
    commitmentOne: Hash;
    commitmentTwo: Hash;
    leftOfTwo: Hash;
    blockNumber: bigint;
    txHash: Hash;
    winnerCommitment: WinnerCommitment;
    deletionReason: DeletionReason;
    deletionBlockNumber: bigint | null;
    deletionTxHash: Hash | null;
    createdAt: Date;
    updatedAt: Date;
};

export type GetMatchParams = {
    application: Address | string;
    epochIndex: bigint;
    tournamentAddress: Address;
    idHash: Hash;
};

export type GetMatchReturnType = Match;

export type MatchAdvanced = {
    epochIndex: bigint;
    tournamentAddress: Address;
    idHash: Hash;
    otherParent: Hash;
    leftNode: Hash;
    blockNumber: bigint;
    txHash: Hash;
    createdAt: Date;
    updatedAt: Date;
};

export type GetMatchAdvanceParams = {
    application: Address | string;
    epochIndex: bigint;
    tournamentAddress: Address;
    idHash: Hash;
    parent: Hash;
};

export type GetMatchAdvanceReturnType = MatchAdvanced;

export type GetInputParams = {
    application: Address | string;
    inputIndex: bigint;
};

export type Input = {
    epochIndex: bigint;
    index: bigint;
    blockNumber: bigint;
    rawData: Hex;
    decodedData: {
        chainId: bigint;
        applicationContract: Address;
        sender: Address;
        blockNumber: bigint;
        blockTimestamp: bigint;
        prevRandao: bigint;
        index: bigint;
        payload: Hex;
    } | null;
    status: InputStatus;
    /**
     * Raw guest-provided CMIO exception payload. Non-null only when `status` is
     * `EXCEPTION`; an empty payload is `0x`.
     */
    exceptionData: Hex | null;
    machineHash: Hash | null;
    outputsHash: Hash | null;
    transactionHash: Hash;
    logIndex: bigint;
    createdAt: Date;
    updatedAt: Date;
};

export type GetInputReturnType = Input;

export type GetLastAcceptedEpochIndexParams = { application: Address | string };

export type GetLastAcceptedEpochIndexReturnType = bigint;

export type GetOutputParams = {
    application: Address | string;
    outputIndex: bigint;
};

export type Notice = {
    type: "Notice";
    payload: Hex;
};

export type Voucher = {
    type: "Voucher";
    destination: Address;
    value: bigint;
    payload: Hex;
};

export type DelegateCallVoucher = {
    type: "DelegateCallVoucher";
    destination: Address;
    payload: Hex;
};

export type Output = {
    epochIndex: bigint;
    inputIndex: bigint;
    index: bigint;
    rawData: Hex;
    decodedData: Notice | Voucher | DelegateCallVoucher | null;
    hash: Hash | null;
    outputHashesSiblings: Hash[] | null;
    executionTransactionHash: Hash | null;
    createdAt: Date;
    updatedAt: Date;
};
export type GetOutputReturnType = Output;
export type GetProcessedInputCountParams = { application: Address | string };

export type GetProcessedInputCountReturnType = bigint;

export type GetExecutedOutputCountParams = { application: Address | string };

export type GetExecutedOutputCountReturnType = bigint;

export type GetPendingExecutableOutputCountParams = {
    application: Address | string;
};

export type GetPendingExecutableOutputCountReturnType = bigint;

export type GetReportParams = {
    application: Address | string;
    reportIndex: bigint;
};

export type Report = {
    epochIndex: bigint;
    inputIndex: bigint;
    index: bigint;
    rawData: Hex;
    createdAt: Date;
    updatedAt: Date;
};
export type GetReportReturnType = Report;
export type ListApplicationsParams = PaginationParams;

export type ListApplicationsReturnType = {
    data: Application[];
    pagination: Pagination;
};

export type ListEpochsParams = PaginationParams &
    RangeParams & {
        application: Address | string;
        /**
         * Filter by one status or by a non-empty list of statuses (OR
         * semantics).
         *
         * To stay in sync, keep discovery and refresh separate: advance `from`
         * to the next unseen epoch index to discover new epochs, and refresh
         * the epochs already seen by filtering them on the non-terminal
         * statuses. Terminal statuses (`CLAIM_ACCEPTED`, `CLAIM_REJECTED` and
         * `CLAIM_FORECLOSED`) never regress, so a settled epoch can be dropped
         * from the refresh set for good.
         */
        status?: EpochStatus | NonEmptyArray<EpochStatus>;
    };

export type ListEpochsReturnType = {
    data: Epoch[];
    pagination: Pagination;
};

export type ListTournamentsParams = PaginationParams & {
    application: Address | string;
    epochIndex?: bigint;
    level?: bigint;
    parentTournamentAddress?: Address;
    parentMatchIdHash?: Hash;
};

export type ListTournamentsReturnType = {
    data: Tournament[];
    pagination: Pagination;
};

export type ListCommitmentsParams = PaginationParams & {
    application: Address | string;
    epochIndex?: bigint;
    tournamentAddress?: Address;
};

export type ListCommitmentsReturnType = {
    data: Commitment[];
    pagination: Pagination;
};

export type ListMatchesParams = PaginationParams & {
    application: Address | string;
    epochIndex?: bigint;
    tournamentAddress?: Address;
};

export type ListMatchesReturnType = {
    data: Match[];
    pagination: Pagination;
};

export type ListMatchAdvancesParams = PaginationParams & {
    application: Address | string;
    epochIndex: bigint;
    tournamentAddress: Address;
    idHash: Hash;
};

export type ListMatchAdvancesReturnType = {
    data: MatchAdvanced[];
    pagination: Pagination;
};

export type ListInputsParams = PaginationParams &
    RangeParams & {
        application: Address | string;
        epochIndex?: bigint;
        sender?: Address;
        transactionHash?: Hash;
    };

export type ListInputsReturnType = {
    data: Input[];
    pagination: Pagination;
};

export type OutputType = ExtractAbiFunctionNames<typeof outputsAbi>;

export type ListOutputsParams = PaginationParams &
    RangeParams & {
        application: Address | string;
        epochIndex?: bigint;
        inputIndex?: bigint;
        /**
         * Filter by one output type or by a non-empty list of output types (OR
         * semantics).
         */
        outputType?: OutputType | NonEmptyArray<OutputType>;
        voucherAddress?: Address;
        /**
         * Filter by execution status: `true` selects outputs already executed,
         * `false` selects outputs that are not.
         *
         * Executions are observed out of output-index order — an old voucher
         * can execute after newer outputs — so no resume cursor over this
         * filter is sound, whether keyed on the output index, a pagination
         * offset or the executed count; each would silently skip late
         * executions. Poll `getExecutedOutputCount` instead and, on change,
         * diff the working set returned with `executed: false` and
         * `outputType: ["Voucher", "DelegateCallVoucher"]` against its previous
         * result.
         */
        executed?: boolean;
    };

export type ListOutputsReturnType = {
    data: Output[];
    pagination: Pagination;
};

export type ListReportsParams = PaginationParams &
    RangeParams & {
        application: Address | string;
        epochIndex?: bigint;
        inputIndex?: bigint;
    };

export type ListReportsReturnType = {
    data: Report[];
    pagination: Pagination;
};

export type WaitForInputParams = GetInputParams & {
    waitProcessing?: boolean;
    rejectErrors?: boolean;
    pollingInterval?: number;
    retryCount?: number;
    timeout?: number;
};

export type WaitForInputReturnType = Input;

export type Withdrawal = {
    accountIndex: bigint;
    account: Hex;
    output: Hex;
    blockNumber: bigint;
    transactionHash: Hash;
    logIndex: bigint;
    createdAt: Date;
    updatedAt: Date;
};

export type ListWithdrawalsParams = PaginationParams & {
    application: string | Address;
    accountIndex?: bigint;
};

export type ListWithdrawalsReturnType = {
    data: Withdrawal[];
    pagination: Pagination;
};

export type GetWithdrawalParams = {
    application: string | Address;
    accountIndex: bigint;
};

export type GetWithdrawalReturnType = Withdrawal;
