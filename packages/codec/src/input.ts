import type { ExtractAbiFunction } from "abitype";
import { decodeFunctionData, encodeFunctionData, type Hex } from "viem";
import { inputsAbi } from "./rollups.js";
import type { ParamsToObject } from "./types.js";

/**
 * Input of a Cartesi application, as delivered to the machine by the node.
 * Field names and types are inferred from the arguments of the `EvmAdvance`
 * function of the rollups contracts `Inputs` interface.
 */
export type Input = ParamsToObject<
    ExtractAbiFunction<typeof inputsAbi, "EvmAdvance">["inputs"]
>;

/**
 * Decode a blob of input data as an `EvmAdvance` call of the rollups
 * contracts `Inputs` interface.
 * @param data ABI-encoded input data
 * @returns decoded input
 * @throws viem `AbiFunctionSignatureNotFoundError` if the data does not start
 * with the `EvmAdvance` function selector
 */
export const decodeInput = (data: Hex): Input => {
    const {
        args: [
            chainId,
            appContract,
            msgSender,
            blockNumber,
            blockTimestamp,
            prevRandao,
            index,
            payload,
        ],
    } = decodeFunctionData({ abi: inputsAbi, data });
    return {
        chainId,
        appContract,
        msgSender,
        blockNumber,
        blockTimestamp,
        prevRandao,
        index,
        payload,
    };
};

/**
 * Encode an input as an `EvmAdvance` call of the rollups contracts `Inputs`
 * interface. This is the inverse of `decodeInput`, useful for testing.
 * @param input input to encode
 * @returns ABI-encoded input data
 */
export const encodeInput = (input: Input): Hex =>
    encodeFunctionData({
        abi: inputsAbi,
        functionName: "EvmAdvance",
        args: [
            input.chainId,
            input.appContract,
            input.msgSender,
            input.blockNumber,
            input.blockTimestamp,
            input.prevRandao,
            input.index,
            input.payload,
        ],
    });
