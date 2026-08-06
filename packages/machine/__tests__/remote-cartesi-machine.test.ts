import { afterEach, describe, expect, test } from "vitest";
import { CleanupCall, type RemoteCartesiMachine, connect, spawn } from "../src";

// These tests need a working cartesi-jsonrpc-machine executable: either on the
// PATH from an emulator installation, or the one bundled in the platform
// package. Every spawned server is a child process, so each one is shut down
// afterwards — leaking them keeps the test runner from exiting.

const spawned: RemoteCartesiMachine[] = [];

/** Spawn a JSON-RPC server that is shut down at the end of the test. */
const spawnServer = (): RemoteCartesiMachine => {
    const machine = spawn();
    spawned.push(machine);
    return machine;
};

afterEach(() => {
    while (spawned.length > 0) {
        const machine = spawned.pop();
        try {
            machine?.shutdown();
        } catch {
            // already gone (e.g. shut down through a fork): nothing to do
        }
    }
});

describe("Cartesi JSON-RPC Machine API", () => {
    test("spawnServer: success", () => {
        const result = spawnServer();
        expect(result.getBoundAddress()).toBeDefined();
        expect(result.getServerPid()).toBeDefined();
    });

    test("spawnServer: error", () => {
        expect(() => {
            spawn("invalid-address", 1000);
        }).toThrow();
    });

    test("connectServer: error", () => {
        expect(() => {
            connect("invalid-address", 1000);
        }).toThrow();
    });

    test("connectServer: success", () => {
        const result = spawnServer();
        const address = result.getBoundAddress();
        expect(() => connect(address as string, 2000)).not.toThrow();
    });

    test("forkServer: success", () => {
        const machine = spawnServer();
        const forkResult = machine.fork();
        spawned.push(forkResult);
        expect(forkResult.getBoundAddress()).toBeDefined();
        expect(forkResult.getServerPid()).toBeDefined();
    });

    test("getServerVersion: success", () => {
        const machine = spawnServer();
        const version = machine.getServerVersion();
        expect(typeof version).toBe("string");
        expect(version.length).toBeGreaterThan(0);
    });

    test("set/getTimeout: success", () => {
        const machine = spawnServer();
        machine.setTimeout(1234);
        const timeout = machine.getTimeout();
        expect(timeout).toBe(1234);
    });

    test("set/getCleanupCall: success", () => {
        const machine = spawnServer();
        machine.setCleanupCall(CleanupCall.Destroy);
        const call = machine.getCleanupCall();
        expect(call).toBe(CleanupCall.Destroy);
    });

    test("getServerAddress: success", () => {
        const machine = spawnServer();
        const address = machine.getServerAddress();
        expect(typeof address).toBe("string");
        expect(address.length).toBeGreaterThan(0);
    });

    test("delayNextRequest: success", () => {
        const machine = spawnServer();
        expect(() => machine.delayNextRequest(100)).not.toThrow();
    });
});
