/// <reference lib="webworker" />
// Runs one machine, and drives its console.
//
// The loop is the whole of it: run a slice of cycles, hand over whatever the
// guest printed, and when the guest asks for a keystroke, give it what has been
// typed. `run` returns for both — ConsoleOutput and ConsoleInput are breaks,
// not errors — and resuming is just calling it again. Nothing suspends, which
// is why this needs no special build of the emulator.
import {
    BreakReason,
    type CartesiMachine,
    type CartesiMachineWasm,
    init,
    Reg,
} from "@cartesi/machine/wasm";

import { imagePath, snapshotPath } from "./config";
import { gunzip, isGzip, loadArchive } from "./snapshot";
import type { BootRequest, FromWorker, RunStats, ToWorker } from "./protocol";
import { readImage } from "../images/store";

/** How far to run before coming up for air. */
const SLICE = 2_000_000n;

// An idle shell asks for input thousands of times a second. Once the guest has
// gone quiet with nothing to type, poll it lazily rather than spinning a core.
const IDLE_BREAKS = 12;
const IDLE_PAUSE = 20;

const STATS_INTERVAL = 250;

const post = (message: FromWorker, transfer: Transferable[] = []): void => {
    self.postMessage(message, transfer);
};

const sleep = (ms: number): Promise<void> =>
    new Promise((resolve) => setTimeout(resolve, ms));

const hex = (bytes: Uint8Array): string =>
    Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");

let cartesi: CartesiMachineWasm | null = null;
let machine: CartesiMachine | null = null;
const staged = new Set<string>();
let pending = new Uint8Array(0);
let stopped = false;

const queue = (bytes: Uint8Array): void => {
    const merged = new Uint8Array(pending.length + bytes.length);
    merged.set(pending);
    merged.set(bytes, pending.length);
    pending = merged;
};

// The emulator itself — a single ~3.5 MB module with libcartesi inside it —
// is what `init` imports, and the bundler splits it off into a chunk of its
// own, so it is fetched here on the first boot rather than with the page. A
// checkout that has not run `pnpm --filter @cartesi/machine build:wasm` has no
// such module: the app still builds, and this reports the miss.
const module = async (): Promise<CartesiMachineWasm> => {
    if (cartesi === null) {
        post({ type: "status", text: "instantiating the emulator" });
        cartesi = await init();
        cartesi.fs.mkdirTree("/images");
    }
    return cartesi;
};

const stage = async (ids: string[]): Promise<void> => {
    const loaded = await module();
    for (const id of ids) {
        if (staged.has(id)) {
            continue;
        }
        post({ type: "status", text: `staging ${id}` });
        const bytes = await readImage(id);
        loaded.fs.writeFile(imagePath(id), bytes);
        staged.add(id);
    }
};

/**
 * Reads a snapshot out of the library and loads the machine in it.
 *
 * The tarball is the biggest thing this page handles — as big as the machine
 * inside it — so it is read, unpacked and dropped in one go, rather than kept
 * staged the way an image is.
 */
const loadSnapshot = async (
    id: string,
    runtime: BootRequest["runtime"],
): Promise<CartesiMachine> => {
    const loaded = await module();

    post({ type: "status", text: "reading the snapshot" });
    let archive = await readImage(id);
    if (isGzip(archive)) {
        post({ type: "status", text: "decompressing the snapshot" });
        archive = await gunzip(archive);
    }

    post({ type: "status", text: "unpacking the snapshot" });
    return loadArchive(loaded, snapshotPath(id), archive, runtime);
};

/**
 * The exit code the guest halted with. HTIF carries it in the low 32 bits of
 * tohost, with bit 0 marking the halt itself.
 */
const exitCodeOf = (halted: CartesiMachine): number | null => {
    const tohost = halted.readReg(Reg.HtifToHost);
    const data = tohost & 0xffffffffn;
    return (data & 1n) === 0n ? null : Number(data >> 1n);
};

