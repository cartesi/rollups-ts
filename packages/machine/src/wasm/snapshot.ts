// Getting stored machines in and out of the module's filesystem.
//
// A stored machine is a directory — a config and one file per memory range —
// and the emulator only knows how to load one from a path. In a browser there
// is no path to point it at, so a snapshot arrives as bytes: this packs and
// unpacks that directory as a tar archive, the format `tar -cf` produces from
// what `machine.store()` wrote, with no compression and no dependencies.
//
// Reading is the fussy half. A snapshot is not always packed by the same tar:
// GNU tar and libarchive (the `tar` on macOS) disagree about how to record a
// file full of holes, and a stored machine — a RAM image and drives that are
// mostly untouched — is nothing but holes, so libarchive writes one sparsely
// without being asked. Three dialects of that are read here, along with pax
// extended headers and GNU long names, because an archive this cannot read is
// an archive somebody made the ordinary way.
//
// What is not understood is refused rather than skipped: a tar reader that
// quietly drops entries hands back a directory that is a machine short of a
// file, and the error for that arrives much later and says nothing useful.
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

/** A run of real bytes inside a sparse file, and where it belongs. */
interface Segment {
    offset: number;
    length: number;
}

/**
 * The records in a pax extended header: `"%d %keyword=%value\n"`, repeated,
 * where the length counts the whole record including its own digits.
 *
 * Byte-wise rather than on a decoded string: the length is in bytes, and a
 * name outside ASCII would put a decoded string's indices out of step with it.
 */
const paxRecords = (block: Uint8Array): Map<string, string> => {
    const records = new Map<string, string>();
    let at = 0;
    while (at < block.length) {
        let space = at;
        while (space < block.length && block[space] !== 0x20) {
            space += 1;
        }
        const length = Number.parseInt(readString(block, at, space - at), 10);
        if (
            !Number.isInteger(length) ||
            length <= 0 ||
            at + length > block.length
        ) {
            break;
        }
        // the record runs to `length` bytes from its start, less the newline
        const record = readString(block, space + 1, at + length - space - 2);
        const equals = record.indexOf("=");
        if (equals !== -1) {
            records.set(record.slice(0, equals), record.slice(equals + 1));
        }
        at += length;
    }
    return records;
};

/**
 * The sparse map GNU's 1.0 format writes at the head of the entry's own data:
 * decimal, newline-separated, a count and then a pair per segment, padded out
 * to a block. The file's bytes start after it.
 */
const sparseMapFromData = (
    data: Uint8Array,
): { segments: Segment[]; dataStart: number } => {
    let at = 0;
    const next = (): number => {
        let value = 0;
        let digits = 0;
        while (at < data.length) {
            const byte = data[at] as number;
            at += 1;
            if (byte === 0x0a) {
                if (digits === 0) {
                    throw new Error("corrupt sparse map in a tar entry");
                }
                return value;
            }
            if (byte < 0x30 || byte > 0x39) {
                throw new Error("corrupt sparse map in a tar entry");
            }
            value = value * 10 + (byte - 0x30);
            digits += 1;
        }
        throw new Error("truncated sparse map in a tar entry");
    };

    const count = next();
    const segments: Segment[] = [];
    for (let index = 0; index < count; index += 1) {
        const offset = next();
        const length = next();
        segments.push({ offset, length });
    }
    return { segments, dataStart: blocksFor(at) };
};

/** The same map, when pax carried it instead (GNU's 0.0 and 0.1 formats). */
const sparseMapFromPax = (pax: Map<string, string>): Segment[] | null => {
    const packed = pax.get("GNU.sparse.map");
    if (packed !== undefined) {
        const numbers = packed.split(",").map(Number);
        const segments: Segment[] = [];
        for (let index = 0; index + 1 < numbers.length; index += 2) {
            segments.push({
                offset: numbers[index] as number,
                length: numbers[index + 1] as number,
            });
        }
        return segments;
    }
    // 0.0 repeats the keys instead, which a Map cannot hold: the archive is
    // readable but the map is not, and guessing would corrupt the file.
    if (pax.has("GNU.sparse.offset")) {
        throw new Error(
            "this archive uses GNU sparse format 0.0, whose sparse map repeats " +
                "pax keys. Repack it with `tar --no-sparse`, or with GNU tar, " +
                "which writes a format this can read.",
        );
    }
    return null;
};

/**
 * The sparse map the old GNU format keeps in the header itself: four segments
 * there, twenty-one in each continuation block that follows.
 */
const oldGnuSparse = (
    archive: Uint8Array,
    headerOffset: number,
): { segments: Segment[]; realSize: number; dataStart: number } => {
    const segments: Segment[] = [];
    const take = (block: Uint8Array, base: number, count: number): void => {
        for (let index = 0; index < count; index += 1) {
            const at = base + index * 24;
            const length = readOctal(block, at + 12, 12);
            if (length > 0) {
                segments.push({ offset: readOctal(block, at, 12), length });
            }
        }
    };

    const header = archive.subarray(headerOffset, headerOffset + BLOCK_SIZE);
    take(header, 386, 4);
    const realSize = readOctal(header, 483, 12);

    let more = header[482] !== 0;
    let at = headerOffset + BLOCK_SIZE;
    while (more) {
        if (at + BLOCK_SIZE > archive.length) {
            throw new Error("truncated sparse map in a tar entry");
        }
        const block = archive.subarray(at, at + BLOCK_SIZE);
        take(block, 0, 21);
        more = block[504] !== 0;
        at += BLOCK_SIZE;
    }
    return { segments, realSize, dataStart: at };
};

