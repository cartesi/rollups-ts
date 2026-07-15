import type {
    AbiParametersToPrimitiveTypes,
    ExtractAbiFunction,
} from "abitype";
import type { iApplicationAbi } from "../rollups.js";
import type { Output } from "./actions.js";

export type ExecuteOutputArgs = AbiParametersToPrimitiveTypes<
    ExtractAbiFunction<typeof iApplicationAbi, "executeOutput">["inputs"]
>;

/**
 * Converts an `Output` returned by the Cartesi node API (e.g. `getOutput`)
 * into the arguments of `IApplication.executeOutput` / `validateOutput`.
 * Throws if the output has no proof (`outputHashesSiblings`).
 */
export const toEVM = (output: Output): ExecuteOutputArgs => {
    const { index: outputIndex, outputHashesSiblings, rawData } = output;
    if (!outputHashesSiblings) {
        throw new Error("Output has no proof");
    }
    return [rawData, { outputIndex, outputHashesSiblings }];
};
