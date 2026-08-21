#!/usr/bin/env node
/**
 * rollups-ts dependency license audit — data collector
 *
 * Run this INSIDE a clone of https://github.com/cartesi/rollups-ts
 * (the directory containing pnpm-lock.yaml).
 *
 *   node audit-licenses.mjs                  collect only, write the JSON report
 *   node audit-licenses.mjs --check          collect, then enforce .license-policy.json
 *   node audit-licenses.mjs --check --format=github                (what CI runs)
 *
 * Flags:
 *   --check              enforce the policy file and exit non-zero on violations
 *   --offline            never reach the network. Note this cannot succeed on a
 *                        normal install: pnpm skips optional dependencies whose
 *                        os/cpu/libc do not match the machine (~180 here), so
 *                        they are absent by design and only the registry has
 *                        them. For an air-gapped run, point NPM_REGISTRY at a
 *                        mirror instead.
 *   --policy <path>      policy file (default: .license-policy.json)
 *   --out <path>         report path (default: rollups-ts-license-data.json)
 *   --cache <path>       resume cache (default: .license-audit-cache.json)
 *   --format=github      emit ::error annotations + a step summary
 *
 * Exit codes:  0 clean · 1 policy violations · 2 could not resolve every
 * coordinate · 3 bad policy file. 1 and 2 are deliberately distinct — a network
 * flake must never be reported as a licence violation.
 *
 * Requirements: Node >= 18 (uses global fetch). No npm install, no dependencies.
 * You do NOT need to run `pnpm install` first — but if node_modules/.pnpm exists,
 * the script reads licenses straight off disk and goes to the registry only for
 * what is not there. When there IS an installed tree, whatever is missing from
 * it is reconciled against pnpm's own "skipped" list in node_modules/.modules.yaml:
 * a platform-incompatible optional dependency is fetched, anything else means the
 * tree does not match the lockfile and is a hard error (exit 2), so a broken
 * install can never be quietly completed from the registry.
 *
 * Safe to re-run: it resumes from the cache and never writes anything else.
 */

import {
    readFileSync,
    writeFileSync,
    existsSync,
    readdirSync,
    appendFileSync,
} from "node:fs";
import path from "node:path";

const ARGV = process.argv.slice(2);
const flag = (name) => ARGV.includes(`--${name}`);
const opt = (name, dflt) => {
    const eq = ARGV.find((a) => a.startsWith(`--${name}=`));
    if (eq) return eq.slice(name.length + 3);
    const i = ARGV.indexOf(`--${name}`);
    return i >= 0 && ARGV[i + 1] && !ARGV[i + 1].startsWith("--")
        ? ARGV[i + 1]
        : dflt;
};

const CHECK = flag("check");
const OFFLINE = flag("offline");
const GH = opt("format", "") === "github";

const ROOT = process.cwd();
const LOCK = path.join(ROOT, "pnpm-lock.yaml");
const OUT = path.resolve(ROOT, opt("out", "rollups-ts-license-data.json"));
const CACHE = path.resolve(ROOT, opt("cache", ".license-audit-cache.json"));
const POLICY_PATH = path.resolve(ROOT, opt("policy", ".license-policy.json"));

if (!existsSync(LOCK)) {
    console.error(`✗ pnpm-lock.yaml not found in ${ROOT}`);
    console.error("  cd into your rollups-ts clone and run this again.");
    process.exit(1);
}

const log = (...a) => console.log(...a);

/* ------------------------------------------------------------------ */
/* 1. Parse pnpm-lock.yaml (no YAML dependency — targeted line parsing) */
/* ------------------------------------------------------------------ */

const lockText = readFileSync(LOCK, "utf8");

function section(name, next) {
    const re = new RegExp(
        `^${name}:\\n([\\s\\S]*?)(?=^${next}:|$(?![\\s\\S]))`,
        "m",
    );
    const m = lockText.match(re);
    return m ? m[1] : "";
}

