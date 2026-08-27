// Helpers for virtio `net-user` networking.
//
// A machine with a `net-user` device sits behind libslirp's NAT, whose
// addresses are fixed: the guest is 10.0.2.15 on 10.0.2.0/24, the host is the
// gateway at 10.0.2.2, and 10.0.2.3 answers DNS. The guest still has to bring
// the interface up itself, which is what `NET_INIT` is for.
import type { VirtIOHostfwd } from "./types.js";

/** The network libslirp puts a `net-user` machine on. */
export const NET_USER = {
    network: "10.0.2.0",
    netmask: "255.255.255.0",
    /** The host, as the guest's default route. */
    gateway: "10.0.2.2",
    nameserver: "10.0.2.3",
    /** The address the guest is expected to take. */
    guest: "10.0.2.15",
} as const;

/**
 * The commands that give the guest its address, in the form `dtb.init` wants.
 * They are what `cartesi-machine --network` appends, and a machine that skips
 * them has a network device and no configured interface.
 */
export const NET_INIT = [
    "busybox ip link set dev eth0 up",
    `busybox ip addr add ${NET_USER.guest}/24 dev eth0`,
    `busybox ip route add default via ${NET_USER.gateway} dev eth0`,
    `[ -w /etc ] && echo 'nameserver ${NET_USER.nameserver}' > /etc/resolv.conf`,
].join("\n");

/**
 * A dotted-quad address as the number the machine configuration carries:
 *
 *     hostfwd({ hostPort: 8080, guestPort: 80 })
 *     ipv4("127.0.0.1") // 2130706433
 */
export const ipv4 = (address: string): number => {
    const parts = address.split(".");
    if (parts.length !== 4) {
        throw new Error(`${address} is not a dotted-quad IPv4 address`);
    }
    return parts.reduce((packed, part) => {
        if (!/^\d{1,3}$/.test(part)) {
            throw new Error(`${address} is not a dotted-quad IPv4 address`);
        }
        const octet = Number(part);
        if (octet > 255) {
            throw new Error(`${address} has an octet out of range`);
        }
        // >>> 0 keeps it unsigned: the last shift would otherwise make an
        // address above 127.x.x.x negative.
        return ((packed << 8) | octet) >>> 0;
    }, 0);
};

/**
 * A port forwarded from the host into the guest — the only way in, since the
 * guest is behind a NAT:
 *
 *     virtio: [{ type: "net-user", hostfwd: [hostfwd({ hostPort: 8080, guestPort: 80 })] }]
 *
 * `hostIp` defaults to 0.0.0.0 (every interface on the host) and `guestIp` to
 * the address libslirp hands out.
 */
export const hostfwd = ({
    hostPort,
    guestPort,
    hostIp = "0.0.0.0",
    guestIp = NET_USER.guest,
    udp = false,
}: {
    hostPort: number;
    guestPort: number;
    hostIp?: string;
    guestIp?: string;
    udp?: boolean;
}): VirtIOHostfwd => ({
    is_udp: udp,
    host_ip: ipv4(hostIp),
    host_port: hostPort,
    guest_ip: ipv4(guestIp),
    guest_port: guestPort,
});
