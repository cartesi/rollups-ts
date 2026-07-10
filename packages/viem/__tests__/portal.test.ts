import {
    type Address,
    concat,
    encodeAbiParameters,
    encodePacked,
    type Hex,
    slice,
} from "viem";
import { describe, expect, it } from "vitest";
import {
    decodeDeposit,
    decodeERC20Deposit,
    decodeERC721Deposit,
    decodeERC1155BatchDeposit,
    decodeERC1155SingleDeposit,
    decodeEtherDeposit,
    type EtherDeposit,
    getPortal,
    InvalidDepositPayloadError,
} from "../src/portal/index.js";
import {
    erc20PortalAddress,
    erc721PortalAddress,
    erc1155BatchPortalAddress,
    erc1155SinglePortalAddress,
    etherPortalAddress,
} from "../src/rollups.js";

const token: Address = "0x491604c0FDF08347Dd1fa4Ee062a822A5DD06B5D";
const sender: Address = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
const maxUint256 = 2n ** 256n - 1n;

// encoding helpers mirroring InputEncoding.sol
const encodeEtherDeposit = (
    sender: Address,
    value: bigint,
    execLayerData: Hex,
): Hex =>
    encodePacked(
        ["address", "uint256", "bytes"],
        [sender, value, execLayerData],
    );

const encodeERC20Deposit = (
    token: Address,
    sender: Address,
    value: bigint,
    execLayerData: Hex,
): Hex =>
    encodePacked(
        ["address", "address", "uint256", "bytes"],
        [token, sender, value, execLayerData],
    );

const encodeERC721Deposit = (
    token: Address,
    sender: Address,
    tokenId: bigint,
    baseLayerData: Hex,
    execLayerData: Hex,
): Hex =>
    concat([
        encodePacked(
            ["address", "address", "uint256"],
            [token, sender, tokenId],
        ),
        encodeAbiParameters(
            [{ type: "bytes" }, { type: "bytes" }],
            [baseLayerData, execLayerData],
        ),
    ]);

const encodeERC1155SingleDeposit = (
    token: Address,
    sender: Address,
    tokenId: bigint,
    value: bigint,
    baseLayerData: Hex,
    execLayerData: Hex,
): Hex =>
    concat([
        encodePacked(
            ["address", "address", "uint256", "uint256"],
            [token, sender, tokenId, value],
        ),
        encodeAbiParameters(
            [{ type: "bytes" }, { type: "bytes" }],
            [baseLayerData, execLayerData],
        ),
    ]);

const encodeERC1155BatchDeposit = (
    token: Address,
    sender: Address,
    tokenIds: bigint[],
    values: bigint[],
    baseLayerData: Hex,
    execLayerData: Hex,
): Hex =>
    concat([
        encodePacked(["address", "address"], [token, sender]),
        encodeAbiParameters(
            [
                { type: "uint256[]" },
                { type: "uint256[]" },
                { type: "bytes" },
                { type: "bytes" },
            ],
            [tokenIds, values, baseLayerData, execLayerData],
        ),
    ]);

describe("getPortal", () => {
    it("should return the portal kind for each portal address", () => {
        expect(getPortal(etherPortalAddress)).toEqual("EtherPortal");
        expect(getPortal(erc20PortalAddress)).toEqual("ERC20Portal");
        expect(getPortal(erc721PortalAddress)).toEqual("ERC721Portal");
        expect(getPortal(erc1155SinglePortalAddress)).toEqual(
            "ERC1155SinglePortal",
        );
        expect(getPortal(erc1155BatchPortalAddress)).toEqual(
            "ERC1155BatchPortal",
        );
    });

    it("should match addresses case-insensitively", () => {
        expect(getPortal(etherPortalAddress.toLowerCase() as Address)).toEqual(
            "EtherPortal",
        );
        expect(
            getPortal(
                `0x${etherPortalAddress.slice(2).toUpperCase()}` as Address,
            ),
        ).toEqual("EtherPortal");
    });

    it("should return undefined for a non-portal address", () => {
        expect(getPortal(sender)).toBeUndefined();
        expect(getPortal(token)).toBeUndefined();
    });
});

