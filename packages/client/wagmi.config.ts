import { prtInternals, rollupsContracts } from "@cartesi/wagmi-plugin";
import { defineConfig } from "@wagmi/cli";

const config: ReturnType<typeof defineConfig> = defineConfig({
    out: "src/rollups.ts",
    plugins: [
        // the rollups-contracts artifacts are already restricted to the
        // contracts clients are expected to use, so every one of them is
        // generated; `prt` adds dave's own contracts on top of those, of which
        // `prtInternals` drops the ones an application never calls. The same
        // list is excluded in `@cartesi/react`, so the two packages agree on
        // which contracts exist.
        rollupsContracts({ prt: true, exclude: prtInternals }),
    ],
});

export default config;
