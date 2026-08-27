// The fetch client, against a real cartesi-jsonrpc-machine server.
//
// This is the path a browser takes to a machine it does not run itself, so
// what the suite checks is the wire: base64 blobs, named break reasons,
// positional parameters, u64 values that do not fit a double, and errors that
// come back as MachineError. A machine driven this way has to end up in the
// same state as one driven through the binding, so the root hashes are
// compared against the local one.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
    BreakReason,
    connectHttp,
    create,
    MachineError,
    Reg,
    spawn,
    type RemoteCartesiMachine,
    type RemoteMachineClient,
} from "../src";

const RAM_LENGTH = 0x4000000;

const hex = (bytes: Uint8Array): string =>
    Array.from(bytes)
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");

describe("JSON-RPC client", () => {
    // the binding knows how to start a server and which port it landed on, so
    // the suite borrows it and then talks to that same server over HTTP —
    // which is exactly the arrangement a browser is in
    let server: RemoteCartesiMachine;
    let machine: RemoteMachineClient;

    beforeAll(() => {
        server = spawn();
        machine = connectHttp(`http://${server.getBoundAddress()}`);
    });

    afterAll(() => {
        server.shutdown();
    });

    it("reports the server version", async () => {
        expect(await machine.getServerVersion()).toMatch(/^\d+\.\d+\.\d+$/);
    });

    it("runs a machine to the same state as the local binding", async () => {
        await machine.create({ ram: { length: RAM_LENGTH } });

        expect(await machine.run(100000n)).toBe(
            BreakReason.ReachedTargetMcycle,
        );
        expect(await machine.readReg(Reg.Mcycle)).toBe(100000n);

        const local = create({ ram: { length: RAM_LENGTH } });
        local.run(100000n);
        expect(hex(await machine.getRootHash())).toBe(hex(local.getRootHash()));
        local.destroy();
    });

    it("carries bytes as base64, both ways", async () => {
        const data = new Uint8Array([0, 1, 2, 253, 254, 255]);
        await machine.writeMemory(0x80000000n, data);
        expect(await machine.readMemory(0x80000000n, 6n)).toEqual(data);
    });

    it("keeps u64 values that do not fit a double", async () => {
        const value = 0xfedcba9876543210n;
        await machine.writeReg(Reg.X1, value);
        expect(await machine.readReg(Reg.X1)).toBe(value);
    });

    it("reads the address ranges and the configuration", async () => {
        expect((await machine.getInitialConfig()).ram?.length).toBe(RAM_LENGTH);
        expect((await machine.getAddressRanges()).length).toBeGreaterThan(0);
    });

    it("surfaces emulator errors as MachineError", async () => {
        await expect(machine.load("/nonexistent")).rejects.toBeInstanceOf(
            MachineError,
        );
    });

    it("forks the server into a client for the child", async () => {
        const before = await machine.getRootHash();

        const forked = await machine.fork();
        expect(forked.url).not.toBe(machine.url);
        // the fork starts as a copy, which is what makes it a snapshot
        expect(await forked.getRootHash()).toEqual(before);

        await forked.run(200000n);
        expect(await forked.getRootHash()).not.toEqual(
            await machine.getRootHash(),
        );

        await forked.shutdown();
    });
});
