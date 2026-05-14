import { unpackTar } from "modern-tar/fs";
import fs from "node:fs";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { ReadableStream } from "node:stream/web";
import { createGunzip } from "node:zlib";

type DownloadAndExtractParams = {
    /** for logging purposes */
    name: string;
    /** URL to download the file from */
    downloadUrl: string;
    /** Destination directory to extract the files to */
    destination: string;
};

const ensureDir = (dir: string) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};

export const downloadAndExtract = async (params: DownloadAndExtractParams) => {
    const { name, downloadUrl, destination } = params;

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

        ensureDir(destination);

        // Convert Web Stream to Node Stream and pipeline it
        // Casting the body as an exact ReadableStream type for the Node compatibility layer
        const responseStream = Readable.fromWeb(
            response.body as ReadableStream,
        );

        /** unpackTar by default defend against tarSlip attacks */
        await pipeline(responseStream, createGunzip(), unpackTar(destination));

        console.info(`Success! Extracted ${params.name} to ${destination}\n`);
    } catch (err) {
        console.error(err);
        throw new Error(`Failed to download and extract ${name}`, {
            cause: err,
        });
    }
};
