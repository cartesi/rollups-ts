# Cartesi Codec

Isomorphic utility functions to decode (and encode, for testing) data compliant with the Cartesi Rollups [`Inputs`](https://github.com/cartesi/rollups-contracts/blob/main/src/common/Inputs.sol) and [`Outputs`](https://github.com/cartesi/rollups-contracts/blob/main/src/common/Outputs.sol) interfaces.

Inputs delivered to a Cartesi application and outputs produced by it are ABI-encoded as calls to the functions of those interfaces. This package decodes those blobs into friendly typed objects, and encodes typed objects back into blobs. The `Input` and `Output` TypeScript types are inferred directly from the `Inputs` and `Outputs` ABIs, so they always match the rollups-contracts release the package is built against. It works in browsers and Node.js, and depends only on [viem](https://viem.sh) and [abitype](https://abitype.dev).

## Installation

```sh
npm install @cartesi/codec viem
```

## Usage

### Decoding inputs

Inputs are encoded as `EvmAdvance(uint256,address,address,uint256,uint256,uint256,uint256,bytes)` calls:

```ts
import { decodeInput } from "@cartesi/codec";

const input = decodeInput("0x415bf363...");
// {
//   chainId: 1n,
//   appContract: "0x...",
//   msgSender: "0x...",
//   blockNumber: 4n,
//   blockTimestamp: 5n,
//   prevRandao: 6n,
//   index: 7n,
//   payload: "0xdeadbeef",
// }
```

### Decoding outputs

Outputs are encoded as `Notice(bytes)`, `Voucher(address,uint256,bytes)` or `DelegateCallVoucher(address,bytes)` calls. `decodeOutput` returns a union discriminated by the `type` field:

```ts
import { decodeOutput } from "@cartesi/codec";

const output = decodeOutput("0xc258d6e5...");
switch (output.type) {
    case "Notice":
        console.log(output.payload);
        break;
    case "Voucher":
        console.log(output.destination, output.value, output.payload);
        break;
    case "DelegateCallVoucher":
        console.log(output.destination, output.payload);
        break;
}
```

### Decoding portal deposits

Deposits made through the rollups portals arrive as inputs whose `msgSender` is the portal and whose `payload` is packed-encoded (`abi.encodePacked`) by the rollups contracts [`InputEncoding`](https://github.com/cartesi/rollups-contracts/blob/main/src/common/InputEncoding.sol) library. Since packed payloads carry no function selector, check the input's `msgSender` against the portal address before decoding:

```ts
import {
    decodeBatchERC1155Deposit,
    decodeERC20Deposit,
    decodeERC721Deposit,
    decodeEtherDeposit,
    decodeInput,
    decodeSingleERC1155Deposit,
} from "@cartesi/codec";

const input = decodeInput("0x415bf363...");

const etherDeposit = decodeEtherDeposit(input.payload);
// { sender: "0x...", value: 123456789n, execLayerData: "0x..." }

const erc20Deposit = decodeERC20Deposit(input.payload);
// { token: "0x...", sender: "0x...", value: 1000n, execLayerData: "0x..." }

const erc721Deposit = decodeERC721Deposit(input.payload);
// { token, sender, tokenId, baseLayerData, execLayerData }

const singleDeposit = decodeSingleERC1155Deposit(input.payload);
// { token, sender, tokenId, value, baseLayerData, execLayerData }

const batchDeposit = decodeBatchERC1155Deposit(input.payload);
// { token, sender, tokenIds, values, baseLayerData, execLayerData }
```

Each has an encoding counterpart (`encodeEtherDeposit`, `encodeERC20Deposit`, `encodeERC721Deposit`, `encodeSingleERC1155Deposit`, `encodeBatchERC1155Deposit`) for producing test fixtures.

### Encoding (for testing)

Each decode function has an encoding counterpart, useful for producing test fixtures:

```ts
import {
    encodeDelegateCallVoucher,
    encodeInput,
    encodeNotice,
    encodeOutput,
    encodeVoucher,
} from "@cartesi/codec";

const input = encodeInput({
    chainId: 1n,
    appContract: "0x67742ff5b2b762503ff0a92738c6fc2ea4a4d182",
    msgSender: "0x92cc14432c1f82622493abd64d99ea8a3000a7c7",
    blockNumber: 4n,
    blockTimestamp: 5n,
    prevRandao: 6n,
    index: 7n,
    payload: "0xdeadbeef",
});

const notice = encodeNotice({ payload: "0xdeadbeef" });
const voucher = encodeVoucher({
    destination: "0x67742ff5b2b762503ff0a92738c6fc2ea4a4d182",
    value: 0n,
    payload: "0x",
});
const delegateCallVoucher = encodeDelegateCallVoucher({
    destination: "0x67742ff5b2b762503ff0a92738c6fc2ea4a4d182",
    payload: "0x",
});
```

### ABIs

The `Inputs` and `Outputs` ABIs used by the codec are also exported, both from the main entrypoint and from `@cartesi/codec/abi`:

```ts
import { inputsAbi, outputsAbi } from "@cartesi/codec/abi";
```

## Documentation

See the [documentation site](https://cartesi.github.io/rollups-ts/codec) for the full API reference.
