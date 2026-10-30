/*
 * Builds assets/generated/ from the official Brand Kit SVGs in assets/source/.
 *
 * Run by hand with `pnpm generate:assets` when a source file or svgo changes;
 * the output is committed, so nobody installing the package runs this. It never
 * recolours or redraws a mark. The Kit ships every colour variant as its own
 * export (their coordinates differ in precision, so they are not recolours of
 * one master), and the icon on a cyan tile is the Kit's own listing asset. All
 * this does is check the sources, optimise the ones the package publishes, and
 * encode three of them as data URIs.
 *
 * svgo is pinned to an exact version because its output is committed: bumping
 * it means re-running this and reviewing the SVG diff in the same change.
 */
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { type CustomPlugin, optimize, type XastElement } from "svgo";

const source = new URL("../assets/source/", import.meta.url);
const generated = new URL("../assets/generated/", import.meta.url);

const brandColors: Record<string, string> = {
    black: "#000000",
    cyan: "#00f6ff",
    teal: "#008da5",
    white: "#ffffff",
};

/** Published file name, and the source file it is optimised from. */
const outputs: Record<string, string> = {
    "logo-light.svg": "cartesi-lockup-black.svg",
    "logo-dark.svg": "cartesi-lockup-white.svg",
    "icon.svg": "ctsi-icon.svg",
    "icon-black.svg": "cartesi-icon-black.svg",
    "icon-white.svg": "cartesi-icon-white.svg",
    "icon-cyan.svg": "cartesi-icon-cyan.svg",
    "icon-teal.svg": "cartesi-icon-teal.svg",
};

const normalise = (hex: string): string => {
    const h = hex.toLowerCase();
    return h.length === 4 ? `#${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}` : h;
};

/** Every fill in the file, whether set in a style block or as an attribute. */
const fillsOf = (svg: string): string[] =>
    [...svg.matchAll(/fill(?::\s*|=")(#[0-9a-f]{3,6})\b/gi)].map(([, hex]) =>
        normalise(hex as string),
    );

/**
 * Throws unless the file is one the Kit ships and is drawn only in the colour
 * its name says. A black mark carries no fill at all, relying on SVG's
 * default; the listing icon is a composition, so any brand colour is allowed.
 */
const check = (name: string, svg: string): void => {
    const fills = fillsOf(svg);
    const brand = Object.values(brandColors);
    if (name === "ctsi-icon.svg") {
        const stray = fills.filter((fill) => !brand.includes(fill));
        if (stray.length > 0) {
            throw new Error(`${name}: not a brand colour: ${stray.join(", ")}`);
        }
        return;
    }
    const match = name.match(
        /^cartesi-(?:outline-)?(?:icon|lockup|wordmark)-(black|cyan|teal|white)\.svg$/,
    );
    if (!match) {
        throw new Error(`${name}: not a file the Brand Kit ships`);
    }
    const color = brandColors[match[1] as string] as string;
    const wrong = fills.filter((fill) => fill !== color);
    if (wrong.length > 0 || (color !== "#000000" && fills.length === 0)) {
        throw new Error(
            `${name}: expected only ${color}, found ${fills.join(", ") || "no fill"}`,
        );
    }
};

const isOpaque = (node: XastElement): boolean =>
    node.attributes.fill !== "none" &&
    node.attributes.opacity === undefined &&
    node.attributes["fill-opacity"] === undefined;

/**
 * Drops a path when a later sibling repaints exactly the same geometry,
 * opaquely, since the earlier one can never be seen. The listing icon carries
 * two such white squares underneath its cyan one.
 */
const removePaintedOver: CustomPlugin = {
    name: "removePaintedOver",
    fn: () => ({
        element: {
            exit: (node) => {
                node.children = node.children.filter(
                    (child, i) =>
                        child.type !== "element" ||
                        child.name !== "path" ||
                        !node.children
                            .slice(i + 1)
                            .some(
                                (later) =>
                                    later.type === "element" &&
                                    later.name === "path" &&
                                    later.attributes.d === child.attributes.d &&
                                    isOpaque(later),
                            ),
                );
            },
        },
    }),
};

const optimise = (svg: string): string =>
    optimize(svg, {
        multipass: true,
        plugins: [
            {
                name: "preset-default",
                params: {
                    // Illustrator styles every shape through one shared class. Inline
                    // it into each shape, not only where a selector matches once, so
                    // that two of these marks inlined into one page cannot collide.
                    overrides: { inlineStyles: { onlyMatchedOnce: false } },
                },
            },
            "convertStyleToAttrs",
            "removeDimensions",
            // Illustrator's layer names, which mean nothing outside it
            { name: "removeAttrs", params: { attrs: "data-name" } },
            removePaintedOver,
        ],
    }).data;

/**
 * A compact `data:` URI. Only the characters an attribute or URL cannot carry
 * are percent-encoded, which keeps path data readable and the result far
 * smaller than base64. Double quotes are encoded too, so a React attribute
 * needs no escaping of its own.
 */
const toDataUri = (svg: string): string =>
    `data:image/svg+xml,${svg.replace(
        /[%#<>"]/g,
        (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
    )}`;

const names = (await readdir(source))
    .filter((name) => name.endsWith(".svg"))
    .sort();
const sources = new Map<string, string>();
for (const name of names) {
    const svg = await readFile(new URL(name, source), "utf8");
    check(name, svg);
    sources.set(name, svg);
}

await mkdir(generated, { recursive: true });
const optimised = new Map<string, string>();
for (const [output, input] of Object.entries(outputs)) {
    const svg = sources.get(input);
    if (svg === undefined) {
        throw new Error(`${input}: missing from assets/source/`);
    }
    const data = optimise(svg);
    optimised.set(output, data);
    await writeFile(new URL(output, generated), `${data}\n`);
}

const dataUris = {
    icon: toDataUri(optimised.get("icon.svg") as string),
    logoLight: toDataUri(optimised.get("logo-light.svg") as string),
    logoDark: toDataUri(optimised.get("logo-dark.svg") as string),
};
await writeFile(
    new URL("data-uris.json", generated),
    `${JSON.stringify(dataUris, null, 4)}\n`,
);

console.log(
    `checked ${names.length} sources, wrote ${Object.keys(outputs).length} SVGs`,
);
