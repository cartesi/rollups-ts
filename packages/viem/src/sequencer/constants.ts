export const sequencerDomainName = "CartesiAppSequencer";
export const sequencerDomainVersion = "1";

export const sequencerTransactionTypes = {
    UserOp: [
        { name: "nonce", type: "uint32" },
        { name: "max_fee", type: "uint16" },
        { name: "data", type: "bytes" },
    ],
} as const;
