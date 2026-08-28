// Machines someone else already built.
//
// A snapshot is the directory `cartesi-machine --store=<dir>` writes — a
// config and one file per memory range — packed into a tar. Loading one skips
// everything the form below does: the machine arrives with its drives, its
// command line and its cycle count already settled, resuming wherever it was
// stored rather than booting from scratch.
import { deleteImage, type ImageRecord } from "../images/store";
import { formatSize } from "../machine/config";
import { LibraryAdd, LibraryStatus } from "./LibraryAdd";
import { Button, Section } from "./ui";
import { useLibrary } from "./useLibrary";

export const SnapshotLibrary = ({
    snapshots,
    onChange,
    snapshotId,
    onPick,
}: {
    snapshots: ImageRecord[];
    onChange: (images: ImageRecord[]) => void;
    snapshotId: string | null;
    onPick: (id: string | null) => void;
}) => {
    const { busy, progress, error, run, onProgress } = useLibrary(onChange);

    return (
        <Section
            title="Snapshots"
            hint="A stored machine, tarred up: what `cartesi-machine --store=snapshot` writes, packed with `tar -czf snapshot.tar.gz -C snapshot .`"
        >
            <p className="field-hint">
                Gzipped archives are unpacked here, and an archive that wraps
                the machine in a directory of its own is fine either way. As
                with images, a URL on GitHub comes through this app's server and
                anywhere else has to allow the read itself.
            </p>

            <LibraryAdd
                kind="snapshot"
                placeholder="https://…/snapshot.tar.gz"
                busy={busy}
                run={run}
                onProgress={onProgress}
            />

            <LibraryStatus busy={busy} progress={progress} error={error} />

            {snapshots.length === 0 ? (
                <p className="hint">
                    No snapshots yet. Fetch one from a URL, or add a tarball
                    from this machine.
                </p>
            ) : (
                <table className="images">
                    <thead>
                        <tr>
                            <th>name</th>
                            <th>size</th>
                            <th>load</th>
                            <th />
                        </tr>
                    </thead>
                    <tbody>
                        {snapshots.map((snapshot) => (
                            <tr key={snapshot.id}>
                                <td>
                                    <span className="mono">
                                        {snapshot.name}
                                    </span>
                                </td>
                                <td className="numeric">
                                    {formatSize(snapshot.size)}
                                </td>
                                <td className="slots">
                                    <Button
                                        kind={
                                            snapshotId === snapshot.id
                                                ? "primary"
                                                : "ghost"
                                        }
                                        onClick={() =>
                                            onPick(
                                                snapshotId === snapshot.id
                                                    ? null
                                                    : snapshot.id,
                                            )
                                        }
                                    >
                                        {snapshotId === snapshot.id
                                            ? "chosen"
                                            : "use this"}
                                    </Button>
                                </td>
                                <td>
                                    <Button
                                        kind="ghost"
                                        onClick={() =>
                                            void run(
                                                snapshot.name,
                                                async () => {
                                                    await deleteImage(
                                                        snapshot.id,
                                                    );
                                                    if (
                                                        snapshotId ===
                                                        snapshot.id
                                                    ) {
                                                        onPick(null);
                                                    }
                                                },
                                            )
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
