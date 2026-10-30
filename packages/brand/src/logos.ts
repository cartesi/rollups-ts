import dataUris from "../assets/generated/data-uris.json" with { type: "json" };

/**
 * The official logos as `data:` URIs, so a site can use them without serving
 * any file. The same SVGs are published as files under
 * `@cartesi/brand/assets/`.
 */

/** The black icon on a cyan tile: the Brand Kit's primary icon usage, and a favicon. */
export const cartesiIconDataUri: string = dataUris.icon;

/** The horizontal lockup in black, for light backgrounds. */
export const cartesiLogoLightDataUri: string = dataUris.logoLight;

/** The horizontal lockup in white, for dark backgrounds. */
export const cartesiLogoDarkDataUri: string = dataUris.logoDark;
