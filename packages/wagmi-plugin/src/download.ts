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
 * Download a tar.gz and extract it to a fresh directory under the OS
 * temporary directory. Nothing is kept between runs: these tarballs are a few
 * hundred KB, and caching them saved less time than the cache took to keep
 * correct.
 * @returns the directory the tarball was extracted to, which the caller owns
 * and should remove once done with it
 */
export const downloadAndExtract = async (
    source: TarballSource,
): Promise<string> => {
    const { url, sha256 } = resolveSource(source);

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

    const destination = fs.mkdtempSync(
        path.join(os.tmpdir(), "cartesi-wagmi-plugin-"),
    );
    try {
        // unpackTar defends against tar-slip attacks by default
        await pipeline(
            Readable.from(buffer),
            createGunzip(),
            unpackTar(destination),
        );
    } catch (err) {
        fs.rmSync(destination, { recursive: true, force: true });
        throw new Error(`Failed to extract ${url}`, { cause: err });
    }
    return destination;
};
