import type { Account, Address, Hex } from "viem";

export type SequencerTransaction = {
    /** Application-defined SSZ-encoded method payload. */
    data: Hex;
    /** Maximum fee, encoded as the sequencer protocol's uint16 exponent. */
    maxFee: number;
    /** Sender nonce. */
    nonce: number;
};

export type SequencerTransactionMessage = {
    data: Hex;
    max_fee: number;
    nonce: number;
};

export type SignedSequencerTransaction = {
    message: SequencerTransactionMessage;
    sender: Address;
    signature: Hex;
};

export type SequencerTransactionReceipt = {
    nonce: number;
    ok: true;
    sender: Address;
};

export type SequencerErrorCode =
    | "BAD_REQUEST"
    | "EXECUTION_REJECTED"
    | "INTERNAL_ERROR"
    | "INVALID_SIGNATURE"
    | "OVERLOADED"
    | "PAYLOAD_TOO_LARGE"
    | "UNAVAILABLE";

export type SequencerErrorResponse = {
    code: SequencerErrorCode | (string & {});
    message: string;
    ok: false;
};

export type SequencerTransactionParameters = SequencerTransaction & {
    /** Account override. Defaults to the client's account. */
    account?: Account | Address | undefined;
};

export type SignSequencerTransactionParameters = SequencerTransactionParameters;

export type SubmitSequencerTransactionParameters = {
    transaction: SignedSequencerTransaction;
};

export type SequencerActions = {
    sendTransaction: (
        parameters: SequencerTransactionParameters,
    ) => Promise<SequencerTransactionReceipt>;
    signTransaction: (
        parameters: SequencerTransactionParameters,
    ) => Promise<SignedSequencerTransaction>;
    submitTransaction: (
        parameters: SubmitSequencerTransactionParameters,
    ) => Promise<SequencerTransactionReceipt>;
};
