import {
    type ContractEventArgsFromTopics,
    type TransactionReceipt,
    parseEventLogs,
} from "viem";
import { iApplicationAbi } from "../rollups.js";

export type OutputExecuted = ContractEventArgsFromTopics<
    typeof iApplicationAbi,
    "OutputExecuted",
    true
>;

export const getOutputsExecuted = (
    receipt: TransactionReceipt,
): OutputExecuted[] => {
    const logs = parseEventLogs({
        abi: iApplicationAbi,
        logs: receipt.logs,
        eventName: "OutputExecuted",
    });
    return logs.map((log) => log.args);
};
