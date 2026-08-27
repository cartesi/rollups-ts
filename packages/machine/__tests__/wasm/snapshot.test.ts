// Moving stored machines in and out of the module's filesystem as bytes,
// which is how a browser gets a machine image at all: there is no path to
// hand the emulator, only a fetch.
import { beforeAll, describe, expect, it } from "vitest";
import { type CartesiMachineWasm, init } from "../../src/browser";

const RAM_LENGTH = 0x4000000;

describe("snapshots", () => {
    let cartesi: CartesiMachineWasm;

    beforeAll(async () => {
        cartesi = await init();
    });

    const storeMachine = (dir: string) => {
        const machine = cartesi.create({ ram: { length: RAM_LENGTH } });
        machine.run(100000n);
        const rootHash = machine.getRootHash();
        cartesi.fs.mkdirTree("/machines");
        machine.store(dir, 2 /* sharing: all */);
        machine.destroy();
        return rootHash;
    };

    it("packs a stored machine into a tar and loads it back from one", () => {
        const rootHash = storeMachine("/machines/source");

        const archive = cartesi.readSnapshot("/machines/source");
        expect(archive.length % 512).toBe(0);

        // an archive is self-contained: unpacked anywhere, it is the same
        // machine, which is what makes it shippable over the network
        cartesi.writeSnapshot("/machines/restored", archive);
        const machine = cartesi.load("/machines/restored");

        expect(machine.getRootHash()).toEqual(rootHash);
        machine.destroy();
    });

    it("writes a tar whose entries are relative to the snapshot directory", () => {
        storeMachine("/machines/relative");
        const archive = cartesi.readSnapshot("/machines/relative");

        const names = new Set<string>();
        for (let offset = 0; offset + 512 <= archive.length; ) {
            const header = archive.subarray(offset, offset + 512);
            if (header.every((byte) => byte === 0)) {
                break;
            }
            const name = new TextDecoder()
                .decode(header.subarray(0, 100))
                .replace(/\0.*$/, "");
            names.add(name);
            const size = Number.parseInt(
                new TextDecoder()
                    .decode(header.subarray(124, 136))
                    .replace(/\0.*$/, "")
                    .trim(),
                8,
            );
            offset += 512 + Math.ceil(size / 512) * 512;
        }

        expect(names).toContain("config.json");
        expect([...names].every((name) => !name.startsWith("/"))).toBe(true);
    });

    it("refuses an archive that is not one", () => {
        expect(() =>
            cartesi.writeSnapshot(
                "/machines/bad",
                new Uint8Array(1024).fill(9),
            ),
        ).toThrow(/checksum/);
    });
});
