/**
 * Error codes returned by the Cartesi node JSON-RPC API.
 *
 * The `-327xx`/`-326xx` codes are the transport-level codes of the JSON-RPC 2.0
 * specification; the `-310xx` codes are the node's application-level codes.
 *
 * Missing resources are *never* reported as `internalError`: a client can treat
 * `internalError` as a node-side failure to alarm on or back off from, while
 * `resourceNotFound` on a forward-looking resource (the next epoch, input or
 * output index) is the documented "not created yet" signal and is safe to poll.
 */
export const errorCodes = {
    /** Invalid JSON was received by the node. */
    parseError: -32700,
    /** The request is not a valid JSON-RPC request object. */
    invalidRequest: -32600,
    /** The method does not exist. */
    methodNotFound: -32601,
    /** Invalid method parameters. */
    invalidParams: -32602,
    /** Node-side failure. Never used for missing resources. */
    internalError: -32603,
    /** The batch is empty or larger than {@link maxBatchSize}. */
    invalidBatch: -32040,
    /** The request could not be processed within the node's time limit. */
    timeout: -32070,
    /**
     * The requested resource does not exist in the method's scope. For
     * application-scoped methods the application is known but the nested entity
     * is missing.
     */
    resourceNotFound: -31001,
    /**
     * The application identifier is unknown to this node. For
     * application-scoped methods this is a configuration error that will not
     * resolve by retrying.
     */
    applicationNotFound: -31002,
    /**
     * The response-size budget was exhausted.
     *
     * An entry whose response would exceed the remaining budget is discarded
     * without consuming it and gets this code; the budget is then *closed*, so
     * every later entry of the batch gets it too, even one whose response would
     * still have fit. Affected entries can be retried individually or in a
     * smaller batch.
     */
    responseSizeLimitExceeded: -31003,
    /**
     * The list-work budget of a batch was exceeded, see
     * {@link maxBatchListWork}. The whole batch is rejected with this single
     * error and no entry is dispatched.
     */
    batchListItemLimitExceeded: -31004,
} as const;

export type ErrorCode = (typeof errorCodes)[keyof typeof errorCodes];

/** Maximum number of entries the node accepts in a JSON-RPC batch. */
export const maxBatchSize = 100;

/**
 * Maximum list work the node accepts in a single JSON-RPC batch, as the sum of
 * the effective `limit` of every list entry in it. This bounds a batch's
 * row-fetch work to that of one maximal list request.
 *
 * Each entry counts as {@link defaultListLimit} when its limit is omitted or
 * zero, and is capped at this value when higher. A total above it rejects the
 * entire batch with `errorCodes.batchListItemLimitExceeded` before any entry
 * runs.
 *
 * It bounds row-fetch work only: neither the `COUNT` queries behind
 * `pagination` nor offset traversal is metered, so a deep `offset` over a broad
 * filter can still make the database scan and discard rows before the requested
 * page. Broad or unnecessary list filters are worth avoiding regardless.
 */
export const maxBatchListWork = 10_000;

/** Limit a list entry counts as when it omits one, or passes zero. */
export const defaultListLimit = 50;
