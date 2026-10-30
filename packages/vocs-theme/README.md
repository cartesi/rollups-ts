# Cartesi Vocs theme

Cartesi branding for [Vocs](https://vocs.dev) v2 documentation sites: the brand colours and typefaces, the official logo and favicon, and a branded footer. It is built on [`@cartesi/brand`](../brand), which carries the brand itself.

## Installation

```sh
npm install @cartesi/vocs-theme@alpha
```

While in pre-release, the library is published under the `alpha` npm tag. The `@alpha` suffix is required: without it npm resolves the `latest` tag, which does not point to the version documented here.

It needs `vocs` 2.11 or later and React 19, which a Vocs site already has.

## Usage

Vocs has no theme packages; a site is themed through its config, a global stylesheet and slot components, so the theme comes in three parts. The paths below are in the site's pages directory, `src/pages/` unless the config's `srcDir` says otherwise.

1. Spread the config first in `vocs.config.ts`, so that every key you set after it wins:

    ```ts
    import { cartesiTheme } from "@cartesi/vocs-theme";
    import { defineConfig } from "vocs/config";

    export default defineConfig({
        ...cartesiTheme(),
        title: "My docs",
    });
    ```

2. Import the stylesheet in `_root.css`:

    ```css
    @import "@cartesi/vocs-theme/styles.css";
    ```

3. Re-export the slots in `_slots.tsx`:

    ```tsx
    export { Footer, OutlineFooter } from "@cartesi/vocs-theme/slots";
    ```

### What the config sets

`cartesiTheme()` returns `accentColor`, `colorScheme`, `iconUrl`, `logoUrl` and `socials`, and nothing else. In particular it never returns a nested object such as `markdown` or `codeHighlight`, because a spread replaces a nested object wholesale and would drop your own settings. To change anything it sets, set the key after the spread:

```ts
export default defineConfig({
    ...cartesiTheme(),
    basePath: "/docs",
    colorScheme: "dark",
    // a file in public/: Vocs does not prefix `basePath`, so include it
    logoUrl: "/docs/logo.svg",
    // github-dark-dimmed, Vocs' default, reads grey on the pure black page
    codeHighlight: { themes: { light: "github-light", dark: "github-dark-default" } },
});
```

The logo and favicon are inlined as `data:` URIs, so the site serves no files for them. One consequence: an `ogImageUrl` template using `%logo` would receive a data URI, so a site that uses one sets `logoUrl` to a served file.

### Restyling the slots

`Footer` takes `children`, shown above its legal line, for a site's own links:

```tsx
import { Footer as CartesiFooter } from "@cartesi/vocs-theme/slots";

export const Footer = () => (
    <CartesiFooter>
        <a href="/changelog">Changelog</a>
    </CartesiFooter>
);
```

The slots' class names, which all start with `cartesi-`, are part of the package's API and can be targeted from your own stylesheet.

## What the theme decides

These choices are the theme's, not the Brand Kit's; see [`@cartesi/brand`'s BRAND.md](../brand/BRAND.md) for what comes from the Kit.

- **Backgrounds.** Vocs paints its chrome (sidebar and top bar) and the column a page is read in with two separate tokens. Both take the Kit's pure white or pure black, and Vocs' hairline borders separate them.
- **Text.** Body text is pure black on white and pure white on black, as the Kit pairs them.
- **Headings.** All headings use Plus Jakarta Sans 600. The page title and section headings are teal on white and cyan on black; smaller headings keep the body colour, since teal on white is AA for large text only.
- **Links.** Teal text on white is below AA at body size, so a link in light mode is black with a teal underline; in dark mode it is cyan. Hovering thickens the underline. Links in callouts keep the callout's underline colour.
- **Accent.** Teal in light mode and cyan in dark, set through the config because Vocs writes it inline on the page. Vocs derives the rest of its accent colours from it and darkens it wherever it colours text, so the active sidebar item stays legible on white.
- **Left alone.** Vocs' greys, which are already neutral; its callout colours, which keep a warning distinct from a tip; and its monospace typeface, since the Kit specifies none.

The stylesheet overrides Vocs without `!important`: it declares no cascade layer, and unlayered rules beat Vocs' own, which are all layered. It reaches Vocs' markup only through the `data-v-*` attributes Vocs renders, never through its generated class names, which change between versions.
