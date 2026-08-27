// The worker entry point: point a Worker at this module and connect() to it
// from the page.
//
//     const worker = new Worker(
//         new URL("@cartesi/machine/worker", import.meta.url),
//         { type: "module" },
//     );
//
// It serves the machine API on the worker's own message port; the module is
// instantiated on the first call.
import { serve } from "./server.js";

serve(self as unknown as Parameters<typeof serve>[0]);
