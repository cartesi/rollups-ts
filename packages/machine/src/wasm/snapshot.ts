// Getting stored machines in and out of the module's filesystem.
//
// A stored machine is a directory — a config and one file per memory range —
// and the emulator only knows how to load one from a path. In a browser there
// is no path to point it at, so a snapshot arrives as bytes: this packs and
// unpacks that directory as a tar archive, the format `tar -cf` produces from
// what `machine.store()` wrote, with no compression and no dependencies.
//
// Only what a snapshot needs is implemented: regular files and directories,
// one level of nesting, names short enough for the classic header.
import type { EmscriptenFS } from "./module.js";

const BLOCK_SIZE = 512;
const NAME_SIZE = 100;

const decoder = new TextDecoder();
const encoder = new TextEncoder();

const readString = (block: Uint8Array, offset: number, size: number): string =>
    decoder.decode(block.subarray(offset, offset + size)).replace(/\0.*$/, "");

/** tar stores numbers as NUL- or space-terminated octal. */
const readOctal = (block: Uint8Array, offset: number, size: number): number => {
    const text = readString(block, offset, size).trim();
    return text === "" ? 0 : Number.parseInt(text, 8);
};

const writeString = (
    block: Uint8Array,
    offset: number,
    size: number,
    value: string,
): void => {
    const bytes = encoder.encode(value);
    if (bytes.length > size) {
        throw new Error(`name too long for a tar header: ${value}`);
    }
    block.set(bytes, offset);
};

const writeOctal = (
    block: Uint8Array,
    offset: number,
    size: number,
    value: number,
): void => {
    // size - 1 digits and a NUL, which is what GNU tar writes
    writeString(block, offset, size, value.toString(8).padStart(size - 1, "0"));
};

const checksum = (header: Uint8Array): number => {
    let sum = 0;
    for (let i = 0; i < BLOCK_SIZE; i += 1) {
        // the checksum field itself counts as spaces
        sum += i >= 148 && i < 156 ? 0x20 : (header[i] as number);
    }
    return sum;
};

const blocksFor = (size: number): number =>
    Math.ceil(size / BLOCK_SIZE) * BLOCK_SIZE;

/**
 * Extracts a tar archive into `dir`, creating it if needed.
 *
 * The archive's own top-level directory, if it has one, is kept: a snapshot
 * tarred as `snapshot/config.json` lands in `${dir}/snapshot/config.json`.
 * Tar the directory's *contents* to land them directly in `dir`.
 */
export const writeSnapshot = (
    fs: EmscriptenFS,
    dir: string,
    archive: Uint8Array,
): void => {
    fs.mkdirTree(dir);

    let offset = 0;
    while (offset + BLOCK_SIZE <= archive.length) {
        const header = archive.subarray(offset, offset + BLOCK_SIZE);

        // two zero blocks end the archive; a single one ends it in practice
        if (header.every((byte) => byte === 0)) {
            break;
        }

        const stored = readOctal(header, 148, 8);
        if (stored !== checksum(header)) {
            throw new Error(
                `corrupt tar header at byte ${offset}: checksum mismatch`,
            );
        }

        const name = readString(header, 0, NAME_SIZE);
        const size = readOctal(header, 124, 12);
        const typeFlag = String.fromCharCode(header[156] as number);
        offset += BLOCK_SIZE;

        const path = `${dir}/${name.replace(/\/+$/, "")}`;
        if (typeFlag === "5") {
            fs.mkdirTree(path);
        } else if (typeFlag === "0" || typeFlag === "\0") {
            const slash = path.lastIndexOf("/");
            fs.mkdirTree(path.slice(0, slash));
            fs.writeFile(path, archive.subarray(offset, offset + size));
        }
        // anything else (symlinks, long names, pax records) is not something
        // a stored machine contains, so it is skipped

        offset += blocksFor(size);
    }
};

/**
 * Packs a stored machine into a tar archive, for handing a snapshot back to
 * the page — to keep in a File, in OPFS, or upload somewhere.
 *
 * Entries are relative to `dir`, so the archive unpacks into any directory.
 */
export const readSnapshot = (fs: EmscriptenFS, dir: string): Uint8Array => {
    const blocks: Uint8Array[] = [];

    const pack = (path: string, prefix: string): void => {
        for (const name of fs.readdir(path)) {
            if (name === "." || name === "..") {
                continue;
            }

            const child = `${path}/${name}`;
            const entry = prefix === "" ? name : `${prefix}/${name}`;
            const { mode, size } = fs.stat(child);

            if (fs.isDir(mode)) {
                blocks.push(header(`${entry}/`, 0, "5"));
                pack(child, entry);
                continue;
            }

            if (!fs.isFile(mode)) {
                continue;
            }

            blocks.push(header(entry, size, "0"));
            const data = fs.readFile(child, { encoding: "binary" });
            const padded = new Uint8Array(blocksFor(size));
            padded.set(data);
            blocks.push(padded);
        }
    };

    const header = (
        name: string,
        size: number,
        typeFlag: string,
    ): Uint8Array => {
        const block = new Uint8Array(BLOCK_SIZE);
        writeString(block, 0, NAME_SIZE, name);
        writeOctal(block, 100, 8, typeFlag === "5" ? 0o755 : 0o644);
        writeOctal(block, 108, 8, 0); // uid
        writeOctal(block, 116, 8, 0); // gid
        writeOctal(block, 124, 12, size);
        writeOctal(block, 136, 12, 0); // mtime: snapshots are content, not history
        block[156] = typeFlag.charCodeAt(0);
        writeString(block, 257, 6, "ustar");
        writeString(block, 263, 2, "00");
        // the checksum field is six octal digits, a NUL and a space — the one
        // field where the classic layout is worth matching exactly, so `tar
        // -xf` accepts what this writes
        writeString(
            block,
            148,
            8,
            `${checksum(block).toString(8).padStart(6, "0")}\0 `,
        );
        return block;
    };

    pack(dir, "");

    // two zero blocks terminate the archive
    blocks.push(new Uint8Array(BLOCK_SIZE * 2));

    const total = blocks.reduce((sum, block) => sum + block.length, 0);
    const archive = new Uint8Array(total);
    let offset = 0;
    for (const block of blocks) {
        archive.set(block, offset);
        offset += block.length;
    }
    return archive;
};