describe("decodeEtherDeposit", () => {
    it("should decode a deposit with execLayerData", () => {
        const payload = encodeEtherDeposit(sender, 123456789n, "0xdeadbeef");
        expect(decodeEtherDeposit(payload)).toEqual({
            type: "EtherDeposit",
            sender,
            value: 123456789n,
            execLayerData: "0xdeadbeef",
        });
    });

    it("should decode a deposit without execLayerData", () => {
        const payload = encodeEtherDeposit(sender, 1n, "0x");
        expect(decodeEtherDeposit(payload)).toEqual({
            type: "EtherDeposit",
            sender,
            value: 1n,
            execLayerData: "0x",
        });
    });

    it("should checksum the sender address", () => {
        const payload = encodeEtherDeposit(
            sender.toLowerCase() as Address,
            1n,
            "0x",
        );
        expect(decodeEtherDeposit(payload).sender).toEqual(sender);
    });

    it("should decode edge case values", () => {
        expect(
            decodeEtherDeposit(encodeEtherDeposit(sender, 0n, "0x")).value,
        ).toEqual(0n);
        expect(
            decodeEtherDeposit(encodeEtherDeposit(sender, maxUint256, "0x"))
                .value,
        ).toEqual(maxUint256);
    });

    it("should throw InvalidDepositPayloadError on truncated payload", () => {
        const payload = encodeEtherDeposit(sender, 1n, "0x");
        const truncated = slice(payload, 0, 51);
        expect(() => decodeEtherDeposit(truncated)).toThrow(
            InvalidDepositPayloadError,
        );
        try {
            decodeEtherDeposit(truncated);
        } catch (error) {
            expect(error).toBeInstanceOf(InvalidDepositPayloadError);
            const e = error as InvalidDepositPayloadError;
            expect(e.portal).toEqual("EtherPortal");
            expect(e.expectedMinSize).toEqual(52);
            expect(e.size).toEqual(51);
            expect(e.payload).toEqual(truncated);
        }
        expect(() => decodeEtherDeposit("0x")).toThrow(
            InvalidDepositPayloadError,
        );
    });
});

describe("decodeERC20Deposit", () => {
    it("should decode a deposit with execLayerData", () => {
        const payload = encodeERC20Deposit(token, sender, 1000n, "0xdeadbeef");
        expect(decodeERC20Deposit(payload)).toEqual({
            type: "ERC20Deposit",
            token,
            sender,
            value: 1000n,
            execLayerData: "0xdeadbeef",
        });
    });

    it("should decode a deposit without execLayerData", () => {
        const payload = encodeERC20Deposit(token, sender, maxUint256, "0x");
        expect(decodeERC20Deposit(payload)).toEqual({
            type: "ERC20Deposit",
            token,
            sender,
            value: maxUint256,
            execLayerData: "0x",
        });
    });

    it("should throw InvalidDepositPayloadError on truncated payload", () => {
        const payload = encodeERC20Deposit(token, sender, 1n, "0x");
        const truncated = slice(payload, 0, 71);
        expect(() => decodeERC20Deposit(truncated)).toThrow(
            InvalidDepositPayloadError,
        );
        try {
            decodeERC20Deposit(truncated);
        } catch (error) {
            const e = error as InvalidDepositPayloadError;
            expect(e.portal).toEqual("ERC20Portal");
            expect(e.expectedMinSize).toEqual(72);
            expect(e.size).toEqual(71);
        }
    });
});

