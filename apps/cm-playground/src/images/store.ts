// The image library: kernels and filesystems, kept in IndexedDB so a reload
// does not mean downloading a few hundred megabytes again.
//
// Both the page and the worker open this — the worker reads the bytes straight
// out of the database rather than having them posted across, which for a
// 300 MB rootfs is the difference between one copy and three.
import { proxied } from "./hosts";

export type ImageKind = "kernel" | "flash" | "other";

export interface ImageRecord {
    id: string;
    name: string;
    kind: ImageKind;
    size: number;
    source: string;
    addedAt: number;
}

interface StoredImage extends ImageRecord {
    blob: Blob;
}

const DATABASE = "cm-playground";
const STORE = "images";

const open = (): Promise<IDBDatabase> =>
    new Promise((resolve, reject) => {
        const request = indexedDB.open(DATABASE, 1);
        request.onupgradeneeded = () => {
            request.result.createObjectStore(STORE, { keyPath: "id" });
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });

const transact = async <T>(
    mode: IDBTransactionMode,
    run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> => {
    const database = await open();
    try {
        return await new Promise<T>((resolve, reject) => {
            const request = run(
                database.transaction(STORE, mode).objectStore(STORE),
            );
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    } finally {
        database.close();
    }
};

const withoutBlob = ({ blob: _blob, ...record }: StoredImage): ImageRecord =>
    record;

export const listImages = async (): Promise<ImageRecord[]> => {
    const stored = await transact<StoredImage[]>("readonly", (store) =>
        store.getAll(),
    );
    return stored
        .map(withoutBlob)
        .sort((left, right) => right.addedAt - left.addedAt);
};

export const readImage = async (id: string): Promise<Uint8Array> => {
    const stored = await transact<StoredImage | undefined>(
        "readonly",
        (store) => store.get(id),
    );
    if (stored === undefined) {
        throw new Error(`image ${id} is not in the library`);
    }
    return new Uint8Array(await stored.blob.arrayBuffer());
};

export const deleteImage = (id: string): Promise<unknown> =>
    transact("readwrite", (store) => store.delete(id));

const put = async (image: StoredImage): Promise<ImageRecord> => {
    await transact("readwrite", (store) => store.put(image));
    return withoutBlob(image);
};

const identify = (name: string, kind?: ImageKind): ImageKind => {
    if (kind !== undefined) {
        return kind;
    }
    if (/linux|kernel|\.bin$/i.test(name)) {
        return "kernel";
    }
    if (/rootfs|\.ext2$|\.ext4$|\.sqfs$|\.squashfs$/i.test(name)) {
        return "flash";
    }
    return "other";
};

const newId = (): string =>
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const addFile = (file: File, kind?: ImageKind): Promise<ImageRecord> =>
    put({
        id: newId(),
        name: file.name,
        kind: identify(file.name, kind),
        size: file.size,
        source: "uploaded",
        addedAt: Date.now(),
        blob: file,
    });

/** What went wrong, in the words of whichever side said so. */
const explain = async (response: Response): Promise<string> => {
    try {
        const body = (await response.clone().json()) as { error?: unknown };
        if (typeof body.error === "string") {
            return body.error;
        }
    } catch {
        // not this app's route answering, or not JSON
    }
    return `${response.status} ${response.statusText}`;
};

/**
 * Downloads an image, reporting progress as it goes. Anything served without a
 * `content-length` (or with `content-encoding`) reports bytes rather than a
 * fraction, which is honest and still moves.
 */
export const addUrl = async (
    url: string,
    options: {
        name?: string;
        kind?: ImageKind;
        onProgress?: (received: number, total: number | null) => void;
    } = {},
): Promise<ImageRecord> => {
    let response: Response;
    try {
        response = await fetch(proxied(url));
    } catch (cause) {
        // A cross-origin fetch the far side does not allow fails here, before
        // any status: the browser refuses to hand the response over. Sites this
        // app proxies never get this far; anything else is at the mercy of its
        // own headers.
        throw new Error(
            `${url} could not be read from this page. Reading a file from ` +
                "another site needs that site to allow it — download the " +
                "file and add it with “add a file”.",
            { cause },
        );
    }
    if (!response.ok) {
        throw new Error(await explain(response));
    }

    const declared = response.headers.get("content-length");
    const total = declared === null ? null : Number(declared);
    const name = options.name ?? (url.split("/").pop() || "image");

    const chunks: Uint8Array[] = [];
    let received = 0;
    const reader = response.body?.getReader();
    if (reader === undefined) {
        const bytes = new Uint8Array(await response.arrayBuffer());
        chunks.push(bytes);
        received = bytes.length;
    } else {
        for (;;) {
            const { done, value } = await reader.read();
            if (done) {
                break;
            }
            chunks.push(value);
            received += value.length;
            options.onProgress?.(received, total);
        }
    }

    const blob = new Blob(chunks as BlobPart[]);
    return put({
        id: newId(),
        name,
        kind: identify(name, options.kind),
        size: blob.size,
        source: url,
        addedAt: Date.now(),
        blob,
    });
};
