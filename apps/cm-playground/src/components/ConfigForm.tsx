// Everything a machine can be told before it boots.
import type { ReactNode } from "react";

import type { ImageRecord } from "../images/store";
import {
    type ConsoleKind,
    type DriveForm,
    type FormatMode,
    type MountMode,
    mountPointOf,
    newDrive,
    newEnvVar,
    newNvram,
    type NvramForm,
    type PlaygroundConfig,
} from "../machine/config";
import type { ConsoleFlushMode } from "@cartesi/machine";
import {
    Button,
    Field,
    Section,
    Select,
    TextArea,
    TextInput,
    Toggle,
} from "./ui";

type Update = (change: Partial<PlaygroundConfig>) => void;

const imageOptions = (images: ImageRecord[]) => [
    { value: "", label: "empty" },
    ...images.map((image) => ({ value: image.id, label: image.name })),
];

// A drive and an NVRAM are the same card: a name, the two things one does to a
// range as a whole, and its fields on a grid underneath.
const RangeCard = ({
    name,
    readOnly,
    onReadOnly,
    onRemove,
    children,
}: {
    name: string;
    readOnly: boolean;
    onReadOnly: (readOnly: boolean) => void;
    onRemove: () => void;
    children: ReactNode;
}) => (
    <div className="range">
        <div className="range-head">
            <span className="range-name">{name}</span>
            <div className="range-actions">
                <Toggle
                    label="read only"
                    checked={readOnly}
                    onChange={onReadOnly}
                />
                <Button kind="ghost" onClick={onRemove}>
                    remove
                </Button>
            </div>
        </div>
        {children}
    </div>
);

export const MachineSection = ({
    config,
    images,
    update,
}: {
    config: PlaygroundConfig;
    images: ImageRecord[];
    update: Update;
}) => {
    const setDrive = (id: string, change: Partial<DriveForm>) => {
        update({
            drives: config.drives.map((drive) =>
                drive.id === id ? { ...drive, ...change } : drive,
            ),
        });
    };

    return (
        <Section
            title="Machine"
            actions={
                <Button
                    kind="ghost"
                    onClick={() =>
                        update({
                            drives: [
                                ...config.drives,
                                newDrive(config.drives.length),
                            ],
                        })
                    }
                >
                    add a drive
                </Button>
            }
        >
            <div className="row">
                <Field label="RAM" hint="128Mi, 0x8000000 or plain bytes">
                    <TextInput
                        value={config.ramLength}
                        onChange={(ramLength) => update({ ramLength })}
                        mono
                    />
                </Field>
            </div>

            <Toggle
                label="Read-only root filesystem"
                hint="the kernel mounts / as ro rather than rw"
                checked={config.rootfsReadOnly}
                onChange={(rootfsReadOnly) => update({ rootfsReadOnly })}
            />

            {config.drives.length === 0 ? (
                <p className="hint">
                    The root filesystem comes from the image library above.
                    Extra drives appear to the guest as /dev/pmem1 and on, and
                    init mounts each of them under /mnt.
                </p>
            ) : null}

            {config.drives.map((drive, index) => {
                const mountPoint = mountPointOf(drive);
                return (
                    <RangeCard
                        key={drive.id}
                        name={`Drive ${index + 1}`}
                        readOnly={drive.readOnly}
                        onReadOnly={(readOnly) =>
                            setDrive(drive.id, { readOnly })
                        }
                        onRemove={() =>
                            update({
                                drives: config.drives.filter(
                                    (other) => other.id !== drive.id,
                                ),
                            })
                        }
                    >
                        <div className="grid">
                            <Field label="Label">
                                <TextInput
                                    value={drive.label}
                                    onChange={(label) =>
                                        setDrive(drive.id, { label })
                                    }
                                    mono
                                />
                            </Field>
                            <Field label="Image">
                                <Select
                                    value={drive.imageId ?? ""}
                                    onChange={(imageId) =>
                                        setDrive(drive.id, {
                                            imageId:
                                                imageId === "" ? null : imageId,
                                        })
                                    }
                                    options={imageOptions(images)}
                                />
                            </Field>
                            <Field
                                label="Size"
                                hint="blank: the image's own size"
                            >
                                <TextInput
                                    value={drive.length}
                                    onChange={(length) =>
                                        setDrive(drive.id, { length })
                                    }
                                    placeholder="64Mi"
                                    mono
                                />
                            </Field>
                            <Field label="Start" hint="blank: chosen for you">
                                <TextInput
                                    value={drive.start}
                                    onChange={(start) =>
                                        setDrive(drive.id, { start })
                                    }
                                    placeholder="0x90000000"
                                    mono
                                />
                            </Field>
                        </div>

                        <div className="grid">
                            <p className="grid-caption">
                                What init does with it.
                            </p>
                            <Field label="Mount">
                                <Select<MountMode>
                                    value={drive.mount}
                                    onChange={(mount) =>
                                        setDrive(drive.id, { mount })
                                    }
                                    options={[
                                        { value: "auto", label: "default" },
                                        {
                                            value: "custom",
                                            label: "custom path",
                                        },
                                        { value: "none", label: "not mounted" },
                                    ]}
                                />
                            </Field>
                            <Field label="Mount point">
                                <TextInput
                                    value={
                                        drive.mount === "custom"
                                            ? drive.mountPoint
                                            : ""
                                    }
                                    onChange={(mountPoint) =>
                                        setDrive(drive.id, { mountPoint })
                                    }
                                    disabled={drive.mount !== "custom"}
                                    placeholder={
                                        drive.mount === "custom"
                                            ? "/data"
                                            : mountPoint === ""
                                              ? "not mounted"
                                              : mountPoint
                                    }
                                    mono
                                />
                            </Field>
                            <Field
                                label="Format"
                                hint="makes it an ext2 filesystem"
                            >
                                <Select<FormatMode>
                                    value={drive.format}
                                    onChange={(format) =>
                                        setDrive(drive.id, { format })
                                    }
                                    options={[
                                        { value: "auto", label: "when empty" },
                                        { value: "always", label: "always" },
                                        { value: "never", label: "never" },
                                    ]}
                                />
                            </Field>
                            <Field
                                label="Owner"
                                hint={
                                    mountPoint === ""
                                        ? "of /dev/pmemN"
                                        : "of the mount point"
                                }
                            >
                                <TextInput
                                    value={drive.user}
                                    onChange={(user) =>
                                        setDrive(drive.id, { user })
                                    }
                                    placeholder="dapp"
                                    mono
                                />
                            </Field>
                        </div>
                    </RangeCard>
                );
            })}
        </Section>
    );
};

