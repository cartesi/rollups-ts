import type {
    Account,
    Address,
    Chain,
    Client,
    DeriveChain,
    ReadContractParameters,
    Transport,
} from "viem";
import { readContract } from "viem/actions";
import { iApplicationAbi } from "../rollups.js";
import type { GetOutputReturnType } from "../types/actions.js";
import { toEVM } from "../types/output.js";

export type ValidateOutputParameters<
    chain extends Chain | undefined = Chain | undefined,
    chainOverride extends Chain | undefined = Chain | undefined,
    _derivedChain extends Chain | undefined = DeriveChain<chain, chainOverride>,
> = Omit<
    ReadContractParameters<typeof iApplicationAbi, "validateOutput">,
    "abi" | "address" | "args" | "functionName"
> & {
    application: Address;
    output: GetOutputReturnType;
};

export type ValidateOutputReturnType = boolean;

export const validateOutput = async <
    transport extends Transport,
    chain extends Chain | undefined,
    account extends Account | undefined,
>(
    client: Client<transport, chain, account>,
    parameters: ValidateOutputParameters,
): Promise<ValidateOutputReturnType> => {
    const { application, output } = parameters;
    const args = toEVM(output);
    try {
        await readContract(client, {
            ...parameters,
            abi: iApplicationAbi,
            address: application,
            args,
            functionName: "validateOutput",
        });
        return true;
    } catch (error) {
        return false;
    }
};
