// The tar reader behind `writeSnapshot`, on the archives people actually hand
// it. Nothing here needs the emulator: unpacking is a function of some bytes
// and a filesystem, and the filesystem is a few lines of Map.
//
// The formats matter because a stored machine is the worst case for tar. A RAM
// image and drives that are mostly untouched are files full of holes, and
// libarchive — the `tar` on macOS — records those sparsely without being asked,
// in a format where the name in the header is a decoy.
import { describe, expect, it } from "vitest";
import type { EmscriptenFS } from "../src/wasm/module.js";
import { readSnapshot, writeSnapshot } from "../src/wasm/snapshot.js";

const BLOCK = 512;
const encoder = new TextEncoder();

// -- a filesystem, as far as a tar is concerned -------------------------------

const DIR_MODE = 0o040755;
const FILE_MODE = 0o100644;

const fakeFs = () => {
    const files = new Map<string, Uint8Array>();
    const dirs = new Set<string>(["/"]);
    const fs: EmscriptenFS = {
        mkdir: (path) => {
            dirs.add(path);
        },
        mkdirTree: (path) => {
            const parts = path.split("/").filter((part) => part !== "");
            let at = "";
            for (const part of parts) {
                at += `/${part}`;
                dirs.add(at);
            }
        },
        writeFile: (path, data) => {
            files.set(
                path,
                typeof data === "string" ? encoder.encode(data) : data.slice(),
            );
        },
        readFile: (path) => {
            const found = files.get(path);
            if (found === undefined) {
                throw new Error(`no such file: ${path}`);
            }
            return found;
        },
        readdir: (path) => {
            const prefix = path === "/" ? "/" : `${path}/`;
            const names = new Set<string>([".", ".."]);
            for (const key of [...files.keys(), ...dirs]) {
                if (key.startsWith(prefix) && key !== path) {
                    names.add(key.slice(prefix.length).split("/")[0] as string);
                }
            }
            return [...names];
        },
        unlink: (path) => {
            files.delete(path);
        },
        rmdir: (path) => {
            dirs.delete(path);
        },
        stat: (path) => {
            const file = files.get(path);
            return file === undefined
                ? { size: 0, mode: DIR_MODE }
                : { size: file.length, mode: FILE_MODE };
        },
        isDir: (mode) => mode === DIR_MODE,
        isFile: (mode) => mode === FILE_MODE,
        analyzePath: (path) => ({
            exists: files.has(path) || dirs.has(path),
        }),
    };
    return { fs, files };
};

// -- building the archives ----------------------------------------------------

const octal = (value: number, size: number): string =>
    value.toString(8).padStart(size - 1, "0");

interface HeaderFields {
    name: string;
    size?: number;
    typeFlag?: string;
    /** Written into the header after the standard fields, by byte offset. */
    extra?: { at: number; bytes: Uint8Array }[];
}

const header = ({
    name,
    size = 0,
    typeFlag = "0",
    extra = [],
}: HeaderFields): Uint8Array => {
    const block = new Uint8Array(BLOCK);
    const put = (at: number, text: string) =>
        block.set(encoder.encode(text), at);
    put(0, name);
    put(100, octal(typeFlag === "5" ? 0o755 : 0o644, 8));
    put(108, octal(0, 8));
    put(116, octal(0, 8));
    put(124, octal(size, 12));
    put(136, octal(0, 12));
    block[156] = typeFlag.charCodeAt(0);
    put(257, "ustar");
    put(263, "00");
    for (const { at, bytes } of extra) {
        block.set(bytes, at);
    }
    let sum = 0;
    for (let index = 0; index < BLOCK; index += 1) {
        sum += index >= 148 && index < 156 ? 0x20 : (block[index] as number);
    }
    put(148, `${sum.toString(8).padStart(6, "0")}\0 `);
    return block;
};

const padded = (bytes: Uint8Array): Uint8Array => {
    const out = new Uint8Array(Math.ceil(bytes.length / BLOCK) * BLOCK);
    out.set(bytes);
    return out;
};

const join = (...parts: Uint8Array[]): Uint8Array => {
    const total = parts.reduce((sum, part) => sum + part.length, 0);
    const out = new Uint8Array(total);
    let at = 0;
    for (const part of parts) {
        out.set(part, at);
        at += part.length;
    }
    return out;
};

/** An archive: the entries given, then the end-of-archive marker. */
const archive = (...parts: Uint8Array[]): Uint8Array =>
    join(...parts, new Uint8Array(BLOCK * 2));

const file = (name: string, contents: Uint8Array): Uint8Array =>
    join(header({ name, size: contents.length }), padded(contents));

