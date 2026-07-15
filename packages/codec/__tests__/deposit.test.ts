import { getAddress } from "viem";
import { describe, expect, it } from "vitest";
import {
    decodeDeposit,
    encodeBatchERC1155Deposit,
    encodeERC20Deposit,
    encodeERC721Deposit,
    encodeEtherDeposit,
    encodeSingleERC1155Deposit,
} from "../src/portal.js";
import {
    erc1155BatchPortalAddress,
    erc1155SinglePortalAddress,
    erc20PortalAddress,
    erc721PortalAddress,
    etherPortalAddress,
} from "../src/rollups.js";

const token = getAddress("0x67742ff5b2b762503ff0a92738c6fc2ea4a4d182");
const sender = getAddress("0x92cc14432c1f82622493abd64d99ea8a3000a7c7");

describe("decodeDeposit", () => {
    it("should decode an Ether deposit input", () => {
        const deposit = {
            sender,
            value: 123456789n,
            execLayerData: "0xdeadbeef",
        } as const;
        expect(
            decodeDeposit({
                msgSender: etherPortalAddress,
                payload: encodeEtherDeposit(deposit),
            }),
        ).toEqual({ type: "EtherDeposit", ...deposit });
    });

    it("should decode an ERC-20 deposit input", () => {
        const deposit = {
            token,
            sender,
            value: 1000000000000000000n,
            execLayerData: "0x",
        } as const;
        expect(
            decodeDeposit({
                msgSender: erc20PortalAddress,
                payload: encodeERC20Deposit(deposit),
            }),
        ).toEqual({ type: "ERC20Deposit", ...deposit });
    });

    it("should decode an ERC-721 deposit input", () => {
        const deposit = {
            token,
            sender,
            tokenId: 42n,
            baseLayerData: "0xabcd",
            execLayerData: "0xdeadbeef",
        } as const;
        expect(
            decodeDeposit({
                msgSender: erc721PortalAddress,
                payload: encodeERC721Deposit(deposit),
            }),
        ).toEqual({ type: "ERC721Deposit", ...deposit });
    });

    it("should decode an ERC-1155 single deposit input", () => {
        const deposit = {
            token,
            sender,
            tokenId: 42n,
            value: 7n,
            baseLayerData: "0x",
            execLayerData: "0x",
        } as const;
        expect(
            decodeDeposit({
                msgSender: erc1155SinglePortalAddress,
                payload: encodeSingleERC1155Deposit(deposit),
            }),
        ).toEqual({ type: "SingleERC1155Deposit", ...deposit });
    });

    it("should decode an ERC-1155 batch deposit input", () => {
        const deposit = {
            token,
            sender,
            tokenIds: [1n, 2n, 3n],
            values: [100n, 200n, 300n],
            baseLayerData: "0x",
            execLayerData: "0xdeadbeef",
        } as const;
        expect(
            decodeDeposit({
                msgSender: erc1155BatchPortalAddress,
                payload: encodeBatchERC1155Deposit(deposit),
            }),
        ).toEqual({ type: "BatchERC1155Deposit", ...deposit });
    });

    it("should dispatch regardless of msgSender case", () => {
        const deposit = {
            sender,
            value: 1n,
            execLayerData: "0x",
        } as const;
        expect(
            decodeDeposit({
                msgSender: etherPortalAddress.toLowerCase() as typeof sender,
                payload: encodeEtherDeposit(deposit),
            }),
        ).toEqual({ type: "EtherDeposit", ...deposit });
    });

    it("should return undefined when msgSender is not a portal", () => {
        expect(
            decodeDeposit({ msgSender: sender, payload: "0xdeadbeef" }),
        ).toBeUndefined();
    });

    it("should throw when msgSender is a portal but the payload is malformed", () => {
        expect(() =>
            decodeDeposit({
                msgSender: etherPortalAddress,
                payload: "0xdeadbeef",
            }),
        ).toThrow("invalid Ether deposit payload");
    });
});
