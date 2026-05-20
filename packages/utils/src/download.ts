import { unpackTar } from "modern-tar/fs";
import { createHash } from "node:crypto";
import fs from "node:fs";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { createGunzip } from "node:zlib";

type DownloadAndExtractParams = {
    /** for logging purposes */
    name: string;
    /** URL to download the file from */
    downloadUrl: string;
    /** The expected SHA-256 hash of the downloaded file */
    expectedHash: string;
    /** Destination directory to extract the files to */
    destination: string;
};

const ensureDir = (dir: string) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};

export const downloadAndExtract = async (params: DownloadAndExtractParams) => {
    const { name, downloadUrl, expectedHash, destination } = params;

    try {
        console.info(
            `Downloading and extracting artifact ${name}\nfrom: ${downloadUrl}\n\n`,
        );

        //Fetch the artifact (automatically handles redirects)
        const response: Response = await fetch(downloadUrl);

        if (!response.ok) {
            throw new Error(
                `Failed to download: Status Code ${response.status}`,
            );
        }

        if (!response.body) {
            throw new Error("Response body is empty");
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        console.info(`Download complete for ${name}, verifying integrity...`);

        const actualHash = createHash("sha256").update(buffer).digest("hex");

        if (actualHash !== expectedHash) {
            throw new Error(
                `Hash mismatch for ${name}: expected ${expectedHash}, got ${actualHash}`,
            );
        }

        console.info(`Hash verification succeeded for ${name}, extracting...`);

        ensureDir(destination);

        // Convert the safe buffer into a ReadableStream for the extraction process
        const bufferStream = Readable.from(buffer);

        /** unpackTar by default defend against tarSlip attacks */
        await pipeline(bufferStream, createGunzip(), unpackTar(destination));

        console.info(`Success! Extracted ${params.name} to ${destination}\n`);
    } catch (err) {
        console.error(err);
        throw new Error(`Failed to download and extract ${name}`, {
            cause: err,
        });
    }
};
