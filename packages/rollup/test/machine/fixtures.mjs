// The advance inputs fed to the machine and the inspect query, shared between
// encode-inputs.mjs and verify-outputs.mjs so expectations stay in sync.
//
// Encoding and decoding is @cartesi/codec's job — it derives the codecs from
// the rollups-contracts ABIs, while libcmt implements the same wire format in C
// inside the guest, so this test cross-checks the two.

export const ADVANCES = [
    {
        chainId: 31337n,
        appContract: `0x${"02".repeat(20)}`,
        msgSender: `0x${"03".repeat(20)}`,
        blockNumber: 456n,
        blockTimestamp: 1700000000n,
        prevRandao: 0xdeadbeefn,
        index: 0n,
        payload: Buffer.from("hello from the chain"),
    },
    {
        chainId: 31337n,
        appContract: `0x${"02".repeat(20)}`,
        msgSender: `0x${"aa".repeat(20)}`,
        blockNumber: 457n,
        blockTimestamp: 1700000012n,
        prevRandao: 0xc0ffeen,
        index: 1n,
        payload: Buffer.from("second input"),
    },
];

export const QUERY = Buffer.from("inspect me");
