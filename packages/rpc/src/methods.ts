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
    cartesi_getEpochByVirtualIndex(
        params: GetEpochByVirtualIndexParams,
    ): GetEpochByVirtualIndexReturnType;
    cartesi_getLastAcceptedEpochIndex(
        params: GetLastAcceptedEpochIndexParams,
    ): GetLastAcceptedEpochIndexReturnType;
    cartesi_listTournaments(
        params: ListTournamentsParams,
    ): ListTournamentsReturnType;
    cartesi_getTournament(params: GetTournamentParams): GetTournamentReturnType;
    cartesi_listCommitments(
        params: ListCommitmentsParams,
    ): ListCommitmentsReturnType;
    cartesi_getCommitment(params: GetCommitmentParams): GetCommitmentReturnType;
    cartesi_listMatches(params: ListMatchesParams): ListMatchesReturnType;
    cartesi_getMatch(params: GetMatchParams): GetMatchReturnType;
    cartesi_listMatchAdvances(
        params: ListMatchAdvancesParams,
    ): ListMatchAdvancesReturnType;
    cartesi_getMatchAdvance(
        params: GetMatchAdvanceParams,
    ): GetMatchAdvanceReturnType;
    cartesi_listInputs(params: ListInputsParams): ListInputsReturnType;
    cartesi_getInput(params: GetInputParams): GetInputReturnType;
    cartesi_getProcessedInputCount(
        params: GetProcessedInputCountParams,
    ): GetProcessedInputCountReturnType;
    cartesi_getExecutedOutputCount(
        params: GetExecutedOutputCountParams,
    ): GetExecutedOutputCountReturnType;
    cartesi_getPendingExecutableOutputCount(
        params: GetPendingExecutableOutputCountParams,
    ): GetPendingExecutableOutputCountReturnType;
    cartesi_listOutputs(params: ListOutputsParams): ListOutputsReturnType;
    cartesi_getOutput(params: GetOutputParams): GetOutputReturnType;
    cartesi_listReports(params: ListReportsParams): ListReportsReturnType;
    cartesi_getReport(params: GetReportParams): GetReportReturnType;
    cartesi_getNodeInfo(): GetNodeInfoReturnType;
    /** @deprecated use `cartesi_getNodeInfo` instead. */
    cartesi_getChainId(): GetChainIdReturnType;
    /** @deprecated use `cartesi_getNodeInfo` instead. */
    cartesi_getNodeVersion(): GetNodeVersionReturnType;
    cartesi_listWithdrawals(
        params: ListWithdrawalsParams,
    ): ListWithdrawalsReturnType;
    cartesi_getWithdrawal(params: GetWithdrawalParams): GetWithdrawalReturnType;
};
