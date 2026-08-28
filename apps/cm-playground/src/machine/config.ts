// The form model, and the pure function that turns it into what the emulator
// takes: a MachineConfig and a MachineRuntimeConfig.
//
// The model is deliberately not the machine configuration itself. A few things
// a person sets here — "interactive", an environment variable, a window size —
// land in several places at once, and a couple of the emulator's defaults have
// to be recomputed when they do (the kernel command line naming the console,
// most of all). Others land nowhere near the configuration: mounting a drive,
// owning it, naming the host — those are shell, and they are assembled into
// `dtb.init`, exactly as cartesi-machine.lua assembles them for the command
// line tool.
import type {
    ConsoleFlushMode,
    MachineConfig,
    MachineRuntimeConfig,
    MemoryRangeConfig,
} from "@cartesi/machine";
import { HtifConsoleMask } from "@cartesi/machine/wasm";

/** How init mounts a drive: the command line tool's `mount:` key. */
export type MountMode = "auto" | "none" | "custom";

/** Whether init formats a drive: the command line tool's `mke2fs:` key. */
export type FormatMode = "auto" | "always" | "never";

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
    /** "auto" mounts at /mnt/<label> when there is something to mount. */
    mount: MountMode;
    /** Where to mount it, when `mount` is "custom". */
    mountPoint: string;
    /** "auto" formats a drive that starts empty. */
    format: FormatMode;
    /** Who owns the mount point — or the device, when it is not mounted. */
    user: string;
}

/** A non-volatile memory range, which the guest sees as /dev/uioN. */
export interface NvramForm {
    id: string;
    label: string;
    imageId: string | null;
    length: string;
    start: string;
    readOnly: boolean;
    user: string;
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
    rootfsReadOnly: boolean;
    ramLength: string;

    drives: DriveForm[];
    nvrams: NvramForm[];