/** `"%d %key=%value\n"`, where the length counts its own digits. */
const paxRecord = (key: string, value: string): string => {
    const body = ` ${key}=${value}\n`;
    let length = body.length + 1;
    while (`${length}`.length + body.length !== length) {
        length = `${length}`.length + body.length;
    }
    return `${length}${body}`;
};

const paxHeader = (name: string, records: [string, string][]): Uint8Array => {
    const text = records.map(([key, value]) => paxRecord(key, value)).join("");
    const bytes = encoder.encode(text);
    return join(
        header({
            name: `PaxHeaders/${name}`,
            size: bytes.length,
            typeFlag: "x",
        }),
        padded(bytes),
    );
};

// -- the file every case reconstructs -----------------------------------------

// 4 KiB with two runs of real bytes and a hole between them, which is a stored
// machine's memory range in miniature.
const SEGMENTS = [
    { offset: 0, length: 512 },
    { offset: 2048, length: 512 },
];

const sparseFile = (): Uint8Array => {
    const bytes = new Uint8Array(4096);
    bytes.fill(0x41, 0, 512);
    bytes.fill(0x42, 2048, 2560);
    return bytes;
};

/** The runs, back to back, which is all a sparse entry actually stores. */
const compacted = (): Uint8Array => {
    const whole = sparseFile();
    return join(
        ...SEGMENTS.map(({ offset, length }) =>
            whole.subarray(offset, offset + length),
        ),
    );
};

