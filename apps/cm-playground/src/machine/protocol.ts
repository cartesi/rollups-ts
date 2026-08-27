// What the page and the machine worker say to each other.
import type { MachineConfig, MachineRuntimeConfig } from "@cartesi/machine";

export interface BootRequest {
    type: "boot";
    config: MachineConfig;
    runtime: MachineRuntimeConfig;
    /** Library ids the worker stages before creating the machine. */
    images: string[];
    interactive: boolean;
    /** Stop after this many cycles; null runs until the machine stops itself. */
    maxMcycle: string | null;
}

export type ToWorker =
    | BootRequest
    | { type: "input"; bytes: Uint8Array }
    | { type: "resize"; runtime: MachineRuntimeConfig }
    | { type: "stop" };

export interface RunStats {
    mcycle: string;
    seconds: number;
    mips: number;
}

export type FromWorker =
    | { type: "status"; text: string }
    | { type: "progress"; text: string; received: number; total: number | null }
    | { type: "booted"; emulator: string }
    | { type: "output"; bytes: Uint8Array }
    | { type: "stats"; stats: RunStats }
    | {
          type: "done";
          reason: string;
          stats: RunStats;
          rootHash: string;
          exitCode: number | null;
      }
    | { type: "error"; message: string };
