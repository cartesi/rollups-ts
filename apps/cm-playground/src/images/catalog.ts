// The kernel and the filesystem a Cartesi Machine is usually built from, which
// is what `cartesi-machine` runs by default.
//
// These are release assets, which GitHub serves with no cross-origin headers —
// so they are fetched through this app's own server (see ./hosts.ts) rather
// than by the page directly.
import type { ImageKind } from "./store";

export interface CatalogEntry {
    name: string;
    kind: ImageKind;
    description: string;
    url: string;
    size: number;
}

export const CATALOG: CatalogEntry[] = [
    {
        name: "linux.bin",
        kind: "kernel",
        description: "Linux 6.5.13-ctsi-2, the kernel of emulator 0.21.0",
        url: "https://github.com/cartesi/machine-linux-image/releases/download/v0.21.0/linux-6.5.13-ctsi-2-v0.21.0.bin",
        size: 17_530_712,
    },
    {
        name: "rootfs-tools.ext2",
        kind: "flash",
        description:
            "Ubuntu 24.04 userland with the guest tools, from machine-guest-tools 0.18.0",
        url: "https://github.com/cartesi/machine-guest-tools/releases/download/v0.18.0/rootfs-tools.ext2",
        size: 366_809_088,
    },
];
