# Cartesi Brand

The Cartesi visual identity as a package: the four brand colours, the two typefaces, a few measurements from the brand's UI language, and the official logos. It is the [Cartesi Brand Kit](https://five-bat-d25.notion.site/Brand-Kit-25bc172ea45080d0b1c0dc222702fece) as code, and holds only what the Kit specifies: no greys, no components and no framework, so it fits any frontend. Give its values to your UI framework's theme, or load its stylesheet. [BRAND.md](BRAND.md) traces every value back to the Kit.

## Installation

```sh
npm install @cartesi/brand@alpha
```

While in pre-release, the library is published under the `alpha` npm tag. The `@alpha` suffix is required: without it npm resolves the `latest` tag, which does not point to the version documented here.

## Usage

### CSS

```css
@import "@cartesi/brand/styles.css";
```

This declares the brand as custom properties on `:root` and loads the typefaces:

| Property | Value |
| --- | --- |
| `--cartesi-cyan`, `--cartesi-teal`, `--cartesi-black`, `--cartesi-white` | `#00f6ff`, `#008da5`, `#000000`, `#ffffff` |
| `--cartesi-font-headline`, `--cartesi-weight-headline` | Plus Jakarta Sans, 600 |
| `--cartesi-font-body`, `--cartesi-weight-body` | Inter, 400 |
| `--cartesi-radius-pill` | `999px`, for the brand's fully rounded buttons |
| `--cartesi-tracking-eyebrow` | `0.12em`, for its small uppercase labels |
| `--cartesi-hairline` | `1px`, for the rule under a logo or above a headline |

The typefaces are self-hosted through [Fontsource](https://fontsource.org), so no page requests a third-party font CDN: the Latin subset of Inter 400 and 600 and Plus Jakarta Sans 600. Bold text resolves to the 600 face. If you load the fonts another way, import `@cartesi/brand/styles/tokens.css` on its own instead.

### TypeScript

The same values are exported as typed constants, for theming a UI framework in code. With [Mantine](https://mantine.dev), for example:

```ts
import { cartesiFonts } from "@cartesi/brand";
import { createTheme } from "@mantine/core";

const theme = createTheme({
    fontFamily: cartesiFonts.body.stack,
    headings: { fontFamily: cartesiFonts.headline.stack },
});
```

| Export | Contents |
| --- | --- |
| `cartesiColors` | the four brand colours |
| `cartesiTypeCombinations` | the background, headline and body colours the Kit pairs together |
| `cartesiContrast` | the WCAG contrast ratios between the colours |
| `cartesiFonts` | each typeface's family, font stack and weight |
| `cartesiShape` | the pill radius, label letter-spacing and hairline width |

### Logos

The official logos are published as SVG files, ready for a bundler to import:

```ts
import iconUrl from "@cartesi/brand/assets/icon.svg";
```

| File | Contents |
| --- | --- |
| `logo-light.svg` | the horizontal lockup in black, for light backgrounds |
| `logo-dark.svg` | the lockup in white, for dark backgrounds |
| `icon.svg` | the black icon on a cyan tile, the Kit's primary icon usage, and a favicon |
| `icon-black.svg`, `icon-white.svg`, `icon-cyan.svg`, `icon-teal.svg` | the icon alone, on a transparent background |

`@cartesi/brand/logos` exports the lockups and the tiled icon as `data:` URIs too (`cartesiLogoLightDataUri`, `cartesiLogoDarkDataUri`, `cartesiIconDataUri`), for a site that would rather not serve the files. Use of the Cartesi marks is subject to the [Trademark Usage Policy](https://cartesi.io/trademark-usage-policy/).

## Updating the logos

`assets/source/` holds the Brand Kit's own SVG exports, renamed to lowercase. `pnpm generate:assets` rebuilds `assets/generated/` from them: it checks that every file is drawn only in the colour its name says, optimises the published ones with [svgo](https://svgo.dev), and encodes the data URIs. It never recolours or redraws a mark. The output is committed, and svgo is pinned to an exact version because its output is: bumping it means regenerating and reviewing the SVG diff in the same change.