describe("decodeERC721Deposit", () => {
    it.each([
        ["0x", "0x"],
        ["0xbeef", "0x"],
        ["0x", "0xdead"],
        ["0xbeef", "0xdead"],
    ] as [
        Hex,
        Hex,
    ][])("should decode a deposit with baseLayerData=%s execLayerData=%s", (baseLayerData, execLayerData) => {
        const payload = encodeERC721Deposit(
            token,
            sender,
            42n,
            baseLayerData,
            execLayerData,
        );
        expect(decodeERC721Deposit(payload)).toEqual({
            type: "ERC721Deposit",
            token,
            sender,
            tokenId: 42n,
            baseLayerData,
            execLayerData,
        });
    });

    it("should throw InvalidDepositPayloadError on truncated fixed prefix", () => {
        const payload = encodeERC721Deposit(token, sender, 1n, "0x", "0x");
        const truncated = slice(payload, 0, 71);
        expect(() => decodeERC721Deposit(truncated)).toThrow(
            InvalidDepositPayloadError,
        );
    });

    it("should throw a viem decoding error on missing abi-encoded tail", () => {
        const payload = encodeERC721Deposit(token, sender, 1n, "0x", "0x");
        const prefixOnly = slice(payload, 0, 72);
        expect(() => decodeERC721Deposit(prefixOnly)).toThrow();
        expect(() => decodeERC721Deposit(prefixOnly)).not.toThrow(
            InvalidDepositPayloadError,
        );
    });

    it("should throw a viem decoding error on garbage abi-encoded tail", () => {
        const payload = encodeERC721Deposit(token, sender, 1n, "0x", "0x");
        const garbage = concat([slice(payload, 0, 72), "0xdeadbeef"]);
        expect(() => decodeERC721Deposit(garbage)).toThrow();
        expect(() => decodeERC721Deposit(garbage)).not.toThrow(
            InvalidDepositPayloadError,
        );
    });
});

describe("decodeERC1155SingleDeposit", () => {
    it("should decode a deposit", () => {
        const payload = encodeERC1155SingleDeposit(
            token,
            sender,
            7n,
            100n,
            "0xbeef",
            "0xdead",
        );
        expect(decodeERC1155SingleDeposit(payload)).toEqual({
            type: "ERC1155SingleDeposit",
            token,
            sender,
            tokenId: 7n,
            value: 100n,
            baseLayerData: "0xbeef",
            execLayerData: "0xdead",
        });
    });

    it("should decode a deposit with empty layer data", () => {
        const payload = encodeERC1155SingleDeposit(
            token,
            sender,
            0n,
            maxUint256,
            "0x",
            "0x",
        );
        expect(decodeERC1155SingleDeposit(payload)).toEqual({
            type: "ERC1155SingleDeposit",
            token,
            sender,
            tokenId: 0n,
            value: maxUint256,
            baseLayerData: "0x",
            execLayerData: "0x",
        });
    });

    it("should throw InvalidDepositPayloadError on truncated fixed prefix", () => {
        const payload = encodeERC1155SingleDeposit(
            token,
            sender,
            1n,
            1n,
            "0x",
            "0x",
        );
        const truncated = slice(payload, 0, 103);
        expect(() => decodeERC1155SingleDeposit(truncated)).toThrow(
            InvalidDepositPayloadError,
        );
        try {
            decodeERC1155SingleDeposit(truncated);
        } catch (error) {
            const e = error as InvalidDepositPayloadError;
            expect(e.portal).toEqual("ERC1155SinglePortal");
            expect(e.expectedMinSize).toEqual(104);
            expect(e.size).toEqual(103);
        }
    });

    it("should throw a viem decoding error on missing abi-encoded tail", () => {
        const payload = encodeERC1155SingleDeposit(
            token,
            sender,
            1n,
            1n,
            "0x",
            "0x",
        );
        const prefixOnly = slice(payload, 0, 104);
        expect(() => decodeERC1155SingleDeposit(prefixOnly)).toThrow();
        expect(() => decodeERC1155SingleDeposit(prefixOnly)).not.toThrow(
            InvalidDepositPayloadError,
        );
    });
});

