import type { Address, Hex } from "viem";

export type PortalKind =
    | "EtherPortal"
    | "ERC20Portal"
    | "ERC721Portal"
    | "ERC1155SinglePortal"
    | "ERC1155BatchPortal";

export type EtherDeposit = {
    type: "EtherDeposit";
    sender: Address;
    value: bigint;
    execLayerData: Hex;
};

export type ERC20Deposit = {
    type: "ERC20Deposit";
    token: Address;
    sender: Address;
    value: bigint;
    execLayerData: Hex;
};

export type ERC721Deposit = {
    type: "ERC721Deposit";
    token: Address;
    sender: Address;
    tokenId: bigint;
    baseLayerData: Hex;
    execLayerData: Hex;
};

export type ERC1155SingleDeposit = {
    type: "ERC1155SingleDeposit";
    token: Address;
    sender: Address;
    tokenId: bigint;
    value: bigint;
    baseLayerData: Hex;
    execLayerData: Hex;
};

export type ERC1155BatchDeposit = {
    type: "ERC1155BatchDeposit";
    token: Address;
    sender: Address;
    tokenIds: readonly bigint[];
    values: readonly bigint[];
    baseLayerData: Hex;
    execLayerData: Hex;
};

export type Deposit =
    | EtherDeposit
    | ERC20Deposit
    | ERC721Deposit
    | ERC1155SingleDeposit
    | ERC1155BatchDeposit;

export type PortalDeposit = {
    EtherPortal: EtherDeposit;
    ERC20Portal: ERC20Deposit;
    ERC721Portal: ERC721Deposit;
    ERC1155SinglePortal: ERC1155SingleDeposit;
    ERC1155BatchPortal: ERC1155BatchDeposit;
};
