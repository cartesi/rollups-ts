import type { ReactNode } from "react";
import { cartesiLinks } from "../links.js";

const links = [
    { href: cartesiLinks.site, text: "cartesi.io" },
    { href: cartesiLinks.docs, text: "Docs" },
    { href: cartesiLinks.github, text: "GitHub" },
    { href: cartesiLinks.discord, text: "Discord" },
    { href: cartesiLinks.x, text: "X" },
    { href: cartesiLinks.telegram, text: "Telegram" },
];

export type FooterProps = {
    /** Site-specific content, shown above the legal line. */
    children?: ReactNode;
};

/**
 * The page footer: the Cartesi tagline, links to the project, and the
 * trademark notice. Vocs renders it inside its own `<footer>`, so this is a
 * `<div>`; a second `<footer>` would be a second contentinfo landmark.
 */
export const Footer = ({ children }: FooterProps) => (
    <div className="cartesi-footer">
        <p className="cartesi-footer__tagline">
            Any code. Ethereum's security.
        </p>
        <nav aria-label="Cartesi" className="cartesi-footer__links">
            {links.map(({ href, text }) => (
                <a href={href} key={href}>
                    {text}
                </a>
            ))}
        </nav>
        {children}
        <p className="cartesi-footer__legal">
            © The Cartesi Foundation ·{" "}
            <a href={cartesiLinks.trademark}>Trademark Usage Policy</a>
        </p>
    </div>
);
