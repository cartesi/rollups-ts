// The form model, and the pure function that turns it into what the emulator
// takes: a MachineConfig and a MachineRuntimeConfig.
//
// The model is deliberately not the machine configuration itself. A few things
// a person sets here — "interactive", an environment variable, a window size —
// land in several places at once, and a couple of the emulator's defaults have
// to be recomputed when they do (the kernel command line naming the console,
// most of all).
import type {
    ConsoleFlushMode,
    MachineConfig,
    MachineRuntimeConfig,
    MemoryRangeConfig,
} from "@cartesi/machine";
import { HtifConsoleMask } from "@cartesi/machine/wasm";

/** A drive the machine gets beyond its root filesystem. */
export interface DriveForm {
    id: string;
    label: string;
    /** An image from the library, or null for an empty drive. */
    imageId: string | null;
    /** Blank means "as big as the image". */
    length: string;
    start: string;
    readOnly: boolean;
}

export interface EnvVar {
    id: string;
    name: string;
    value: string;
}

export type ConsoleKind = "virtio" | "htif";

export interface PlaygroundConfig {
    kernelId: string | null;
    rootfsId: string | null;
    ramLength: string;

    drives: DriveForm[];

    entrypoint: string;
    env: EnvVar[];
    workdir: string;
    user: string;
    hostname: string;
    initScript: string;
    bootargs: string;

    interactive: boolean;
    console: ConsoleKind;
    flushMode: ConsoleFlushMode;
    ttyCols: number;
    ttyRows: number;

    unreproducible: boolean;
    imcyclemax: string;
    softYield: boolean;
    updateHashTree: boolean;
    maxMcycle: string;
}

export const defaultConfig = (): PlaygroundConfig => ({
    kernelId: null,
    rootfsId: null,
    ramLength: "128Mi",

    drives: [],

    entrypoint: "",
    env: [],
    workdir: "",
    user: "",
    hostname: "",
    initScript: "",
    bootargs: "",

    interactive: true,
    console: "virtio",
    flushMode: "every_char",
    ttyCols: 80,
    ttyRows: 25,

    unreproducible: false,
    imcyclemax: "",
    softYield: false,
    updateHashTree: false,
    maxMcycle: "",
});

// -- sizes -------------------------------------------------------------------

const UNITS: Record<string, bigint> = {
    "": 1n,
    k: 1000n,
    ki: 1024n,
    m: 1000n ** 2n,
    mi: 1024n ** 2n,
    g: 1000n ** 3n,
    gi: 1024n ** 3n,
};

/** Accepts `128Mi`, `0x8000000` and plain decimals; null when unparseable. */
export const parseSize = (value: string): bigint | null => {
    const text = value.trim();
    if (text === "") {
        return null;
    }
    if (/^0x[0-9a-f]+$/i.test(text)) {
        return BigInt(text);
    }
    const match = /^(\d+)\s*([kmg]i?)?b?$/i.exec(text);
    if (match === null) {
        return null;
    }
    const unit = UNITS[(match[2] ?? "").toLowerCase()];
    return unit === undefined ? null : BigInt(match[1] as string) * unit;
};

export const formatSize = (bytes: number): string => {
    const units = ["B", "KiB", "MiB", "GiB"];
    let value = bytes;
    let unit = 0;
    while (value >= 1024 && unit < units.length - 1) {
        value /= 1024;
        unit += 1;
    }
    return `${value.toFixed(value >= 10 || unit === 0 ? 0 : 1)} ${units[unit]}`;
};

// -- the boot command line ---------------------------------------------------

// What the emulator uses when a configuration says nothing (cm.h,
// CM_DTB_BOOTARGS_INIT). It is spelled out here because two of its parts are
// not always right: the console is hvc1 rather than hvc0 when the machine gets
// a VirtIO console, and there is no root= to mount when there are no drives.
const bootargsFor = (config: PlaygroundConfig, hasRoot: boolean): string => {
    const console = config.console === "virtio" ? "hvc1" : "hvc0";
    return [
        `quiet earlycon=sbi console=${console}`,
        "uio_pdrv_genirq.of_id=generic-uio",
        hasRoot ? "root=/dev/pmem0 rw" : "",
        "init=/usr/sbin/cartesi-init",
    ]
        .filter((part) => part !== "")
        .join(" ");
};