const drive = async (interactive: boolean, limit: bigint | null) => {
    const running = machine as CartesiMachine;
    const started = performance.now();
    // A machine created here starts at cycle zero; a loaded one starts wherever
    // it was stored. Everything this reports is about the run, not the machine's
    // whole life, so both the speed and the cycle limit count from here.
    const origin = running.readReg(Reg.Mcycle);
    const cap = limit === null ? null : origin + limit;
    let idle = 0;
    let reported = 0;

    const statsFor = (): RunStats => {
        const seconds = (performance.now() - started) / 1000;
        const mcycle = running.readReg(Reg.Mcycle);
        return {
            mcycle: mcycle.toString(),
            seconds,
            mips: seconds === 0 ? 0 : Number(mcycle - origin) / seconds / 1e6,
        };
    };

    const finish = (reason: string): void => {
        post({
            type: "done",
            reason,
            stats: statsFor(),
            rootHash: hex(running.getRootHash()),
            exitCode: reason === "Halted" ? exitCodeOf(running) : null,
        });
    };

    for (;;) {
        if (stopped) {
            finish("stopped");
            return;
        }

        const mcycle = running.readReg(Reg.Mcycle);
        const target = cap === null ? mcycle + SLICE : min(mcycle + SLICE, cap);
        const reason = running.run(target);

        const output = running.readConsoleOutput();
        if (output.length > 0) {
            idle = 0;
            post({ type: "output", bytes: output }, [output.buffer]);
        }

        if (reason === BreakReason.ConsoleInput) {
            if (interactive && pending.length > 0) {
                const taken = running.writeConsoleInput(pending);
                pending = pending.slice(taken);
                idle = 0;
            } else {
                idle += 1;
            }
        } else if (
            reason !== BreakReason.ConsoleOutput &&
            reason !== BreakReason.ReachedTargetMcycle
        ) {
            finish(BreakReason[reason] ?? String(reason));
            return;
        } else if (cap !== null && running.readReg(Reg.Mcycle) >= cap) {
            finish("cycle limit");
            return;
        }

        if (performance.now() - reported > STATS_INTERVAL) {
            reported = performance.now();
            post({ type: "stats", stats: statsFor() });
        }

        // back to the event loop, which is what lets keystrokes arrive at all
        await sleep(idle > IDLE_BREAKS ? IDLE_PAUSE : 0);
    }
};

const min = (left: bigint, right: bigint): bigint =>
    left < right ? left : right;

const boot = async (request: BootRequest) => {
    stopped = false;
    pending = new Uint8Array(0);

    const loaded = await module();
    // before anything large is read or unpacked: the machine that ran last is
    // of no use now, and it is holding its whole state
    machine?.destroy();
    machine = null;

    if (request.snapshot !== null) {
        machine = await loadSnapshot(request.snapshot, request.runtime);
    } else if (request.config !== null) {
        await stage(request.images);
        post({ type: "status", text: "creating the machine" });
        machine = loaded.create(request.config, request.runtime);
    } else {
        throw new Error("nothing to boot: no configuration and no snapshot");
    }

    post({
        type: "booted",
        emulator: formatVersion(loaded.getVersion()),
    });

    const limit =
        request.maxMcycle === null ? null : BigInt(request.maxMcycle) || null;
    await drive(request.interactive, limit);
};

const formatVersion = (version: bigint): string => {
    const major = version / 1000000n;
    const minor = (version / 1000n) % 1000n;
    const patch = version % 1000n;
    return `${major}.${minor}.${patch}`;
};

self.onmessage = ({ data }: MessageEvent<ToWorker>) => {
    switch (data.type) {
        case "boot":
            boot(data).catch((error: unknown) => {
                post({
                    type: "error",
                    message:
                        error instanceof Error ? error.message : String(error),
                });
            });
            break;
        case "input":
            queue(data.bytes);
            break;
        case "resize":
            // A VirtIO console reports its size to the guest and interrupts it
            // when the size changes, which is what makes this a SIGWINCH there.
            try {
                machine?.setRuntimeConfig(data.runtime);
            } catch {
                // a machine that is gone, or one whose console cannot resize
            }
            break;
        case "stop":
            stopped = true;
            break;
    }
};
