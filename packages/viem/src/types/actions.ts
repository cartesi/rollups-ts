import { Address, Hash, Hex } from "viem";

export type PaginationParams = {
    limit?: number;
    offset?: number;
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

export type GetApplicationReturnType = {
    name: string;
    applicationAddress: Address;
    consensusAddress: Address;
    inputBoxAddress: Address;
    templateHash: Hash;
    epochLength: bigint;
    dataAvailability: DataAvailability;
    state: string;
    reason: string | null;
    inputBoxBlock: bigint;
    lastInputCheckBlock: bigint;
    lastOutputCheckBlock: bigint;
    processedInputs: bigint;
    createdAt: Date;
    updatedAt: Date;
    executionParameters: {
        snapshotPolicy: "NONE" | "EACH_INPUT" | "EACH_EPOCH";
        advanceIncCycles: bigint;
        advanceMaxCycles: bigint;
        inspectIncCycles: bigint;
        inspectMaxCycles: bigint;
        advanceIncDeadline: string;
        advanceMaxDeadline: string;
        inspectIncDeadline: string;
        inspectMaxDeadline: string;
        loadDeadline: string;
        storeDeadline: string;
        fastDeadline: string;
        maxConcurrentInspects: number;
        createdAt: Date;
        updatedAt: Date;
    };
};

export type GetEpochParams = {
    application: Address | string;
    epochIndex: bigint;
};

export type GetEpochReturnType = {
    index: bigint;
    firstBlock: bigint;
    lastBlock: bigint;
    claimHash: Hash;
    claimTransactionHash: Hash;
    status: EpochStatus;
    virtualIndex: bigint;
    createdAt: Date;
    updatedAt: Date;
};

export type GetInputParams = {
    application: Address | string;
    inputIndex: bigint;
};

export type GetInputReturnType = {
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

export type GetLastAcceptedEpochParams = { application: Address | string };

export type GetLastAcceptedEpochReturnType = GetEpochReturnType;

export type GetOutputParams = {
    application: Address | string;
    outputIndex: bigint;
};

export type GetOutputReturnType = {
    inputIndex: bigint;
    index: bigint;
    rawData: Hex;
    decodedData:
        | {
              index: bigint;
              type: string;
              payload: Hex;
          }
        | {
              index: bigint;
              type: string;
              destination: Address;
              value: bigint;
              payload: Hex;
          }
        | {
              index: bigint;
              type: string;
              destination: Address;
              payload: Hex;
          };
    hash: Hash;
    outputHashesSiblings: Hash[];
    executionTransactionHash: Hash;
    createdAt: Date;
    updatedAt: Date;
};

export type GetProcessedInputCountParams = { application: Address | string };

export type GetProcessedInputCountReturnType = bigint;

export type GetReportParams = {
    application: Address | string;
    reportIndex: bigint;
};

export type GetReportReturnType = {
    inputIndex: bigint;
    index: bigint;
    rawData: Hex;
    createdAt: Date;
    updatedAt: Date;
};

export type ListApplicationsParams = PaginationParams;

export type ListApplicationsReturnType = {
    data: GetApplicationReturnType[];
    pagination: Pagination;
};

export type ListEpochsParams = PaginationParams & {
    application: Address | string;
    status?: EpochStatus;
};

export type ListEpochsReturnType = {
    data: GetEpochReturnType[];
    pagination: Pagination;
};

export type ListInputsParams = PaginationParams & {
    application: Address | string;
    epochIndex?: bigint;
    sender?: Address;
};

export type ListInputsReturnType = {
    data: GetInputReturnType[];
    pagination: Pagination;
};

export type ListOutputsParams = PaginationParams & {
    application: Address | string;
    epochIndex?: bigint;
    inputIndex?: bigint;
    outputType?: Hex;
    voucherAddress?: Address;
};

export type ListOutputsReturnType = {
    data: GetOutputReturnType[];
    pagination: Pagination;
};

export type ListReportsParams = PaginationParams & {
    application: Address | string;
    epochIndex?: bigint;
    inputIndex?: bigint;
};

export type ListReportsReturnType = {
    data: GetReportReturnType[];
    pagination: Pagination;
};

export type WaitForInputParams = GetInputParams & {
    waitProcessing?: boolean;
    rejectErrors?: boolean;
    pollingInterval?: number;
    retryCount?: number;
    timeout?: number;
};

export type WaitForInputReturnType = GetInputReturnType;
