import { unpackTar } from "modern-tar/fs";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { createGunzip } from "node:zlib";

export type TarballSource =
    | string
    | {
          /** URL to download the tar.gz from */
          url: string;
          /** expected SHA-256 hash of the downloaded file, as a hex string */
          sha256?: string;
      };

export const resolveSource = (source: TarballSource) =>
    typeof source === "string" ? { url: source } : source;

/**
 * Download a tar.gz and extract it to a directory under the OS temporary
 * directory, keyed by the URL (and expected hash). Extraction is cached:
 * if the same tarball was fully extracted before, nothing is downloaded.
 * @returns the directory the tarball was extracted to
 */
export const downloadAndExtract = async (
    source: TarballSource,
): Promise<string> => {
    const { url, sha256 } = resolveSource(source);
    const key = createHash("sha256")
        .update(`${url}\n${sha256 ?? ""}`)
        .digest("hex")
        .slice(0, 16);
    const destination = path.join(os.tmpdir(), "cartesi-wagmi-plugin", key);
    const marker = path.join(destination, ".complete");
    if (fs.existsSync(marker)) {
        return destination;
    }

    console.info(`Downloading ${url}`);
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to download ${url}: status ${response.status}`);
    }
    const buffer = Buffer.from(await response.arrayBuffer());

    if (sha256) {
        const actualHash = createHash("sha256").update(buffer).digest("hex");
        if (actualHash !== sha256) {
            throw new Error(
                `SHA-256 mismatch for ${url}: expected ${sha256}, got ${actualHash}`,
            );
        }
    }

    // extract to a staging directory and rename, so a concurrent or aborted
    // run never sees a half-extracted destination
    const staging = `${destination}.${process.pid}`;
    fs.mkdirSync(staging, { recursive: true });
    try {
        // unpackTar defends against tar-slip attacks by default
        await pipeline(
            Readable.from(buffer),
            createGunzip(),
            unpackTar(staging),
        );
        fs.writeFileSync(path.join(staging, ".complete"), url);
        fs.renameSync(staging, destination);
    } catch (err) {
        fs.rmSync(staging, { recursive: true, force: true });
        if (fs.existsSync(marker)) {
            // lost a race against a concurrent extraction of the same tarball
            return destination;
        }
        throw new Error(`Failed to download and extract ${url}`, {
            cause: err,
        });
    }
    console.info(`Extracted ${url} to ${destination}`);
    return destination;
};