// cartesi-init runs `dtb.init` before the entrypoint, which is where the
// command line tool puts the same things (see cartesi-machine.lua).
const initFor = (config: PlaygroundConfig): string => {
    const lines: string[] = [];
    // The guest cannot see what it is talking to, and a terminal that says
    // nothing gets a dumb one. `cartesi-machine -it` exports the host's TERM
    // for the same reason; here the terminal is always xterm.
    const named = config.env.some(
        ({ name }) => name.trim().toUpperCase() === "TERM",
    );
    if (config.interactive && !named) {
        lines.push("export TERM=xterm-256color");
    }
    for (const { name, value } of config.env) {
        if (name.trim() !== "") {
            lines.push(`export ${name.trim()}=${value}`);
        }
    }
    if (config.workdir.trim() !== "") {
        lines.push(`WORKDIR=${config.workdir.trim()}`);
    }
    if (config.user.trim() !== "") {
        lines.push(`USER=${config.user.trim()}`);
    }
    if (config.hostname.trim() !== "") {
        lines.push(`busybox hostname ${config.hostname.trim()}`);
    }
    if (config.initScript.trim() !== "") {
        lines.push(config.initScript.trim());
    }
    return lines.length === 0 ? "" : `${lines.join("\n")}\n`;
};

// -- generation --------------------------------------------------------------

/** Where an image ends up in the module's filesystem. */
export const imagePath = (id: string): string => `/images/${id}`;

export interface GeneratedConfig {
    config: MachineConfig;
    runtime: MachineRuntimeConfig;
    /** Images this configuration needs staged, by library id. */
    images: string[];
    /** Reasons the configuration cannot be booted as it stands. */
    problems: string[];
}

export const generate = (form: PlaygroundConfig): GeneratedConfig => {
    const problems: string[] = [];
    const images: string[] = [];

    const ramLength = parseSize(form.ramLength);
    if (ramLength === null) {
        problems.push(`RAM size "${form.ramLength}" is not a size`);
    }
    if (form.kernelId === null) {
        problems.push("no kernel image chosen");
    } else {
        images.push(form.kernelId);
    }

    const flashDrives: MemoryRangeConfig[] = [];
    if (form.rootfsId !== null) {
        images.push(form.rootfsId);
        flashDrives.push({
            label: "root",
            backing_store: { data_filename: imagePath(form.rootfsId) },
        });
    }

    for (const drive of form.drives) {
        const range: MemoryRangeConfig = {};
        if (drive.label.trim() !== "") {
            range.label = drive.label.trim();
        }
        if (drive.imageId !== null) {
            images.push(drive.imageId);
            range.backing_store = { data_filename: imagePath(drive.imageId) };
        }
        const length = parseSize(drive.length);
        if (length !== null) {
            range.length = Number(length);
        } else if (drive.imageId === null) {
            problems.push(
                `drive ${drive.label || flashDrives.length} has neither an image nor a size`,
            );
        }
        const start = parseSize(drive.start);
        if (start !== null) {
            range.start = Number(start);
        }
        if (drive.readOnly) {
            range.read_only = true;
        }
        flashDrives.push(range);
    }

    const unreproducible = form.interactive || form.unreproducible;
    const registers: Record<string, unknown> = {};
    if (unreproducible) {
        registers.iunrep = 1;
    }
    if (form.interactive && form.console === "htif") {
        // a machine is created able to print and not to read
        registers.htif = {
            iconsole: HtifConsoleMask.Putchar | HtifConsoleMask.Getchar,
        };
    }
    const imcyclemax = parseSize(form.imcyclemax);
    if (imcyclemax !== null) {
        registers.imcyclemax = Number(imcyclemax);
    }

    const config: MachineConfig = {
        ram: {
            length: Number(ramLength ?? 0n),
            ...(form.kernelId === null
                ? {}
                : {
                      backing_store: {
                          data_filename: imagePath(form.kernelId),
                      },
                  }),
        },
    };

    if (flashDrives.length > 0) {
        config.flash_drive = flashDrives;
    }
    if (Object.keys(registers).length > 0) {
        config.processor = { registers };
    }
    if (form.console === "virtio") {
        config.virtio = [{ type: "console" }];
    }

    const dtb: MachineConfig["dtb"] = {};
    const bootargs =
        form.bootargs.trim() !== ""
            ? form.bootargs.trim()
            : bootargsFor(form, flashDrives.length > 0);
    dtb.bootargs = bootargs;
    const init = initFor(form);
    if (init !== "") {
        dtb.init = init;
    }
    // cartesi-init prints "Nothing to do." and halts when there is no
    // entrypoint, which is not what someone asking for an interactive machine
    // wants: there, no entrypoint means a shell.
    const entrypoint =
        form.entrypoint.trim() !== ""
            ? form.entrypoint.trim()
            : form.interactive
              ? "sh -i"
              : "";
    if (entrypoint !== "") {
        dtb.entrypoint = entrypoint;
    }
    config.dtb = dtb;

    const runtime: MachineRuntimeConfig = {
        console: {
            output_destination: "to_buffer",
            output_flush_mode: form.flushMode,
            input_source: form.interactive ? "from_buffer" : "from_null",
            tty_cols: form.ttyCols,
            tty_rows: form.ttyRows,
        },
    };
    if (form.softYield) {
        runtime.soft_yield = true;
    }
    if (form.updateHashTree) {
        runtime.concurrency = { update_hash_tree: 1 };
    }

    return { config, runtime, images: [...new Set(images)], problems };
};
