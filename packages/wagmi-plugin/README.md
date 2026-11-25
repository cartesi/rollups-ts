# Cartesi wagmi CLI plugin

A [wagmi CLI](https://wagmi.sh/cli/getting-started) plugin that generates code for the [Cartesi Rollups contracts](https://github.com/cartesi/rollups-contracts) straight from an official release: ABIs come from the build artifacts tarball, and deployment addresses from the deployment addresses and anvil devnet tarballs.

## Installation

```bash
pnpm add -D @cartesi/wagmi-plugin@alpha @wagmi/cli
```

While in pre-release, the plugin is published under the `alpha` npm tag. The `@alpha` suffix is required: without it npm resolves the `latest` tag, which does not point to the version documented here.

## Usage

Add `rollupsContracts` to your `wagmi.config.ts`. By default it uses the tarballs of the rollups-contracts `v3.0.0-beta.1` GitHub release, verified against known SHA-256 hashes.

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
const version = "3.0.0-beta.1";
const releaseUrl = `https://github.com/cartesi/rollups-contracts/releases/download/v${version}`;

rollupsContracts({
    artifacts: {
        url: `${releaseUrl}/cartesi-rollups-contracts-${version}-artifacts.tar.gz`,
        sha256: "fef35c40f30805301c1e5ca238e7c54f2ca585b539c692d88c640b3aee6f639d",
    },
    deployments: {
        url: `${releaseUrl}/cartesi-rollups-contracts-${version}-deployment-addresses.tar.gz`,
        sha256: "a73388630483740a55c08ee06be0e41303b20621a65b6dbc7d7e3b61ccb3f93e",
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

## PRT contracts

The Rollups contracts provide two permissioned consensus models out of the box: Authority (1-of-1) and Quorum (majority-of-N). These consensus models are simple to implement and interact with, but they are not very safe. Both are permissioned and therefore prone to private-key leakage. Meanwhile, PRT (Permissionless Refereed Tournaments) is a 1-of-N dispute-resolution algorithm that allows anyone to defend the correct outcome of a computation with sensible hardware and Ether requirements. If you wish to generate bindings for the PRT contracts as well, you can set the `prt` option to true.

```ts
rollupsContracts({ prt: true });
```

Everything `rollupsContracts()` generates is still there, with the same ABIs and addresses, plus `DaveConsensus`, `DaveAppFactory`, `MultiLevelTournamentFactory`, `Tournament`, `CartesiStateTransition` and what they are built against.

[dave](https://github.com/cartesi/dave) publishes the PRT contracts and the deployment addresses, but does not rebuild the rollups contracts, so `prt` reads the ABIs of those from the `artifacts` tarball and adds dave's own. Both releases publish the addresses they share, and both are read: an address they disagree on fails the generation, which is what catches a dave release paired with a rollups-contracts one it was not deployed against. By default it uses dave `v3.0.0-alpha.6`, deployed against the rollups-contracts `v3.0.0-alpha.10` release `artifacts` defaults to; pass an object (`prt: { artifacts, deployments, experimentalDeployments, anvil }`) to point at another dave release, keeping the pairing intact.

Since `v3.0.0-alpha.6` dave publishes the chains it deploys to but does not validate the node on (OP Mainnet, Base, their Sepolia testnets and the Arbitrum chains) in a separate experimental addresses tarball, which `prt.experimentalDeployments` reads by default; set it to `false` to generate only Ethereum mainnet, Sepolia and the devnet, or for a dave release that publishes no such tarball.

Addresses are read from the plaintext deployment files, which dave publishes since `v3.0.0-alpha.4`, so `prt.deployments` and `prt.anvil` must point at that release or a later one.

Much of what dave publishes is of no use to an application: libraries, error-only ABIs, and concrete contracts whose interface is what you call. Pass `prtInternals` as `exclude` to generate only the surface a consumer reaches for.

```ts
rollupsContracts({ prt: true, exclude: prtInternals });
```

That drops `Tournament` and `DaveConsensus` in favour of `ITournament` and `IDaveConsensus` — an application holds the address of a tournament the factory created, not of a published deployment — so a bond is claimed through `iTournamentAbi`. It is worth doing: wagmi writes one declaration per contract member, each carrying a copy of that contract's ABI type, so a large ABI nobody calls is paid for many times over in the declaration file.

## Behavior

- Tarballs are downloaded on every run, verified against their expected hash, and extracted to a temporary directory that is removed once the contracts have been read. Codegen therefore needs network access.
- Deployed contracts get their address on every chain: a single address when it is identical across chains, or a per-chain record otherwise.
- Addresses cover the supported livenets and the devnet (chain 31337), the latter read from the anvil tarball, which is also where the devnet-only test tokens come from. Set `anvil: false` to generate livenet addresses only.
- When multiple projects build the same contract, the plugin ensures their ABIs match and generates only one binding, and likewise that the releases agree on the addresses they both publish.

See the [documentation](https://cartesi.github.io/rollups-ts/) for more details.
