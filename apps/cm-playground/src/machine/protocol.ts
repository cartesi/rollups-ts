// What the page and the machine worker say to each other.
import type { MachineConfig, MachineRuntimeConfig } from "@cartesi/machine";

export interface BootRequest {
    type: "boot";
    /** The machine to create, or null when `snapshot` names a stored one. */
    config: MachineConfig | null;
    runtime: MachineRuntimeConfig;
    /** Library ids the worker stages before creating the machine. */
    images: string[];
    /** The snapshot tarball to unpack and load, by library id. */
    snapshot: string | null;
    interactive: boolean;
    /** Run this many cycles before giving up; null runs until it stops itself. */
    maxMcycle: string | null;
}

export type ToWorker =
    | BootRequest
    | { type: "input"; bytes: Uint8Array }
    | { type: "resize"; runtime: MachineRuntimeConfig }
    /** Pack the machine as it stands into the snapshot library. */
    | { type: "store" }
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
    | { type: "error"; message: string }
    // Storing is its own little state machine: it happens beside a machine
    // that is still running, and failing at it is not the run failing.
    | { type: "storing"; text: string }
    | { type: "stored"; name: string; size: number }
    | { type: "storeFailed"; message: string };
