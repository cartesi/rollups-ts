import { contracts } from "./contracts.js";

export const chainConfig = {
    name: "Cartesi Devnet",
    blockTime: 2_000,
    contracts,
    rpcUrls: {
        default: { http: ["http://127.0.0.1:6751/anvil"] },
    },
    testnet: true,
} as const;
