import type {
    GetApplicationParams as GetApplicationParamsRpc,
    GetApplicationReturnType as GetApplicationReturnTypeRpc,
    GetChainIdReturnType as GetChainIdReturnTypeRpc,
    GetCommitmentParams as GetCommitmentParamsRpc,
    GetCommitmentReturnType as GetCommitmentReturnTypeRpc,
    GetEpochByVirtualIndexParams as GetEpochByVirtualIndexParamsRpc,
    GetEpochByVirtualIndexReturnType as GetEpochByVirtualIndexReturnTypeRpc,
    GetEpochParams as GetEpochParamsRpc,
    GetEpochReturnType as GetEpochReturnTypeRpc,
    GetExecutedOutputCountParams as GetExecutedOutputCountParamsRpc,
    GetExecutedOutputCountReturnType as GetExecutedOutputCountReturnTypeRpc,
    GetInputParams as GetInputParamsRpc,
    GetInputReturnType as GetInputReturnTypeRpc,
    GetLastAcceptedEpochIndexParams as GetLastAcceptedEpochIndexParamsRpc,
    GetLastAcceptedEpochIndexReturnType as GetLastAcceptedEpochIndexReturnTypeRpc,
    GetMatchAdvanceParams as GetMatchAdvanceParamsRpc,
    GetMatchAdvanceReturnType as GetMatchAdvanceReturnTypeRpc,
    GetMatchParams as GetMatchParamsRpc,
    GetMatchReturnType as GetMatchReturnTypeRpc,
    GetNodeInfoReturnType as GetNodeInfoReturnTypeRpc,
    GetNodeVersionReturnType as GetNodeVersionReturnTypeRpc,
    GetOutputParams as GetOutputParamsRpc,
    GetOutputReturnType as GetOutputReturnTypeRpc,
    GetPendingExecutableOutputCountParams as GetPendingExecutableOutputCountParamsRpc,
    GetPendingExecutableOutputCountReturnType as GetPendingExecutableOutputCountReturnTypeRpc,
    GetProcessedInputCountParams as GetProcessedInputCountParamsRpc,
    GetProcessedInputCountReturnType as GetProcessedInputCountReturnTypeRpc,
    GetReportParams as GetReportParamsRpc,
    GetReportReturnType as GetReportReturnTypeRpc,
    GetTournamentParams as GetTournamentParamsRpc,
    GetTournamentReturnType as GetTournamentReturnTypeRpc,
    GetWithdrawalParams as GetWithdrawalParamsRpc,
    GetWithdrawalReturnType as GetWithdrawalReturnTypeRpc,
    ListApplicationsParams as ListApplicationsParamsRpc,
    ListApplicationsReturnType as ListApplicationsReturnTypeRpc,
    ListCommitmentsParams as ListCommitmentsParamsRpc,
    ListCommitmentsReturnType as ListCommitmentsReturnTypeRpc,
    ListEpochsParams as ListEpochsParamsRpc,
    ListEpochsReturnType as ListEpochsReturnTypeRpc,
    ListInputsParams as ListInputsParamsRpc,
    ListInputsReturnType as ListInputsReturnTypeRpc,
    ListMatchAdvancesParams as ListMatchAdvancesParamsRpc,
    ListMatchAdvancesReturnType as ListMatchAdvancesReturnTypeRpc,
    ListMatchesParams as ListMatchesParamsRpc,
    ListMatchesReturnType as ListMatchesReturnTypeRpc,
    ListOutputsParams as ListOutputsParamsRpc,
    ListOutputsReturnType as ListOutputsReturnTypeRpc,
    ListReportsParams as ListReportsParamsRpc,
    ListReportsReturnType as ListReportsReturnTypeRpc,
    ListTournamentsParams as ListTournamentsParamsRpc,
    ListTournamentsReturnType as ListTournamentsReturnTypeRpc,
    ListWithdrawalsParams as ListWithdrawalsParamsRpc,
    ListWithdrawalsReturnType as ListWithdrawalsReturnTypeRpc,
} from "@cartesi/rpc";
import type { Client, Transport } from "viem";

