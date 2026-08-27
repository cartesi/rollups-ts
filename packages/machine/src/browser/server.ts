// The worker side of the facade: it owns the module, the machines and the
// rollups machines, and answers calls by name.
//
// Dispatch is by name rather than a hand-written switch because the API this
// serves is the machine API — some sixty methods that all take and return
// cloneable values. What needs care is only the two things that are not
// cloneable: objects stay here behind handles, and errors are flattened.
import { rollups as makeRollups } from "../rollups.js";
import { init, type CartesiMachineWasm, type InitOptions } from "../browser.js";
import {
    flattenError,
    isHandle,
    type CallRequest,
    type Handle,
    type MessageEndpoint,
    type Request,
    type Response,
} from "./protocol.js";

/** Objects the page can hold: a machine, or a rollups machine. */
type Held = Record<string, unknown>;

const isHeld = (value: unknown): value is Held =>
    typeof value === "object" &&
    value !== null &&
    // machines and rollups machines are class instances; results that cross as
    // data (configs, proofs, stats) are plain objects and arrays
    Object.getPrototypeOf(value) !== Object.prototype &&
    !Array.isArray(value) &&
    !ArrayBuffer.isView(value);

/**
 * Serves the machine API over an endpoint. In a worker that endpoint is
 * `self`; a test can use either end of a MessageChannel.
 *
 * The module is instantiated on the first call, so a page that never uses the
 * worker never pays for it.
 */
export const serve = (
    endpoint: MessageEndpoint,
    options: InitOptions = {},
): void => {
    let cartesi: CartesiMachineWasm | null = null;
    const held = new Map<number, Held>();
    let nextHandle = 1;

    const hold = (value: Held): Handle => {
        const handle = nextHandle;
        nextHandle += 1;
        held.set(handle, value);
        return { __cartesiHandle: handle };
    };

    const resolve = (value: unknown): unknown => {
        if (isHandle(value)) {
            const target = held.get(value.__cartesiHandle);
            if (target === undefined) {
                throw new Error(
                    `@cartesi/machine: handle ${value.__cartesiHandle} was already released`,
                );
            }
            return target;
        }
        return value;
    };

    const call = async ({ target, method, args }: CallRequest) => {
        cartesi ??= await init(options);

        const resolved = args.map(resolve);

        // rollups() is served here rather than by the machine API because it
        // takes a machine and returns another object to hold
        if (target.object === "api" && method === "rollups") {
            const [machine, rollupsOptions] = resolved;
            return makeRollups(
                machine as Parameters<typeof makeRollups>[0],
                rollupsOptions as Parameters<typeof makeRollups>[1],
            );
        }

        const receiver =
            target.object === "api"
                ? (cartesi as unknown as Held)
                : (resolve({ __cartesiHandle: target.handle }) as Held);

        const fn = receiver[method];
        if (typeof fn !== "function") {
            throw new Error(
                `@cartesi/machine: no method ${method} on the ${target.object === "api" ? "machine API" : "object"}`,
            );
        }

        return (fn as (...a: unknown[]) => unknown).apply(receiver, resolved);
    };

    endpoint.onmessage = (event: { data: unknown }) => {
        const request = event.data as Request;

        if (request.kind === "release") {
            held.delete(request.handle);
            const response: Response = { id: request.id, result: null };
            endpoint.postMessage(response);
            return;
        }

        call(request)
            .then((result) => {
                const response: Response = {
                    id: request.id,
                    result: isHeld(result) ? hold(result) : result,
                };
                endpoint.postMessage(response);
            })
            .catch((error: unknown) => {
                endpoint.postMessage({
                    id: request.id,
                    error: flattenError(error),
                } satisfies Response);
            });
    };
};
