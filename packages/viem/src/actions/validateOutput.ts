import {
    Account,
    Address,
    Chain,
    PublicClient,
    ReadContractParameters,
    Transport,
} from "viem";
import { readContract } from "viem/actions";
import { iApplicationAbi } from "../rollups";
import { type GetOutputReturnType } from "../types/actions";
import { toEVM } from "../types/output";

export type ValidateOutputParameters = Omit<
    ReadContractParameters<typeof iApplicationAbi, "validateOutput">,
    "address" | "args"
> & {
    application: Address;
    output: GetOutputReturnType;
};

export type ValidateOutputReturnType = boolean;

export const validateOutput = async <
    TChain extends Chain | undefined,
    TAccount extends Account | undefined,
>(
    client: PublicClient<Transport, TChain, TAccount>,
    parameters: ValidateOutputParameters,
): Promise<ValidateOutputReturnType> => {
    const { application, output } = parameters;
    const args = toEVM(output);
    try {
        await readContract(client, {
            ...parameters,
            address: application,
            args,
        });
        return true;
    } catch (error) {
        return false;
    }
};
