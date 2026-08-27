// Copyright Cartesi and individual authors (see AUTHORS)
// SPDX-License-Identifier: Apache-2.0
//
// libslirp, resolved when the guest first asks for it.
//
// The official libcartesi.a is built with slirp support and references a
// handful of libslirp symbols. They are reached only by a machine configured
// with a virtio "net-user" device, which most callers never create — so
// linking libslirp into the addon would put a shared library (and its glib
// dependency) on the critical path of every install, prebuilds included, to
// serve a feature almost nobody uses.
//
// Instead the addon defines those symbols itself and forwards each call to the
// real library, dlopen'd on the first one. A machine with no networking never
// loads it; a machine with networking works as soon as libslirp is installed,
// with no rebuild; and one asking for networking on a host without libslirp
// gets an exception naming what to install, which libcartesi turns into an
// ordinary machine error at cm_create.
//
// Build with CARTESI_SLIRP=yes to link the real library directly instead, in
// which case this file is not compiled at all.
//
// The prototypes below are libslirp's, declared here rather than included:
// the point is to build without libslirp's headers. They are ABI, fixed since
// libslirp 4.0 (https://gitlab.freedesktop.org/slirp/libslirp).

#include <cstdint>
#include <cstdlib>
#include <dlfcn.h>
#include <netinet/in.h>
#include <stdexcept>
#include <string>

extern "C" {

struct Slirp;
struct SlirpConfig;
struct SlirpCb;
using SlirpAddPollCb = int (*)(int fd, int events, void *opaque);
using SlirpGetREventsCb = int (*)(int idx, void *opaque);

Slirp *slirp_new(const SlirpConfig *cfg, const SlirpCb *callbacks, void *opaque);
void slirp_cleanup(Slirp *slirp);
void slirp_input(Slirp *slirp, const uint8_t *pkt, int pkt_len);
void slirp_pollfds_fill(Slirp *slirp, uint32_t *timeout, SlirpAddPollCb add_poll, void *opaque);
void slirp_pollfds_poll(Slirp *slirp, int select_error, SlirpGetREventsCb get_revents, void *opaque);
int slirp_add_hostfwd(Slirp *slirp, int is_udp, struct in_addr host_addr, int host_port,
    struct in_addr guest_addr, int guest_port);
const char *slirp_version_string(void);
}

namespace {

#if defined(__APPLE__)
// Homebrew is keg-relative and not on the loader's default path, so the
// install prefixes are named as well as the plain sonames.
constexpr const char *CANDIDATES[] = {
    "libslirp.0.dylib",
    "libslirp.dylib",
    "/opt/homebrew/lib/libslirp.0.dylib",
    "/usr/local/lib/libslirp.0.dylib",
};
#else
constexpr const char *CANDIDATES[] = {
    "libslirp.so.0",
    "libslirp.so",
};
#endif

/// The library, or nullptr. Loaded once; a failure is not retried, since the
/// answer cannot change while the process runs.
void *library() {
    static void *const handle = [] () -> void * {
        // An installation the loader would not find on its own — a vendored
        // copy, a Nix store path — is named here.
        if (const char *named = getenv("CARTESI_SLIRP_LIB");
            named != nullptr && *named != '\0') {
            return dlopen(named, RTLD_LAZY | RTLD_LOCAL);
        }
        for (const char *candidate : CANDIDATES) {
            if (void *loaded = dlopen(candidate, RTLD_LAZY | RTLD_LOCAL); loaded != nullptr) {
                return loaded;
            }
        }
        return nullptr;
    }();
    return handle;
}

[[noreturn]] void unavailable(const char *symbol) {
    throw std::runtime_error(std::string("@cartesi/machine: virtio net-user networking needs libslirp, "
                                         "which could not be loaded (looking up ") +
        symbol +
        "). Install it — Debian/Ubuntu: apt install libslirp0, macOS: brew install libslirp — "
        "or point CARTESI_SLIRP_LIB at a copy. Machines without a virtio net device are unaffected.");
}

/// The real symbol, or an exception naming what is missing.
template <typename Fn>
Fn resolve(const char *symbol) {
    void *const handle = library();
    if (handle == nullptr) {
        unavailable(symbol);
    }
    // NOLINTNEXTLINE(cppcoreguidelines-pro-type-reinterpret-cast)
    auto *const found = reinterpret_cast<Fn>(dlsym(handle, symbol));
    if (found == nullptr) {
        unavailable(symbol);
    }
    return found;
}

} // namespace

extern "C" {

Slirp *slirp_new(const SlirpConfig *cfg, const SlirpCb *callbacks, void *opaque) {
    static const auto real = resolve<Slirp *(*)(const SlirpConfig *, const SlirpCb *, void *)>("slirp_new");
    return real(cfg, callbacks, opaque);
}

void slirp_cleanup(Slirp *slirp) {
    static const auto real = resolve<void (*)(Slirp *)>("slirp_cleanup");
    real(slirp);
}

void slirp_input(Slirp *slirp, const uint8_t *pkt, int pkt_len) {
    static const auto real = resolve<void (*)(Slirp *, const uint8_t *, int)>("slirp_input");
    real(slirp, pkt, pkt_len);
}

void slirp_pollfds_fill(Slirp *slirp, uint32_t *timeout, SlirpAddPollCb add_poll, void *opaque) {
    static const auto real =
        resolve<void (*)(Slirp *, uint32_t *, SlirpAddPollCb, void *)>("slirp_pollfds_fill");
    real(slirp, timeout, add_poll, opaque);
}

void slirp_pollfds_poll(Slirp *slirp, int select_error, SlirpGetREventsCb get_revents, void *opaque) {
    static const auto real =
        resolve<void (*)(Slirp *, int, SlirpGetREventsCb, void *)>("slirp_pollfds_poll");
    real(slirp, select_error, get_revents, opaque);
}

int slirp_add_hostfwd(Slirp *slirp, int is_udp, struct in_addr host_addr, int host_port,
    struct in_addr guest_addr, int guest_port) {
    static const auto real =
        resolve<int (*)(Slirp *, int, struct in_addr, int, struct in_addr, int)>("slirp_add_hostfwd");
    return real(slirp, is_udp, host_addr, host_port, guest_addr, guest_port);
}

const char *slirp_version_string(void) {
    // Called by libcartesi while reporting versions, where a host without
    // libslirp is not an error — it simply has no networking.
    void *const handle = library();
    if (handle == nullptr) {
        return "none";
    }
    // NOLINTNEXTLINE(cppcoreguidelines-pro-type-reinterpret-cast)
    auto *const real = reinterpret_cast<const char *(*) ()>(dlsym(handle, "slirp_version_string"));
    return real == nullptr ? "none" : real();
}
}
