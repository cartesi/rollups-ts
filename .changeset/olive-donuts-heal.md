---
"@cartesi/wagmi-plugin": patch
---

stop caching the downloaded tarballs. Extracting them into the OS temporary directory and caching that left codegen unable to recover once a temporary directory cleaner had swept the extraction: a leftover directory made every later run fail with `ENOTEMPTY` while renaming a fresh extraction onto it, and a surviving completion marker over reaped contents made codegen silently resolve no contracts. The tarballs are a few hundred KB, so they are now simply downloaded on every run and extracted to a throwaway directory, removed once the contracts have been read. Generating contracts therefore always needs network access.
