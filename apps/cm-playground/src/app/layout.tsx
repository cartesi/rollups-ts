import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
    title: "Cartesi Machine Playground",
    description:
        "Configure a Cartesi Machine and boot it in the browser, with the guest's terminal on the page.",
    icons: {
        icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'><text y='14' font-size='14'>%F0%9F%A7%A9</text></svg>",
    },
};

const RootLayout = ({ children }: { children: React.ReactNode }) => (
    <html lang="en">
        <body>{children}</body>
    </html>
);

export default RootLayout;