export const NvramSection = ({
    config,
    images,
    update,
}: {
    config: PlaygroundConfig;
    images: ImageRecord[];
    update: Update;
}) => {
    const setNvram = (id: string, change: Partial<NvramForm>) => {
        update({
            nvrams: config.nvrams.map((nvram) =>
                nvram.id === id ? { ...nvram, ...change } : nvram,
            ),
        });
    };

    return (
        <Section
            title="NVRAM"
            hint="Memory ranges with no filesystem on them, which the guest reaches as /dev/uio0 and on — running nvram with a label there says which."
            actions={
                <Button
                    kind="ghost"
                    onClick={() =>
                        update({
                            nvrams: [
                                ...config.nvrams,
                                newNvram(config.nvrams.length),
                            ],
                        })
                    }
                >
                    add an NVRAM
                </Button>
            }
        >
            {config.nvrams.map((nvram, index) => (
                <RangeCard
                    key={nvram.id}
                    name={`NVRAM ${index + 1}`}
                    readOnly={nvram.readOnly}
                    onReadOnly={(readOnly) => setNvram(nvram.id, { readOnly })}
                    onRemove={() =>
                        update({
                            nvrams: config.nvrams.filter(
                                (other) => other.id !== nvram.id,
                            ),
                        })
                    }
                >
                    <div className="grid">
                        <Field label="Label">
                            <TextInput
                                value={nvram.label}
                                onChange={(label) =>
                                    setNvram(nvram.id, { label })
                                }
                                mono
                            />
                        </Field>
                        <Field label="Image">
                            <Select
                                value={nvram.imageId ?? ""}
                                onChange={(imageId) =>
                                    setNvram(nvram.id, {
                                        imageId:
                                            imageId === "" ? null : imageId,
                                    })
                                }
                                options={imageOptions(images)}
                            />
                        </Field>
                        <Field label="Size" hint="a multiple of 4Ki">
                            <TextInput
                                value={nvram.length}
                                onChange={(length) =>
                                    setNvram(nvram.id, { length })
                                }
                                placeholder="4Ki"
                                mono
                            />
                        </Field>
                        <Field label="Start" hint="blank: chosen for you">
                            <TextInput
                                value={nvram.start}
                                onChange={(start) =>
                                    setNvram(nvram.id, { start })
                                }
                                placeholder="0x90000000"
                                mono
                            />
                        </Field>
                        <Field label="Owner" hint="of /dev/uioN, set by init">
                            <TextInput
                                value={nvram.user}
                                onChange={(user) =>
                                    setNvram(nvram.id, { user })
                                }
                                placeholder="dapp"
                                mono
                            />
                        </Field>
                    </div>
                </RangeCard>
            ))}
        </Section>
    );
};

