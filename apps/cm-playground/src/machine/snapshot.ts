// Getting a stored machine out of a tarball and into the emulator's filesystem.
//
// The emulator only loads a machine from a path, and a browser has no paths —
// so a snapshot arrives here as bytes and is unpacked into the module's own
// filesystem, which is what `load()` is then pointed at. `writeSnapshot` does
// the unpacking; everything here is about meeting an archive halfway: it may
// be compressed, it may wrap the machine in a directory, and it is as large as
// the machine inside it, so it does not stay unpacked a moment longer than it
// has to.
import {
    type CartesiMachine,
    type CartesiMachineWasm,
    type EmscriptenFS,
    SharingMode,
} from "@cartesi/machine/wasm";

/**
 * Whether these bytes are gzipped — which a tarball that travelled over HTTP
 * usually is. The browser has the decompressor, so there is no library to pull
 * in for it.
 */
export const isGzip = (bytes: Uint8Array): boolean =>
    bytes.length > 2 && bytes[0] === 0x1f && bytes[1] === 0x8b;

const through = async (
    bytes: Uint8Array,
    transform: CompressionStream | DecompressionStream,
): Promise<Uint8Array> => {
    const stream = new Blob([bytes as BlobPart])
        .stream()
        .pipeThrough(transform);
    return new Uint8Array(await new Response(stream).arrayBuffer());
};

export const gunzip = (bytes: Uint8Array): Promise<Uint8Array> =>
    through(bytes, new DecompressionStream("gzip"));

/**
 * The other direction, for a snapshot this page made. A machine is mostly
 * memory it has never touched, so this is not a marginal saving: a freshly
 * booted machine compresses by a factor of hundreds, and the result is an
 * ordinary `.tar.gz` that `tar -xzf` opens.
 */
export const gzip = (bytes: Uint8Array): Promise<Uint8Array> =>
    through(bytes, new CompressionStream("gzip"));

/**
 * Where the stored machine is inside an unpacked archive.
 *
 * `tar -cf snapshot.tar -C <dir> .` lands the machine directly in `dir`, and
 * `tar -cf snapshot.tar <dir>` wraps it in a directory named after it. Both are
 * archives someone will reasonably hand this page, so this looks for
 * config.json — the one file every stored machine has — through any wrapping.
 */
export const machineRoot = (fs: EmscriptenFS, dir: string): string => {
    let at = dir;
    // deep enough for the wrapping a tarball has, and no deeper: a stored
    // machine is a flat directory, so nothing legitimate is far down
    for (let depth = 0; depth < 4; depth += 1) {
        if (fs.analyzePath(`${at}/config.json`).exists) {
            return at;
        }
        const entries = fs
            .readdir(at)
            .filter((name) => name !== "." && name !== "..");
        const only = entries.length === 1 ? `${at}/${entries[0]}` : null;
        if (only === null || !fs.isDir(fs.stat(only).mode)) {
            break;
        }
        at = only;
    }
    throw new Error(
        "this archive holds no stored machine: nothing in it is a directory " +
            "with a config.json in it. A snapshot is what `cartesi-machine " +
            "--store=<dir>` writes, tarred up.",
    );
};

/** Frees an unpacked snapshot, which is a machine's worth of memory. */
export const removeTree = (fs: EmscriptenFS, path: string): void => {
    for (const name of fs.readdir(path)) {
        if (name === "." || name === "..") {
            continue;
        }
        const child = `${path}/${name}`;
        if (fs.isDir(fs.stat(child).mode)) {
            removeTree(fs, child);
        } else {
            fs.unlink(child);
        }
    }
    fs.rmdir(path);
};

/**
 * Unpacks an archive into `dir` and loads the machine in it, leaving nothing
 * behind.
 *
 * Nothing needs the unpacked copy once the machine is up — `load` with the
 * default sharing reads the whole machine into memory — and a snapshot is as
 * big as the machine it holds, which is not a copy worth keeping around for a
 * boot that may never come.
 */
export const loadArchive = (
    cartesi: CartesiMachineWasm,
    dir: string,
    archive: Uint8Array,
    runtime: Parameters<CartesiMachineWasm["load"]>[1],
) => {
    if (cartesi.fs.analyzePath(dir).exists) {
        // whatever an interrupted boot left behind
        removeTree(cartesi.fs, dir);
    }
    cartesi.writeSnapshot(dir, archive);
    try {
        return cartesi.load(machineRoot(cartesi.fs, dir), runtime);
    } finally {
        removeTree(cartesi.fs, dir);
    }
};

/**
 * Packs a running machine into a tarball, leaving the machine untouched.
 *
 * The sharing mode is not a choice: a machine created in memory, which is the
 * only kind this page has, can only be written out with `All` — the other two
 * ask the emulator to roll ranges back to a backing store that was never there.
 * What it does not mean is that the machine is left tied to the files. It goes
 * on running exactly as it was, so the directory is this function's alone: it
 * is tarred and then removed, which gives a machine's worth of memory back.
 */
export const storeArchive = (
    cartesi: CartesiMachineWasm,
    machine: CartesiMachine,
    dir: string,
): Uint8Array => {
    const parent = dir.slice(0, dir.lastIndexOf("/"));
    cartesi.fs.mkdirTree(parent === "" ? "/" : parent);
    if (cartesi.fs.analyzePath(dir).exists) {
        // whatever an interrupted store left behind
        removeTree(cartesi.fs, dir);
    }

    machine.store(dir, SharingMode.All);
    try {
        return cartesi.readSnapshot(dir);
    } finally {
        removeTree(cartesi.fs, dir);
    }
};
