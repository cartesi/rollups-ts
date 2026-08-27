// Which sites the page reads images from through this app's own server, and
// how it addresses that route.
//
// The page cannot read a release asset itself: GitHub serves them with no
// `access-control-allow-origin`, on the redirect and on the storage it points
// at, so the browser refuses the response before the page ever sees a status.
// A request to this origin has no such rule to answer to, and the bytes come
// back on a same-origin response the page can read.
//
// The list is short on purpose. A proxy that fetches whatever it is given is a
// way into whatever network it runs in, so anything not named here is fetched
// by the browser directly and lives or dies by that site's own headers.

/** The route, shared so the client and the handler cannot drift apart. */
export const PROXY_ROUTE = "/api/images";

export const PROXY_HOSTS: readonly string[] = [
    "github.com",
    "objects.githubusercontent.com",
    "release-assets.githubusercontent.com",
];

/** Whether this app will fetch `url` on the page's behalf. */
export const isProxyable = (url: string): boolean => {
    let parsed: URL;
    try {
        parsed = new URL(url);
    } catch {
        return false;
    }
    // https only: every host here serves it, and a plaintext request would be
    // one this app made rather than one the browser could be warned about.
    return (
        parsed.protocol === "https:" && PROXY_HOSTS.includes(parsed.hostname)
    );
};

/**
 * The address to fetch `url` from: this app's route when it will carry it, and
 * otherwise the URL itself, which then needs the far side to allow the read.
 */
export const proxied = (url: string): string =>
    isProxyable(url) ? `${PROXY_ROUTE}?url=${encodeURIComponent(url)}` : url;
