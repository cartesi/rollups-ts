import type {
    GetApplicationParams as GetApplicationParamsRpc,
    GetApplicationReturnType as GetApplicationReturnTypeRpc,
    GetChainIdReturnType as GetChainIdReturnTypeRpc,
    GetEpochParams as GetEpochParamsRpc,
    GetEpochReturnType as GetEpochReturnTypeRpc,
    GetInputParams as GetInputParamsRpc,
    GetInputReturnType as GetInputReturnTypeRpc,
    GetLastAcceptedEpochIndexParams as GetLastAcceptedEpochIndexParamsRpc,
    GetLastAcceptedEpochIndexReturnType as GetLastAcceptedEpochIndexReturnTypeRpc,
    GetNodeVersionReturnType as GetNodeVersionReturnTypeRpc,
    GetOutputParams as GetOutputParamsRpc,
    GetOutputReturnType as GetOutputReturnTypeRpc,
    GetProcessedInputCountParams as GetProcessedInputCountParamsRpc,
    GetProcessedInputCountReturnType as GetProcessedInputCountReturnTypeRpc,
    GetReportParams as GetReportParamsRpc,
    GetReportReturnType as GetReportReturnTypeRpc,
    ListApplicationsParams as ListApplicationsParamsRpc,
    ListApplicationsReturnType as ListApplicationsReturnTypeRpc,
    ListEpochsParams as ListEpochsParamsRpc,
    ListEpochsReturnType as ListEpochsReturnTypeRpc,
    ListInputsParams as ListInputsParamsRpc,
    ListInputsReturnType as ListInputsReturnTypeRpc,
    ListOutputsParams as ListOutputsParamsRpc,
    ListOutputsReturnType as ListOutputsReturnTypeRpc,
    ListReportsParams as ListReportsParamsRpc,
    ListReportsReturnType as ListReportsReturnTypeRpc,
} from "@cartesi/rpc";
import type { Client, Transport } from "viem";

import {
    getApplication,
    getChainId,
    getEpoch,
    getInput,
    getLastAcceptedEpochIndex,
    getNodeVersion,
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
import type {
    GetApplicationParams,
    GetApplicationReturnType,
    GetChainIdReturnType,
    GetEpochParams,
    GetEpochReturnType,
    GetInputParams,
    GetInputReturnType,
    GetLastAcceptedEpochIndexParams,
    GetLastAcceptedEpochIndexReturnType,
    GetNodeVersionReturnType,
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
    WaitForInputParams,
    WaitForInputReturnType,
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
    {
        Method: "cartesi_getChainId";
        ReturnType: GetChainIdReturnTypeRpc;
    },
    {
        Method: "cartesi_getNodeVersion";
        ReturnType: GetNodeVersionReturnTypeRpc;
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
    getChainId: () => Promise<GetChainIdReturnType>;
    getEpoch: (params: GetEpochParams) => Promise<GetEpochReturnType>;
    getNodeVersion: () => Promise<GetNodeVersionReturnType>;
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
        getChainId: () => getChainId(client),
        getNodeVersion: () => getNodeVersion(client),
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
