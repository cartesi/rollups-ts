import { defineChain } from "viem";
import { anvil } from "viem/chains";
import { chainConfig } from "./chainConfig.js";

export const cartesi = defineChain({
    ...anvil,
    ...chainConfig,
});
