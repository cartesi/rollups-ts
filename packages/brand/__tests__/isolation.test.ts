import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// The package's one promise to a non-Vocs consumer, such as a Next.js app on
// Mantine, is that installing it brings no framework along. Nothing in this
// repository exercises that yet, so the built JavaScript is checked directly.
const dist = new URL("../dist/", import.meta.url);
const modules = readdirSync(dist)
    .filter((name) => name.endsWith(".js"))
    .map((name) => [name, readFileSync(new URL(name, dist), "utf8")] as const);

describe("isolation", () => {
    it("should build some modules to check", () => {
        expect(modules.length).toBeGreaterThan(0);
    });

    it("should import nothing but its own modules", () => {
        for (const [name, code] of modules) {
            const specifiers = [
                ...code.matchAll(/\bfrom\s*["'`]([^"'`]+)["'`]/g),
            ].map(([, specifier]) => specifier);
            for (const specifier of specifiers) {
                expect(specifier, name).toMatch(/^\.\.?\//);
            }
        }
    });

    it("should not touch the DOM", () => {
        for (const [name, code] of modules) {
            expect(code, name).not.toMatch(/\b(window|document)\b/);
        }
    });
});
