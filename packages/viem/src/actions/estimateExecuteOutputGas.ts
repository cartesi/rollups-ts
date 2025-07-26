import type {
    Account,
    Address,
    Chain,
    Client,
    DeriveChain,
    EstimateContractGasErrorType,
    EstimateContractGasParameters,
    FormattedTransactionRequest,
    GetChainParameter,
    Transport,
    UnionOmit,
} from "viem";
import { estimateContractGas } from "viem/actions";
import { iApplicationAbi } from "../rollups.js";
import type { GetOutputReturnType } from "../types/actions.js";
import { toEVM } from "../types/output.js";
import type {
    ErrorType,
    GetAccountParameter,
    UnionEvaluate,
} from "../types/utils.js";

export type EstimateExecuteOutputGasParameters<
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
        /** Gas limit for transaction execution */
        gas?: bigint | undefined;
        application: Address;
        output: GetOutputReturnType;
    };
export type EstimateExecuteOutputGasReturnType = bigint;
export type EstimateExecuteOutputGasErrorType =
    | EstimateContractGasErrorType
    | ErrorType;

export const estimateExecuteOutputGas = <
    transport extends Transport,
    chain extends Chain | undefined,
    account extends Account | undefined,
    chainOverride extends Chain | undefined = undefined,
>(
    client: Client<transport, chain, account>,
    parameters: EstimateExecuteOutputGasParameters<
        chain,
        account,
        chainOverride
    >,
) => {
    const {
        account,
        chain = client.chain,
        application,
        gas,
        maxFeePerGas,
        maxPriorityFeePerGas,
        nonce,
        output,
    } = parameters;

    const args = toEVM(output);

    const params = {
        account,
        abi: iApplicationAbi,
        address: application,
        functionName: "executeOutput",
        args,
        gas,
        maxFeePerGas,
        maxPriorityFeePerGas,
        nonce,
        // TODO: Not sure `chain` is necessary since it's not used downstream
        // in `estimateContractGas` or `estimateGas`
        // @ts-ignore
        chain,
    } satisfies EstimateContractGasParameters<
        typeof iApplicationAbi,
        "executeOutput"
    >;
    // biome-ignore lint/suspicious/noExplicitAny: viem pattern
    return estimateContractGas(client, params as any);
};
