# Cartesi wagmi CLI plugin

A [wagmi CLI](https://wagmi.sh/cli/getting-started) plugin that generates code for the [Cartesi Rollups smart contracts](https://github.com/cartesi/rollups-contracts) straight from an official release: ABIs come from the foundry build artifacts tarball, and deployment addresses from the deployment addresses and anvil devnet tarballs.

## Installation

```bash
pnpm add -D @cartesi/wagmi-plugin@alpha @wagmi/cli
```

While in pre-release, the plugin is published under the `alpha` npm tag. The `@alpha` suffix is required: without it npm resolves the `latest` tag, which does not point to the version documented here.

## Usage

Add the plugin to your `wagmi.config.ts`. By default it uses the tarballs of the rollups-contracts `v3.0.0-alpha.10` GitHub release, verified against known SHA-256 hashes.

```ts
import { rollupsContracts } from "@cartesi/wagmi-plugin";
import { defineConfig } from "@wagmi/cli";

export default defineConfig({
    out: "src/generated.ts",
    plugins: [rollupsContracts()],
});
```

Then run codegen:

```bash
pnpm wagmi generate
```

### Using a different release

Point `artifacts` and `deployments` at the tarballs of another rollups-contracts release, optionally with an expected SHA-256 hash for integrity verification:

```ts
const version = "3.0.0-alpha.10";
const releaseUrl = `https://github.com/cartesi/rollups-contracts/releases/download/v${version}`;

rollupsContracts({
    artifacts: {
        url: `${releaseUrl}/cartesi-rollups-contracts-${version}-artifacts.tar.gz`,
        sha256: "5213ce59d0f5a1c4fef4ebf17b6ef999be709c32b4b94511c320729bb2afa959",
    },
    deployments: {
        url: `${releaseUrl}/cartesi-rollups-contracts-${version}-deployment-addresses.tar.gz`,
        sha256: "ba92d98c5f1ccbc3edf3b05e3717dc7292f56187b363f86d2569d00b6eedf4b5",
    },
});
```

Addresses are read from the plaintext deployment files, which rollups-contracts publishes since `v3.0.0-alpha.8`, so `deployments` must point at that release or a later one.

### Selecting contracts

Use `include` and `exclude` to select which contracts are generated. Both accept contract names or regular expressions, and apply to every contract in the artifacts, whether it has a deployment or not:

- Neither defined: all contracts are included.
- Only `include`: only the matching contracts are included.
- Only `exclude`: all contracts are included except the matching ones.
- Both: `include` is applied first, then `exclude`.

For example, to generate only the `Inputs` and `Outputs` contracts:

```ts
rollupsContracts({
    include: ["Inputs", "Outputs"],
});
```

Or to generate all portal contracts except the interfaces:

```ts
rollupsContracts({
    include: [/Portal$/],
    exclude: [/^I[A-Z]/],
});
```

## Behavior

- Tarballs are downloaded on every run, verified against their expected hash, and extracted to a temporary directory that is removed once the contracts have been read. Codegen therefore needs network access.
- Deployed contracts get their address on every chain: a single address when it is identical across chains, or a per-chain record otherwise.
- Addresses cover the supported livenets and the devnet (chain 31337), the latter read from the anvil tarball, which is also where the devnet-only test tokens come from. Set `anvil: false` to generate livenet addresses only.

See the [documentation](https://cartesi.github.io/rollups-ts/) for more details.
