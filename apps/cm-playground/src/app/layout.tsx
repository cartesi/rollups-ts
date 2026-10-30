import { cartesiIconDataUri } from "@cartesi/brand/logos";
import type { Metadata } from "next";

// the brand first, so that globals.css can build its palette on it
import "@cartesi/brand/styles.css";
import "./globals.css";

export const metadata: Metadata = {
    title: "Cartesi Machine Playground",
    description:
        "Configure a Cartesi Machine and boot it in the browser, with the guest's terminal on the page.",
    icons: { icon: cartesiIconDataUri },
};

const RootLayout = ({ children }: { children: React.ReactNode }) => (
    <html lang="en">
        <body>{children}</body>
    </html>
);

export default RootLayout;