const impSec = section("importers", "packages");
const pkgSec = section("packages", "snapshots");
const snapSec = section("snapshots", "ZZZ_NO_SUCH_SECTION");

// --- pinned coordinates, from the `packages:` section ---
const pins = [];
const seenPin = new Set();
for (const line of pkgSec.split("\n")) {
    const m = line.match(/^ {2}'?(\S+?)@([0-9][^:']*?)'?:$/);
    if (!m) continue;
    const name = m[1];
    const version = m[2].split("(")[0];
    const key = `${name}@${version}`;
    if (seenPin.has(key)) continue;
    seenPin.add(key);
    pins.push([name, version]);
}

// --- workspace importers and their direct deps ---
const importers = {};
{
    let cur = null;
    let kind = null;
    for (const line of impSec.split("\n")) {
        if (/^ {2}\S/.test(line)) {
            cur = line.trim().replace(/:$/, "");
            importers[cur] = { prod: [], dev: [] };
            kind = null;
        } else if (
            /^ {4}(dependencies|devDependencies|optionalDependencies):/.test(
                line,
            )
        ) {
            const k = line.trim().replace(/:$/, "");
            kind = k === "devDependencies" ? "dev" : "prod";
        } else if (/^ {6}\S/.test(line) && kind && cur) {
            importers[cur][kind].push(
                line.trim().replace(/:$/, "").replace(/'/g, ""),
            );
        }
    }
}

// --- resolved dependency graph, from the `snapshots:` section ---
const graph = new Map();
{
    let cur = null;
    let kind = null;
    for (const line of snapSec.split("\n")) {
        const key = line.match(/^ {2}(?=\S)'?(.+?)'?:(?: \{\})?$/);
        if (key) {
            cur = key[1];
            if (!graph.has(cur)) graph.set(cur, []);
            kind = null;
            continue;
        }
        if (/^ {4}(dependencies|optionalDependencies):/.test(line)) {
            kind = "d";
            continue;
        }
        if (/^ {4}\S/.test(line)) {
            kind = null;
            continue;
        }
        const dep = line.match(/^ {6}'?([^:']+?)'?: (.+)$/);
        if (dep && cur && kind)
            graph.get(cur).push(`${dep[1].trim()}@${dep[2].trim()}`);
    }
}

const baseName = (k) => {
    const s = k.split("(")[0];
    return s.slice(0, s.lastIndexOf("@"));
};

const byName = new Map();
for (const k of graph.keys()) {
    const b = baseName(k);
    if (!byName.has(b)) byName.set(b, []);
    byName.get(b).push(k);
}

function reachable(rootNames) {
    const roots = rootNames.flatMap((n) => byName.get(n) ?? []);
    const seen = new Set(roots);
    const queue = [...roots];
    while (queue.length) {
        const k = queue.pop();
        const deps = graph.get(k) ?? graph.get(k.split("(")[0]) ?? [];
        for (const d of deps)
            if (!seen.has(d)) {
                seen.add(d);
                queue.push(d);
            }
    }
    return [...new Set([...seen].map(baseName))].sort();
}

const reach = {};
for (const [imp, d] of Object.entries(importers)) {
    reach[imp] = { prod: reachable(d.prod), dev: reachable(d.dev) };
}

