// Kernels and filesystems: where they come from and which ones this machine
// is built out of. They are kept in IndexedDB, so this is also one of the two
// places in the app that knows a few hundred megabytes are involved.
import { CATALOG } from "../images/catalog";
import { addUrl, deleteImage, type ImageRecord } from "../images/store";
import { formatSize } from "../machine/config";
import { LibraryAdd, LibraryStatus } from "./LibraryAdd";
import { Button, Section } from "./ui";
import { useLibrary } from "./useLibrary";

export const ImageLibrary = ({
    images,
    onChange,
    kernelId,
    rootfsId,
    onPick,
}: {
    /** The images a machine can be built from — snapshots are not among them. */
    images: ImageRecord[];
    onChange: (images: ImageRecord[]) => void;
    kernelId: string | null;
    rootfsId: string | null;
    onPick: (slot: "kernel" | "rootfs", id: string | null) => void;
}) => {
    const { busy, progress, error, run, onProgress } = useLibrary(onChange);

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

            <LibraryAdd
                placeholder="https://…/rootfs.ext2"
                busy={busy}
                run={run}
                onProgress={onProgress}
            />

            <LibraryStatus busy={busy} progress={progress} error={error} />

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