import {
    getApplication,
    getChainId,
    getCommitment,
    getEpoch,
    getEpochByVirtualIndex,
    getExecutedOutputCount,
    getInput,
    getLastAcceptedEpochIndex,
    getMatch,
    getMatchAdvance,
    getNodeInfo,
    getNodeVersion,
    getOutput,
    getPendingExecutableOutputCount,
    getProcessedInputCount,
    getReport,
    getTournament,
    getWithdrawal,
    listApplications,
    listCommitments,
    listEpochs,
    listInputs,
    listMatchAdvances,
    listMatches,
    listOutputs,
    listReports,
    listTournaments,
    listWithdrawals,
    waitForInput,
} from "../actions/index.js";
import type {
    GetApplicationParams,
    GetApplicationReturnType,
    GetChainIdReturnType,
    GetCommitmentParams,
    GetCommitmentReturnType,
    GetEpochByVirtualIndexParams,
    GetEpochByVirtualIndexReturnType,
    GetEpochParams,
    GetEpochReturnType,
    GetExecutedOutputCountParams,
    GetExecutedOutputCountReturnType,
    GetInputParams,
    GetInputReturnType,
    GetLastAcceptedEpochIndexParams,
    GetLastAcceptedEpochIndexReturnType,
    GetMatchAdvanceParams,
    GetMatchAdvanceReturnType,
    GetMatchParams,
    GetMatchReturnType,
    GetNodeInfoReturnType,
    GetNodeVersionReturnType,
    GetOutputParams,
    GetOutputReturnType,
    GetPendingExecutableOutputCountParams,
    GetPendingExecutableOutputCountReturnType,
    GetProcessedInputCountParams,
    GetProcessedInputCountReturnType,
    GetReportParams,
    GetReportReturnType,
    GetTournamentParams,
    GetTournamentReturnType,
    GetWithdrawalParams,
    GetWithdrawalReturnType,
    ListApplicationsParams,
    ListApplicationsReturnType,
    ListCommitmentsParams,
    ListCommitmentsReturnType,
    ListEpochsParams,
    ListEpochsReturnType,
    ListInputsParams,
    ListInputsReturnType,
    ListMatchAdvancesParams,
    ListMatchAdvancesReturnType,
    ListMatchesParams,
    ListMatchesReturnType,
    ListOutputsParams,
    ListOutputsReturnType,
    ListReportsParams,
    ListReportsReturnType,
    ListTournamentsParams,
    ListTournamentsReturnType,
    ListWithdrawalsParams,
    ListWithdrawalsReturnType,
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
        Method: "cartesi_getEpochByVirtualIndex";
        Parameters: GetEpochByVirtualIndexParamsRpc;
        ReturnType: GetEpochByVirtualIndexReturnTypeRpc;
    },
    {
        Method: "cartesi_listTournaments";
        Parameters: ListTournamentsParamsRpc;
        ReturnType: ListTournamentsReturnTypeRpc;
    },
    {
        Method: "cartesi_getTournament";
        Parameters: GetTournamentParamsRpc;
        ReturnType: GetTournamentReturnTypeRpc;
    },
    {
        Method: "cartesi_listCommitments";
        Parameters: ListCommitmentsParamsRpc;
        ReturnType: ListCommitmentsReturnTypeRpc;
    },
    {
        Method: "cartesi_getCommitment";
        Parameters: GetCommitmentParamsRpc;
        ReturnType: GetCommitmentReturnTypeRpc;
    },
    {
        Method: "cartesi_listMatches";
        Parameters: ListMatchesParamsRpc;
        ReturnType: ListMatchesReturnTypeRpc;
    },
    {
        Method: "cartesi_getMatch";
        Parameters: GetMatchParamsRpc;
        ReturnType: GetMatchReturnTypeRpc;
    },
    {
        Method: "cartesi_listMatchAdvances";
        Parameters: ListMatchAdvancesParamsRpc;
        ReturnType: ListMatchAdvancesReturnTypeRpc;
    },
    {
        Method: "cartesi_getMatchAdvance";
        Parameters: GetMatchAdvanceParamsRpc;
        ReturnType: GetMatchAdvanceReturnTypeRpc;
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
        Method: "cartesi_getExecutedOutputCount";
        Parameters: GetExecutedOutputCountParamsRpc;
        ReturnType: GetExecutedOutputCountReturnTypeRpc;
    },
    {
        Method: "cartesi_getPendingExecutableOutputCount";
        Parameters: GetPendingExecutableOutputCountParamsRpc;
        ReturnType: GetPendingExecutableOutputCountReturnTypeRpc;
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
        Method: "cartesi_getNodeInfo";
        ReturnType: GetNodeInfoReturnTypeRpc;
    },
    {
        Method: "cartesi_getChainId";
        ReturnType: GetChainIdReturnTypeRpc;
    },
    {
        Method: "cartesi_getNodeVersion";
        ReturnType: GetNodeVersionReturnTypeRpc;
    },
    {
        Method: "cartesi_getWithdrawal";
        Parameters: GetWithdrawalParamsRpc;
        ReturnType: GetWithdrawalReturnTypeRpc;
    },
    {
        Method: "cartesi_listWithdrawals";
        Parameters: ListWithdrawalsParamsRpc;
        ReturnType: ListWithdrawalsReturnTypeRpc;
    },
];