describe("decodeERC1155BatchDeposit", () => {
    it("should decode a deposit with multiple tokens", () => {
        const payload = encodeERC1155BatchDeposit(
            token,
            sender,
            [1n, 2n, 3n],
            [100n, 200n, 300n],
            "0xbeef",
            "0xdead",
        );
        expect(decodeERC1155BatchDeposit(payload)).toEqual({
            type: "ERC1155BatchDeposit",
            token,
            sender,
            tokenIds: [1n, 2n, 3n],
            values: [100n, 200n, 300n],
            baseLayerData: "0xbeef",
            execLayerData: "0xdead",
        });
    });

    it("should decode a deposit with empty arrays and layer data", () => {
        const payload = encodeERC1155BatchDeposit(
            token,
            sender,
            [],
            [],
            "0x",
            "0x",
        );
        expect(decodeERC1155BatchDeposit(payload)).toEqual({
            type: "ERC1155BatchDeposit",
            token,
            sender,
            tokenIds: [],
            values: [],
            baseLayerData: "0x",
            execLayerData: "0x",
        });
    });

    it("should throw InvalidDepositPayloadError on truncated fixed prefix", () => {
        const payload = encodeERC1155BatchDeposit(
            token,
            sender,
            [1n],
            [1n],
            "0x",
            "0x",
        );
        const truncated = slice(payload, 0, 39);
        expect(() => decodeERC1155BatchDeposit(truncated)).toThrow(
            InvalidDepositPayloadError,
        );
        try {
            decodeERC1155BatchDeposit(truncated);
        } catch (error) {
            const e = error as InvalidDepositPayloadError;
            expect(e.portal).toEqual("ERC1155BatchPortal");
            expect(e.expectedMinSize).toEqual(40);
            expect(e.size).toEqual(39);
        }
    });

    it("should throw a viem decoding error on missing abi-encoded tail", () => {
        const prefixOnly = encodePacked(
            ["address", "address"],
            [token, sender],
        );
        expect(() => decodeERC1155BatchDeposit(prefixOnly)).toThrow();
        expect(() => decodeERC1155BatchDeposit(prefixOnly)).not.toThrow(
            InvalidDepositPayloadError,
        );
    });
});

describe("decodeDeposit", () => {
    it("should match the per-portal decoders", () => {
        const etherPayload = encodeEtherDeposit(sender, 1n, "0xdeadbeef");
        expect(decodeDeposit("EtherPortal", etherPayload)).toEqual(
            decodeEtherDeposit(etherPayload),
        );

        const erc20Payload = encodeERC20Deposit(token, sender, 1n, "0x");
        expect(decodeDeposit("ERC20Portal", erc20Payload)).toEqual(
            decodeERC20Deposit(erc20Payload),
        );

        const erc721Payload = encodeERC721Deposit(
            token,
            sender,
            1n,
            "0xbeef",
            "0xdead",
        );
        expect(decodeDeposit("ERC721Portal", erc721Payload)).toEqual(
            decodeERC721Deposit(erc721Payload),
        );

        const erc1155SinglePayload = encodeERC1155SingleDeposit(
            token,
            sender,
            1n,
            2n,
            "0x",
            "0x",
        );
        expect(
            decodeDeposit("ERC1155SinglePortal", erc1155SinglePayload),
        ).toEqual(decodeERC1155SingleDeposit(erc1155SinglePayload));

        const erc1155BatchPayload = encodeERC1155BatchDeposit(
            token,
            sender,
            [1n],
            [2n],
            "0x",
            "0x",
        );
        expect(
            decodeDeposit("ERC1155BatchPortal", erc1155BatchPayload),
        ).toEqual(decodeERC1155BatchDeposit(erc1155BatchPayload));
    });

    it("should narrow the return type for literal portal kinds", () => {
        const payload = encodeEtherDeposit(sender, 1n, "0x");
        const deposit: EtherDeposit = decodeDeposit("EtherPortal", payload);
        expect(deposit.type).toEqual("EtherDeposit");
    });
});
