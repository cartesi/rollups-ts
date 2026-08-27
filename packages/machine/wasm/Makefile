# Links the Emscripten flavor of libcartesi into a single ES module.
#
# Runs inside the builder image (see builder.Dockerfile), or on any host with
# the Emscripten toolchain on the PATH and a wasm libcartesi installed:
#
#   make PREFIX=/path/to/emscripten-cartesi-machine
#
# The module exports the C API verbatim — src/wasm/addon.ts marshals for it —
# so the export list is derived from the installed header instead of being
# maintained by hand.

PREFIX ?= /opt/emscripten-cartesi-machine
OUT ?= build
MODULE = $(OUT)/cartesi-machine.mjs
EXPORTS = $(OUT)/exports.txt
OPTFLAGS ?= -O3 -g0

# SINGLE_FILE embeds the wasm in the module as base64. It costs ~35% in bytes
# over the wire and rules out streaming compilation, and buys a package that
# every bundler and runtime resolves without asset plumbing. Set to 0 to emit
# cartesi-machine.wasm alongside the module instead.
SINGLE_FILE ?= 1

LDFLAGS = \
	$(OPTFLAGS) \
	-fwasm-exceptions \
	-I$(PREFIX)/include/cartesi-machine \
	-L$(PREFIX)/lib \
	-lcartesi \
	--no-entry \
	-sMODULARIZE=1 \
	-sEXPORT_ES6=1 \
	-sEXPORT_NAME=createCartesiMachineModule \
	-sENVIRONMENT=web,worker,node \
	-sALLOW_MEMORY_GROWTH=1 \
	-sINITIAL_MEMORY=64MB \
	-sMAXIMUM_MEMORY=4GB \
	-sSTACK_SIZE=4MB \
	-sFORCE_FILESYSTEM=1 \
	-sINVOKE_RUN=0 \
	-sEXIT_RUNTIME=0 \
	-sSINGLE_FILE=$(SINGLE_FILE) \
	-sEXPORTED_FUNCTIONS=@$(EXPORTS) \
	-sEXPORTED_RUNTIME_METHODS=FS,UTF8ToString,stringToUTF8,lengthBytesUTF8,HEAPU8,HEAPU16,HEAPU32,HEAP64,HEAPU64

all: $(MODULE) ## Build the ES module

$(MODULE): entry.cpp $(EXPORTS) $(PREFIX)/lib/libcartesi.a
	em++ entry.cpp -o $@ $(LDFLAGS)

# _malloc/_free own the scratch buffers the TypeScript side passes as out
# parameters, cmw_* come from entry.cpp, and everything else is the emulator's
# public C API.
$(EXPORTS): $(PREFIX)/include/cartesi-machine/cm.h entry.cpp | $(OUT)
	printf '_malloc\n_free\n_cmw_abi_version\n_cmw_emulator_version\n' > $@
	grep -oE '^CM_API [^;]*\bcm_[a-z0-9_]+\(' $< \
	    | grep -oE 'cm_[a-z0-9_]+\(' \
	    | tr -d '(' \
	    | sed 's/^/_/' \
	    | sort -u >> $@

$(OUT):
	mkdir -p $@

clean: ## Remove build outputs
	rm -rf $(OUT)

help: ## Show this help
	@grep -hE '^[a-zA-Z0-9_-]+:.*##' $(MAKEFILE_LIST) | sed 's/:.*##/:/' | column -t -s:

.PHONY: all clean help
