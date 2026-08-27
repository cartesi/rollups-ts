// The messages a page and its machine worker exchange.
//
// Everything that crosses is structured-cloneable as-is — bigints, byte
// arrays, plain objects — with two exceptions this protocol handles: machines
// and rollups machines, which stay in the worker and are addressed by handle,
// and errors, which are flattened so a MachineError can be rebuilt on the
// other side with its code and description intact.

/** A machine (or rollups machine) that lives in the worker. */
export interface Handle {
    __cartesiHandle: number;
}

export const isHandle = (value: unknown): value is Handle =>
    typeof value === "object" &&
    value !== null &&
    typeof (value as Handle).__cartesiHandle === "number";

/** What a call was made on: the module-level API, or one held object. */
export type Target = { object: "api" } | { object: "handle"; handle: number };

export interface CallRequest {
    id: number;
    kind: "call";
    target: Target;
    method: string;
    args: unknown[];
}

export interface ReleaseRequest {
    id: number;
    kind: "release";
    handle: number;
}

export type Request = CallRequest | ReleaseRequest;

export interface FlatError {
    name: string;
    message: string;
    code?: number;
    description?: string;
    stack?: string;
}

export interface Response {
    id: number;
    result?: unknown;
    error?: FlatError;
}

/**
 * Anything with postMessage and onmessage: a Worker, a MessagePort, self.
 *
 * `onmessage` is a property rather than a method, so under `strictFunctionTypes`
 * its parameter is checked contravariantly — and `{ data: unknown }` is not a
 * `MessageEvent`, which would make a real `Worker` fail to satisfy this. The
 * indexed access below declares the handler as a *method*, whose parameters are
 * compared bivariantly, which is what makes both directions assignable.
 */
export interface MessageEndpoint {
    postMessage(message: unknown): void;
    onmessage:
        | { bivariance(event: { data: unknown }): void }["bivariance"]
        | null;
    terminate?(): void;
}

export const flattenError = (error: unknown): FlatError => {
    if (error instanceof Error) {
        const { code, description } = error as {
            code?: number;
            description?: string;
        };
        return {
            name: error.name,
            message: error.message,
            code,
            description,
            stack: error.stack,
        };
    }
    return { name: "Error", message: String(error) };
};
