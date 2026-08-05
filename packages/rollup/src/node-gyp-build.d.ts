// node-gyp-build ships no type declarations of its own.
declare module "node-gyp-build" {
    /**
     * Load the native addon of the package rooted at `dir`, preferring a
     * prebuild in `<dir>/prebuilds/<platform>-<arch>/` and falling back to the
     * node-gyp output in `<dir>/build/`.
     */
    function nodeGypBuild(dir: string): unknown;
    export = nodeGypBuild;
}
