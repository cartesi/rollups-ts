import {
    GetApplicationParams,
    GetApplicationReturnType,
    GetEpochParams,
    GetEpochReturnType,
    GetInputParams,
    GetInputReturnType,
    GetLastAcceptedEpochIndexParams,
    GetLastAcceptedEpochIndexReturnType,
    GetOutputParams,
    GetOutputReturnType,
    GetProcessedInputCountParams,
    GetProcessedInputCountReturnType,
    GetReportParams,
    GetReportReturnType,
    ListApplicationsParams,
    ListApplicationsReturnType,
    ListEpochsParams,
    ListEpochsReturnType,
    ListInputsParams,
    ListInputsReturnType,
    ListOutputsParams,
    ListOutputsReturnType,
    ListReportsParams,
    ListReportsReturnType,
} from "./types.js";

export type Methods = {
    cartesi_listApplications(
        params: ListApplicationsParams,
    ): ListApplicationsReturnType;
    cartesi_getApplication(
        params: GetApplicationParams,
    ): GetApplicationReturnType;
    cartesi_listEpochs(params: ListEpochsParams): ListEpochsReturnType;
    cartesi_getEpoch(params: GetEpochParams): GetEpochReturnType;
    cartesi_getLastAcceptedEpochIndex(
        params: GetLastAcceptedEpochIndexParams,
    ): GetLastAcceptedEpochIndexReturnType;
    cartesi_listInputs(params: ListInputsParams): ListInputsReturnType;
    cartesi_getInput(params: GetInputParams): GetInputReturnType;
    cartesi_getProcessedInputCount(
        params: GetProcessedInputCountParams,
    ): GetProcessedInputCountReturnType;
    cartesi_listOutputs(params: ListOutputsParams): ListOutputsReturnType;
    cartesi_getOutput(params: GetOutputParams): GetOutputReturnType;
    cartesi_listReports(params: ListReportsParams): ListReportsReturnType;
    cartesi_getReport(params: GetReportParams): GetReportReturnType;
};
