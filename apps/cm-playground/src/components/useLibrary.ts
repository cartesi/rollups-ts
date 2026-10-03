// The state a library panel has, whichever library it is: what it is busy
// with, how far along that is, and what went wrong — plus the reload that
// follows anything which changes the store.
//
// Both panels are the same shape because the store is: a few hundred megabytes
// arriving over a slow link, which has to say so while it happens.
import { useCallback, useEffect, useState } from "react";

import { type ImageRecord, listImages } from "../images/store";
import { formatSize } from "../machine/config";

export const useLibrary = (onChange: (images: ImageRecord[]) => void) => {
    const [busy, setBusy] = useState<string | null>(null);
    const [progress, setProgress] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

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

    return { busy, progress, error, run, onProgress };
};
