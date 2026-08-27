// Browser entry point: the public API bound to the WebAssembly module.
//
// The module is instantiated asynchronously, so unlike the Node entry — where
// the addon is loaded at import time — the machine constructors come from
// `init()`. Everything after that is the same synchronous API:
//
//     const cartesi = await init();
//     const machine = cartesi.create({ ram: { length: 0x4000000 } });
//     machine.run(1000n);
//
// `run()` occupies the thread it is called on, so a page that stays responsive
// runs this in a worker (see ./browser/worker.js).
import { createMachineApi, type MachineApi } from "./machine-impl.js";
import { createWasmAddon } from "./wasm/addon.js";
import { readSnapshot, writeSnapshot } from "./wasm/snapshot.js";
import {
    loadModule,
    type CartesiMachineModule,
    type LoadModuleOptions,
} from "./wasm/module.js";
import type { EmscriptenFS } from "./wasm/module.js";

export type InitOptions = LoadModuleOptions;

/**
 * The machine API, plus the two handles that only exist in this build: the
 * module itself and its filesystem, which is where stored machines live.
 */
export interface CartesiMachineWasm extends MachineApi {
    module: CartesiMachineModule;
    fs: EmscriptenFS;

    /**
     * Unpacks a stored machine — a tar of what `machine.store()` wrote — into
     * the module's filesystem, ready for `load()`:
     *
     *     const snapshot = await fetch("/app.tar").then((r) => r.arrayBuffer());
     *     cartesi.writeSnapshot("/machines/app", new Uint8Array(snapshot));
     *     const machine = cartesi.load("/machines/app");
     */
    writeSnapshot(dir: string, archive: Uint8Array): void;

    /**
     * Packs a stored machine back into a tar archive, for keeping a snapshot
     * beyond the life of the page.
     */
    readSnapshot(dir: string): Uint8Array;
}

/**
 * Instantiates the WebAssembly module and binds the machine API to it.
 *
 * Each call builds an independent module with its own heap and filesystem;
 * machines from different modules cannot be mixed.
 */
export const init = async (
    options: InitOptions = {},
): Promise<CartesiMachineWasm> => {
    const module = await loadModule(options);
    const addon = createWasmAddon(module);
    return {
        ...createMachineApi(addon),
        module,
        fs: module.FS,
        writeSnapshot: (dir, archive) => writeSnapshot(module.FS, dir, archive),
        readSnapshot: (dir) => readSnapshot(module.FS, dir),
    };
};

export {
    loadModule,
    type CartesiMachineModule,
    type CartesiMachineModuleFactory,
    type EmscriptenFS,
    type LoadModuleOptions,
} from "./wasm/module.js";
export { createWasmAddon } from "./wasm/addon.js";
export { readSnapshot, writeSnapshot } from "./wasm/snapshot.js";
export {
    connectWorker,
    type CartesiMachineClient,
    type RemoteMachine,
    type RemoteRollupsMachine,
} from "./browser/client.js";
export { serve } from "./browser/server.js";
export type { MessageEndpoint } from "./browser/protocol.js";

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
