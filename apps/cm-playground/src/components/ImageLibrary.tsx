// Kernels and filesystems: where they come from and which ones this machine
// uses. They are kept in IndexedDB, so this is also the only place in the app
// that knows a few hundred megabytes are involved.
import { useCallback, useEffect, useRef, useState } from "react";

import { CATALOG } from "../images/catalog";
import {
    addFile,
    addUrl,
    deleteImage,
    type ImageRecord,
    listImages,
} from "../images/store";
import { formatSize } from "../machine/config";
import { Button, Field, Section, TextInput } from "./ui";

export const ImageLibrary = ({
    images,
    onChange,
    kernelId,
    rootfsId,
    onPick,
}: {
    images: ImageRecord[];
    onChange: (images: ImageRecord[]) => void;
    kernelId: string | null;
    rootfsId: string | null;
    onPick: (slot: "kernel" | "rootfs", id: string | null) => void;
}) => {
    const [busy, setBusy] = useState<string | null>(null);
    const [progress, setProgress] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [url, setUrl] = useState("");
    const fileInput = useRef<HTMLInputElement>(null);

    const refresh = useCallback(async () => {
        onChange(await listImages());
    }, [onChange]);

    useEffect(() => {
        refresh().catch((cause: unknown) => setError(String(cause)));
    }, [refresh]);

    const run = async (label: string, work: () => Promise<unknown>) => {
        setBusy(label);
        setProgress(null);
        setError(null);
        try {
            await work();
            await refresh();
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : String(cause));
        } finally {
            setBusy(null);
            setProgress(null);
        }
    };

    // A rootfs is a third of a gigabyte, so a download that says nothing for a
    // minute looks like one that has stalled.
    const onProgress = (received: number, total: number | null) => {
        setProgress(
            total === null
                ? formatSize(received)
                : `${formatSize(received)} of ${formatSize(total)} · ${Math.round(
                      (received / total) * 100,
                  )}%`,
        );
    };

    const have = (url: string) => images.some((image) => image.source === url);

    return (
        <Section
            title="Images"
            hint="Kept in this browser's storage, so they are added once."
        >
            <div className="catalog">
                {CATALOG.map((entry) => (
                    <div className="catalog-row" key={entry.url}>
                        <div>
                            <strong>{entry.name}</strong>
                            <div className="field-hint">
                                {entry.description} · {formatSize(entry.size)}
                            </div>
                        </div>
                        {have(entry.url) ? (
                            <span className="field-hint">in library</span>
                        ) : (
                            // Through this app's server: GitHub serves release
                            // assets with no cross-origin headers, so the page
                            // cannot read one itself (see images/hosts.ts).
                            <Button
                                kind="ghost"
                                disabled={busy !== null}
                                onClick={() =>
                                    void run(entry.name, () =>
                                        addUrl(entry.url, {
                                            name: entry.name,
                                            kind: entry.kind,
                                            onProgress,
                                        }),
                                    )
                                }
                            >
                                fetch
                            </Button>
                        )}
                    </div>
                ))}
            </div>

            <p className="field-hint">
                Releases come through this app's server, which is what makes
                them readable here at all — GitHub serves release assets with no
                cross-origin headers. Anywhere else has to allow the read
                itself; a file already on this machine goes in with{" "}
                <strong>add a file</strong>.
            </p>

            <div className="row">
                <Field label="From a URL" wide>
                    <TextInput
                        value={url}
                        onChange={setUrl}
                        placeholder="https://…/rootfs.ext2"
                        mono
                    />
                </Field>
                <Button
                    disabled={busy !== null || url.trim() === ""}
                    onClick={() =>
                        void run(url, async () => {
                            await addUrl(url.trim(), { onProgress });
                            setUrl("");
                        })
                    }
                >
                    fetch
                </Button>
                <Button
                    kind="ghost"
                    disabled={busy !== null}
                    onClick={() => fileInput.current?.click()}
                >
                    add a file
                </Button>
                <input
                    ref={fileInput}
                    type="file"
                    hidden
                    onChange={(event) => {
                        const files = Array.from(event.target.files ?? []);
                        event.target.value = "";
                        if (files.length > 0) {
                            void run(files[0]?.name ?? "file", async () => {
                                for (const file of files) {
                                    await addFile(file);
                                }
                            });
                        }
                    }}
                />
            </div>

            {busy === null ? null : (
                <p className="hint">
                    working on {busy}
                    {progress === null ? "" : ` — ${progress}`}…
                </p>
            )}
            {error === null ? null : <p className="error">{error}</p>}

            {images.length === 0 ? (
                <p className="hint">
                    The library is empty. A machine needs at least a kernel.
                </p>
            ) : (
                <table className="images">
                    <thead>
                        <tr>
                            <th>name</th>
                            <th>size</th>
                            <th>use as</th>
                            <th />
                        </tr>
                    </thead>
                    <tbody>
                        {images.map((image) => (
                            <tr key={image.id}>
                                <td>
                                    <span className="mono">{image.name}</span>
                                </td>
                                <td className="numeric">
                                    {formatSize(image.size)}
                                </td>
                                <td className="slots">
                                    <Button
                                        kind={
                                            kernelId === image.id
                                                ? "primary"
                                                : "ghost"
                                        }
                                        onClick={() =>
                                            onPick(
                                                "kernel",
                                                kernelId === image.id
                                                    ? null
                                                    : image.id,
                                            )
                                        }
                                    >
                                        kernel
                                    </Button>
                                    <Button
                                        kind={
                                            rootfsId === image.id
                                                ? "primary"
                                                : "ghost"
                                        }
                                        onClick={() =>
                                            onPick(
                                                "rootfs",
                                                rootfsId === image.id
                                                    ? null
                                                    : image.id,
                                            )
                                        }
                                    >
                                        root
                                    </Button>
                                </td>
                                <td>
                                    <Button
                                        kind="ghost"
                                        onClick={() =>
                                            void run(image.name, async () => {
                                                await deleteImage(image.id);
                                                if (kernelId === image.id) {
                                                    onPick("kernel", null);
                                                }
                                                if (rootfsId === image.id) {
                                                    onPick("rootfs", null);
                                                }
                                            })
                                        }
                                    >
                                        remove
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </Section>
    );
};