describe("reading a snapshot tarball", () => {
    it("unpacks the `./` names a tar of a directory's contents carries", () => {
        const { fs, files } = fakeFs();
        writeSnapshot(
            fs,
            "/snap",
            archive(
                join(header({ name: "./", typeFlag: "5" })),
                file("./config.json", encoder.encode("{}")),
                file("./ram.bin", new Uint8Array([1, 2, 3])),
            ),
        );

        expect([...files.keys()].sort()).toEqual([
            "/snap/config.json",
            "/snap/ram.bin",
        ]);
        expect(files.get("/snap/ram.bin")).toEqual(new Uint8Array([1, 2, 3]));
    });

    // The three ways a tar can say "this file is mostly holes". libarchive
    // picks the first without being asked, which is what a machine stored on a
    // mac and tarred with the system tar arrives as.
    it("expands a GNU 1.0 sparse entry, whose header name is a decoy", () => {
        const { fs, files } = fakeFs();
        const map = encoder.encode(
            `${SEGMENTS.length}\n${SEGMENTS.map(({ offset, length }) => `${offset}\n${length}\n`).join("")}`,
        );
        const stored = join(padded(map), compacted());

        writeSnapshot(
            fs,
            "/snap",
            archive(
                paxHeader("ram.bin", [
                    ["GNU.sparse.major", "1"],
                    ["GNU.sparse.minor", "0"],
                    ["GNU.sparse.name", "./ram.bin"],
                    ["GNU.sparse.realsize", "4096"],
                ]),
                join(
                    header({
                        name: "./GNUSparseFile.0/ram.bin",
                        size: stored.length,
                    }),
                    padded(stored),
                ),
            ),
        );

        expect([...files.keys()]).toEqual(["/snap/ram.bin"]);
        expect(files.get("/snap/ram.bin")).toEqual(sparseFile());
    });

    it("expands a GNU 0.1 sparse entry, whose map is in the pax records", () => {
        const { fs, files } = fakeFs();
        const stored = compacted();

        writeSnapshot(
            fs,
            "/snap",
            archive(
                paxHeader("ram.bin", [
                    ["GNU.sparse.name", "./ram.bin"],
                    ["GNU.sparse.size", "4096"],
                    [
                        "GNU.sparse.map",
                        SEGMENTS.map(
                            ({ offset, length }) => `${offset},${length}`,
                        ).join(","),
                    ],
                ]),
                join(
                    header({ name: "./ram.bin", size: stored.length }),
                    padded(stored),
                ),
            ),
        );

        expect(files.get("/snap/ram.bin")).toEqual(sparseFile());
    });

    it("expands an old-GNU sparse entry, whose map is in the header", () => {
        const { fs, files } = fakeFs();
        const stored = compacted();
        const inHeader = new Uint8Array(4 * 24);
        SEGMENTS.forEach(({ offset, length }, index) => {
            inHeader.set(encoder.encode(octal(offset, 12)), index * 24);
            inHeader.set(encoder.encode(octal(length, 12)), index * 24 + 12);
        });

        writeSnapshot(
            fs,
            "/snap",
            archive(
                join(
                    header({
                        name: "./ram.bin",
                        size: stored.length,
                        typeFlag: "S",
                        extra: [
                            { at: 386, bytes: inHeader },
                            {
                                at: 483,
                                bytes: encoder.encode(octal(4096, 12)),
                            },
                        ],
                    }),
                    padded(stored),
                ),
            ),
        );

        expect(files.get("/snap/ram.bin")).toEqual(sparseFile());
    });

    it("follows an old-GNU sparse map into its continuation blocks", () => {
        const { fs, files } = fakeFs();
        // six runs: four in the header, the rest in a block after it
        const segments = [0, 1, 2, 3, 4, 5].map((index) => ({
            offset: index * 1024,
            length: 512,
        }));
        const whole = new Uint8Array(6 * 1024);
        for (const [index, { offset, length }] of segments.entries()) {
            whole.fill(0x41 + index, offset, offset + length);
        }
        const stored = join(
            ...segments.map(({ offset, length }) =>
                whole.subarray(offset, offset + length),
            ),
        );

        const pack = (from: number, count: number): Uint8Array => {
            const bytes = new Uint8Array(count * 24);
            segments.slice(from, from + count).forEach((run, index) => {
                bytes.set(encoder.encode(octal(run.offset, 12)), index * 24);
                bytes.set(
                    encoder.encode(octal(run.length, 12)),
                    index * 24 + 12,
                );
            });
            return bytes;
        };

        const continuation = new Uint8Array(BLOCK);
        continuation.set(pack(4, 2), 0);

        writeSnapshot(
            fs,
            "/snap",
            archive(
                join(
                    header({
                        name: "./ram.bin",
                        size: stored.length,
                        typeFlag: "S",
                        extra: [
                            { at: 386, bytes: pack(0, 4) },
                            { at: 482, bytes: new Uint8Array([1]) },
                            {
                                at: 483,
                                bytes: encoder.encode(octal(whole.length, 12)),
                            },
                        ],
                    }),
                    continuation,
                    padded(stored),
                ),
            ),
        );

        expect(files.get("/snap/ram.bin")).toEqual(whole);
    });

    it("takes a name from a GNU long-name entry", () => {
        const { fs, files } = fakeFs();
        const long = `./${"d".repeat(120)}.bin`;
        const name = encoder.encode(`${long}\0`);

        writeSnapshot(
            fs,
            "/snap",
            archive(
                join(
                    header({
                        name: "././@LongLink",
                        size: name.length,
                        typeFlag: "L",
                    }),
                    padded(name),
                ),
                file("truncated-name", new Uint8Array([7])),
            ),
        );

        expect([...files.keys()]).toEqual([`/snap/${"d".repeat(120)}.bin`]);
    });

    // The one that mattered: an archive that stops early used to unpack as far
    // as it got and say nothing, so the machine was a file short and the
    // emulator reported a missing backing file much later.
    it("refuses an archive with no end-of-archive marker", () => {
        const { fs } = fakeFs();
        const whole = archive(file("./config.json", encoder.encode("{}")));
        expect(() =>
            writeSnapshot(
                fs,
                "/snap",
                whole.subarray(0, whole.length - BLOCK * 2),
            ),
        ).toThrow(/end-of-archive/);
    });

    it("refuses an archive that stops inside an entry", () => {
        const { fs } = fakeFs();
        const whole = archive(file("./ram.bin", new Uint8Array(4096)));
        expect(() =>
            writeSnapshot(fs, "/snap", whole.subarray(0, BLOCK * 3)),
        ).toThrow(/ends inside an entry/);
    });

    it("refuses an entry it cannot represent rather than dropping it", () => {
        const { fs } = fakeFs();
        expect(() =>
            writeSnapshot(
                fs,
                "/snap",
                archive(join(header({ name: "./link", typeFlag: "2" }))),
            ),
        ).toThrow(/cannot contain/);
    });

    it("refuses an entry that reaches outside the snapshot", () => {
        const { fs } = fakeFs();
        expect(() =>
            writeSnapshot(
                fs,
                "/snap",
                archive(file("../escaped.bin", new Uint8Array([1]))),
            ),
        ).toThrow(/outside the snapshot/);
    });

    it("refuses an archive that is not one", () => {
        const { fs } = fakeFs();
        expect(() =>
            writeSnapshot(fs, "/snap", new Uint8Array(1024).fill(9)),
        ).toThrow(/checksum/);
    });

    it("reads back what it writes", () => {
        const { fs } = fakeFs();
        fs.mkdirTree("/source");
        fs.writeFile("/source/config.json", encoder.encode("{}"));
        fs.writeFile("/source/ram.bin", sparseFile());

        const packed = readSnapshot(fs, "/source");
        const there = fakeFs();
        writeSnapshot(there.fs, "/snap", packed);

        expect([...there.files.keys()].sort()).toEqual([
            "/snap/config.json",
            "/snap/ram.bin",
        ]);
        expect(there.files.get("/snap/ram.bin")).toEqual(sparseFile());
    });
});