// --- the workspace's own package manifests ---
const workspacePackages = [];
for (const dir of ["packages", "apps"]) {
    const base = path.join(ROOT, dir);
    if (!existsSync(base)) continue;
    for (const entry of readdirSync(base, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        const pj = path.join(base, entry.name, "package.json");
        if (!existsSync(pj)) continue;
        const j = JSON.parse(readFileSync(pj, "utf8"));
        workspacePackages.push({
            path: `${dir}/${entry.name}`,
            name: j.name ?? null,
            version: j.version ?? null,
            license: j.license ?? null,
            private: j.private ?? false,
            files: j.files ?? null,
            hasLicenseFile:
                existsSync(path.join(base, entry.name, "LICENSE")) ||
                existsSync(path.join(base, entry.name, "LICENSE.md")),
            hasNoticeFile: existsSync(path.join(base, entry.name, "NOTICE")),
            dependencies: j.dependencies ?? {},
            optionalDependencies: j.optionalDependencies ?? {},
            peerDependencies: j.peerDependencies ?? {},
        });
        // platform sub-packages (e.g. packages/machine/npm/linux-x64)
        const npmDir = path.join(base, entry.name, "npm");
        if (existsSync(npmDir)) {
            for (const sub of readdirSync(npmDir, { withFileTypes: true })) {
                if (!sub.isDirectory()) continue;
                const spj = path.join(npmDir, sub.name, "package.json");
                if (!existsSync(spj)) continue;
                const sj = JSON.parse(readFileSync(spj, "utf8"));
                workspacePackages.push({
                    path: `${dir}/${entry.name}/npm/${sub.name}`,
                    name: sj.name ?? null,
                    version: sj.version ?? null,
                    license: sj.license ?? null,
                    private: sj.private ?? false,
                    files: sj.files ?? null,
                    platformPackage: true,
                });
            }
        }
    }
}
const rootPkg = JSON.parse(
    readFileSync(path.join(ROOT, "package.json"), "utf8"),
);

log(`✓ lockfile parsed`);
log(`  ${pins.length} pinned coordinates · ${byName.size} unique names`);
log(
    `  ${Object.keys(importers).length} workspace importers · ${workspacePackages.length} manifests`,
);

/* ------------------------------------------------------------------ */
/* 2. Resolve each pinned version's license                            */
/* ------------------------------------------------------------------ */

const licenses = existsSync(CACHE)
    ? JSON.parse(readFileSync(CACHE, "utf8"))
    : {};
const cachedAtStart = Object.keys(licenses).length;
if (cachedAtStart) log(`  resuming: ${cachedAtStart} already cached`);

const normalize = (j) => {
    let lic = null;
    if (typeof j.license === "string") lic = j.license;
    else if (j.license && typeof j.license === "object")
        lic = j.license.type ?? null;
    if (!lic && Array.isArray(j.licenses))
        lic = j.licenses.map((l) => l.type ?? l).join(" OR ");
    if (!lic && typeof j.licenses === "string") lic = j.licenses;
    return {
        license: lic ?? "UNKNOWN",
        repository:
            typeof j.repository === "string"
                ? j.repository
                : (j.repository?.url ?? null),
        deprecated: j.deprecated ? String(j.deprecated).slice(0, 200) : null,
    };
};

// 2a. Offline path — read straight from node_modules/.pnpm if it exists.
const STORE = path.join(ROOT, "node_modules", ".pnpm");
let fromDisk = 0;
if (existsSync(STORE)) {
    const dirs = readdirSync(STORE, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name);
    const index = new Map();
    for (const d of dirs) {
        // "@scope+name@1.2.3_peer" or "name@1.2.3". Anchor the version on a
        // leading digit rather than splitting on "_": a package name may
        // itself contain an underscore (string_decoder), and splitting there
        // truncates the name and drops the package from the index.
        const m = d.match(/^(.+?)@(\d[^_]*)/);
        if (!m) continue;
        const nm = m[1].replace(/\+/g, "/");
        const ver = m[2];
        index.set(
            `${nm}@${ver}`,
            path.join(STORE, d, "node_modules", nm, "package.json"),
        );
    }
    for (const [name, version] of pins) {
        const key = `${name}@${version}`;
        if (licenses[key]) continue;
        const pj = index.get(key);
        if (pj && existsSync(pj)) {
            try {
                licenses[key] = {
                    ...normalize(JSON.parse(readFileSync(pj, "utf8"))),
                    source: "node_modules",
                };
                fromDisk++;
            } catch {
                /* fall through to network */
            }
        }
    }
    if (fromDisk)
        log(
            `✓ ${fromDisk} licenses read from node_modules/.pnpm (no network needed)`,
        );
}

// 2b. Reconcile what is missing against pnpm's own record of what it skipped.
//
// pnpm never installs an optional dependency whose os/cpu/libc does not match
// the machine it is running on, and records every one it left out under
// "skipped" in node_modules/.modules.yaml. On this repo that is ~180 of 1320
// coordinates (@esbuild/*, @rollup/*, @biomejs/cli-*, ...), on every platform.
// Those are legitimately absent and have to be resolved from the registry.
//
// Anything missing that pnpm did NOT skip is a different animal: the installed
// tree does not match the lockfile. Filling that gap from the registry would
// turn a broken install into a green run describing packages nobody installed,
// so it is fatal (exit 2) rather than quietly papered over.
const missing = pins.filter(([n, v]) => !licenses[`${n}@${v}`]);

// .modules.yaml is JSON in current pnpm, but has been true YAML historically —
// read both, the same way the lockfile is read by hand above.
const readSkipped = () => {
    const f = path.join(ROOT, "node_modules", ".modules.yaml");
    if (!existsSync(f)) return null;
    let raw;
    try {
        raw = readFileSync(f, "utf8");
    } catch {
        return null;
    }
    // Entries are "name@version", but carry pnpm's parenthesised peer suffix
    // when the package has peers — "@napi-rs/wasm-runtime@1.1.6(@emnapi/...)".
    // Pin keys are bare, so strip it or the coordinate reads as unexpected.
    const bare = (e) => e.replace(/\(.*$/, "");
    try {
        const j = JSON.parse(raw);
        if (Array.isArray(j.skipped)) return new Set(j.skipped.map(bare));
    } catch {
        /* not JSON — fall through to the YAML scan */
    }
    const out = new Set();
    let inSkipped = false;
    for (const line of raw.split("\n")) {
        if (/^skipped:/.test(line)) {
            inSkipped = true;
            continue;
        }
        if (inSkipped) {
            const m = line.match(/^\s+-\s+'?"?([^'"]+?)'?"?\s*$/);
            if (m) {
                out.add(bare(m[1]));
                continue;
            }
            if (/^\S/.test(line)) break;
        }
    }
    return out.size ? out : null;
};

// A bare checkout has no store at all: everything is "missing", nothing was
// skipped, and resolving from the registry is the whole point. Only reconcile
// when there is an installed tree to reconcile against.
const skipped = existsSync(STORE) ? readSkipped() : null;
const key = ([n, v]) => `${n}@${v}`;
const unexpected = skipped ? missing.filter((c) => !skipped.has(key(c))) : [];

if (unexpected.length) {
    console.error(
        `✗ ${unexpected.length} coordinate${unexpected.length === 1 ? " is" : "s are"} missing from node_modules/.pnpm and ${unexpected.length === 1 ? "was" : "were"} not skipped by pnpm.`,
    );
    console.error(
        "  The installed tree does not match pnpm-lock.yaml. This is a broken install,",
    );
    console.error(
        "  not a licence problem — resolving it from the registry would audit",
    );
    console.error("  packages this job never installed.");
    for (const c of unexpected.slice(0, 10)) console.error(`    ${key(c)}`);
    if (unexpected.length > 10)
        console.error(`    … and ${unexpected.length - 10} more`);
    console.error("  Re-run `pnpm install --frozen-lockfile`.");
    process.exit(2);
}

if (existsSync(STORE) && !skipped)
    log(
        "  ! node_modules/.modules.yaml unreadable — cannot tell a skipped optional dependency from a broken install",
    );
if (skipped && missing.length)
    log(
        `  ${missing.length} skipped by pnpm as platform-incompatible (os/cpu/libc) — not on disk by design`,
    );

// 2c. Network path for whatever is legitimately left.
const todo = missing;
if (OFFLINE && todo.length) {
    console.error(
        `✗ --offline: ${todo.length} coordinates still need the registry.`,
    );
    console.error(
        "  These are optional dependencies pnpm skipped as platform-incompatible, so no",
    );
    console.error(
        "  install can put them on disk. Drop --offline, or set NPM_REGISTRY to a mirror.",
    );
    process.exit(2);
}
log(`→ ${todo.length} coordinates to fetch from registry.npmjs.org`);

const REGISTRY = process.env.NPM_REGISTRY || "https://registry.npmjs.org";
const CONCURRENCY = Number(process.env.CONCURRENCY || 8);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchOne(name, version, attempt = 0) {
    const url = `${REGISTRY}/${name.replace(/\//g, "%2f")}/${encodeURIComponent(version)}`;
    try {
        const res = await fetch(url, {
            headers: { accept: "application/json" },
        });
        if (res.status === 404)
            return {
                license: "VERSION-NOT-FOUND",
                repository: null,
                source: "registry",
            };
        if (res.status === 429 || res.status >= 500)
            throw new Error(`HTTP ${res.status}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return { ...normalize(await res.json()), source: "registry" };
    } catch (err) {
        if (attempt >= 5)
            return {
                license: "FETCH-FAILED",
                error: String(err).slice(0, 120),
                source: "registry",
            };
        await sleep(500 * 2 ** attempt + Math.random() * 400);
        return fetchOne(name, version, attempt + 1);
    }
}

let done = 0;
let sinceSave = 0;
const saveCache = () => writeFileSync(CACHE, JSON.stringify(licenses, null, 0));

async function worker(queue) {
    for (;;) {
        const item = queue.pop();
        if (!item) return;
        const [name, version] = item;
        licenses[`${name}@${version}`] = await fetchOne(name, version);
        done++;
        sinceSave++;
        if (sinceSave >= 25) {
            saveCache();
            sinceSave = 0;
        }
        if (done % 50 === 0 || done === todo.length) {
            process.stdout.write(`\r  ${done}/${todo.length} fetched`);
        }
    }
}

if (todo.length) {
    const queue = [...todo].reverse();
    await Promise.all(Array.from({ length: CONCURRENCY }, () => worker(queue)));
    saveCache();
    process.stdout.write("\n");
}

/* ------------------------------------------------------------------ */
/* 3. Emit the upload file                                             */
/* ------------------------------------------------------------------ */

const failed = Object.entries(licenses).filter(
    ([, v]) =>
        v.license === "FETCH-FAILED" || v.license === "VERSION-NOT-FOUND",
);

const tally = {};
for (const [, v] of Object.entries(licenses))
    tally[v.license] = (tally[v.license] || 0) + 1;

writeFileSync(
    OUT,
    JSON.stringify(
        {
            schema: "rollups-ts-license-data/1",
            generatedAt: new Date().toISOString(),
            node: process.version,
            cwd: ROOT,
            rootPackage: {
                name: rootPkg.name,
                license: rootPkg.license ?? null,
                packageManager: rootPkg.packageManager ?? null,
                hasRootLicenseFile: existsSync(path.join(ROOT, "LICENSE")),
                hasRootNoticeFile: existsSync(path.join(ROOT, "NOTICE")),
            },
            counts: {
                pinnedCoordinates: pins.length,
                uniqueNames: byName.size,
                resolved: Object.keys(licenses).length,
                fromNodeModules: fromDisk,
                unresolved: failed.length,
            },
            tally,
            workspacePackages,
            importers,
            reach,
            pins,
            licenses,
        },
        null,
        1,
    ),
);

log("");
log("──────────────────────────────────────────────");
log(`✓ wrote ${path.basename(OUT)}`);
log(`  ${Object.keys(licenses).length} of ${pins.length} coordinates resolved`);
if (failed.length) {
    log(
        `  ⚠ ${failed.length} unresolved — re-run this script to retry just those:`,
    );
    for (const [k, v] of failed.slice(0, 10)) log(`      ${k} → ${v.license}`);
    if (failed.length > 10) log(`      …and ${failed.length - 10} more`);
}
log("");
log("License tally:");
for (const [k, n] of Object.entries(tally).sort((a, b) => b[1] - a[1])) {
    log(`  ${String(n).padStart(5)}  ${k}`);
}
log("──────────────────────────────────────────────");

if (!CHECK) {
    log(`Upload ${path.basename(OUT)} back to Claude.`);
    process.exit(0);
}

/* ------------------------------------------------------------------ */
/* 4. Policy gate (--check)                                            */
/* ------------------------------------------------------------------ */

if (failed.length) {
    console.error(
        `✗ ${failed.length} coordinates could not be resolved — not gating on partial data.`,
    );
    process.exit(2); // NOT 1: a network failure is not a licence violation.
}

if (!existsSync(POLICY_PATH)) {
    console.error(
        `✗ policy file not found: ${path.relative(ROOT, POLICY_PATH)}`,
    );
    process.exit(3);
}
let policy;
try {
    policy = JSON.parse(readFileSync(POLICY_PATH, "utf8"));
} catch (err) {
    console.error(`✗ policy file is not valid JSON: ${err.message}`);
    process.exit(3);
}
const ALLOW = new Set(policy.allow ?? []);
const BUILD_ONLY = new Set(policy.allowBuildOnly ?? []);
const WITH_NOTICE = new Set(policy.allowWithNotice ?? []);
const DENY = new Set(policy.deny ?? []);
const EXCEPTIONS = policy.exceptions ?? {};

// --- SPDX expression evaluation -------------------------------------
// "(MIT OR Apache-2.0)" must pass when either side is allowed;
// "(Apache-2.0 AND LGPL-3.0-or-later)" only when BOTH are.
// A plain string comparison against the allowlist gets both cases wrong.
function evalSpdx(expr, isAllowed) {
    const tokens = String(expr).match(/\(|\)|[^\s()]+/g) ?? [];
    let i = 0;
    const peek = () => tokens[i];
    const parseAtom = () => {
        if (peek() === "(") {
            i++;
            const v = parseOr();
            i++;
            return v;
        }
        return isAllowed(tokens[i++]);
    };
    const parseAnd = () => {
        let v = parseAtom();
        while (peek() && peek().toUpperCase() === "AND") {
            i++;
            v = parseAtom() && v;
        }
        return v;
    };
    const parseOr = () => {
        let v = parseAnd();
        while (peek() && peek().toUpperCase() === "OR") {
            i++;
            v = parseAnd() || v;
        }
        return v;
    };
    try {
        return parseOr();
    } catch {
        return false;
    }
}
const mentionsDenied = (expr) =>
    (String(expr).match(/[^\s()]+/g) ?? []).some((t) => DENY.has(t));

// --- scope: is this name in the runtime closure of a PUBLISHED package? ---
// The distinction is the point of the gate: MPL-2.0 in a build tool is fine,
// MPL-2.0 shipped inside @cartesi/client is a different conversation.
const publishablePaths = workspacePackages
    .filter(
        (w) =>
            !w.private && !w.platformPackage && w.path.startsWith("packages/"),
    )
    .map((w) => w.path);
const publishedRuntime = new Set();
for (const p of publishablePaths)
    for (const n of reach[p]?.prod ?? []) publishedRuntime.add(n);

const violations = [];
const notices = [];
for (const [name, version] of pins) {
    const coord = `${name}@${version}`;
    const shipped = publishedRuntime.has(name);
    const ex = EXCEPTIONS[coord];
    let lic = licenses[coord].license;

    if (ex) {
        if (!ex.license || !ex.evidence) {
            violations.push({
                coord,
                lic,
                kind: "bad-exception",
                msg: `exception for ${coord} must carry both "license" and "evidence"`,
            });
            continue;
        }
        lic = ex.license; // resolved by hand from the upstream LICENSE file
    } else if (/^SEE LICENSE IN/i.test(lic) || lic === "UNKNOWN") {
        violations.push({
            coord,
            lic,
            shipped,
            kind: "unresolvable",
            msg: `${coord} publishes "${lic}" — read the upstream LICENSE and add an exceptions entry`,
        });
        continue;
    }

    if (mentionsDenied(lic)) {
        violations.push({
            coord,
            lic,
            shipped,
            kind: "denied",
            msg: `${coord} is ${lic} (deny-listed)`,
        });
        continue;
    }
    if (evalSpdx(lic, (id) => ALLOW.has(id))) continue;
    if (evalSpdx(lic, (id) => ALLOW.has(id) || WITH_NOTICE.has(id))) {
        notices.push({ coord, lic });
        continue;
    }
    if (evalSpdx(lic, (id) => ALLOW.has(id) || BUILD_ONLY.has(id))) {
        if (!shipped) continue;
        violations.push({
            coord,
            lic,
            shipped,
            kind: "scope",
            msg: `${coord} is ${lic}, allowed for build-time only, but it is in a published package's runtime closure`,
        });
        continue;
    }
    violations.push({
        coord,
        lic,
        shipped,
        kind: "not-allowed",
        msg: `${coord} is ${lic} (not on the allowlist)`,
    });
}

// --- manifest rules: keep F2/F3 from regressing ----------------------
const manifestViolations = [];
const rules = policy.publishable ?? {};
for (const w of workspacePackages) {
    if (w.private || w.platformPackage) continue;
    const file = `${w.path}/package.json`;
    if (rules.requireLicenseField && !w.license)
        manifestViolations.push({
            file,
            msg: `${w.name} declares no "license" field`,
        });
    if (
        rules.requireLicenseInFiles &&
        Array.isArray(w.files) &&
        !w.files.some((f) => String(f).toUpperCase().includes("LICENSE"))
    )
        manifestViolations.push({
            file,
            msg: `${w.name} does not ship a LICENSE (not in "files")`,
        });
}
if (rules.requireRootNotice && !existsSync(path.join(ROOT, "NOTICE")))
    manifestViolations.push({
        file: "NOTICE",
        msg: "repository root has no NOTICE file",
    });

// --- report ----------------------------------------------------------
log("");
if (notices.length) {
    log(
        `ℹ ${notices.length} attribution-required dependencies (must appear in the notices page):`,
    );
    for (const n of notices) log(`    ${n.coord} — ${n.lic}`);
    log("");
}
const total = violations.length + manifestViolations.length;
if (!total) {
    log("✓ license policy: pass");
    process.exit(0);
}
log(`✗ license policy: ${total} violation${total === 1 ? "" : "s"}`);
for (const v of violations) log(`    [${v.kind}] ${v.msg}`);
for (const v of manifestViolations) log(`    [manifest] ${v.msg}`);

if (GH) {
    for (const v of violations)
        console.log(`::error title=License policy (${v.kind})::${v.msg}`);
    for (const v of manifestViolations)
        console.log(
            `::error file=${v.file},title=License policy (manifest)::${v.msg}`,
        );
    if (process.env.GITHUB_STEP_SUMMARY) {
        const md = [
            `### License policy — ${total} violation${total === 1 ? "" : "s"}`,
            "",
            "| Scope | Subject | Problem |",
            "|---|---|---|",
            ...violations.map(
                (v) =>
                    `| ${v.shipped ? "published runtime" : "dev / docs"} | \`${v.coord}\` | ${v.kind}: ${v.lic} |`,
            ),
            ...manifestViolations.map(
                (v) => `| manifest | \`${v.file}\` | ${v.msg} |`,
            ),
            "",
            `_${pins.length} pinned coordinates checked against \`${path.basename(POLICY_PATH)}\`._`,
        ].join("\n");
        appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${md}\n`);
    }
}
process.exit(1);