    entrypoint: string;
    env: EnvVar[];
    workdir: string;
    user: string;
    hostname: string;
    splash: boolean;
    syncDate: boolean;
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

const newId = (): string => Math.random().toString(36).slice(2, 10);

export const newDrive = (index: number): DriveForm => ({
    id: newId(),
    label: `drive${index + 1}`,
    imageId: null,
    length: "",
    start: "",
    readOnly: false,
    mount: "auto",
    mountPoint: "",
    format: "auto",
    user: "",
});

export const newNvram = (index: number): NvramForm => ({
    id: newId(),
    label: `nvram-${index + 1}`,
    imageId: null,
    length: "",
    start: "",
    readOnly: false,
    user: "",
});

export const newEnvVar = (): EnvVar => ({ id: newId(), name: "", value: "" });

export const defaultConfig = (): PlaygroundConfig => ({
    kernelId: null,
    rootfsId: null,
    rootfsReadOnly: false,
    ramLength: "128Mi",

    drives: [],
    nvrams: [],

    entrypoint: "",
    env: [],
    workdir: "",
    user: "",
    hostname: "",
    splash: true,
    syncDate: false,
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

/** Fills in fields a configuration saved by an older version of this page lacks. */
export const restoreConfig = (saved: unknown): PlaygroundConfig => {
    const config = { ...defaultConfig(), ...(saved as PlaygroundConfig) };
    return {
        ...config,
        drives: (config.drives ?? []).map((drive, index) => ({
            ...newDrive(index),
            ...drive,
        })),
        nvrams: (config.nvrams ?? []).map((nvram, index) => ({
            ...newNvram(index),
            ...nvram,
        })),
        env: (config.env ?? []).map((variable) => ({
            ...newEnvVar(),
            ...variable,
        })),
    };
};

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

// -- labels ------------------------------------------------------------------

// A memory range always carries the automatic label the machine gives it —
// `flashdrive0`, `nvram0`, and so on by position — and may carry one of the
// user's own besides. The emulator is strict about the second: it is what the
// guest looks a range up by, so it has to be a name and it has to be unique.
const USER_LABEL = /^[a-z][a-z0-9-]*$/;
const AUTOMATIC_LABEL = /^(flashdrive|nvram)\d+$/;

const labelProblem = (label: string): string | null => {
    if (!USER_LABEL.test(label)) {
        return "must start with a lowercase letter and hold only lowercase letters, digits and hyphens";
    }
    if (label.length > 31) {
        return "is longer than 31 characters";
    }
    if (AUTOMATIC_LABEL.test(label)) {
        return "is a name the machine gives ranges itself";
    }
    return null;
};

/**
 * The name the guest looks the range up by — `flashdrive <label>` and
 * `nvram <label>` print the device a label resolves to. The user's own label
 * when there is one, and the machine's automatic one otherwise.
 */
const deviceLabel = (
    label: string,
    kind: "flashdrive" | "nvram",
    index: number,
): string => (label.trim() === "" ? `${kind}${index}` : label.trim());

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
        hasRoot ? `root=/dev/pmem0 ${config.rootfsReadOnly ? "ro" : "rw"}` : "",
        "init=/usr/sbin/cartesi-init",
    ]
        .filter((part) => part !== "")
        .join(" ");
};

// -- the init script ---------------------------------------------------------

// The splash cartesi-machine prints on boot. The backslashes are doubled
// because this is a shell script: `echo` is given the drawing, not the escapes.
const SPLASH = String.raw`echo "
         .
        / \\
      /    \\
\\---/---\\  /----\\
 \\       X       \\
  \\----/  \\---/---\\
       \\    / CARTESI
        \\ /   MACHINE
         '
"`;

/** Whether init formats this drive, and where — if anywhere — it mounts it. */
const driveMount = (
    drive: DriveForm,
): { format: boolean; mountPoint: string } => {
    // A drive that starts empty has no filesystem, so it gets one; one that
    // comes from an image already has whatever the image holds.
    const format =
        drive.format === "always"
            ? true
            : drive.format === "never"
              ? false
              : drive.imageId === null;
    const label = drive.label.trim();
    const mountPoint =
        drive.mount === "custom"
            ? drive.mountPoint.trim()
            : drive.mount === "none"
              ? ""
              : // there has to be something to mount, and somewhere to mount
                // it: an unnamed drive gets no automatic mount point
                (drive.imageId !== null || format) && label !== ""
                ? `/mnt/${label}`
                : "";
    return { format, mountPoint };
};

/** Where init will mount this drive, or "" when it will not mount it at all. */
export const mountPointOf = (drive: DriveForm): string =>
    driveMount(drive).mountPoint;

// cartesi-init runs `dtb.init` as root before the entrypoint, which is where
// the command line tool puts all of this too (see cartesi-machine.lua).
const driveInit = (drive: DriveForm, label: string): string[] => {
    // The kernel mounts the root filesystem itself, from the command line,
    // long before init runs — so init leaves a drive called "root" alone,
    // whether it came from the image library or from a drive named that here.
    if (label === "root") {
        return [];
    }
    const { format, mountPoint } = driveMount(drive);
    const user = drive.user.trim();
    if (!format && mountPoint === "" && user === "") {
        return [];
    }
    const lines = [`dev=$(flashdrive ${label})`];
    if (format) {
        lines.push(
            `busybox mke2fs -F -b 4096 -I 256 -L "${label}" "$dev" > /dev/null`,
        );
    }
    if (mountPoint !== "") {
        lines.push(
            `busybox mkdir -p "${mountPoint}" && busybox mount${
                drive.readOnly ? " -o ro" : ""
            } "$dev" "${mountPoint}"`,
        );
    }
    if (user !== "") {
        // an unmounted drive is still a device the entrypoint may want to read
        lines.push(
            `busybox chown ${user}: "${mountPoint === "" ? "$dev" : mountPoint}"`,
        );
    }
    return lines;
};

// An NVRAM has no filesystem layer, so there is nothing to format or mount:
// what init settles is who may read and write /dev/uioN.
const nvramInit = (nvram: NvramForm, label: string): string[] => {
    const lines = [
        `dev=$(nvram ${label})`,
        `busybox chmod ${nvram.readOnly ? "0444" : "0664"} "$dev"`,
    ];
    const user = nvram.user.trim();
    if (user !== "") {
        lines.push(`busybox chown ${user}: "$dev"`);
    }
    return lines;
};

const initFor = (
    config: PlaygroundConfig,
    ranges: string[],
    now: number,
): string => {
    const lines: string[] = [];
    if (config.splash) {
        lines.push(SPLASH);
    }
    if (config.syncDate) {
        // rounded up by one, as the command line tool does, so the guest is
        // less likely to start in the host's past
        lines.push(
            `busybox date -s @${Math.floor(now / 1000) + 1} >> /dev/null`,
        );
    }
    lines.push(...ranges);
    // The guest cannot see what it is talking to, and a terminal that says
    // nothing gets a dumb one. `cartesi-machine -it` exports the host's TERM
    // and LANG for the same reason; here the terminal is always an xterm
    // reading UTF-8.
    const named = config.env.some(
        ({ name }) => name.trim().toUpperCase() === "TERM",
    );
    if (config.interactive && !named) {
        lines.push("export TERM=xterm-256color", "export LANG=C.utf8");
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

export const generate = (
    form: PlaygroundConfig,
    /** Only read when the date is synced, which is why it is not a constant. */
    now: number = Date.now(),
): GeneratedConfig => {
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

    // Labels have to be unique across every range the machine gets, and the
    // root filesystem holds the first one.
    const taken = new Set<string>();
    const claim = (label: string, what: string): void => {
        if (label === "") {
            return;
        }
        const problem = labelProblem(label);
        if (problem !== null) {
            problems.push(`${what} label "${label}" ${problem}`);
        } else if (taken.has(label)) {
            problems.push(`${what} label "${label}" is used twice`);
        }
        taken.add(label);
    };

    // Ranges that need something done to them on boot, in the order the
    // machine will see them.
    const rangeInit: string[] = [];

    const flashDrives: MemoryRangeConfig[] = [];
    if (form.rootfsId !== null) {
        images.push(form.rootfsId);
        taken.add("root");
        flashDrives.push({
            label: "root",
            backing_store: { data_filename: imagePath(form.rootfsId) },
            // the kernel mounts it from the command line, so init leaves it be
            ...(form.rootfsReadOnly ? { read_only: true } : {}),
        });
    }

    for (const [index, drive] of form.drives.entries()) {
        const range: MemoryRangeConfig = {};
        const label = drive.label.trim();
        const named = `drive ${index + 1}`;
        claim(label, named);
        if (label !== "") {
            range.label = label;
        }
        if (drive.imageId !== null) {
            images.push(drive.imageId);
            range.backing_store = { data_filename: imagePath(drive.imageId) };
        }
        const length = parseSize(drive.length);
        if (length !== null) {
            range.length = Number(length);
        } else if (drive.imageId === null) {
            problems.push(`${named} has neither an image nor a size`);
        }
        const start = parseSize(drive.start);
        if (start !== null) {
            range.start = Number(start);
        }
        if (drive.readOnly) {
            range.read_only = true;
        }
        if (drive.mount === "custom" && drive.mountPoint.trim() === "") {
            problems.push(`${named} asks for a mount point but names none`);
        }
        rangeInit.push(
            ...driveInit(
                drive,
                deviceLabel(label, "flashdrive", flashDrives.length),
            ),
        );
        flashDrives.push(range);
    }

    const nvrams: MemoryRangeConfig[] = [];
    for (const [index, nvram] of form.nvrams.entries()) {
        const range: MemoryRangeConfig = {};
        const label = nvram.label.trim();
        const named = `NVRAM ${index + 1}`;
        claim(label, named);
        if (label !== "") {
            range.label = label;
        }
        if (nvram.imageId !== null) {
            images.push(nvram.imageId);
            range.backing_store = { data_filename: imagePath(nvram.imageId) };
        }
        const length = parseSize(nvram.length);
        if (length !== null) {
            range.length = Number(length);
        } else if (nvram.imageId === null) {
            problems.push(`${named} has neither an image nor a size`);
        }
        const start = parseSize(nvram.start);
        if (start !== null) {
            range.start = Number(start);
        }
        if (nvram.readOnly) {
            range.read_only = true;
        }
        rangeInit.push(
            ...nvramInit(nvram, deviceLabel(label, "nvram", nvrams.length)),
        );
        nvrams.push(range);
    }

    const unreproducible =
        form.interactive || form.syncDate || form.unreproducible;
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
    if (nvrams.length > 0) {
        config.nvram = nvrams;
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
    const init = initFor(form, rangeInit, now);
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