export type PublicActionsL2 = {
    listApplications: (
        params?: ListApplicationsParams,
    ) => Promise<ListApplicationsReturnType>;
    listEpochs: (params: ListEpochsParams) => Promise<ListEpochsReturnType>;
    listTournaments: (
        params: ListTournamentsParams,
    ) => Promise<ListTournamentsReturnType>;
    listCommitments: (
        params: ListCommitmentsParams,
    ) => Promise<ListCommitmentsReturnType>;
    listMatches: (params: ListMatchesParams) => Promise<ListMatchesReturnType>;
    listMatchAdvances: (
        params: ListMatchAdvancesParams,
    ) => Promise<ListMatchAdvancesReturnType>;
    listInputs: (params: ListInputsParams) => Promise<ListInputsReturnType>;
    listOutputs: (params: ListOutputsParams) => Promise<ListOutputsReturnType>;
    listReports: (params: ListReportsParams) => Promise<ListReportsReturnType>;
    listWithdrawals: (
        params: ListWithdrawalsParams,
    ) => Promise<ListWithdrawalsReturnType>;
    getApplication: (
        params: GetApplicationParams,
    ) => Promise<GetApplicationReturnType>;
    /** @deprecated use `getNodeInfo` instead. */
    getChainId: () => Promise<GetChainIdReturnType>;
    getNodeInfo: () => Promise<GetNodeInfoReturnType>;
    getEpoch: (params: GetEpochParams) => Promise<GetEpochReturnType>;
    getEpochByVirtualIndex: (
        params: GetEpochByVirtualIndexParams,
    ) => Promise<GetEpochByVirtualIndexReturnType>;
    getTournament: (
        params: GetTournamentParams,
    ) => Promise<GetTournamentReturnType>;
    getCommitment: (
        params: GetCommitmentParams,
    ) => Promise<GetCommitmentReturnType>;
    getMatch: (params: GetMatchParams) => Promise<GetMatchReturnType>;
    getMatchAdvance: (
        params: GetMatchAdvanceParams,
    ) => Promise<GetMatchAdvanceReturnType>;
    /** @deprecated use `getNodeInfo` instead. */
    getNodeVersion: () => Promise<GetNodeVersionReturnType>;
    getInput: (params: GetInputParams) => Promise<GetInputReturnType>;
    getOutput: (params: GetOutputParams) => Promise<GetOutputReturnType>;
    getReport: (params: GetReportParams) => Promise<GetReportReturnType>;
    getWithdrawal: (
        params: GetWithdrawalParams,
    ) => Promise<GetWithdrawalReturnType>;

    getProcessedInputCount: (
        params: GetProcessedInputCountParams,
    ) => Promise<GetProcessedInputCountReturnType>;
    getExecutedOutputCount: (
        params: GetExecutedOutputCountParams,
    ) => Promise<GetExecutedOutputCountReturnType>;
    getPendingExecutableOutputCount: (
        params: GetPendingExecutableOutputCountParams,
    ) => Promise<GetPendingExecutableOutputCountReturnType>;
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
        getEpochByVirtualIndex: (params) =>
            getEpochByVirtualIndex(client, params),
        listTournaments: (params) => listTournaments(client, params),
        getTournament: (params) => getTournament(client, params),
        listCommitments: (params) => listCommitments(client, params),
        getCommitment: (params) => getCommitment(client, params),
        listMatches: (params) => listMatches(client, params),
        getMatch: (params) => getMatch(client, params),
        listMatchAdvances: (params) => listMatchAdvances(client, params),
        getMatchAdvance: (params) => getMatchAdvance(client, params),
        getNodeInfo: () => getNodeInfo(client),
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
        getExecutedOutputCount: (params) =>
            getExecutedOutputCount(client, params),
        getPendingExecutableOutputCount: (params) =>
            getPendingExecutableOutputCount(client, params),
        getLastAcceptedEpochIndex: (params) =>
            getLastAcceptedEpochIndex(client, params),
        waitForInput: (params) => waitForInput(client, params),
        getWithdrawal: (params) => getWithdrawal(client, params),
        listWithdrawals: (params) => listWithdrawals(client, params),
    });
