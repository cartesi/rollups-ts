import { cartesiColors } from "@cartesi/brand/tokens";
import { describe, expect, it } from "vitest";
import type { defineConfig } from "vocs/config";
import { cartesiTheme } from "../src/config.js";

describe("cartesiTheme", () => {
    // A site spreads the result into its own config, and a spread replaces a
    // nested object wholesale: returning `markdown` would silently drop the
    // docs site's rehype plugin, `codeHighlight` its themes. Every key here is
    // one a site is meant to inherit, so the set is pinned and growing it has
    // to be a deliberate change.
    it("should set only the keys a site is meant to inherit", () => {
        expect(Object.keys(cartesiTheme()).sort()).toEqual([
            "accentColor",
            "colorScheme",
            "iconUrl",
            "logoUrl",
            "socials",
        ]);
    });

    it("should take the accent from the brand colours", () => {
        expect(cartesiTheme().accentColor).toBe(
            `light-dark(${cartesiColors.teal}, ${cartesiColors.cyan})`,
        );
    });

    it("should inline the logo and icon as SVG data URIs", () => {
        const { iconUrl, logoUrl } = cartesiTheme();
        expect(iconUrl).toMatch(/^data:image\/svg\+xml,/);
        expect(logoUrl).toEqual({
            light: expect.stringMatching(/^data:image\/svg\+xml,/),
            dark: expect.stringMatching(/^data:image\/svg\+xml,/),
        });
    });

    // Also a type check: `check-types` fails if the theme stops fitting the
    // config `defineConfig` takes.
    it("should let a site's own keys win after the spread", () => {
        const config: Parameters<typeof defineConfig>[0] = {
            ...cartesiTheme(),
            logoUrl: "/logo.svg",
        };
        expect(config?.logoUrl).toBe("/logo.svg");
    });
});
