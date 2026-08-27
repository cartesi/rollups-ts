// `rollups("path/to/snapshot")` spawns a cartesi-jsonrpc-machine server, which
// only a binding that can start a process and open sockets can do. The entry
// point that has one registers it here, so rollups.ts never imports a loader
// and the browser build does not drag node:child_process into a bundle just to
// support an overload it cannot serve.
import type { RemoteCartesiMachine } from "./remote-cartesi-machine.js";

export type RemoteSpawner = (
    address: string,
    timeout: number,
) => RemoteCartesiMachine;

let spawner: RemoteSpawner | null = null;

export const setRemoteSpawner = (fn: RemoteSpawner): void => {
    spawner = fn;
};

export const getRemoteSpawner = (): RemoteSpawner => {
    if (spawner === null) {
        throw new Error(
            "spawning a machine server requires the Node build of @cartesi/machine; " +
                "in the browser, pass a machine to rollups() instead of a directory",
        );
    }
    return spawner;
};
