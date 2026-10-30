/**
 * The Cartesi brand, as data.
 *
 * Every value comes from the Cartesi Brand Kit
 * (https://five-bat-d25.notion.site/Brand-Kit-25bc172ea45080d0b1c0dc222702fece).
 * Where the Kit describes something without giving a number, the value is our
 * reading of it and says so. There are no greys and no semantic aliases: the
 * Kit defines neither, and a consumer's UI framework ships its own neutrals.
 *
 * `styles/tokens.css` carries the same values as CSS custom properties, and a
 * test keeps the two in step.
 */

/** The four brand colours. */
export const cartesiColors = {
    cyan: "#00f6ff",
    teal: "#008da5",
    black: "#000000",
    white: "#ffffff",
} as const;

export type CartesiColor = keyof typeof cartesiColors;

/** The background, headline and body colours the Brand Kit pairs together. */
export const cartesiTypeCombinations = [
    { background: "cyan", headline: "black", body: "black" },
    { background: "black", headline: "cyan", body: "white" },
    { background: "white", headline: "teal", body: "black" },
] as const satisfies readonly {
    background: CartesiColor;
    headline: CartesiColor;
    body: CartesiColor;
}[];

/**
 * WCAG contrast ratios between the brand colours. Teal on white passes AA only
 * for large text (24px, or 18.66px bold), so it suits headlines but not body
 * text or links; cyan on white is never legible as text.
 */
export const cartesiContrast = {
    cyanOnBlack: 15.6,
    tealOnBlack: 5.35,
    tealOnWhite: 3.92,
    cyanOnWhite: 1.34,
} as const;

/** Plus Jakarta Sans for headlines, Inter for everything else. */
export const cartesiFonts = {
    headline: {
        family: "Plus Jakarta Sans",
        stack: '"Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif',
        weight: 600,
    },
    body: {
        family: "Inter",
        stack: "Inter, ui-sans-serif, system-ui, sans-serif",
        weight: 400,
    },
} as const;

/** Measurements from the Brand Kit's UI language. */
export const cartesiShape = {
    /** Buttons are fully rounded pills. */
    radiusPill: "999px",
    /**
     * Uppercase labels are generously letter-spaced. The Kit gives no number;
     * this one is ours.
     */
    trackingEyebrow: "0.12em",
    /** The rule under a logo or above a headline. */
    hairline: "1px",
} as const;
