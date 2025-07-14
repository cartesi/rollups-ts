export type PaginationParams = {
    limit?: number;
    offset?: number;
    descending?: boolean;
};

export type Address = `0x${string}`;
export type Hash = `0x${string}`;
export type Hex = `0x${string}`;
export type HexNumber = `0x${string}`;
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

export type GetApplicationParams = { application: string | Address };

export type Application = {
    name: string;
    iapplication_address: Address;
    iconsensus_address: Address;
    iinputbox_address: Address;
    template_hash: Hash;
    epoch_length: HexNumber;
    data_availability: Hex;
    state: "ENABLED" | "DISABLED" | "INOPERABLE";
    reason?: string | null;
    iinputbox_block: HexNumber;
    last_input_check_block: HexNumber;
    last_output_check_block: HexNumber;
    processed_inputs: HexNumber;
    created_at: DateTime;
    updated_at: DateTime;
    execution_parameters: {
        snapshot_policy: "NONE" | "EACH_INPUT" | "EACH_EPOCH";
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
    claim_hash: Hash;
    claim_transaction_hash: Hash;
    status: EpochStatus;
    virtual_index: HexNumber;
    created_at: DateTime;
    updated_at: DateTime;
};

export type GetEpochReturnType = {
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
        chain_id: string;
        application_contract: Address;
        sender: Address;
        block_number: HexNumber;
        block_timestamp: HexNumber;
        prev_randao: string;
        index: HexNumber;
        payload: Hex;
    };
    status: InputStatus;
    machine_hash: Hash;
    outputs_hash: Hash;
    transaction_reference: Hex;
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
    decoded_data: Notice | Voucher | DelegateCallVoucher;
    hash: Hash;
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
    processed_inputs: HexNumber;
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

export type ListEpochsParams = PaginationParams & {
    application: string | Address;
    status?: EpochStatus;
};

export type ListEpochsReturnType = PaginatedReturnType<Epoch>;

export type ListInputsParams = PaginationParams & {
    application: string | Address;
    epoch_index?: HexNumber;
    sender?: Address;
};

export type ListInputsReturnType = PaginatedReturnType<Input>;

export type ListOutputsParams = PaginationParams & {
    application: string | Address;
    epoch_index?: HexNumber;
    input_index?: HexNumber;
    output_type?: Hex;
    voucher_address?: Address;
};

export type ListOutputsReturnType = PaginatedReturnType<Output>;

export type ListReportsParams = PaginationParams & {
    application: string | Address;
    epoch_index?: HexNumber;
    input_index?: HexNumber;
};

export type ListReportsReturnType = PaginatedReturnType<Report>;

export type GetChainIdReturnType = {
    data: string;
};

export type GetNodeVersionReturnType = {
    data: string;
};
