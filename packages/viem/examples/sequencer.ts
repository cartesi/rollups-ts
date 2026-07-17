import { erc20PortalAbi } from "@cartesi/viem/abi";
import { createSequencerClient } from "@cartesi/viem/sequencer";
import {
    createPublicClient,
    createTestClient,
    createWalletClient,
    http,
    parseAbi,
    parseUnits,
} from "viem";
import { mnemonicToAccount } from "viem/accounts";
import { anvil } from "viem/chains";

// devnet erc20 portal address
const erc20PortalAddress = "0xACA6586A0Cf05bD831f2501E7B4aea550dA6562D";

// sequencer devnet application address
const application = "0x7508F403A38a0cE53ca70F3DC4c150d614CE371C";

// sequencer devnet application address
const mnemonic = "test test test test test test test test test test test junk";
const addressIndex = 3;

// sequencer devnet RPC URL
const rpcUrl = "http://127.0.0.1:51872";

// sequencer devnet URL
const sequencerUrl = "http://127.0.0.1:51887";

// tx data
const data = "0xdeadbeef";
const maxFee = 1_200;
const nonce = 0;

// create an L1 wallet client
const account = mnemonicToAccount(mnemonic, { addressIndex });
const walletClient = createWalletClient({
    account,
    chain: anvil,
    transport: http(rpcUrl),
});

// create a separate client for the sequencer service
const sequencerClient = createSequencerClient({
    account,
    application,
    chain: anvil,
    transport: http(sequencerUrl),
});

const publicClient = createPublicClient({
    chain: anvil,
    transport: http(rpcUrl),
});

// fee token
const mockUsdc = "0x95d0c8A7d11342299807A2Fc19ac44C2321cCc68";

const mockUsdcAbi = parseAbi([
    "function approve(address spender, uint256 value) returns (bool)",
    "function balanceOf(address) view returns (uint256)",
    "function mint(address to, uint256 value)",
]);

const amount = parseUnits("10", 6); // 10 USDC

// Local devnet only: mint mock USDC.
const mintHash = await walletClient.writeContract({
    address: mockUsdc,
    abi: mockUsdcAbi,
    functionName: "mint",
    args: [account.address, amount],
});
console.log(
    `Minting ${amount} mock USDC to ${account.address}, tx hash: ${mintHash}`,
);
await publicClient.waitForTransactionReceipt({ hash: mintHash });

// Allow ERC20Portal to transfer it.
const approveHash = await walletClient.writeContract({
    address: mockUsdc,
    abi: mockUsdcAbi,
    functionName: "approve",
    args: [erc20PortalAddress, amount],
});
console.log(
    `Approving ${amount} mock USDC for ERC20Portal, tx hash: ${approveHash}`,
);
await publicClient.waitForTransactionReceipt({ hash: approveHash });

// Deposit into the application.
const depositHash = await walletClient.writeContract({
    address: erc20PortalAddress,
    abi: erc20PortalAbi,
    functionName: "depositERC20Tokens",
    args: [mockUsdc, application, amount, "0x"],
});
console.log(
    `Depositing ${amount} mock USDC into the application, tx hash: ${depositHash}`,
);
await publicClient.waitForTransactionReceipt({ hash: depositHash });

// Give the sequencer another safe L1 block to observe the direct input.
const testClient = createTestClient({
    chain: anvil,
    mode: "anvil",
    transport: http(rpcUrl),
});
await testClient.mine({ blocks: 10 }); // why 3? 1 did not work

console.log(`Sending sequencer transaction with data: ${data}`);
const receipt = await sequencerClient.sendTransaction({
    data,
    maxFee,
    nonce,
});

console.log(receipt);
