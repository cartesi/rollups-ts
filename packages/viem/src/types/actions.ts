import type { ExtractAbiFunctionNames } from "abitype";
import type { Address, Hash, Hex } from "viem";

import type { outputsAbi } from "../rollups";

export type PaginationParams = {
    limit?: number;
    offset?: number;
    descending?: boolean;
};

export type Pagination = {
    totalCount: number;
    limit: number;
    offset: number;
};

export type EpochStatus =
    | "OPEN"
    | "CLOSED"
    | "INPUTS_PROCESSED"
    | "CLAIM_COMPUTED"
    | "CLAIM_SUBMITTED"
    | "CLAIM_ACCEPTED"
    | "CLAIM_REJECTED";

export type InputStatus =
    | "NONE"
    | "ACCEPTED"
    | "REJECTED"
    | "EXCEPTION"
    | "MACHINE_HALTED"
    | "OUTPUTS_LIMIT_EXCEEDED"
    | "CYCLE_LIMIT_EXCEEDED"
    | "TIME_LIMIT_EXCEEDED"
    | "PAYLOAD_LENGTH_LIMIT_EXCEEDED";

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
    dataAvailability: DataAvailability;
    consensusType: "AUTHORITY" | "QUORUM" | "PRT";
    state: "ENABLED" | "DISABLED" | "INOPERABLE";
    reason?: string | null;
    inputBoxBlock: bigint;
    lastEpochCheckBlock: bigint;
    lastInputCheckBlock: bigint;
    lastOutputCheckBlock: bigint;
    processedInputs: bigint;
    createdAt: Date;
    updatedAt: Date;
    executionParameters: {
        snapshotPolicy: "NONE" | "EVERY_INPUT" | "EVERY_EPOCH";
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

export type GetChainIdReturnType = number;

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
    machineHash: Hash;
    claimHash: Hash;
    claimTransactionHash: Hash;
    tournamentAddress: Address;
    commitment: Hash;
    status: EpochStatus;
    virtualIndex: bigint;
    createdAt: Date;
    updatedAt: Date;
};

export type GetEpochReturnType = Epoch;

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
    submitterAddress: Address | null;
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
    winnerCommitment: Hash | null;
    deletionReason: "STEP" | "TIMEOUT" | "CHILD_TOURNAMENT" | "NOT_DELETED";
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

export type GetMatchAdvancedParams = {
    application: Address | string;
    epochIndex: bigint;
    tournamentAddress: Address;
    idHash: Hash;
    parent: Hash;
};

export type GetMatchAdvancedReturnType = MatchAdvanced;

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
    };
    status: InputStatus;
    machineHash: Hash;
    outputsHash: Hash;
    transactionReference: Hash;
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
    decodedData: Notice | Voucher | DelegateCallVoucher;
    hash: Hash;
    outputHashesSiblings: Hash[] | null;
    executionTransactionHash: Hash | null;
    createdAt: Date;
    updatedAt: Date;
};
export type GetOutputReturnType = Output;
export type GetProcessedInputCountParams = { application: Address | string };

export type GetProcessedInputCountReturnType = bigint;

export type GetReportParams = {
    application: Address | string;
    reportIndex: bigint;
};

export type Report = {
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

export type ListEpochsParams = PaginationParams & {
    application: Address | string;
    status?: EpochStatus;
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

export type ListInputsParams = PaginationParams & {
    application: Address | string;
    epochIndex?: bigint;
    sender?: Address;
};

export type ListInputsReturnType = {
    data: Input[];
    pagination: Pagination;
};

export type OutputType = ExtractAbiFunctionNames<typeof outputsAbi>;

export type ListOutputsParams = PaginationParams & {
    application: Address | string;
    epochIndex?: bigint;
    inputIndex?: bigint;
    outputType?: OutputType;
    voucherAddress?: Address;
};

export type ListOutputsReturnType = {
    data: Output[];
    pagination: Pagination;
};

export type ListReportsParams = PaginationParams & {
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