/** Lays a sparse entry's stored runs back out into the file they came from. */
const expand = (
    stored: Uint8Array,
    segments: Segment[],
    realSize: number,
): Uint8Array => {
    const file = new Uint8Array(realSize);
    let at = 0;
    for (const { offset, length } of segments) {
        if (offset + length > realSize || at + length > stored.length) {
            throw new Error(
                "a sparse tar entry describes more data than it carries",
            );
        }
        file.set(stored.subarray(at, at + length), offset);
        at += length;
    }
    return file;
};

/**
 * An entry's path under `dir`, with the `./` a tar of a directory's contents
 * puts on everything, and without any way out of `dir` — an archive is not
 * necessarily one this page made.
 */
const pathIn = (dir: string, name: string): string => {
    const parts: string[] = [];
    for (const part of name.split("/")) {
        if (part === "" || part === ".") {
            continue;
        }
        if (part === "..") {
            throw new Error(
                `refusing a tar entry that reaches outside the snapshot: ${name}`,
            );
        }
        parts.push(part);
    }
    return parts.length === 0 ? dir : `${dir}/${parts.join("/")}`;
};

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
    let ended = false;
    // what a metadata entry says about the entry after it
    let pax = new Map<string, string>();
    let longName: string | null = null;

    while (offset + BLOCK_SIZE <= archive.length) {
        const header = archive.subarray(offset, offset + BLOCK_SIZE);

        // two zero blocks end the archive; a single one ends it in practice
        if (header.every((byte) => byte === 0)) {
            ended = true;
            break;
        }

        const stored = readOctal(header, 148, 8);
        if (stored !== checksum(header)) {
            throw new Error(
                `corrupt tar header at byte ${offset}: checksum mismatch`,
            );
        }

        const typeFlag = String.fromCharCode(header[156] as number);
        const size = readOctal(header, 124, 12);
        // An old-GNU sparse entry puts its map in continuation blocks between
        // the header and the data, so both the data and the entry after it sit
        // further along than the block count alone would say.
        const map = typeFlag === "S" ? oldGnuSparse(archive, offset) : null;
        const body = map === null ? offset + BLOCK_SIZE : map.dataStart;
        if (body + size > archive.length) {
            throw new Error(
                `this archive ends inside an entry at byte ${offset}: it is ` +
                    "not a whole tar",
            );
        }
        const next = body + blocksFor(size);

        // Metadata entries describe the one that follows rather than being a
        // file themselves.
        if (typeFlag === "x") {
            pax = paxRecords(archive.subarray(body, body + size));
            offset = next;
            continue;
        }
        if (typeFlag === "g") {
            // a global header applies to the rest of the archive; nothing a
            // stored machine needs is carried in one
            offset = next;
            continue;
        }
        if (typeFlag === "L") {
            longName = readString(archive, body, size);
            offset = next;
            continue;
        }
        if (typeFlag === "K") {
            // the long name of a link's target, and links are refused below
            offset = next;
            continue;
        }

        const prefix = readString(header, 345, 155);
        const named = readString(header, 0, NAME_SIZE);
        let name =
            longName ??
            pax.get("path") ??
            (prefix === "" ? named : `${prefix}/${named}`);
        let data = archive.subarray(body, body + size);

        // Sparse, in whichever of the three ways this archive says so. The
        // name in the header is a decoy in GNU's 1.0 format — the real one is
        // in the pax records, under a directory that does not exist.
        const sparse = pax.get("GNU.sparse.name");
        if (map !== null) {
            data = expand(data, map.segments, map.realSize);
        } else if (sparse !== undefined || pax.has("GNU.sparse.map")) {
            name = sparse ?? name;
            const realSize = Number(
                pax.get("GNU.sparse.realsize") ?? pax.get("GNU.sparse.size"),
            );
            if (!Number.isInteger(realSize)) {
                throw new Error(`sparse tar entry ${name} has no real size`);
            }
            const fromPax = sparseMapFromPax(pax);
            if (fromPax !== null) {
                data = expand(data, fromPax, realSize);
            } else {
                const map = sparseMapFromData(data);
                data = expand(
                    data.subarray(map.dataStart),
                    map.segments,
                    realSize,
                );
            }
        }

        pax = new Map();
        longName = null;
        offset = next;

        const path = pathIn(dir, name);
        if (typeFlag === "5") {
            fs.mkdirTree(path);
        } else if (
            typeFlag === "0" ||
            typeFlag === "\0" ||
            typeFlag === "7" ||
            typeFlag === "S"
        ) {
            const slash = path.lastIndexOf("/");
            fs.mkdirTree(path.slice(0, slash));
            fs.writeFile(path, data);
        } else {
            // Skipping it would leave a directory that looks like a machine
            // and is missing a file, which is a much worse thing to hand back
            // than a refusal.
            throw new Error(
                `a snapshot cannot contain ${JSON.stringify(name)}, a tar ` +
                    `entry of type ${JSON.stringify(typeFlag)}`,
            );
        }
    }

    if (!ended) {
        throw new Error(
            "this archive has no end-of-archive marker: it was cut short, or " +
                "it is not a tar",
        );
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
