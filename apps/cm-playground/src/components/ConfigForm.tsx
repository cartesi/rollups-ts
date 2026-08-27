// Everything a machine can be told before it boots.
import type { ImageRecord } from "../images/store";
import type {
    ConsoleKind,
    DriveForm,
    PlaygroundConfig,
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

const newId = (): string => Math.random().toString(36).slice(2, 10);

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
                                {
                                    id: newId(),
                                    label: `drive${config.drives.length + 1}`,
                                    imageId: null,
                                    length: "",
                                    start: "",
                                    readOnly: false,
                                },
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

            {config.drives.length === 0 ? (
                <p className="hint">
                    The root filesystem comes from the image library above.
                    Extra drives appear to the guest as /dev/pmem1 and on.
                </p>
            ) : null}

            {config.drives.map((drive, index) => (
                <div className="drive" key={drive.id}>
                    <div className="row">
                        <Field label={`Drive ${index + 1} label`}>
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
                                options={[
                                    { value: "", label: "empty" },
                                    ...images.map((image) => ({
                                        value: image.id,
                                        label: image.name,
                                    })),
                                ]}
                            />
                        </Field>
                        <Field label="Size" hint="blank: the image's own size">
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
                        <div className="drive-actions">
                            <Toggle
                                label="read only"
                                checked={drive.readOnly}
                                onChange={(readOnly) =>
                                    setDrive(drive.id, { readOnly })
                                }
                            />
                            <Button
                                kind="ghost"
                                onClick={() =>
                                    update({
                                        drives: config.drives.filter(
                                            (other) => other.id !== drive.id,
                                        ),
                                    })
                                }
                            >
                                remove
                            </Button>
                        </div>
                    </div>
                </div>
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
                onClick={() =>
                    update({
                        env: [
                            ...config.env,
                            { id: newId(), name: "", value: "" },
                        ],
                    })
                }
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
            hint="implied by an interactive machine"
            checked={config.interactive || config.unreproducible}
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
