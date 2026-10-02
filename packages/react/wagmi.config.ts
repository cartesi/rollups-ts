import { prtInternals, rollupsContracts } from "@cartesi/wagmi-plugin";
import { defineConfig } from "@wagmi/cli";
import { actions, react } from "@wagmi/cli/plugins";

const config: ReturnType<typeof defineConfig> = defineConfig({
    out: "src/generated.ts",
    plugins: [
        // the rollups-contracts artifacts are already restricted to the
        // contracts clients are expected to use, so every one of them is
        // generated; `prt` adds dave's own contracts on top of those, of which
        // `prtInternals` drops the ones an application never calls. The same
        // list is excluded in `@cartesi/client`, so the two packages agree on
        // which contracts exist.
        //
        // It matters most here: `actions()` and `react()` emit one declaration
        // per contract member, each carrying a copy of that contract's ABI
        // type, so an ABI nobody calls is paid for many times over in the
        // declaration file.
        rollupsContracts({ prt: true, exclude: prtInternals }),
        actions(),
        react(),
    ],
});

export default config;
