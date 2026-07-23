import type { CartesiPublicClient } from "@cartesi/viem";

/**
 * Identity of the Cartesi node a client points at, used to scope query keys.
 * Uses the transport URL as primary identity: it is stable across client
 * instances and provider remounts, so the cache survives a remount and
 * revives when the user switches back to a previously used server.
 * Falls back to `client.uid` only for custom transports that expose no url;
 * uid is minted per client instance, so uid-scoped caches do not survive
 * remounts — acceptable for that exotic case only.
 */
export const serverUrl = (client: CartesiPublicClient): string => {
    const { url } = client.transport as { url?: string };
    return url ?? client.uid;
};
