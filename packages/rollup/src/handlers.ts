import type { RequestHandler, RollupRequest } from "./types.js";

/**
 * Await a handler's answer and insist that there is one.
 *
 * {@link RequestHandler} already rules out a handler that falls off its end,
 * which settles it for TypeScript callers. This is the JavaScript half: a
 * `void`-returning handler — the shape `Rollup.run` accepts and reads as an
 * accept — would otherwise count as *declined* here, silently passing the
 * request on and rejecting the input once the handlers run out. Throwing turns
 * that into the loud version: `run` rejects the input and emits this message as
 * a report, naming the handler contract that was broken.
 */
const answer = async (result: boolean | Promise<boolean>): Promise<boolean> => {
    const accepted = await result;
    if (typeof accepted !== "boolean") {
        throw new TypeError(
            `composed handler must return a boolean (true accepts the request, false declines it), got ${typeof accepted}`,
        );
    }
    return accepted;
};

/**
 * Compose handlers that *compete* for the request: each is offered it in turn
 * and the first one to accept (return `true`) wins, so the rest never run. Use
 * it when at most one handler owns a given request — a portal deposit claimed
 * by a wallet, then the application's own logic:
 *
 * ```ts
 * await rollup.run({ advance: chain(wallet.handler, app.handler) });
 * ```
 *
 * The composed handler returns `true` as soon as one accepts and `false` when
 * they all decline (an empty `chain()` declines everything), which is what
 * `run` turns into rejecting the input: an input nobody claimed was not
 * processed. Exceptions are deliberately not caught — they propagate to `run`,
 * which rejects the input and reports them.
 */
export const chain =
    <request extends RollupRequest>(
        ...handlers: RequestHandler<request>[]
    ): RequestHandler<request> =>
    async (request, rollup) => {
        for (const handler of handlers) {
            if (await answer(handler(request, rollup))) {
                return true;
            }
        }
        return false;
    };

/**
 * Compose handlers that *observe* the same request: every one of them is
 * offered it, in order, regardless of what the previous ones answered. Use it
 * when several concerns react to the same input independently — an indexer, a
 * metrics collector, the application logic.
 *
 * The composed handler accepts if *any* handler accepted, so a request no
 * handler claimed still ends up rejected. The handlers run one after another
 * rather than concurrently: they share one rollup device and one application
 * state, and the order in which they emit outputs is part of what the machine
 * proves. Exceptions are deliberately not caught — the first one aborts the
 * remaining handlers and propagates to `run`, which rejects the input and
 * reports it.
 */
export const broadcast =
    <request extends RollupRequest>(
        ...handlers: RequestHandler<request>[]
    ): RequestHandler<request> =>
    async (request, rollup) => {
        let accepted = false;
        for (const handler of handlers) {
            if (await answer(handler(request, rollup))) {
                accepted = true;
            }
        }
        return accepted;
    };
