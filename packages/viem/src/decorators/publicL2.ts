import {
    type GetApplicationParams as GetApplicationParamsRpc,
    type GetApplicationReturnType as GetApplicationReturnTypeRpc,
    type GetEpochParams as GetEpochParamsRpc,
    type GetEpochReturnType as GetEpochReturnTypeRpc,
    type GetInputParams as GetInputParamsRpc,
    type GetInputReturnType as GetInputReturnTypeRpc,
    type GetLastAcceptedEpochIndexParams as GetLastAcceptedEpochIndexParamsRpc,
    type GetLastAcceptedEpochIndexReturnType as GetLastAcceptedEpochIndexReturnTypeRpc,
    type GetOutputParams as GetOutputParamsRpc,
    type GetOutputReturnType as GetOutputReturnTypeRpc,
    type GetProcessedInputCountParams as GetProcessedInputCountParamsRpc,
    type GetProcessedInputCountReturnType as GetProcessedInputCountReturnTypeRpc,
    type GetReportParams as GetReportParamsRpc,
    type GetReportReturnType as GetReportReturnTypeRpc,
    type ListApplicationsParams as ListApplicationsParamsRpc,
    type ListApplicationsReturnType as ListApplicationsReturnTypeRpc,
    type ListEpochsParams as ListEpochsParamsRpc,
    type ListEpochsReturnType as ListEpochsReturnTypeRpc,
    type ListInputsParams as ListInputsParamsRpc,
    type ListInputsReturnType as ListInputsReturnTypeRpc,
    type ListOutputsParams as ListOutputsParamsRpc,
    type ListOutputsReturnType as ListOutputsReturnTypeRpc,
    type ListReportsParams as ListReportsParamsRpc,
    type ListReportsReturnType as ListReportsReturnTypeRpc,
} from "@cartesi/rpc";
import { Client, Transport } from "viem";
import {
    getApplication,
    getEpoch,
    getInput,
    getLastAcceptedEpochIndex,
    getOutput,
    getProcessedInputCount,
    getReport,
    listApplications,
    listEpochs,
    listInputs,
    listOutputs,
    listReports,
    waitForInput,
} from "../actions/index.js";
import {
    type GetApplicationParams,
    type GetApplicationReturnType,
    type GetEpochParams,
    type GetEpochReturnType,
    type GetInputParams,
    type GetInputReturnType,
    type GetLastAcceptedEpochIndexParams,
    type GetLastAcceptedEpochIndexReturnType,
    type GetOutputParams,
    type GetOutputReturnType,
    type GetProcessedInputCountParams,
    type GetProcessedInputCountReturnType,
    type GetReportParams,
    type GetReportReturnType,
    type ListApplicationsParams,
    type ListApplicationsReturnType,
    type ListEpochsParams,
    type ListEpochsReturnType,
    type ListInputsParams,
    type ListInputsReturnType,
    type ListOutputsParams,
    type ListOutputsReturnType,
    type ListReportsParams,
    type ListReportsReturnType,
    type WaitForInputParams,
    type WaitForInputReturnType,
} from "../types/actions.js";

export type PublicCartesiRpcSchema = [
    {
        Method: "cartesi_listApplications";
        Parameters: ListApplicationsParamsRpc;
        ReturnType: ListApplicationsReturnTypeRpc;
    },
    {
        Method: "cartesi_getApplication";
        Parameters: GetApplicationParamsRpc;
        ReturnType: GetApplicationReturnTypeRpc;
    },
    {
        Method: "cartesi_listEpochs";
        Parameters: ListEpochsParamsRpc;
        ReturnType: ListEpochsReturnTypeRpc;
    },
    {
        Method: "cartesi_getEpoch";
        Parameters: GetEpochParamsRpc;
        ReturnType: GetEpochReturnTypeRpc;
    },
    {
        Method: "cartesi_getLastAcceptedEpochIndex";
        Parameters: GetLastAcceptedEpochIndexParamsRpc;
        ReturnType: GetLastAcceptedEpochIndexReturnTypeRpc;
    },
    {
        Method: "cartesi_listInputs";
        Parameters: ListInputsParamsRpc;
        ReturnType: ListInputsReturnTypeRpc;
    },
    {
        Method: "cartesi_getInput";
        Parameters: GetInputParamsRpc;
        ReturnType: GetInputReturnTypeRpc;
    },
    {
        Method: "cartesi_getProcessedInputCount";
        Parameters: GetProcessedInputCountParamsRpc;
        ReturnType: GetProcessedInputCountReturnTypeRpc;
    },
    {
        Method: "cartesi_listOutputs";
        Parameters: ListOutputsParamsRpc;
        ReturnType: ListOutputsReturnTypeRpc;
    },
    {
        Method: "cartesi_getOutput";
        Parameters: GetOutputParamsRpc;
        ReturnType: GetOutputReturnTypeRpc;
    },
    {
        Method: "cartesi_listReports";
        Parameters: ListReportsParamsRpc;
        ReturnType: ListReportsReturnTypeRpc;
    },
    {
        Method: "cartesi_getReport";
        Parameters: GetReportParamsRpc;
        ReturnType: GetReportReturnTypeRpc;
    },
];

export type PublicActionsL2 = {
    listApplications: (
        params?: ListApplicationsParams,
    ) => Promise<ListApplicationsReturnType>;
    listEpochs: (params: ListEpochsParams) => Promise<ListEpochsReturnType>;
    listInputs: (params: ListInputsParams) => Promise<ListInputsReturnType>;
    listOutputs: (params: ListOutputsParams) => Promise<ListOutputsReturnType>;
    listReports: (params: ListReportsParams) => Promise<ListReportsReturnType>;

    getApplication: (
        params: GetApplicationParams,
    ) => Promise<GetApplicationReturnType>;
    getEpoch: (params: GetEpochParams) => Promise<GetEpochReturnType>;
    getInput: (params: GetInputParams) => Promise<GetInputReturnType>;
    getOutput: (params: GetOutputParams) => Promise<GetOutputReturnType>;
    getReport: (params: GetReportParams) => Promise<GetReportReturnType>;

    getProcessedInputCount: (
        params: GetProcessedInputCountParams,
    ) => Promise<GetProcessedInputCountReturnType>;
    getLastAcceptedEpochIndex: (
        params: GetLastAcceptedEpochIndexParams,
    ) => Promise<GetLastAcceptedEpochIndexReturnType>;
    waitForInput: (
        params: WaitForInputParams,
    ) => Promise<WaitForInputReturnType>;
};

export const publicActionsL2 =
    () =>
    <TTransport extends Transport>(
        client: Client<
            TTransport,
            undefined,
            undefined,
            PublicCartesiRpcSchema
        >,
    ): PublicActionsL2 => ({
        listApplications: (params) => listApplications(client, params ?? {}),
        getApplication: (params) => getApplication(client, params),
        listEpochs: (params) => listEpochs(client, params),
        getEpoch: (params) => getEpoch(client, params),
        listInputs: (params) => listInputs(client, params),
        getInput: (params) => getInput(client, params),
        listOutputs: (params) => listOutputs(client, params),
        getOutput: (params) => getOutput(client, params),
        listReports: (params) => listReports(client, params),
        getReport: (params) => getReport(client, params),
        getProcessedInputCount: (params) =>
            getProcessedInputCount(client, params),
        getLastAcceptedEpochIndex: (params) =>
            getLastAcceptedEpochIndex(client, params),
        waitForInput: (params) => waitForInput(client, params),
    });
