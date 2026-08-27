// Types for the generated Emscripten module (cartesi-machine.mjs), which is a
// build artifact: `pnpm build:wasm` writes it next to this file, and the
// published package ships it in dist/. Declaring it here keeps type checking
// (and editors) working in a checkout where it has not been built yet.
import type { CartesiMachineModuleFactory } from "./module.js";

declare const createCartesiMachineModule: CartesiMachineModuleFactory;
export default createCartesiMachineModule;
