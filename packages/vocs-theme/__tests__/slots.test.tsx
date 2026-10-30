import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Footer, OutlineFooter } from "../src/slots/index.js";

describe("slots", () => {
    // Vocs renders the Footer slot inside its own <footer>; a second one
    // would be a second contentinfo landmark for assistive technology.
    it("should not render the footer as a landmark of its own", () => {
        const html = renderToStaticMarkup(<Footer />);
        expect(html).toMatch(/^<div class="cartesi-footer">/);
        expect(html).not.toContain("<footer");
    });

    // A site that puts Cartesi's marks on its pages should point at the terms
    // it uses them under.
    it("should link the trademark usage policy", () => {
        expect(renderToStaticMarkup(<Footer />)).toContain(
            'href="https://cartesi.io/trademark-usage-policy/"',
        );
    });

    it("should render a site's own content above the legal line", () => {
        const html = renderToStaticMarkup(
            <Footer>
                <a href="/changelog">Changelog</a>
            </Footer>,
        );
        expect(html.indexOf("Changelog")).toBeLessThan(
            html.indexOf("cartesi-footer__legal"),
        );
    });

    it("should point the outline footer at the Discord", () => {
        expect(renderToStaticMarkup(<OutlineFooter />)).toContain(
            'href="https://discord.gg/pfXMwXDDfW"',
        );
    });
});
