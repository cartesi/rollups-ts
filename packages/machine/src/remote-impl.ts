// Remote machines: a machine whose state lives in a cartesi-jsonrpc-machine
// server, driven through the same NativeAddon as a local one. Only bindings
// that can spawn a process and open sockets can provide these — the Emscripten
// module throws from the jsonrpc* entries, which is what a browser gets.
import type { SharingMode } from "./cartesi-machine.js";
import { MachineError } from "./cartesi-machine.js";
import { CartesiMachineImpl } from "./machine-impl.js";
import type { NativeAddon, NativeMachine } from "./native.js";
import type { CleanupCall } from "./remote-cartesi-machine.js";
import type { MachineConfig, MachineRuntimeConfig } from "./types.js";

/**
 * Converts errors thrown by the binding into MachineError.
 */
const call = <T>(fn: () => T): T => {
    try {
        return fn();
    } catch (error) {
        const e = error as { code?: unknown; description?: unknown };
        if (typeof e.code === "number" && typeof e.description === "string") {
            throw new MachineError(e.code, e.description);
        }
        throw error;
    }
};

export class RemoteCartesiMachineImpl extends CartesiMachineImpl {
    private serverAddress: string | null = null;
    private serverPid: number | null = null;

    constructor(
        addon: NativeAddon,
        machine: NativeMachine,
        serverAddress: string | null = null,
        serverPid: number | null = null,
    ) {
        super(addon, machine);
        this.serverAddress = serverAddress;
        this.serverPid = serverPid;
    }

    fork(): RemoteCartesiMachineImpl {
        const { machine, address, pid } = call(() =>
            this.machine.jsonrpcFork(),
        );
        return new RemoteCartesiMachineImpl(this.addon, machine, address, pid);
    }

    shutdown(): void {
        call(() => this.machine.jsonrpcShutdownServer());
    }

    rebind(address: string): string {
        const addressBound = call(() =>
            this.machine.jsonrpcRebindServer(address),
        );
        this.serverAddress = addressBound;
        return addressBound;
    }

    getServerVersion(): string {
        return call(() => this.machine.jsonrpcGetServerVersion());
    }

    emancipate(): void {
        call(() => this.machine.jsonrpcEmancipateServer());
    }

    setTimeout(ms: number): void {
        call(() => this.machine.jsonrpcSetTimeout(ms));
    }

    getTimeout(): number {
        return call(() => this.machine.jsonrpcGetTimeout());
    }

    setCleanupCall(call_: CleanupCall): RemoteCartesiMachineImpl {
        call(() => this.machine.jsonrpcSetCleanupCall(call_));
        return this;
    }

    getCleanupCall(): CleanupCall {
        return call(() => this.machine.jsonrpcGetCleanupCall());
    }

    getServerAddress(): string {
        return call(() => this.machine.jsonrpcGetServerAddress());
    }

    delayNextRequest(ms: number): void {
        call(() => this.machine.jsonrpcDelayNextRequest(ms));
    }

    getBoundAddress(): string | null {
        return this.serverAddress;
    }

    getServerPid(): number | null {
        return this.serverPid;
    }

    load(
        dir: string,
        runtimeConfig?: MachineRuntimeConfig,
        sharing?: SharingMode,
    ): RemoteCartesiMachineImpl {
        super.load(dir, runtimeConfig, sharing);
        return this;
    }

    cloneEmpty(): RemoteCartesiMachineImpl {
        super.cloneEmpty();
        return this;
    }

    create(
        config: MachineConfig,
        runtimeConfig?: MachineRuntimeConfig,
        dir?: string,
    ): RemoteCartesiMachineImpl {
        super.create(config, runtimeConfig, dir);
        return this;
    }

    store(dir: string, sharing?: SharingMode): RemoteCartesiMachineImpl {
        super.store(dir, sharing);
        return this;
    }
}

/**
 * Spawning and connecting, bound to one addon.
 */
export const createRemoteApi = (addon: NativeAddon) => ({
    /**
     * Spawns a cartesi-jsonrpc-machine server and connects to it
     */
    spawn(
        address: string = "127.0.0.1:0",
        spawnTimeoutMs: number = -1,
    ): RemoteCartesiMachineImpl {
        const { machine, boundAddress, pid } = call(() =>
            addon.jsonrpcSpawnServer(address, spawnTimeoutMs),
        );
        return new RemoteCartesiMachineImpl(addon, machine, boundAddress, pid);
    },

    /**
     * Connects to an already running cartesi-jsonrpc-machine server
     */
    connect(
        address: string,
        connectTimeoutMs: number = -1,
    ): RemoteCartesiMachineImpl {
        const machine = call(() =>
            addon.jsonrpcConnectServer(address, connectTimeoutMs),
        );
        return new RemoteCartesiMachineImpl(addon, machine, address);
    },
});

export type RemoteApi = ReturnType<typeof createRemoteApi>;
