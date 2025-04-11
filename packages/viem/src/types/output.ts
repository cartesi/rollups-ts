import { Hash, Hex } from "viem";
import { type Output } from "./actions.js";

type OutputValidityProof = {
    outputIndex: bigint;
    outputHashesSiblings: Hash[];
};

type ExecuteOutputArgs = [Hex, OutputValidityProof];

export const toEVM = (output: Output): ExecuteOutputArgs => {
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
