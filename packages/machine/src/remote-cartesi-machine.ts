// Public declarations for machines that live in a cartesi-jsonrpc-machine
// server. Binding-free, like cartesi-machine.ts: src/index.ts exports spawn()
// and connect() bound to the N-API addon.
import type { CartesiMachine } from "./cartesi-machine.js";
import type { MachineConfig, MachineRuntimeConfig } from "./types.js";

// -----------------------------------------------------------------------------
// Type definitions
// -----------------------------------------------------------------------------

export enum CleanupCall {
    Nothing = 0, // CM_JSONRPC_NOTHING
    Destroy = 1, // CM_JSONRPC_DESTROY
    Shutdown = 2, // CM_JSONRPC_SHUTDOWN
}

// -----------------------------------------------------------------------------
// High-level TypeScript wrapper classes
// -----------------------------------------------------------------------------

export interface RemoteCartesiMachine extends CartesiMachine {
    getServerAddress(): string;
    getServerPid(): number | null;
    shutdown(): void;
    rebind(address: string): string;
    emancipate(): void;
    setTimeout(ms: number): void;
    getTimeout(): number;
    setCleanupCall(call: CleanupCall): RemoteCartesiMachine;
    getCleanupCall(): CleanupCall;
    getServerVersion(): string;
    delayNextRequest(ms: number): void;
    getBoundAddress(): string | null;
    fork(): RemoteCartesiMachine;
    load(
        dir: string,
        runtimeConfig?: MachineRuntimeConfig,
    ): RemoteCartesiMachine;
    cloneEmpty(): RemoteCartesiMachine;
    create(
        config: MachineConfig,
        runtimeConfig?: MachineRuntimeConfig,
    ): RemoteCartesiMachine;
    store(dir: string): RemoteCartesiMachine;
}
