import { defineChain } from "viem";
import { cannon } from "viem/chains";
import { chainConfig } from "./chainConfig.js";

export const cartesi = defineChain({
    ...cannon,
    ...chainConfig,
});
