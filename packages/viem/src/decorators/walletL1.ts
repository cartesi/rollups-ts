import type { Account, Chain, Client } from "viem";
import {
    type AddInputParameters,
    type AddInputReturnType,
    type DepositBatchERC1155TokenParameters,
    type DepositBatchERC1155TokenReturnType,
    type DepositERC20TokensParameters,
    type DepositERC20TokensReturnType,
    type DepositERC721TokenParameters,
    type DepositERC721TokenReturnType,
    type DepositEtherParameters,
    type DepositEtherReturnType,
    type DepositSingleERC1155TokenParameters,
    type DepositSingleERC1155TokenReturnType,
    type ExecuteOutputParameters,
    type ExecuteOutputReturnType,
    addInput,
    depositBatchERC1155Token,
    depositERC20Tokens,
    depositERC721Token,
    depositEther,
    depositSingleERC1155Token,
    executeOutput,
} from "../actions/index.js";

export type WalletActionsL1<
    chain extends Chain | undefined = Chain | undefined,
    account extends Account | undefined = Account | undefined,
> = {
    addInput: <chainOverride extends Chain | undefined = undefined>(
        parameters: AddInputParameters<chain, account, chainOverride>,
    ) => Promise<AddInputReturnType>;

    depositEther: <chainOverride extends Chain | undefined = undefined>(
        parameters: DepositEtherParameters<chain, account, chainOverride>,
    ) => Promise<DepositEtherReturnType>;

    depositERC20Tokens: <chainOverride extends Chain | undefined = undefined>(
        parameters: DepositERC20TokensParameters<chain, account, chainOverride>,
    ) => Promise<DepositERC20TokensReturnType>;

    depositERC721Token: <chainOverride extends Chain | undefined = undefined>(
        parameters: DepositERC721TokenParameters<chain, account, chainOverride>,
    ) => Promise<DepositERC721TokenReturnType>;

    depositSingleERC1155Token: <
        chainOverride extends Chain | undefined = undefined,
    >(
        parameters: DepositSingleERC1155TokenParameters<
            chain,
            account,
            chainOverride
        >,
    ) => Promise<DepositSingleERC1155TokenReturnType>;

    depositBatchERC1155Token: <
        chainOverride extends Chain | undefined = undefined,
    >(
        parameters: DepositBatchERC1155TokenParameters<
            chain,
            account,
            chainOverride
        >,
    ) => Promise<DepositBatchERC1155TokenReturnType>;

    executeOutput: <chainOverride extends Chain | undefined = undefined>(
        parameters: ExecuteOutputParameters<chain, account, chainOverride>,
    ) => Promise<ExecuteOutputReturnType>;
};

export const walletActionsL1 =
    () =>
    (client: Client): WalletActionsL1 => ({
        addInput: (params) => addInput(client, params),
        depositEther: (params) => depositEther(client, params),
        depositERC20Tokens: (params) => depositERC20Tokens(client, params),
        depositERC721Token: (params) => depositERC721Token(client, params),
        depositSingleERC1155Token: (params) =>
            depositSingleERC1155Token(client, params),
        depositBatchERC1155Token: (params) =>
            depositBatchERC1155Token(client, params),
        executeOutput: (params) => executeOutput(client, params),
    });
