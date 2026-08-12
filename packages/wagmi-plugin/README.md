# Cartesi wagmi CLI plugin

A [wagmi CLI](https://wagmi.sh/cli/getting-started) plugin that generates code for the [Cartesi Rollups smart contracts](https://github.com/cartesi/rollups-contracts) straight from an official release: ABIs come from the foundry build artifacts tarball, and deployment addresses from the deployment addresses tarball.

## Installation

```bash
pnpm add -D @cartesi/wagmi-plugin@alpha @wagmi/cli
```

While in pre-release, the plugin is published under the `alpha` npm tag. The `@alpha` suffix is required: without it npm resolves the `latest` tag, which does not point to the version documented here.

## Usage

Add the plugin to your `wagmi.config.ts`. By default it uses the tarballs of the rollups-contracts `v3.0.0-alpha.6` GitHub release, verified against known SHA-256 hashes.

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
const version = "3.0.0-alpha.6";
const releaseUrl = `https://github.com/cartesi/rollups-contracts/releases/download/v${version}`;

rollupsContracts({
    artifacts: {
        url: `${releaseUrl}/rollups-contracts-${version}-artifacts.tar.gz`,
        sha256: "ad1e0880766d25419fc6da1858ea4e7b9074b400e9d9ef68da88b12f4a8bba45",
    },
    deployments: {
        url: `${releaseUrl}/rollups-contracts-${version}-deployment-addresses.tar.gz`,
        sha256: "bd6ee9b339e0541ce464ea3368e5e70595627b35fe0a68c6f5e044ef433ab895",
    },
});
```

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

See the [documentation](https://cartesi.github.io/rollups-ts/) for more details.
