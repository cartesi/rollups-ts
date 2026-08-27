// Node entry point: the public API bound to the N-API addon.
import { createMachineApi } from "./machine-impl.js";
import { addon, ensureJsonrpcServerBinary } from "./node/addon.js";
import { setRemoteSpawner } from "./remote-binding.js";
import { createRemoteApi } from "./remote-impl.js";
import type { RemoteCartesiMachine } from "./remote-cartesi-machine.js";

const machineApi = createMachineApi(addon);
const remoteApi = createRemoteApi(addon);

/**
 * Spawns a cartesi-jsonrpc-machine server and connects to it. The prebuilt
 * platform package bundles the executable; ensureJsonrpcServerBinary points
 * the emulator at it unless the caller chose one.
 */
export const spawn = (
    address: string = "127.0.0.1:0",
    timeout: number = -1,
): RemoteCartesiMachine => {
    ensureJsonrpcServerBinary();
    return remoteApi.spawn(address, timeout);
};

/**
 * Connects to an already running cartesi-jsonrpc-machine server.
 */
export const connect = (
    address: string,
    timeout: number = -1,
): RemoteCartesiMachine => remoteApi.connect(address, timeout);

// rollups("path/to/snapshot") loads the snapshot into a server it spawns
setRemoteSpawner(spawn);

export const {
    empty,
    create,
    load,
    getLastError,
    getVersion,
    getSlirpVersion,
    getDefaultConfig,
    getRegAddress,
    getAddressName,
    verifyStep,
    verifyStepUarch,
    verifyResetUarch,
    verifySendCmioResponse,
} = machineApi;

// a machine in a cartesi-jsonrpc-machine server, over fetch: no binding
// involved, so it works in a browser as well as here
export {
    connect as connectHttp,
    type ConnectOptions as HttpConnectOptions,
    type RemoteMachineClient,
} from "./jsonrpc/client.js";

export * from "./cartesi-machine.js";
export * from "./net.js";
export * from "./remote-cartesi-machine.js";
export * from "./rollups.js";
export * from "./types.js";
