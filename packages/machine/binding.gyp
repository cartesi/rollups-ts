{
    "variables": {
        # The addon links against the static libraries of an installed
        # cartesi-machine emulator distribution (the official .deb packages on
        # Linux, the cartesi-machine-emulator brew formula on macOS).
        # scripts/find-cartesi.cjs probes the standard locations; override
        # with the CARTESI_INC / CARTESI_LIB environment variables.
        "cartesi_inc%": "<!(node scripts/find-cartesi.cjs include)",
        "cartesi_lib%": "<!(node scripts/find-cartesi.cjs lib)",
        # libcartesi.a references libslirp (virtio net-user networking). By
        # default the addon defines those symbols itself and dlopen's the real
        # library on the first call (native/slirp-forward.cc), so nothing here
        # depends on libslirp until a machine asks for a virtio net device;
        # set CARTESI_SLIRP=yes to link it directly instead.
        "cartesi_slirp%": "<!(node -p \"process.env.CARTESI_SLIRP || 'no'\")"
    },
    "targets": [
        {
            "target_name": "cartesi_machine",
            "sources": ["native/addon.cc"],
            "include_dirs": [
                "<!@(node -p \"require('node-addon-api').include_dir\")",
                "<(cartesi_inc)"
            ],
            "defines": [
                "NAPI_VERSION=8",
                "NAPI_DISABLE_CPP_EXCEPTIONS",
                "NODE_ADDON_API_DISABLE_DEPRECATED"
            ],
            # node-gyp compiles addons with -fno-exceptions. libcartesi throws
            # internally and catches at its own C API boundary, so that costs
            # nothing normally — but native/slirp-forward.cc reports a missing
            # libslirp by throwing from inside libcartesi, which needs a frame
            # that can. NAPI_DISABLE_CPP_EXCEPTIONS above is unrelated: it is
            # about node-addon-api's error handling, not the compiler's.
            "cflags_cc!": ["-fno-exceptions"],
            "cflags!": ["-fno-exceptions"],
            "libraries": [
                "<(cartesi_lib)/libcartesi_jsonrpc.a",
                "<(cartesi_lib)/libcartesi.a"
            ],
            "conditions": [
                ["cartesi_slirp=='yes'", {
                    # brew/system libslirp lives next to libcartesi.a
                    "libraries": ["-L<(cartesi_lib)", "-lslirp"]
                }, {
                    "sources": ["native/slirp-forward.cc"]
                }],
                ["OS=='linux'", {
                    # libcartesi.a is built with OpenMP
                    "ldflags": ["-fopenmp"]
                }],
                ["OS=='mac'", {
                    "xcode_settings": {
                        "GCC_ENABLE_CPP_EXCEPTIONS": "YES",
                        "MACOSX_DEPLOYMENT_TARGET": "12.0",
                        # brew's libomp is keg-only; empty when not installed
                        "OTHER_LDFLAGS": ["<!@(node scripts/find-cartesi.cjs omp)"]
                    }
                }]
            ]
        }
    ]
}
