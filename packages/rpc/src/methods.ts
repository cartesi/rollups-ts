import type {
    GetApplicationParams,
    GetApplicationReturnType,
    GetChainIdReturnType,
    GetCommitmentParams,
    GetCommitmentReturnType,
    GetEpochParams,
    GetEpochReturnType,
    GetInputParams,
    GetInputReturnType,
    GetLastAcceptedEpochIndexParams,
    GetLastAcceptedEpochIndexReturnType,
    GetMatchAdvancedParams,
    GetMatchAdvancedReturnType,
    GetMatchParams,
    GetMatchReturnType,
    GetNodeVersionReturnType,
    GetOutputParams,
    GetOutputReturnType,
    GetProcessedInputCountParams,
    GetProcessedInputCountReturnType,
    GetReportParams,
    GetReportReturnType,
    GetTournamentParams,
    GetTournamentReturnType,
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
    cartesi_getMatchAdvanced(
        params: GetMatchAdvancedParams,
    ): GetMatchAdvancedReturnType;
    cartesi_listInputs(params: ListInputsParams): ListInputsReturnType;
    cartesi_getInput(params: GetInputParams): GetInputReturnType;
    cartesi_getProcessedInputCount(
        params: GetProcessedInputCountParams,
    ): GetProcessedInputCountReturnType;
    cartesi_listOutputs(params: ListOutputsParams): ListOutputsReturnType;
    cartesi_getOutput(params: GetOutputParams): GetOutputReturnType;
    cartesi_listReports(params: ListReportsParams): ListReportsReturnType;
    cartesi_getReport(params: GetReportParams): GetReportReturnType;
    cartesi_getChainId(): GetChainIdReturnType;
    cartesi_getNodeVersion(): GetNodeVersionReturnType;
};
