import { Hash, Hex } from "viem";
import { type GetOutputReturnType } from "./actions.js";

type OutputValidityProof = {
    outputIndex: bigint;
    outputHashesSiblings: Hash[];
};

type ExecuteOutputArgs = [Hex, OutputValidityProof];

export const toEVM = (output: GetOutputReturnType): ExecuteOutputArgs => {
    const { index: outputIndex, outputHashesSiblings, rawData } = output;
    if (!outputHashesSiblings) {
        throw new Error("Output has no proof");
    }

    const proof: OutputValidityProof = {
        outputIndex,
        outputHashesSiblings,
    };
    return [rawData, proof];
};
