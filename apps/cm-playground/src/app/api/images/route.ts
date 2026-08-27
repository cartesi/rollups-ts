// Fetches a release asset for the page.
//
// The whole job is being a different origin than GitHub: the server has no
// cross-origin policy to satisfy, so it reads the asset and hands it back on a
// same-origin response the page is allowed to touch. See ../../images/hosts.ts
// for why the page cannot do this itself, and for the list of sites this will
// go to.
//
// The body is passed through as a stream. A rootfs is a third of a gigabyte:
// buffering one here would hold it in the server's memory for as long as the
// browser takes to write it to IndexedDB, for no gain at either end.
import { isProxyable } from "../../../images/hosts";

// A stream from another host, with no two requests alike: nothing about this
// is static, and nothing about it should be cached on the way through.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const failed = (status: number, message: string): Response =>
    Response.json({ error: message }, { status });

export const GET = async (request: Request): Promise<Response> => {
    const url = new URL(request.url).searchParams.get("url");
    if (url === null) {
        return failed(400, "no url to fetch");
    }
    if (!isProxyable(url)) {
        return failed(
            403,
            `${url} is not one of the sites this app fetches from ` +
                "(a proxy that fetches anything is a way into the network it " +
                "runs in). Download the file and add it with “add a file”.",
        );
    }

    let upstream: Response;
    try {
        upstream = await fetch(url, {
            // GitHub answers a release download with a redirect to its object
            // storage, which is the response that actually carries the bytes.
            redirect: "follow",
            headers: { accept: "*/*" },
        });
    } catch (cause) {
        return failed(
            502,
            `${url} could not be reached: ${
                cause instanceof Error ? cause.message : String(cause)
            }`,
        );
    }

    if (!upstream.ok || upstream.body === null) {
        return failed(
            upstream.status === 404 ? 404 : 502,
            `${url} answered ${upstream.status} ${upstream.statusText}`,
        );
    }

    const headers = new Headers({
        "content-type":
            upstream.headers.get("content-type") ?? "application/octet-stream",
        // The image is on its way to IndexedDB, which is where it is kept; a
        // copy in the HTTP cache as well would be a few hundred megabytes of
        // the same bytes.
        "cache-control": "no-store",
    });

    // Only when the length describes what arrives here: fetch decompresses an
    // encoded body on the way in, which leaves the declared length describing
    // something this response no longer contains. Without it the page counts
    // bytes instead of a percentage.
    const length = upstream.headers.get("content-length");
    if (length !== null && upstream.headers.get("content-encoding") === null) {
        headers.set("content-length", length);
    }

    return new Response(upstream.body, { status: 200, headers });
};
