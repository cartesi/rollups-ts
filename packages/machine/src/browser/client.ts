// The page side of the facade.
//
// Running a machine occupies its thread — an advance is seconds of compute —
// so a page that stays responsive runs the module in a worker. This turns the
// synchronous machine API into a promise-returning one across that boundary,
// keeping the method names and arguments identical:
//
//     const worker = new Worker(
//         new URL("@cartesi/machine/worker", import.meta.url),
//         { type: "module" },
//     );
//     const cartesi = connectWorker(worker);
//     const machine = await cartesi.create({ ram: { length: 0x4000000 } });
//     await machine.run(1000n);
import type { CartesiMachineWasm } from "../browser.js";
import { MachineError, type CartesiMachine } from "../cartesi-machine.js";
import type { AdvanceResult } from "../rollups.js";
import {
    isHandle,
    type FlatError,
    type Handle,
    type MessageEndpoint,
    type Request,
    type Response,
    type Target,
} from "./protocol.js";

/**
 * The same call, one thread over: arguments unchanged, results awaited. Calls
 * that hand back a machine hand back a proxy for it instead.
 */
type Remote<T> = {
    [K in keyof T]: T[K] extends (...args: infer A) => infer R
        ? (
              ...args: A
          ) => Promise<
              Awaited<R> extends CartesiMachine ? RemoteMachine : Awaited<R>
          >
        : never;
};

/** A machine held by the worker. */
export interface RemoteMachine extends Remote<CartesiMachine> {
    /**
     * Drops the worker's reference to this machine. Machines hold their memory
     * ranges in the module's heap, so a page that creates several should
     * release the ones it is done with instead of waiting for the worker to be
     * discarded.
     */
    release(): Promise<void>;
}

/** A rollups machine held by the worker. */
export interface RemoteRollupsMachine {
    advance(
        input: Uint8Array,
        options?: { collect: true },
    ): Promise<AdvanceResult>;
    inspect(
        query: Uint8Array,
        options?: { collect: true },
    ): Promise<Uint8Array[]>;
    shutdown(): Promise<void>;
    store(dir: string): Promise<RemoteRollupsMachine>;
    release(): Promise<void>;
}

type RemoteApi = Remote<Omit<CartesiMachineWasm, "module" | "fs">> & {
    /** Wraps a machine the worker holds in the rollups protocol. */
    rollups(
        machine: RemoteMachine,
        options?: { noRollback?: boolean; snapshotDir?: string },
    ): Promise<RemoteRollupsMachine>;
};

export interface CartesiMachineClient extends RemoteApi {
    /** Stops the worker, discarding every machine it holds. */
    terminate(): void;
}

/** Omit over a union has to distribute, or the members collapse into one. */
type WithoutId<T> = T extends unknown ? Omit<T, "id"> : never;

const rebuild = (error: FlatError): Error => {
    if (
        typeof error.code === "number" &&
        typeof error.description === "string"
    ) {
        return new MachineError(error.code, error.description);
    }
    const rebuilt = new Error(error.message);
    rebuilt.name = error.name;
    rebuilt.stack = error.stack ?? rebuilt.stack;
    return rebuilt;
};

/**
 * Connects to a worker, or to any endpoint the worker side is served on.
 *
 * The module is instantiated in the worker on the first call, so this returns
 * immediately and the first call is the slow one.
 */
export const connectWorker = (
    endpoint: MessageEndpoint,
): CartesiMachineClient => {
    const pending = new Map<
        number,
        { resolve: (value: unknown) => void; reject: (error: Error) => void }
    >();
    let nextId = 1;

    // proxies remember the handle they stand for, so passing a machine to
    // rollups() sends that handle instead of trying to clone the proxy
    const handles = new WeakMap<object, Handle>();

    endpoint.onmessage = (event: { data: unknown }) => {
        const { id, result, error } = event.data as Response;
        const settle = pending.get(id);
        if (settle === undefined) {
            return;
        }
        pending.delete(id);
        if (error !== undefined) {
            settle.reject(rebuild(error));
        } else {
            settle.resolve(result);
        }
    };

    const send = (request: WithoutId<Request>): Promise<unknown> => {
        const id = nextId;
        nextId += 1;
        return new Promise((resolve, reject) => {
            pending.set(id, { resolve, reject });
            endpoint.postMessage({ ...request, id } as Request);
        });
    };

    const asArgument = (value: unknown): unknown =>
        typeof value === "object" && value !== null && handles.has(value)
            ? handles.get(value)
            : value;

    const makeProxy = (target: Target): object => {
        const proxy = new Proxy(
            {},
            {
                get: (_unused, method: string) => {
                    if (method === "then") {
                        // awaiting a proxy must not look like a thenable
                        return undefined;
                    }

                    if (target.object === "api" && method === "terminate") {
                        return () => endpoint.terminate?.();
                    }

                    if (target.object === "handle" && method === "release") {
                        return async () => {
                            await send({
                                kind: "release",
                                handle: target.handle,
                            });
                        };
                    }

                    return async (...args: unknown[]) => {
                        const result = await send({
                            kind: "call",
                            target,
                            method,
                            args: args.map(asArgument),
                        });
                        return isHandle(result)
                            ? makeProxy({
                                  object: "handle",
                                  handle: result.__cartesiHandle,
                              })
                            : result;
                    };
                },
            },
        );

        if (target.object === "handle") {
            handles.set(proxy, { __cartesiHandle: target.handle });
        }
        return proxy;
    };

    return makeProxy({ object: "api" }) as CartesiMachineClient;
};

export type { MessageEndpoint } from "./protocol.js";
