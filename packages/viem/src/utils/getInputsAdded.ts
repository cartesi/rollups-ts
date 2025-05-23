import {
    type ContractEventArgsFromTopics,
    type TransactionReceipt,
    parseEventLogs,
} from "viem";
import { inputBoxAbi } from "../rollups.js";

export type InputAdded = ContractEventArgsFromTopics<
    typeof inputBoxAbi,
    "InputAdded",
    true
>;

export const getInputsAdded = (receipt: TransactionReceipt): InputAdded[] => {
    const logs = parseEventLogs({
        abi: inputBoxAbi,
        logs: receipt.logs,
        eventName: "InputAdded",
    });
    return logs.map((log) => log.args);
};
