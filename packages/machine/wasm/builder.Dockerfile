# syntax=docker/dockerfile:1
#
# Builds the WebAssembly flavor of @cartesi/machine: libcartesi compiled by
# Emscripten, linked into a single ES module the TypeScript layer drives
# through the same C API the N-API addon binds.
#
#   docker buildx build --target artifact --output type=local,dest=../src/wasm .
#
# Both versions below are pinned on purpose: the emulator series has to match
# the one the native binding targets (see scripts/install.cjs), and a build that
# ends up in a release has to be reproducible.

ARG EMSDK_VERSION=6.0.8
ARG CARTESI_MACHINE_VERSION=0.21.0

# -----------------------------------------------------------------------------
# libcartesi.a, compiled to WebAssembly
# -----------------------------------------------------------------------------
FROM emscripten/emsdk:${EMSDK_VERSION} AS libcartesi
ARG CARTESI_MACHINE_VERSION

# The emulator keeps documentation images in Git LFS, which the library build
# has no use for, so the clone skips fetching them.
#
# Release tarballs ship without the generated files (the pristine
# microarchitecture images and the interpreter jump table); generating them
# needs a RISC-V toolchain and Lua, so every release publishes them as a patch
# instead, which is what the official builds consume as well.
RUN set -eu; \
    apt-get update; \
    apt-get install -y --no-install-recommends ca-certificates git patch wget; \
    rm -rf /var/lib/apt/lists/*; \
    GIT_LFS_SKIP_SMUDGE=1 git clone --branch v${CARTESI_MACHINE_VERSION} --depth 1 \
        https://github.com/cartesi/machine-emulator.git /usr/src/machine-emulator; \
    cd /usr/src/machine-emulator; \
    wget -q "https://github.com/cartesi/machine-emulator/releases/download/v${CARTESI_MACHINE_VERSION}/add-generated-files.diff"; \
    patch -Np1 < add-generated-files.diff; \
    make bundle-boost

# Emscripten specifics, all of them load-bearing:
#   -fwasm-exceptions  libcartesi throws internally and catches at the C API
#                      boundary to fill cm_get_last_error_message(). Emscripten
#                      does not catch exceptions by default, which turns the
#                      first emulator error into an unrecoverable abort.
#   -DNO_MMAP          MEMFS has no shared file mappings, so mapping the
#                      backing stores of a stored machine fails at load time.
#                      The emulator ships a stdio fallback behind this define.
#   threads=no         OpenMP is used only to parallelize hash tree updates.
#   slirp=no           virtio net-user networking, not portable to wasm.
RUN set -eu; \
    cd /usr/src/machine-emulator; \
    make -C src -j$(nproc) libcartesi.a \
        SO_EXT=wasm CC=emcc CXX=em++ AR="emar rcs" \
        LUA_LIB= LUA_INC= \
        OPTFLAGS="-O3 -g0 -fwasm-exceptions -DNO_MMAP" \
        slirp=no threads=no; \
    make install-headers install-static-libs \
        STRIP=emstrip \
        EMU_TO_LIB_A="src/libcartesi.a" \
        PREFIX=/opt/emscripten-cartesi-machine

# -----------------------------------------------------------------------------
# The ES module
# -----------------------------------------------------------------------------
FROM libcartesi AS module
WORKDIR /usr/src/wasm
COPY Makefile entry.cpp ./
RUN make

# -----------------------------------------------------------------------------
# Artifact only, so `--output type=local` writes just the module
# -----------------------------------------------------------------------------
FROM scratch AS artifact
COPY --from=module /usr/src/wasm/build/cartesi-machine.mjs /
