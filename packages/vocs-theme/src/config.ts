import {
    cartesiIconDataUri,
    cartesiLogoDarkDataUri,
    cartesiLogoLightDataUri,
} from "@cartesi/brand/logos";
import { cartesiColors } from "@cartesi/brand/tokens";
import type { Config } from "vocs/config";
import { cartesiLinks } from "./links.js";

/** The site config keys `cartesiTheme()` sets. */
export type CartesiTheme = Pick<
    Config,
    "accentColor" | "colorScheme" | "iconUrl" | "logoUrl" | "socials"
>;

/**
 * Cartesi branding for a Vocs site config. Spread it first, so that any key
 * you set after it wins:
 *
 * ```ts
 * export default defineConfig({
 *     ...cartesiTheme(),
 *     title: "My docs",
 * });
 * ```
 *
 * It returns top-level values only, never a nested object such as `markdown`
 * or `codeHighlight`: a spread replaces a nested object wholesale instead of
 * merging it, and would silently drop the site's own settings. It takes no
 * options because there is nothing an option could do that setting the key
 * after the spread does not.
 */
export const cartesiTheme = (): CartesiTheme => ({
    // Vocs writes the accent inline on <html>, where no stylesheet can reach
    // it, and derives its whole accent ramp from it. Where the accent colours
    // text, Vocs darkens it on its own, so teal stays legible on white.
    accentColor: `light-dark(${cartesiColors.teal}, ${cartesiColors.cyan})`,
    colorScheme: "light dark",
    iconUrl: cartesiIconDataUri,
    logoUrl: { light: cartesiLogoLightDataUri, dark: cartesiLogoDarkDataUri },
    socials: [
        { icon: "github", link: cartesiLinks.github },
        { icon: "discord", link: cartesiLinks.discord },
        { icon: "x", link: cartesiLinks.x },
        { icon: "telegram", link: cartesiLinks.telegram },
    ],
});
