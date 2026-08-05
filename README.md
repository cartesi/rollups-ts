# Cartesi TypeScript libraries

This repository hosts different Cartesi related TypeScript libraries, that tipically helps with development of Cartesi applications.

Documentation for all of them is published at <https://cartesi.github.io/rollups-ts>.

## What's inside?

This repo includes the following packages:

### Packages

- [`@cartesi/client`](packages/client): a [viem](https://viem.sh) extension with L1 actions for the Cartesi smart contracts and L2 actions for the Cartesi Rollups node JSON-RPC API
- [`@cartesi/react`](packages/react): React hooks (built on TanStack Query) wrapping the client actions
- [`@cartesi/rpc`](packages/rpc): a Cartesi JSON-RPC typed client library
- [`@cartesi/codec`](packages/codec): isomorphic encoding and decoding of Cartesi Rollups inputs, outputs and portal deposits
- [`@cartesi/rollup`](packages/rollup): Node.js bindings for libcmt, for applications running inside a Cartesi Machine
- [`@cartesi/wagmi-plugin`](packages/wagmi-plugin): a [Wagmi CLI](https://wagmi.sh/cli/getting-started) plugin that generates ABIs and deployment addresses from a rollups-contracts release

### Apps

- [`@cartesi/docs`](apps/docs): the [Vocs](https://vocs.dev) documentation site

### Setup

`@cartesi/rollup` builds a native addon from the [machine-guest-tools](https://github.com/cartesi/machine-guest-tools) git submodule, so check it out before installing:

```
git submodule update --init
pnpm install
```

### Build

To build all packages, run the following command:

```
pnpm build
```

### Develop

To develop all packages, run the following command:

```
pnpm dev
```

## License

Licensed under [Apache 2.0](LICENSE).
