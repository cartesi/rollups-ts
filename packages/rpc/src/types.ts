export type PaginationParams = {
    limit?: number;
    offset?: number;
};

export type Address = `0x${string}`;
export type Hash = `0x${string}`;
export type Hex = `0x${string}`;
export type UnsignedInteger = `0x${string}`;
export type Date = string;
export type Duration = string;

export type Pagination = {
    total_count: number;
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

export type GetApplicationParams = { application: string | Address };

export type GetApplicationReturnType = {
    name: string;
    iapplication_address: Address;
    iconsensus_address: Address;
    iinputbox_address: Address;
    template_hash: Hash;
    epoch_length: UnsignedInteger;
    data_availability: Hex;
    state: "ENABLED" | "DISABLED" | "INOPERABLE";
    reason: string | null;
    iinputbox_block: UnsignedInteger;
    last_input_check_block: UnsignedInteger;
    last_output_check_block: UnsignedInteger;
    processed_inputs: UnsignedInteger;
    created_at: Date;
    updated_at: Date;
    execution_parameters: {
        snapshot_policy: "NONE" | "EACH_INPUT" | "EACH_EPOCH";
        advance_inc_cycles: UnsignedInteger;
        advance_max_cycles: UnsignedInteger;
        inspect_inc_cycles: UnsignedInteger;
        inspect_max_cycles: UnsignedInteger;
        advance_inc_deadline: Duration;
        advance_max_deadline: Duration;
        inspect_inc_deadline: Duration;
        inspect_max_deadline: Duration;
        load_deadline: Duration;
        store_deadline: Duration;
        fast_deadline: Duration;
        max_concurrent_inspects: number;
        created_at: Date;
        updated_at: Date;
    };
};

export type GetEpochParams = {
    application: string | Address;
    epoch_index: UnsignedInteger;
};

export type GetEpochReturnType = {
    index: UnsignedInteger;
    first_block: UnsignedInteger;
    last_block: UnsignedInteger;
    claim_hash: Hash;
    claim_transaction_hash: Hash;
    status: EpochStatus;
    virtual_index: UnsignedInteger;
    created_at: Date;
    updated_at: Date;
};

export type GetLastAcceptedEpochParams = { application: string | Address };

export type GetLastAcceptedEpochReturnType = GetEpochReturnType;

export type GetInputParams = {
    application: string | Address;
    input_index: UnsignedInteger;
};

export type GetInputReturnType = {
    epoch_index: UnsignedInteger;
    index: UnsignedInteger;
    block_number: UnsignedInteger;
    raw_data: Hex;
    decoded_data: {
        chain_id: string;
        application_contract: Address;
        sender: Address;
        block_number: UnsignedInteger;
        block_timestamp: UnsignedInteger;
        prev_randao: string;
        index: UnsignedInteger;
        payload: Hex;
    };
    status: InputStatus;
    machine_hash: Hash;
    outputs_hash: Hash;
    transaction_reference: Hex;
    created_at: Date;
    updated_at: Date;
};

export type GetOutputParams = {
    application: string | Address;
    output_index: UnsignedInteger;
};

export type GetOutputReturnType = {
    epoch_index: UnsignedInteger;
    input_index: UnsignedInteger;
    index: UnsignedInteger;
    raw_data: Hex;
    decoded_data:
        | {
              index: UnsignedInteger;
              type: string;
              payload: Hex;
          }
        | {
              index: UnsignedInteger;
              type: string;
              destination: Address;
              value: string;
              payload: Hex;
          }
        | {
              index: UnsignedInteger;
              type: string;
              destination: Address;
              payload: Hex;
          };
    hash: Hash;
    output_hashes_siblings: Hash[];
    execution_transaction_hash: Hash;
    created_at: Date;
    updated_at: Date;
};

export type GetProcessedInputCountParams = { application: string | Address };

export type GetProcessedInputCountReturnType = {
    processed_inputs: UnsignedInteger;
};

export type GetReportParams = {
    application: string | Address;
    report_index: UnsignedInteger;
};

export type GetReportReturnType = {
    epoch_index: UnsignedInteger;
    input_index: UnsignedInteger;
    index: UnsignedInteger;
    raw_data: Hex;
    created_at: Date;
    updated_at: Date;
};

export type ListApplicationsParams = PaginationParams;

export type ListApplicationsReturnType = {
    data: GetApplicationReturnType[];
    pagination: Pagination;
};

export type ListEpochsParams = PaginationParams & {
    application: string | Address;
    status?: EpochStatus;
};

export type ListEpochsReturnType = {
    data: GetEpochReturnType[];
    pagination: Pagination;
};

export type ListInputsParams = PaginationParams & {
    application: string | Address;
    epoch_index?: UnsignedInteger;
    sender?: Address;
};

export type ListInputsReturnType = {
    data: GetInputReturnType[];
    pagination: Pagination;
};

export type ListOutputsParams = PaginationParams & {
    application: string | Address;
    epoch_index?: UnsignedInteger;
    input_index?: UnsignedInteger;
    output_type?: UnsignedInteger;
    voucher_address?: Address;
};

export type ListOutputsReturnType = {
    data: GetOutputReturnType[];
    pagination: Pagination;
};

export type ListReportsParams = PaginationParams & {
    application: string | Address;
    epoch_index?: UnsignedInteger;
    input_index?: UnsignedInteger;
};

export type ListReportsReturnType = {
    data: GetReportReturnType[];
    pagination: Pagination;
};
