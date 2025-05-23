import type {
    AbiParametersToPrimitiveTypes,
    ExtractAbiFunction,
} from "abitype";
import type { iApplicationAbi } from "../rollups.js";
import type { Output } from "./actions.js";

type ExecuteOutputArgs = AbiParametersToPrimitiveTypes<
    ExtractAbiFunction<typeof iApplicationAbi, "executeOutput">["inputs"]
>;

export const toEVM = (output: Output): ExecuteOutputArgs => {
    const { index: outputIndex, outputHashesSiblings, rawData } = output;
    if (!outputHashesSiblings) {
        throw new Error("Output has no proof");
    }
    return [rawData, { outputIndex, outputHashesSiblings }];
};
