// The guest's console, as a terminal.
//
// Nothing sits between the two: no echo, no line editing, no interpretation of
// Ctrl+C. The guest is running Linux and has a terminal driver of its own;
// anything done here would be done twice.
import { FitAddon } from "@xterm/addon-fit";
import { Terminal as XTerm } from "@xterm/xterm";
import { useEffect, useImperativeHandle, useRef, type RefObject } from "react";
import "@xterm/xterm/css/xterm.css";

export interface TerminalHandle {
    write(bytes: Uint8Array): void;
    clear(): void;
    focus(): void;
    /** Brings the terminal on screen, for the layout where it is below the fold. */
    reveal(): void;
    size(): { cols: number; rows: number };
}

export const Terminal = ({
    handle,
    onData,
    onResize,
}: {
    handle: RefObject<TerminalHandle | null>;
    onData: (bytes: Uint8Array) => void;
    onResize: (cols: number, rows: number) => void;
}) => {
    const host = useRef<HTMLDivElement>(null);
    const terminal = useRef<XTerm | null>(null);
    const data = useRef(onData);
    const resized = useRef(onResize);
    data.current = onData;
    resized.current = onResize;

    useImperativeHandle(handle, () => ({
        write: (bytes) => terminal.current?.write(bytes),
        clear: () => terminal.current?.reset(),
        focus: () => terminal.current?.focus(),
        reveal: () => host.current?.scrollIntoView({ block: "start" }),
        size: () => ({
            cols: terminal.current?.cols ?? 80,
            rows: terminal.current?.rows ?? 25,
        }),
    }));

    useEffect(() => {
        const element = host.current;
        if (element === null) {
            return;
        }

        const xterm = new XTerm({
            // The guest hands over bare line feeds: on a physical terminal the
            // host's own tty driver adds the carriage returns, and here there
            // is no host tty.
            convertEol: true,
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            fontSize: 13,
            theme: { background: "#0b0d11", foreground: "#d7dae0" },
            cursorBlink: true,
            scrollback: 10000,
        });
        const fit = new FitAddon();
        xterm.loadAddon(fit);
        xterm.open(element);
        terminal.current = xterm;

        // Measuring before the browser has laid the panel out gives xterm a
        // zero-sized viewport, which it does not survive; a frame later the
        // element has a size.
        const resize = () => {
            try {
                if (element.clientWidth > 0 && element.clientHeight > 0) {
                    fit.fit();
                }
            } catch {
                // xterm is between renderers
            }
        };
        requestAnimationFrame(resize);

        const encoder = new TextEncoder();
        const typed = xterm.onData((text) =>
            data.current(encoder.encode(text)),
        );
        const sized = xterm.onResize(({ cols, rows }) =>
            resized.current(cols, rows),
        );

        const observer = new ResizeObserver(resize);
        observer.observe(element);

        return () => {
            observer.disconnect();
            typed.dispose();
            sized.dispose();
            xterm.dispose();
            terminal.current = null;
        };
    }, []);

    return <div className="terminal" ref={host} />;
};
