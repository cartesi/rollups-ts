import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
    cartesiColors,
    cartesiContrast,
    cartesiFonts,
    cartesiShape,
} from "../src/tokens.js";

// The brand ships twice, as typed values and as CSS custom properties, for
// consumers that theme a UI framework in code and consumers that only load a
// stylesheet. Neither is generated from the other, so this is what keeps them
// the same brand.
const css = readFileSync(
    new URL("../styles/tokens.css", import.meta.url),
    "utf8",
);
const properties = new Map(
    [...css.matchAll(/(--cartesi-[a-z-]+):\s*([^;]+);/g)].map(
        ([, name, value]) => [
            name,
            (value as string).replace(/\s+/g, " ").trim(),
        ],
    ),
);

/** WCAG 2 relative luminance of an sRGB hex colour. */
const luminance = (hex: string): number => {
    const [r, g, b] = [1, 3, 5].map((i) => {
        const c = Number.parseInt(hex.slice(i, i + 2), 16) / 255;
        return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    }) as [number, number, number];
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const contrast = (a: string, b: string): number => {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [
        number,
        number,
    ];
    return (hi + 0.05) / (lo + 0.05);
};

describe("tokens", () => {
    it("should declare the brand colours in CSS as in TypeScript", () => {
        for (const [name, hex] of Object.entries(cartesiColors)) {
            expect(properties.get(`--cartesi-${name}`)).toBe(hex);
        }
    });

    it("should declare the typefaces in CSS as in TypeScript", () => {
        expect(properties.get("--cartesi-font-headline")).toBe(
            cartesiFonts.headline.stack,
        );
        expect(properties.get("--cartesi-font-body")).toBe(
            cartesiFonts.body.stack,
        );
        expect(properties.get("--cartesi-weight-headline")).toBe(
            String(cartesiFonts.headline.weight),
        );
        expect(properties.get("--cartesi-weight-body")).toBe(
            String(cartesiFonts.body.weight),
        );
    });

    it("should declare the measurements in CSS as in TypeScript", () => {
        expect(properties.get("--cartesi-radius-pill")).toBe(
            cartesiShape.radiusPill,
        );
        expect(properties.get("--cartesi-tracking-eyebrow")).toBe(
            cartesiShape.trackingEyebrow,
        );
        expect(properties.get("--cartesi-hairline")).toBe(
            cartesiShape.hairline,
        );
    });

    it("should declare nothing in CSS that TypeScript does not", () => {
        // each typeface is a stack and a weight
        expect(properties.size).toBe(
            Object.keys(cartesiColors).length +
                2 * Object.keys(cartesiFonts).length +
                Object.keys(cartesiShape).length,
        );
    });

    // The published ratios are what a consumer makes its contrast decisions
    // with, so they are computed here from the colours rather than trusted.
    it("should publish the contrast ratios the colours actually have", () => {
        const { black, cyan, teal, white } = cartesiColors;
        expect(contrast(cyan, black)).toBeCloseTo(
            cartesiContrast.cyanOnBlack,
            1,
        );
        expect(contrast(teal, black)).toBeCloseTo(
            cartesiContrast.tealOnBlack,
            1,
        );
        expect(contrast(teal, white)).toBeCloseTo(
            cartesiContrast.tealOnWhite,
            1,
        );
        expect(contrast(cyan, white)).toBeCloseTo(
            cartesiContrast.cyanOnWhite,
            1,
        );
    });
});
