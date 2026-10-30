# Cartesi brand rules

Condensed from the [Cartesi Brand Kit](https://five-bat-d25.notion.site/Brand-Kit-25bc172ea45080d0b1c0dc222702fece), which is the source of truth. This file records what the package takes from it, so any value here can be checked against the original.

## Colours

The palette centres on neon cyan, supported by black and white. Teal is for headlines over white only, and is rarely used as a large block or background.

| Name | Hex | Role |
| --- | --- | --- |
| Cyan | `#00f6ff` | the primary brand colour: backgrounds, highlights, primary buttons |
| Teal | `#008da5` | headlines over white only |
| Black | `#000000` | text, backgrounds |
| White | `#ffffff` | text, backgrounds |

WCAG contrast between them, computed from the colours and checked by the package's tests:

| Pair | Ratio | Use |
| --- | --- | --- |
| cyan on black | 15.6:1 | anything |
| teal on black | 5.35:1 | AA for body text |
| teal on white | 3.92:1 | AA for large text only (24px, or 18.66px bold): headlines, not body text or links |
| cyan on white | 1.34:1 | never as text |

## Type colour combinations

| Background | Headline | Body |
| --- | --- | --- |
| cyan | black | black |
| black | cyan | white |
| white | teal | black |

## Typography

- **Plus Jakarta Sans, semibold (600)** for headlines.
- **Inter, regular (400)** for everything else.

Both are on Google Fonts under the SIL Open Font License. The Kit specifies no monospace typeface, so the package sets none.

## UI language

- Buttons are pills: fully rounded, uppercase labels with generous letter-spacing, a thin 1px outline. The primary button is cyan with black text; the secondary is transparent, outlined in the text colour.
- Small labels above a headline are uppercase and letter-spaced. The Kit gives no letter-spacing value; the package's `0.12em` is our reading of it, and the only number in the package the Kit does not state.
- A thin 1px rule sits under the logo and above a headline, in the headline colour.

## Logos

The logo is the icon and the lowercase "cartesi" wordmark, mostly used side by side as a lockup, and only ever in the brand colours. The primary icon usage is the black icon on a cyan background, as in profile images and exchange listings.

`assets/source/` holds the Kit's own exports, renamed to lowercase: the icon, lockup, wordmark, outline icon and outline lockup, each in black, cyan, teal and white, plus `ctsi-icon.svg`, the black icon on a cyan tile used for listings. Each colour is a separate export rather than a recolour of one master, and the package never recolours or redraws one.

## Voice

The tagline is "Any code. Ethereum's security."
