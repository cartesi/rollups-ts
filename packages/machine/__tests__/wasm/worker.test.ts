// The worker facade, wired end to end.
//
// The two halves talk over a message port, so the suite runs them over a
// MessageChannel in one process: same protocol, same structured clone (the
// bigints and byte arrays this API is made of), no browser needed. A real
// Worker only differs in which thread the server half runs on.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
    connectWorker,
    Reg,
    serve,
    type CartesiMachineClient,
    type MessageEndpoint,
    type RemoteMachine,
} from "../../src/browser";

const RAM_LENGTH = 0x4000000;

const PRISTINE_ROOT_HASH =
    "b5db5de4951fb9f43b54a31c55a59e6da0445447124974033134d98317bca15e";

const hex = (bytes: Uint8Array): string =>
    Array.from(bytes)
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");

describe("worker facade", () => {
    let channel: MessageChannel;
    let cartesi: CartesiMachineClient;

    beforeAll(() => {
        channel = new MessageChannel();
        serve(channel.port1 as unknown as MessageEndpoint);
        cartesi = connectWorker(channel.port2 as unknown as MessageEndpoint);
    });

    afterAll(() => {
        channel.port1.close();
        channel.port2.close();
    });

    it("runs a machine on the other side of the port", async () => {
        const machine: RemoteMachine = await cartesi.create({
            ram: { length: RAM_LENGTH },
        });

        await machine.run(100000n);

        expect(await machine.readReg(Reg.Mcycle)).toBe(100000n);
        expect(hex(await machine.getRootHash())).toBe(PRISTINE_ROOT_HASH);

        await machine.release();
    });

    it("passes bytes both ways", async () => {
        const machine = await cartesi.create({ ram: { length: RAM_LENGTH } });
        const data = new Uint8Array([9, 8, 7, 6]);

        await machine.writeMemory(0x80000000n, data);
        expect(await machine.readMemory(0x80000000n, 4n)).toEqual(data);

        await machine.release();
    });

    it("reports emulator errors as MachineError, with the code", async () => {
        await expect(cartesi.load("/nonexistent")).rejects.toMatchObject({
            name: "MachineError",
            code: expect.any(Number),
        });
    });

    it("hands a machine to rollups without cloning it", async () => {
        const machine = await cartesi.create({ ram: { length: RAM_LENGTH } });

        // the machine never leaves the server side: what crosses is a handle,
        // which is what makes this call possible at all
        const app = await cartesi.rollups(machine, { noRollback: true });
        expect(typeof app.advance).toBe("function");

        await machine.release();
    });

    it("moves snapshots across as bytes", async () => {
        const machine = await cartesi.create({ ram: { length: RAM_LENGTH } });
        await machine.run(100000n);
        await cartesi.load("/nonexistent").catch(() => undefined);

        await machine.store("/worker-snapshot", 2 /* sharing: all */);
        const archive = await cartesi.readSnapshot("/worker-snapshot");
        expect(archive.length).toBeGreaterThan(0);

        await cartesi.writeSnapshot("/worker-restored", archive);
        const restored = await cartesi.load("/worker-restored");
        expect(hex(await restored.getRootHash())).toBe(PRISTINE_ROOT_HASH);

        await restored.release();
        await machine.release();
    });

    it("releases machines on request", async () => {
        const machine = await cartesi.create({ ram: { length: RAM_LENGTH } });
        await machine.release();
        await expect(machine.getRootHash()).rejects.toThrow(/released/);
    });
});
