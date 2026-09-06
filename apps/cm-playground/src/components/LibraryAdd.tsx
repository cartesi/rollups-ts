// Putting something into the library: from a URL, or from this machine.
//
// Shared by both panels because the two ways in are the same for a kernel and
// for a whole stored machine — only what the placeholder suggests, and what
// the result is filed as, differ.
import { useRef, useState } from "react";

import { addFile, addUrl, type ImageKind } from "../images/store";
import { Button, Field, TextInput } from "./ui";

export const LibraryAdd = ({
    kind,
    placeholder,
    busy,
    run,
    onProgress,
}: {
    /** What anything added here is, whatever it happens to be called. */
    kind?: ImageKind;
    placeholder: string;
    busy: string | null;
    run: (label: string, work: () => Promise<unknown>) => Promise<void>;
    onProgress: (received: number, total: number | null) => void;
}) => {
    const [url, setUrl] = useState("");
    const fileInput = useRef<HTMLInputElement>(null);

    return (
        <div className="row">
            <Field label="From a URL" wide>
                <TextInput
                    value={url}
                    onChange={setUrl}
                    placeholder={placeholder}
                    mono
                />
            </Field>
            <Button
                disabled={busy !== null || url.trim() === ""}
                onClick={() =>
                    void run(url, async () => {
                        await addUrl(url.trim(), { kind, onProgress });
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
                                await addFile(file, kind);
                            }
                        });
                    }
                }}
            />
        </div>
    );
};

/** What the panel is doing, and what it failed at. */
export const LibraryStatus = ({
    busy,
    progress,
    error,
}: {
    busy: string | null;
    progress: string | null;
    error: string | null;
}) => (
    <>
        {busy === null ? null : (
            <p className="hint">
                working on {busy}
                {progress === null ? "" : ` — ${progress}`}…
            </p>
        )}
        {error === null ? null : <p className="error">{error}</p>}
    </>
);
