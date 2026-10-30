import { existsSync, readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import pkg from "../package.json" with { type: "json" };
import dataUris from "../assets/data-uris.json" with { type: "json" };

// The export map is the package's public API and nothing else checks it: a
// renamed stylesheet or a dropped `files` entry still builds, and only fails
// for whoever installs the published package. Runs after `build`, so the
// `dist/` targets exist.
const root = new URL("../", import.meta.url);

const targets = (value: unknown): string[] =>
    typeof value === "string"
        ? [value]
        : Object.values(value as Record<string, unknown>).flatMap(targets);

describe("package", () => {
    it("should point every export at a file that exists", () => {
        for (const [subpath, value] of Object.entries(pkg.exports)) {
            for (const target of targets(value)) {
                if (target.endsWith("/*")) {
                    const dir = new URL(target.slice(0, -1), root);
                    expect(readdirSync(dir).length, subpath).toBeGreaterThan(0);
                } else {
                    expect(
                        existsSync(new URL(target, root)),
                        `${subpath} → ${target}`,
                    ).toBe(true);
                }
            }
        }
    });

    it("should publish the stylesheets and generated assets, not the sources", () => {
        expect(pkg.files).toContain("styles/**");
        expect(pkg.files).toContain("assets/generated/**");
        expect(
            pkg.files.some((entry) => entry.startsWith("assets/source")),
        ).toBe(false);
    });

    // Every published SVG is also a data URI under the same name, so a site
    // can use either; this is what ties the two together.
    it("should encode every published SVG as a data URI, and nothing else", () => {
        const generated = new URL("assets/generated/", root);
        const files = readdirSync(generated).filter((name) =>
            name.endsWith(".svg"),
        );
        const decode = (uri: string) =>
            decodeURIComponent(uri.replace("data:image/svg+xml,", ""));
        // iconBlack -> icon-black.svg
        const fileOf = (key: string) =>
            `${key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}.svg`;
        expect(Object.keys(dataUris).map(fileOf).sort()).toEqual(files.sort());
        for (const [key, uri] of Object.entries(dataUris)) {
            expect(decode(uri), key).toBe(
                readFileSync(new URL(fileOf(key), generated), "utf8").trim(),
            );
        }
    });
});
