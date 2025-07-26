import type {
    Account,
    Address,
    Chain,
    Client,
    DeriveChain,
    FormattedTransactionRequest,
    GetChainParameter,
    Hash,
    Transport,
    UnionOmit,
    WriteContractErrorType,
    WriteContractParameters,
    WriteContractReturnType,
} from "viem";
import { writeContract } from "viem/actions";
import { iApplicationAbi } from "../rollups.js";
import type { GetOutputReturnType } from "../types/actions.js";
import { toEVM } from "../types/output.js";
import type {
    ErrorType,
    GetAccountParameter,
    UnionEvaluate,
} from "../types/utils.js";
import {
    type EstimateExecuteOutputGasErrorType,
    type EstimateExecuteOutputGasParameters,
    estimateExecuteOutputGas,
} from "./estimateExecuteOutputGas.js";

export type ExecuteOutputParameters<
    chain extends Chain | undefined = Chain | undefined,
    account extends Account | undefined = Account | undefined,
    chainOverride extends Chain | undefined = Chain | undefined,
    _derivedChain extends Chain | undefined = DeriveChain<chain, chainOverride>,
> = UnionEvaluate<
    UnionOmit<
        FormattedTransactionRequest<_derivedChain>,
        | "accessList"
        | "data"
        | "from"
        | "gas"
        | "gasPrice"
        | "to"
        | "type"
        | "value"
    >
> &
    GetAccountParameter<account, Account | Address> &
    GetChainParameter<chain, chainOverride> & {
        /**
         * Gas limit for transaction execution on the L1.
         * `null` to skip gas estimation & defer calculation to signer.
         */
        gas?: bigint | null | undefined;
        application: Address;
        output: GetOutputReturnType;
    };
export type ExecuteOutputReturnType = Hash;
export type ExecuteOutputErrorType =
    | EstimateExecuteOutputGasErrorType
    | WriteContractErrorType
    | ErrorType;

export const executeOutput = async <
    TChain extends Chain | undefined,
    TAccount extends Account | undefined,
    TChainOverride extends Chain | undefined = undefined,
>(
    client: Client<Transport, TChain, TAccount>,
    params: ExecuteOutputParameters<TChain, TAccount, TChainOverride>,
): Promise<WriteContractReturnType> => {
    const {
        account,
        application,
        chain = client.chain,
        gas,
        maxFeePerGas,
        maxPriorityFeePerGas,
        nonce,
        output,
    } = params;

    const gas_ =
        typeof gas !== "number" && gas !== null
            ? await estimateExecuteOutputGas(
                  client,
                  params as EstimateExecuteOutputGasParameters,
              )
            : undefined;

    const args = toEVM(output);
    return writeContract(client, {
        // biome-ignore lint/style/noNonNullAssertion: viem pattern
        account: account!,
        abi: iApplicationAbi,
        address: application,
        chain,
        functionName: "executeOutput",
        args,
        gas: gas_,
        maxFeePerGas,
        maxPriorityFeePerGas,
        nonce,
        // biome-ignore lint/suspicious/noExplicitAny: viem pattern
    } satisfies WriteContractParameters as any);
};
