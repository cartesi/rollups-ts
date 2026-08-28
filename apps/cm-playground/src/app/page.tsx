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
import type { TerminalHandle } from "../components/Terminal";
import type { ImageRecord } from "../images/store";
import {
    defaultConfig,
    generate,
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

    const generated = useMemo(() => generate(settled()), [settled]);

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
                    <ImageLibrary
                        images={images}
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
                        images={images}
                        update={update}
                    />
                    <NvramSection
                        config={config}
                        images={images}
                        update={update}
                    />
                    <BootSection config={config} update={update} />
                    <ConsoleSection config={config} update={update} />
                    <AdvancedSection config={config} update={update} />
                    <ConfigJson generated={generated} />
                </div>

                <div className="column column-run">
                    <RunBar
                        state={machine.state}
                        problems={generated.problems}
                        onBoot={boot}
                        onStop={machine.stop}
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
