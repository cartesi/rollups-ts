// The page's half of the worker: one machine at a time, its status, and the
// numbers it reports while it runs.
import { useCallback, useEffect, useRef, useState } from "react";

import type { FromWorker, RunStats, ToWorker } from "./protocol";
import type { GeneratedConfig } from "./config";
import type { MachineRuntimeConfig } from "@cartesi/machine";

export type Phase = "idle" | "starting" | "running" | "done" | "error";

export interface Outcome {
    reason: string;
    rootHash: string;
    exitCode: number | null;
    stats: RunStats;
}

export interface MachineState {
    phase: Phase;
    status: string;
    emulator: string | null;
    stats: RunStats | null;
    outcome: Outcome | null;
    error: string | null;
}

const initial: MachineState = {
    phase: "idle",
    status: "",
    emulator: null,
    stats: null,
    outcome: null,
    error: null,
};

export const useMachine = (onOutput: (bytes: Uint8Array) => void) => {
    const [state, setState] = useState<MachineState>(initial);
    const worker = useRef<Worker | null>(null);
    const output = useRef(onOutput);
    output.current = onOutput;

    useEffect(() => {
        const spawned = new Worker(
            new URL("./runner.worker.ts", import.meta.url),
            { type: "module" },
        );

        spawned.onmessage = ({ data }: MessageEvent<FromWorker>) => {
            switch (data.type) {
                case "status":
                    setState((was) => ({ ...was, status: data.text }));
                    break;
                case "progress":
                    setState((was) => ({ ...was, status: data.text }));
                    break;
                case "booted":
                    setState((was) => ({
                        ...was,
                        phase: "running",
                        status: "running",
                        emulator: data.emulator,
                    }));
                    break;
                case "output":
                    output.current(data.bytes);
                    break;
                case "stats":
                    setState((was) => ({ ...was, stats: data.stats }));
                    break;
                case "done":
                    setState((was) => ({
                        ...was,
                        phase: "done",
                        status: data.reason,
                        stats: data.stats,
                        outcome: {
                            reason: data.reason,
                            rootHash: data.rootHash,
                            exitCode: data.exitCode,
                            stats: data.stats,
                        },
                    }));
                    break;
                case "error":
                    setState((was) => ({
                        ...was,
                        phase: "error",
                        status: "failed",
                        error: data.message,
                    }));
                    break;
            }
        };

        // A worker that fails to start, or throws outside a message handler,
        // is otherwise silent.
        spawned.onerror = (event: ErrorEvent) => {
            setState((was) => ({
                ...was,
                phase: "error",
                status: "failed",
                error: event.message || "the machine worker failed to start",
            }));
        };

        worker.current = spawned;
        return () => {
            spawned.terminate();
            worker.current = null;
        };
    }, []);

    const send = useCallback(
        (message: ToWorker, transfer: Transferable[] = []) => {
            worker.current?.postMessage(message, transfer);
        },
        [],
    );

    const boot = useCallback(
        (
            generated: GeneratedConfig,
            interactive: boolean,
            maxMcycle: string | null,
        ) => {
            setState({
                ...initial,
                phase: "starting",
                status: "starting",
            });
            send({
                type: "boot",
                config: generated.config,
                runtime: generated.runtime,
                images: generated.images,
                interactive,
                maxMcycle,
            });
        },
        [send],
    );

    const stop = useCallback(() => send({ type: "stop" }), [send]);

    const sendInput = useCallback(
        (bytes: Uint8Array) => send({ type: "input", bytes }),
        [send],
    );

    const resize = useCallback(
        (runtime: MachineRuntimeConfig) => send({ type: "resize", runtime }),
        [send],
    );

    return { state, boot, stop, sendInput, resize };
};
