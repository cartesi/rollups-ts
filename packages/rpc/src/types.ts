export type PaginationParams = {
    limit?: number;
    offset?: number;
};

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

export type GetApplicationParams = { application: string };

export type GetApplicationReturnType = {
    name: string;
    iapplication_address: string;
    iconsensus_address: string;
    iinputbox_address: string;
    template_hash: string;
    template_uri: string;
    epoch_length: number;
    data_availability: string;
    state: string;
    reason: string | null;
    iinputbox_block: string;
    last_input_check_block: string;
    last_output_check_block: string;
    processed_inputs: number;
    created_at: string;
    updated_at: string;
    execution_parameters: {
        snapshot_policy: "NONE" | "EACH_INPUT" | "EACH_EPOCH";
        snapshot_retention: number;
        advance_inc_cycles: number;
        advance_max_cycles: number;
        inspect_inc_cycles: number;
        inspect_max_cycles: number;
        advance_inc_deadline: number;
        advance_max_deadline: number;
        inspect_inc_deadline: number;
        inspect_max_deadline: number;
        load_deadline: number;
        store_deadline: number;
        fast_deadline: number;
        max_concurrent_inspects: number;
        created_at: string;
        updated_at: string;
    };
};

export type GetEpochParams = { application: string; epoch_index: string };

export type GetEpochReturnType = {
    index: string;
    first_block: string;
    last_block: string;
    claim_hash: string;
    claim_transaction_hash: string;
    status: EpochStatus;
    virtual_index: string;
    created_at: string;
    updated_at: string;
};

export type GetInputParams = {
    application: string;
    input_index: string;
};

export type GetInputReturnType = {
    epoch_index: string;
    index: string;
    block_number: string;
    raw_data: string;
    decoded_data: {
        chain_id: string;
        application_contract: string;
        sender: string;
        block_number: string;
        block_timestamp: string;
        prev_randao: string;
        index: string;
        payload: string;
    };
    status: InputStatus;
    machine_hash: string;
    outputs_hash: string;
    transaction_reference: string;
    created_at: string;
    updated_at: string;
};

export type GetLastAcceptedEpochParams = { application: string };

export type GetLastAcceptedEpochReturnType = GetEpochReturnType;

export type GetOutputParams = {
    application: string;
    output_index: string;
};

export type GetOutputReturnType = {
    input_index: string;
    index: string;
    raw_data: string;
    decoded_data:
        | {
              index: number;
              type: string;
              payload: string;
          }
        | {
              index: number;
              type: string;
              destination: string;
              value: string;
              payload: string;
          }
        | {
              index: number;
              type: string;
              destination: string;
              payload: string;
          };
    hash: string;
    output_hashes_siblings: string[];
    execution_transaction_hash: string;
    created_at: string;
    updated_at: string;
};

export type GetProcessedInputCountParams = { application: string };

export type GetProcessedInputCountReturnType = { processed_inputs: number };

export type GetReportParams = { application: string; report_index: string };

export type GetReportReturnType = {
    input_index: string;
    index: string;
    raw_data: string;
    created_at: string;
    updated_at: string;
};

export type ListApplicationsParams = PaginationParams;

export type ListApplicationsReturnType = {
    data: GetApplicationReturnType[];
    pagination: Pagination;
};

export type ListEpochsParams = PaginationParams & {
    application: string;
    status?: EpochStatus;
};

export type ListEpochsReturnType = {
    data: GetEpochReturnType[];
    pagination: Pagination;
};

export type ListInputsParams = PaginationParams & {
    application: string;
    epoch_index?: string;
    sender?: string;
};

export type ListInputsReturnType = {
    data: GetInputReturnType[];
    pagination: Pagination;
};

export type ListOutputsParams = PaginationParams & {
    application: string;
    epoch_index?: string;
    input_index?: string;
    output_type?: string;
    voucher_address?: string;
};

export type ListOutputsReturnType = {
    data: GetOutputReturnType[];
    pagination: Pagination;
};

export type ListReportsParams = PaginationParams & {
    application: string;
    epoch_index?: string;
    input_index?: string;
};

export type ListReportsReturnType = {
    data: GetReportReturnType[];
    pagination: Pagination;
};
