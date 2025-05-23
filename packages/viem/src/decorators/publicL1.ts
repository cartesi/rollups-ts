import type { Account, Chain, Client, Transport } from "viem";
import {
    type EstimateAddInputGasParameters,
    type EstimateAddInputGasReturnType,
    type EstimateDepositBatchERC1155TokenGasParameters,
    type EstimateDepositBatchERC1155TokenGasReturnType,
    type EstimateDepositERC20TokensGasParameters,
    type EstimateDepositERC20TokensGasReturnType,
    type EstimateDepositERC721TokenGasParameters,
    type EstimateDepositERC721TokenGasReturnType,
    type EstimateDepositEtherGasParameters,
    type EstimateDepositEtherGasReturnType,
    type EstimateDepositSingleERC1155TokenGasParameters,
    type EstimateDepositSingleERC1155TokenGasReturnType,
    type EstimateExecuteOutputGasParameters,
    type EstimateExecuteOutputGasReturnType,
    type ValidateOutputParameters,
    type ValidateOutputReturnType,
    estimateAddInputGas,
    estimateDepositBatchERC1155TokenGas,
    estimateDepositERC20TokensGas,
    estimateDepositERC721TokenGas,
    estimateDepositEtherGas,
    estimateDepositSingleERC1155TokenGas,
    estimateExecuteOutputGas,
    validateOutput,
} from "../actions/index.js";

export type PublicActionsL1<
    TChain extends Chain | undefined = Chain | undefined,
    TAccount extends Account | undefined = Account | undefined,
> = {
    estimateAddInputGas: <chainOverride extends Chain | undefined = undefined>(
        parameters: EstimateAddInputGasParameters<
            TChain,
            TAccount,
            chainOverride
        >,
    ) => Promise<EstimateAddInputGasReturnType>;

    estimateDepositEtherGas: <
        chainOverride extends Chain | undefined = undefined,
    >(
        parameters: EstimateDepositEtherGasParameters<
            TChain,
            TAccount,
            chainOverride
        >,
    ) => Promise<EstimateDepositEtherGasReturnType>;

    estimateDepositERC20TokensGas: <
        chainOverride extends Chain | undefined = undefined,
    >(
        parameters: EstimateDepositERC20TokensGasParameters<
            TChain,
            TAccount,
            chainOverride
        >,
    ) => Promise<EstimateDepositERC20TokensGasReturnType>;

    estimateDepositERC721TokenGas: <
        chainOverride extends Chain | undefined = undefined,
    >(
        parameters: EstimateDepositERC721TokenGasParameters<
            TChain,
            TAccount,
            chainOverride
        >,
    ) => Promise<EstimateDepositERC721TokenGasReturnType>;

    estimateDepositSingleERC1155TokenGas: <
        chainOverride extends Chain | undefined = undefined,
    >(
        parameters: EstimateDepositSingleERC1155TokenGasParameters<
            TChain,
            TAccount,
            chainOverride
        >,
    ) => Promise<EstimateDepositSingleERC1155TokenGasReturnType>;

    estimateDepositBatchERC1155TokenGas: <
        chainOverride extends Chain | undefined = undefined,
    >(
        parameters: EstimateDepositBatchERC1155TokenGasParameters<
            TChain,
            TAccount,
            chainOverride
        >,
    ) => Promise<EstimateDepositBatchERC1155TokenGasReturnType>;

    estimateExecuteOutputGas: <
        chainOverride extends Chain | undefined = undefined,
    >(
        parameters: EstimateExecuteOutputGasParameters<
            TChain,
            TAccount,
            chainOverride
        >,
    ) => Promise<EstimateExecuteOutputGasReturnType>;

    validateOutput: <chainOverride extends Chain | undefined = undefined>(
        parameters: ValidateOutputParameters<TChain, chainOverride>,
    ) => Promise<ValidateOutputReturnType>;
};

export const publicActionsL1 =
    () =>
    <
        TTransport extends Transport = Transport,
        TChain extends Chain | undefined = Chain | undefined,
        TAccount extends Account | undefined = Account | undefined,
    >(
        client: Client<TTransport, TChain, TAccount>,
    ): PublicActionsL1 => ({
        estimateAddInputGas: (params) => estimateAddInputGas(client, params),
        estimateDepositEtherGas: (params) =>
            estimateDepositEtherGas(client, params),
        estimateDepositERC20TokensGas: (params) =>
            estimateDepositERC20TokensGas(client, params),
        estimateDepositERC721TokenGas: (params) =>
            estimateDepositERC721TokenGas(client, params),
        estimateDepositSingleERC1155TokenGas: (params) =>
            estimateDepositSingleERC1155TokenGas(client, params),
        estimateDepositBatchERC1155TokenGas: (params) =>
            estimateDepositBatchERC1155TokenGas(client, params),
        estimateExecuteOutputGas: (params) =>
            estimateExecuteOutputGas(client, params),
        validateOutput: (params) => validateOutput(client, params),
    });
