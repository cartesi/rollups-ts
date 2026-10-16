// A Cartesi Machine, configured and booted in this tab.
//
// The whole page is a client component: every part of it talks to
// something only a browser has — IndexedDB, a worker, a terminal — and
// there is nothing here a server could usefully render first.
"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
    AdvancedSection,
    BootSection,
    ConsoleSection,
    MachineSection,
    NvramSection,
} from "../components/ConfigForm";
import { ConfigJson } from "../components/ConfigJson";
import { ImageLibrary } from "../components/ImageLibrary";
import { RunBar } from "../components/RunBar";
import { SnapshotLibrary } from "../components/SnapshotLibrary";
import type { TerminalHandle } from "../components/Terminal";
import { Choice } from "../components/ui";
import { type ImageRecord, listImages } from "../images/store";
import {
    defaultConfig,
    generate,
    type MachineSource,
    type PlaygroundConfig,
    restoreConfig,
} from "../machine/config";
import { useMachine } from "../machine/useMachine";

// xterm reaches for `self` as it is imported, which the server rendering this
// page does not have. Nothing about a terminal wants rendering ahead of time
// anyway: it has no content until a machine is running.
const Terminal = dynamic(
    () => import("../components/Terminal").then((module) => module.Terminal),
    { ssr: false },
);

const STORED = "cm-playground.config";

const restore = (): PlaygroundConfig | null => {
    try {
        const saved = localStorage.getItem(STORED);
        return saved === null ? null : restoreConfig(JSON.parse(saved));
    } catch {
        // a stored configuration from an older shape, or no storage at all
        return null;
    }
};