export const BootSection = ({
    config,
    update,
}: {
    config: PlaygroundConfig;
    update: Update;
}) => (
    <Section
        title="Boot"
        hint="The entrypoint runs after init. Left empty, an interactive machine gets a shell and any other halts with nothing to do."
        actions={
            <Button
                kind="ghost"
                onClick={() => update({ env: [...config.env, newEnvVar()] })}
            >
                add a variable
            </Button>
        }
    >
        <div className="row">
            <Field label="Entrypoint" wide>
                <TextInput
                    value={config.entrypoint}
                    onChange={(entrypoint) => update({ entrypoint })}
                    placeholder="uname -a"
                    mono
                />
            </Field>
        </div>

        <div className="row">
            <Field label="Working directory">
                <TextInput
                    value={config.workdir}
                    onChange={(workdir) => update({ workdir })}
                    placeholder="/home/dapp"
                    mono
                />
            </Field>
            <Field label="User">
                <TextInput
                    value={config.user}
                    onChange={(user) => update({ user })}
                    placeholder="dapp"
                    mono
                />
            </Field>
            <Field label="Hostname">
                <TextInput
                    value={config.hostname}
                    onChange={(hostname) => update({ hostname })}
                    placeholder="cartesi"
                    mono
                />
            </Field>
        </div>

        {config.env.map((variable) => (
            <div className="row" key={variable.id}>
                <Field label="Name">
                    <TextInput
                        value={variable.name}
                        onChange={(name) =>
                            update({
                                env: config.env.map((other) =>
                                    other.id === variable.id
                                        ? { ...other, name }
                                        : other,
                                ),
                            })
                        }
                        mono
                    />
                </Field>
                <Field label="Value" wide>
                    <TextInput
                        value={variable.value}
                        onChange={(value) =>
                            update({
                                env: config.env.map((other) =>
                                    other.id === variable.id
                                        ? { ...other, value }
                                        : other,
                                ),
                            })
                        }
                        mono
                    />
                </Field>
                <Button
                    kind="ghost"
                    onClick={() =>
                        update({
                            env: config.env.filter(
                                (other) => other.id !== variable.id,
                            ),
                        })
                    }
                >
                    remove
                </Button>
            </div>
        ))}

        <Toggle
            label="Splash"
            hint="the drawing cartesi-machine prints on boot"
            checked={config.splash}
            onChange={(splash) => update({ splash })}
        />
        <Toggle
            label="Set the guest clock"
            hint="to this machine's, on boot; otherwise the guest starts in 1970, which upsets TLS and timestamps"
            checked={config.syncDate}
            onChange={(syncDate) => update({ syncDate })}
        />

        <Field
            label="Init script"
            hint="Shell, run before the entrypoint, as root."
            wide
        >
            <TextArea
                value={config.initScript}
                onChange={(initScript) => update({ initScript })}
                placeholder="busybox mount -t tmpfs none /scratch"
            />
        </Field>

        <Field
            label="Kernel command line"
            hint="Blank uses the one built from the settings here."
            wide
        >
            <TextInput
                value={config.bootargs}
                onChange={(bootargs) => update({ bootargs })}
                placeholder="quiet earlycon=sbi console=hvc1 …"
                mono
            />
        </Field>
    </Section>
);

export const ConsoleSection = ({
    config,
    update,
}: {
    config: PlaygroundConfig;
    update: Update;
}) => (
    <Section title="Console">
        <Toggle
            label="Interactive"
            hint="the machine reads what you type, which makes it unreproducible"
            checked={config.interactive}
            onChange={(interactive) => update({ interactive })}
        />
        <div className="row">
            <Field
                label="Device"
                hint={
                    config.console === "virtio"
                        ? "carries the window size, and SIGWINCH with it"
                        : "always present, but no window size and no signals"
                }
            >
                <Select<ConsoleKind>
                    value={config.console}
                    onChange={(console) => update({ console })}
                    options={[
                        { value: "virtio", label: "VirtIO (hvc1)" },
                        { value: "htif", label: "HTIF (hvc0)" },
                    ]}
                />
            </Field>
            <Field label="Flush output">
                <Select<ConsoleFlushMode>
                    value={config.flushMode}
                    onChange={(flushMode) => update({ flushMode })}
                    options={[
                        { value: "every_char", label: "every character" },
                        { value: "every_line", label: "every line" },
                        { value: "when_full", label: "when the buffer fills" },
                    ]}
                />
            </Field>
        </div>
    </Section>
);

export const AdvancedSection = ({
    config,
    update,
}: {
    config: PlaygroundConfig;
    update: Update;
}) => (
    <Section
        title="Advanced"
        hint="Rarely needed, and exactly what the emulator calls them."
    >
        <Toggle
            label="Unreproducible (iunrep)"
            hint="implied by an interactive machine, and by setting the clock"
            checked={
                config.interactive || config.syncDate || config.unreproducible
            }
            onChange={(unreproducible) => update({ unreproducible })}
        />
        <Toggle
            label="Soft yield"
            checked={config.softYield}
            onChange={(softYield) => update({ softYield })}
        />
        <Toggle
            label="Parallel hash tree updates"
            hint="single-threaded here, so this changes nothing yet"
            checked={config.updateHashTree}
            onChange={(updateHashTree) => update({ updateHashTree })}
        />
        <div className="row">
            <Field label="Cycle limit" hint="imcyclemax; blank for none">
                <TextInput
                    value={config.imcyclemax}
                    onChange={(imcyclemax) => update({ imcyclemax })}
                    placeholder="0"
                    mono
                />
            </Field>
            <Field
                label="Stop after"
                hint="cycles this page runs before giving up"
            >
                <TextInput
                    value={config.maxMcycle}
                    onChange={(maxMcycle) => update({ maxMcycle })}
                    placeholder="1000000000"
                    mono
                />
            </Field>
        </div>
    </Section>
);
