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
    getUarchPristineHash,
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

    it("hashes the pristine uarch state as the binding does", async () => {
        expect(hex(await machine.getUarchPristineHash())).toBe(
            hex(getUarchPristineHash()),
        );
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

    it("collects root hashes the way the local binding does", async () => {
        // a fresh machine of its own, so the hashes do not depend on what
        // the other tests did to the shared one
        const other = spawn();
        try {
            const client = connectHttp(`http://${other.getBoundAddress()}`);
            await client.create({ ram: { length: RAM_LENGTH } });
            const local = create({ ram: { length: RAM_LENGTH } });

            const first = await client.collectMcycleRootHashes(512n, 8, 0n, 2);
            expect(first.partialBundle).toBeDefined();
            const rest = await client.collectMcycleRootHashes(
                1024n,
                8,
                first.mcyclePhase,
                2,
                first.partialBundle,
            );
            expect(rest.breakReason).toBe(BreakReason.ReachedTargetMcycle);
            expect(rest.hashes.map(hex)).toEqual(
                local.collectMcycleRootHashes(1024n, 8, 0n, 2).hashes.map(hex),
            );

            expect(
                (await client.collectMcycleBundle(1n, 8, 1)).map(hex),
            ).toEqual(local.collectMcycleBundle(1n, 8, 1).map(hex));

            // the revert tail of a machine waiting on an accepted input
            const yielded = create({ ram: { length: RAM_LENGTH } });
            yielded.writeReg(Reg.IflagsY, 1n);
            const tail = yielded.collectUarchCycleRootHashes(
                yielded.readReg(Reg.Mcycle),
                0,
            ).hashes;
            await client.writeRevertRootHash(tail.at(-1) as Uint8Array);
            local.writeRevertRootHash(tail.at(-1) as Uint8Array);

            expect(
                (await client.collectUarchCycleBundle(0n, 3, tail)).map(hex),
            ).toEqual(local.collectUarchCycleBundle(0n, 3, tail).map(hex));

            const mcycleEnd = (await client.readReg(Reg.Mcycle)) + 1n;
            const remote = await client.collectUarchCycleRootHashes(
                mcycleEnd,
                0,
                tail,
            );
            const expected = local.collectUarchCycleRootHashes(
                mcycleEnd,
                0,
                tail,
            );
            expect(remote.mcycleHashOffsets).toEqual(
                expected.mcycleHashOffsets,
            );
            expect(remote.hashes.map(hex)).toEqual(expected.hashes.map(hex));
            local.destroy();
            yielded.destroy();
        } finally {
            other.shutdown();
        }
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
