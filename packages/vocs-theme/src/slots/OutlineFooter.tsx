import { cartesiLinks } from "../links.js";

/**
 * The foot of the page outline: a pointer to the Cartesi Discord, as an
 * outlined pill rather than a filled one, which would be loud in a column this
 * narrow.
 */
export const OutlineFooter = () => (
    <div className="cartesi-outline-footer">
        <p className="cartesi-outline-footer__label">Need help?</p>
        <a className="cartesi-outline-footer__link" href={cartesiLinks.discord}>
            Ask on Discord
        </a>
    </div>
);