const Playground = () => {
    // The form starts at the defaults, and the configuration this browser
    // last had arrives a render later.
    //
    // Reading storage while rendering would be the obvious thing, and it is
    // the one thing that cannot be done here: this page is prerendered, where
    // there is no localStorage to read, and a first client render that
    // disagrees with what the server sent has React throw the whole tree away
    // and build it again. So the read waits for an effect — and the write
    // waits for the read, or it would save the defaults over what it is about
    // to load.
    const [config, setConfig] = useState<PlaygroundConfig>(defaultConfig);
    const [restored, setRestored] = useState(false);
    const [images, setImages] = useState<ImageRecord[]>([]);
    const terminal = useRef<TerminalHandle | null>(null);

    const machine = useMachine(
        useCallback((bytes: Uint8Array) => terminal.current?.write(bytes), []),
        // the worker writes a stored machine straight into the library, so
        // the page hears about it rather than putting it there
        useCallback(() => {
            listImages()
                .then(setImages)
                .catch(() => {
                    // the run bar already says the snapshot was stored; the
                    // list catches up on the next thing that reloads it
                });
        }, []),
    );

    useEffect(() => {
        const saved = restore();
        if (saved !== null) {
            setConfig(saved);
        }
        setRestored(true);
    }, []);

    useEffect(() => {
        if (restored) {
            localStorage.setItem(STORED, JSON.stringify(config));
        }
    }, [config, restored]);

    const update = useCallback((change: Partial<PlaygroundConfig>) => {
        setConfig((was) => ({ ...was, ...change }));
    }, []);

    // An image can be removed from the library while a machine still names it.
    const settled = useCallback(
        (extra: Partial<PlaygroundConfig> = {}): PlaygroundConfig => {
            const known = new Set(images.map((image) => image.id));
            const kept = (id: string | null) =>
                id !== null && known.has(id) ? id : null;
            return {
                ...config,
                snapshotId: kept(config.snapshotId),
                kernelId: kept(config.kernelId),
                rootfsId: kept(config.rootfsId),
                drives: config.drives.map((drive) => ({
                    ...drive,
                    imageId: kept(drive.imageId),
                })),
                nvrams: config.nvrams.map((nvram) => ({
                    ...nvram,
                    imageId: kept(nvram.imageId),
                })),
                ...extra,
            };
        },
        [config, images],
    );

    // One store, two panels: a snapshot is a machine and the rest are the
    // parts one is built from, and neither list has any business in the
    // other's table.
    const snapshots = useMemo(
        () => images.filter((image) => image.kind === "snapshot"),
        [images],
    );
    const parts = useMemo(
        () => images.filter((image) => image.kind !== "snapshot"),
        [images],
    );

    const generated = useMemo(() => generate(settled()), [settled]);
    const loading = config.source === "snapshot";

    const boot = () => {
        terminal.current?.clear();
        // the guest is told the size the terminal actually has, not the one
        // last saved in the form
        const size = terminal.current?.size() ?? { cols: 80, rows: 25 };
        machine.boot(
            generate(settled({ ttyCols: size.cols, ttyRows: size.rows })),
            config.interactive,
            config.maxMcycle.trim() === "" ? null : config.maxMcycle.trim(),
        );
        // Stacked, the terminal is below the form: bring it up rather than
        // leaving the machine to run off screen. Focusing it there would open
        // the on-screen keyboard over a machine that has not booted yet, so
        // that waits for a tap.
        if (window.matchMedia("(max-width: 1000px)").matches) {
            terminal.current?.reveal();
        } else {
            terminal.current?.focus();
        }
    };

    return (
        <div className="app">
            <header className="masthead">
                <h1>
                    Cartesi Machine <span>Playground</span>
                </h1>
                <p>
                    A RISC-V machine, configured here and running in this tab.
                    Nothing to install, and the only thing the server does is
                    hand over the images.
                </p>
            </header>

            <div className="columns">
                <div className="column column-config">
                    <Choice<MachineSource>
                        value={config.source}
                        onChange={(source) => update({ source })}
                        options={[
                            {
                                value: "config",
                                label: "Build a machine",
                                hint: "a kernel, a root filesystem and what runs on it",
                            },
                            {
                                value: "snapshot",
                                label: "Load a snapshot",
                                hint: "a stored machine, from a tarball",
                            },
                        ]}
                    />

                    {loading ? (
                        <SnapshotLibrary
                            snapshots={snapshots}
                            onChange={setImages}
                            snapshotId={config.snapshotId}
                            onPick={(snapshotId) => update({ snapshotId })}
                        />
                    ) : (
                        <>
                            <ImageLibrary
                                images={parts}
                                onChange={setImages}
                                kernelId={config.kernelId}
                                rootfsId={config.rootfsId}
                                onPick={(slot, id) =>
                                    update(
                                        slot === "kernel"
                                            ? { kernelId: id }
                                            : { rootfsId: id },
                                    )
                                }
                            />
                            <MachineSection
                                config={config}
                                images={parts}
                                update={update}
                            />
                            <NvramSection
                                config={config}
                                images={parts}
                                update={update}
                            />
                            <BootSection config={config} update={update} />
                        </>
                    )}

                    {/* A stored machine settled its own configuration when it
                        was stored; what is left to say about it is how this
                        page drives it, which is these two. */}
                    <ConsoleSection
                        config={config}
                        update={update}
                        loading={loading}
                    />
                    <AdvancedSection
                        config={config}
                        update={update}
                        loading={loading}
                    />
                    <ConfigJson generated={generated} />
                </div>

                <div className="column column-run">
                    <RunBar
                        state={machine.state}
                        problems={generated.problems}
                        onBoot={boot}
                        onStop={machine.stop}
                        onStore={machine.store}
                        onClear={() => terminal.current?.clear()}
                    />
                    <Terminal
                        handle={terminal}
                        onData={machine.sendInput}
                        onResize={(cols, rows) =>
                            machine.resize(
                                generate(
                                    settled({ ttyCols: cols, ttyRows: rows }),
                                ).runtime,
                            )
                        }
                    />
                </div>
            </div>
        </div>
    );
};

export default Playground;
