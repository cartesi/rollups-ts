import { describe, expect, it } from "vitest";

// `chain` and `broadcast` are pure functions over the handler types: they never
// touch the device, so this suite imports them straight from their module
// rather than from `src/index.js`, which loads the native addon. Nothing here
// needs a built addon or CMT_INPUTS.
import { broadcast, chain } from "../src/handlers.js";
import type { Rollup } from "../src/rollup.js";
import type {
    AdvanceRequest,
    AdvanceRequestHandler,
    RunHandlers,
} from "../src/types.js";

// the composers only pass these two through, so identity is all that matters —
// no device is ever touched (the `Rollup` import above is type-only)
const REQUEST = { type: "advance", index: 7n } as AdvanceRequest;
const ROLLUP = {} as Rollup;

/** A handler that records the call and answers with `accepted`. */
const handler = (
    name: string,
    calls: string[],
    accepted: boolean,
): AdvanceRequestHandler => {
    return (request, rollup) => {
        expect(request).toBe(REQUEST);
        expect(rollup).toBe(ROLLUP);
        calls.push(name);
        return accepted;
    };
};

/** The same, asynchronous, so the composers have something to await. */
const asyncHandler = (
    name: string,
    calls: string[],
    accepted: boolean,
): AdvanceRequestHandler => {
    const sync = handler(name, calls, accepted);
    return async (request, rollup) => {
        await Promise.resolve();
        return sync(request, rollup);
    };
};

const throwing =
    (error: Error): AdvanceRequestHandler =>
    () => {
        throw error;
    };

// what a handler written for `run` looks like: no return statement, which
// `run` reads as an accept. The type rejects it here, so composing one is a
// deliberate act — hence the casts below, which stand in for the JavaScript
// caller the runtime check exists for.
const voidHandler = (() => {}) as unknown as AdvanceRequestHandler;

describe("chain", () => {
    it("stops at the first handler that accepts", async () => {
        const calls: string[] = [];
        await expect(
            chain(
                handler("a", calls, false),
                asyncHandler("b", calls, true),
                handler("c", calls, false),
            )(REQUEST, ROLLUP),
        ).resolves.toBe(true);
        // "c" never ran: the request was already claimed
        expect(calls).toEqual(["a", "b"]);
    });

    it("declines when every handler declines", async () => {
        const calls: string[] = [];
        await expect(
            chain(handler("a", calls, false), asyncHandler("b", calls, false))(
                REQUEST,
                ROLLUP,
            ),
        ).resolves.toBe(false);
        expect(calls).toEqual(["a", "b"]);
    });

    it("declines when there are no handlers", async () => {
        await expect(chain()(REQUEST, ROLLUP)).resolves.toBe(false);
    });

    it("lets a handler's exception through, aborting the rest", async () => {
        const calls: string[] = [];
        const error = new Error("handler blew up");
        await expect(
            chain(
                handler("a", calls, false),
                throwing(error),
                handler("c", calls, false),
            )(REQUEST, ROLLUP),
        ).rejects.toBe(error);
        expect(calls).toEqual(["a"]);
    });

    it("rejects a handler that answers with something other than a boolean", async () => {
        const calls: string[] = [];
        // a `void` handler must not be read as "declined" behind the caller's
        // back — that would silently pass the request on and end up rejecting
        // an input `run` would have accepted
        await expect(
            chain(voidHandler, handler("b", calls, true))(REQUEST, ROLLUP),
        ).rejects.toThrow(TypeError);
        await expect(chain(voidHandler)(REQUEST, ROLLUP)).rejects.toThrow(
            /must return a boolean.*got undefined/,
        );
        expect(calls).toEqual([]);
    });
});

describe("broadcast", () => {
    it("offers the request to every handler, in order", async () => {
        const calls: string[] = [];
        await expect(
            broadcast(
                handler("a", calls, false),
                asyncHandler("b", calls, true),
                handler("c", calls, false),
            )(REQUEST, ROLLUP),
        ).resolves.toBe(true);
        // unlike `chain`, "b" accepting does not stop "c"; and the handlers run
        // one after another, not concurrently
        expect(calls).toEqual(["a", "b", "c"]);
    });

    it("accepts if any handler accepted", async () => {
        const calls: string[] = [];
        await expect(
            broadcast(
                asyncHandler("a", calls, true),
                handler("b", calls, true),
            )(REQUEST, ROLLUP),
        ).resolves.toBe(true);
        expect(calls).toEqual(["a", "b"]);
    });

    it("declines when every handler declines, and when there are none", async () => {
        const calls: string[] = [];
        await expect(
            broadcast(
                handler("a", calls, false),
                asyncHandler("b", calls, false),
            )(REQUEST, ROLLUP),
        ).resolves.toBe(false);
        expect(calls).toEqual(["a", "b"]);
        await expect(broadcast()(REQUEST, ROLLUP)).resolves.toBe(false);
    });

    it("lets a handler's exception through, aborting the rest", async () => {
        const calls: string[] = [];
        const error = new Error("handler blew up");
        await expect(
            broadcast(
                handler("a", calls, true),
                throwing(error),
                handler("c", calls, false),
            )(REQUEST, ROLLUP),
        ).rejects.toBe(error);
        expect(calls).toEqual(["a"]);
    });

    it("rejects a handler that answers with something other than a boolean", async () => {
        await expect(broadcast(voidHandler)(REQUEST, ROLLUP)).rejects.toThrow(
            TypeError,
        );
    });
});

describe("composition types", () => {
    it("produces handlers `run` takes", () => {
        const calls: string[] = [];
        // the point of the looser `RunHandlers` type: `boolean` is assignable
        // to `boolean | void`, so a composed handler drops straight into `run`
        const handlers: RunHandlers = {
            advance: chain(handler("a", calls, true)),
            inspect: broadcast(),
        };
        expect(handlers.advance).toBeTypeOf("function");

        // ...while the reverse is a type error: a handler with no return
        // statement cannot be composed, which is the whole point
        // @ts-expect-error a composed handler must return a boolean
        chain(() => {});
    });
});
