// Translation unit for the module link step. C++, because that is what the
// module is linked as — libcartesi is C++ — and the helpers below are given C
// linkage so they keep the names the export list asks for.
//
// The binding calls libcartesi's C API directly — every entry point takes
// pointers and scalars, so there is nothing to wrap — and the archive's
// symbols are pulled in by the generated EXPORTED_FUNCTIONS list rather than
// by references from here. What this file does provide is an input object for
// the linker and a version the TypeScript layer can check the module against.

#include <stdint.h>

#include "cm.h"

extern "C" {

// Bumped when the shape of the module's exports changes in a way src/wasm
// depends on (an added helper, a changed convention). Unrelated to the
// emulator version, which cm_get_version() reports.
#define CMW_ABI_VERSION 1

uint32_t cmw_abi_version(void) {
    return CMW_ABI_VERSION;
}

// The emulator version this module was linked against, so a mismatched module
// is diagnosed at load time instead of at the first surprising behavior.
uint64_t cmw_emulator_version(void) {
    return cm_get_version();
}

}
