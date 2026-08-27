// The WebAssembly binding, exercised through the public browser entry point.
// It runs under Node here — the module targets web, worker and node — so the
// suite needs no browser and no installed emulator distribution.
import { beforeAll, describe, expect, it } from "vitest";
import {
    type CartesiMachine,
    type CartesiMachineWasm,
    BreakReason,
    Constant,
    ErrorCode,
    init,
    MachineError,
    Reg,
} from "../../src/browser";

// A 64 MiB machine with nothing loaded, run for 100k cycles: the state is
// fully determined by the emulator, so this hash is the same everywhere. It is
// what the native build produces for the same steps, which is the property
// worth pinning — a WebAssembly machine has to be the same machine.
const PRISTINE_ROOT_HASH =
    "b5db5de4951fb9f43b54a31c55a59e6da0445447124974033134d98317bca15e";

const RAM_LENGTH = 0x4000000;

const hex = (bytes: Uint8Array): string =>
    Array.from(bytes)
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");

describe("WebAssembly binding", () => {
    let cartesi: CartesiMachineWasm;

    beforeAll(async () => {
        cartesi = await init();
    });

    describe("module", () => {
        it("reports the emulator version it was built against", () => {
            // major * 1000000 + minor * 1000 + patch
            const version = cartesi.getVersion();
            expect(version / 1000000n).toBe(0n);
            expect((version / 1000n) % 1000n).toBe(21n);
        });

        it("exposes a filesystem for stored machines", () => {
            expect(typeof cartesi.fs.mkdirTree).toBe("function");
        });

        it("has no networking", () => {
            // The module is built with slirp=no, and TUN/TAP needs a host
            // interface: a browser gets neither, and both devices are refused
            // by the emulator rather than half-working.
            expect(cartesi.getSlirpVersion()).toBeNull();
            expect(() =>
                cartesi.create({
                    ram: { length: RAM_LENGTH },
                    processor: { registers: { iunrep: 1 } },
                    virtio: [{ type: "net-user" }],
                }),
            ).toThrow(MachineError);
        });
    });

    describe("machines", () => {
        let machine: CartesiMachine;

        beforeAll(() => {
            machine = cartesi.create({ ram: { length: RAM_LENGTH } });
        });

        it("runs and produces the same root hash as the native build", () => {
            expect(machine.run(100000n)).toBe(BreakReason.ReachedTargetMcycle);
            expect(machine.readReg(Reg.Mcycle)).toBe(100000n);
            expect(hex(machine.getRootHash())).toBe(PRISTINE_ROOT_HASH);
        });

        it("reads and writes registers", () => {
            machine.writeReg(Reg.X1, 0xdeadbeefn);
            expect(machine.readReg(Reg.X1)).toBe(0xdeadbeefn);
        });

        it("reads and writes memory", () => {
            const data = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
            const address = 0x80000000n;
            machine.writeMemory(address, data);
            expect(machine.readMemory(address, 8n)).toEqual(data);
        });

        it("reports its configuration", () => {
            expect(machine.getInitialConfig().ram?.length).toBe(RAM_LENGTH);
            expect(
                machine.getAddressRanges().some((range) => range.description),
            ).toBe(true);
        });

        it("proves nodes of the hash tree", () => {
            const proof = machine.getProof(
                0x80000000n,
                Constant.TreeLog2PageSize,
            );
            expect(proof.target_address).toBe(0x80000000);
            expect(proof.sibling_hashes.length).toBeGreaterThan(0);
        });

        it("names addresses", () => {
            expect(cartesi.getAddressName(0x80000000n)).toBe("memory");
        });
    });

    // The console the host drives: with the buffers configured, output the
    // guest writes lands in one and keystrokes go into the other, and cm_run
    // returns ConsoleOutput / ConsoleInput to hand control back. That is what
    // an interactive terminal is built from, and it needs nothing to suspend.
    describe("console buffers", () => {
        // Console *input* is only allowed on an unreproducible machine: what
        // the host types cannot be replayed, so the emulator refuses it on a
        // machine whose whole point is that it can be. Output has no such
        // restriction.
        const buffered = (console: object, unreproducible = false) =>
            cartesi.create(
                {
                    ram: { length: RAM_LENGTH },
                    ...(unreproducible
                        ? { processor: { registers: { iunrep: 1 } } }
                        : {}),
                },
                { console },
            );

        it("reads an empty buffer as no bytes", () => {
            const machine = buffered({ output_destination: "to_buffer" });
            expect(machine.readConsoleOutput()).toEqual(new Uint8Array(0));
            expect(machine.readConsoleOutput(64n)).toEqual(new Uint8Array(0));
            machine.destroy();
        });

        it("accepts input and reports what the buffer took", () => {
            const machine = buffered(
                { input_source: "from_buffer", input_buffer_size: 8 },
                true,
            );
            expect(
                machine.writeConsoleInput(new TextEncoder().encode("ls\n")),
            ).toBe(3);
            // the buffer is finite, so a caller keeps whatever did not fit
            expect(
                machine.writeConsoleInput(
                    new TextEncoder().encode("0123456789"),
                ),
            ).toBe(5);
            machine.destroy();
        });

        it("refuses console input on a reproducible machine", () => {
            expect(() => buffered({ input_source: "from_buffer" })).toThrow(
                MachineError,
            );
        });

        it("refuses the buffers when the console is pointed elsewhere", () => {
            const machine = cartesi.create({ ram: { length: RAM_LENGTH } });
            expect(() => machine.readConsoleOutput()).toThrow(MachineError);
            expect(() => machine.writeConsoleInput(new Uint8Array(1))).toThrow(
                MachineError,
            );
            machine.destroy();
        });
    });

    describe("snapshots", () => {
        it("stores and loads a machine through the module filesystem", () => {
            const machine = cartesi.create({ ram: { length: RAM_LENGTH } });
            machine.run(100000n);
            const before = machine.getRootHash();

            // cm_store creates the snapshot directory itself, but not the
            // path leading to it
            cartesi.fs.mkdirTree("/snapshots");

            // sharing "all" writes the memory ranges out as files; the default
            // copies the backing files of the machine's own configuration,
            // which a machine created from scratch does not have
            machine.store("/snapshots/pristine", 2);
            machine.destroy();

            const loaded = cartesi.load("/snapshots/pristine");
            expect(loaded.getRootHash()).toEqual(before);

            // and it is a machine, not just a hash: it keeps running
            expect(loaded.run(200000n)).toBe(BreakReason.ReachedTargetMcycle);
            loaded.destroy();
        });
    });

    describe("errors", () => {
        it("reports emulator errors, with the emulator's message", () => {
            // this is also the exceptions check: libcartesi throws internally
            // and catches at the C API boundary, which only works when the
            // module is built with -fwasm-exceptions
            let error: unknown;
            try {
                cartesi.load("/nonexistent");
            } catch (caught) {
                error = caught;
            }

            expect(error).toBeInstanceOf(MachineError);
            const machineError = error as MachineError;
            expect(machineError.code).toBe(ErrorCode.RuntimeError);
            expect(machineError.description).toContain("/nonexistent");
        });

        it("explains what the WebAssembly build cannot do", () => {
            const machine = cartesi.create({ ram: { length: RAM_LENGTH } });
            expect(() => machine.isJsonrpcMachine()).not.toThrow();
            expect(machine.isJsonrpcMachine()).toBe(false);
            machine.destroy();
        });
    });
});
