#!/usr/bin/env node
/**
 * Render the license audit report.
 *
 *   node scripts/render-license-report.mjs
 *   node scripts/render-license-report.mjs --rev 4 --commit $GITHUB_SHA
 *
 * Input:  rollups-ts-license-data.json   (written by scripts/audit-licenses.mjs)
 *         scripts/license-findings.json  (optional — the curated narrative)
 * Output: rollups-ts-license-report.html (single file, no external assets)
 *
 * Every number, table and chart in the report is computed from the data file.
 * The findings file holds only prose a human wrote; without it the report still
 * renders, minus the findings and drift sections.
 *
 * Flags:
 *   --data <path>      default: rollups-ts-license-data.json
 *   --findings <path>  default: scripts/license-findings.json
 *   --out <path>       default: rollups-ts-license-report.html
 *   --rev <n>          revision number shown in the header (default: 1)
 *   --commit <sha>     commit recorded in the footer
 *
 * Requirements: Node >= 18. No dependencies.
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";

const ARGV = process.argv.slice(2);
const opt = (n, d) => {
    const eq = ARGV.find((a) => a.startsWith(`--${n}=`));
    if (eq) return eq.slice(n.length + 3);
    const i = ARGV.indexOf(`--${n}`);
    return i >= 0 && ARGV[i + 1] && !ARGV[i + 1].startsWith("--")
        ? ARGV[i + 1]
        : d;
};

const ROOT = process.cwd();
const DATA = path.resolve(ROOT, opt("data", "rollups-ts-license-data.json"));
const FIND = path.resolve(
    ROOT,
    opt("findings", "scripts/license-findings.json"),
);
const OUT = path.resolve(ROOT, opt("out", "rollups-ts-license-report.html"));
const REV = opt("rev", "1");
const COMMIT = opt("commit", "");

if (!existsSync(DATA)) {
    console.error(
        `✗ ${path.relative(ROOT, DATA)} not found — run scripts/audit-licenses.mjs first.`,
    );
    process.exit(1);
}
const D = JSON.parse(readFileSync(DATA, "utf8"));
const NARR = existsSync(FIND)
    ? JSON.parse(readFileSync(FIND, "utf8"))
    : { findings: [], drift: [] };

const esc = (s) =>
    String(s).replace(
        /[&<>"]/g,
        (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
    );

/* ---------------- derive everything from the data file ---------------- */

const { licenses, pins, reach, workspacePackages: WS, rootPackage: RP } = D;
const OKSET = new Set([
    "MIT",
    "ISC",
    "Apache-2.0",
    "BSD-2-Clause",
    "BSD-3-Clause",
    "0BSD",
    "Unlicense",
]);

// Only count names that are actually pinned coordinates: pnpm alias entries
// (e.g. "cva@class-variance-authority") appear in the graph but are not packages.
const pinnedNames = new Set(pins.map(([n]) => n));
const prodNames = new Set();
for (const r of Object.values(reach))
    for (const n of r.prod) if (pinnedNames.has(n)) prodNames.add(n);

const publishablePaths = WS.filter(
    (w) => !w.private && !w.platformPackage && w.path.startsWith("packages/"),
).map((w) => w.path);
const publishedRuntime = new Set();
for (const p of publishablePaths)
    for (const n of reach[p]?.prod ?? []) publishedRuntime.add(n);

const importersOf = (name) =>
    Object.keys(reach)
        .filter(
            (i) => reach[i].prod.includes(name) || reach[i].dev.includes(name),
        )
        .sort();

const rows = pins.map(([n, v]) => ({
    n,
    v,
    l: licenses[`${n}@${v}`].license,
    prod: prodNames.has(n),
    pub: publishedRuntime.has(n),
    imp: importersOf(n),
}));
const flagged = rows.filter((r) => !OKSET.has(r.l));
const inPub = flagged.filter((r) => r.pub);

const tally = new Map();
for (const r of rows) tally.set(r.l, (tally.get(r.l) ?? 0) + 1);
const counts = [...tally.entries()].sort((a, b) => b[1] - a[1]);
const maxc = counts[0][1];

const COORDS = rows.length;
const NAMES = D.counts.uniqueNames;

// manifest facts
const publishable = WS.filter((w) => !w.private && !w.platformPackage);
const shipsLicense = (w) =>
    (w.files ?? []).some((f) => String(f).toUpperCase().includes("LICENSE"));
const noField = publishable.filter((w) => !w.license);
const noText = publishable.filter((w) => !shipsLicense(w));
const platform = WS.filter((w) => w.platformPackage);
const privatePkgs = WS.filter((w) => w.private);

// per-published-package runtime licence mix, at name granularity
const licsOfName = new Map();
for (const [n, v] of pins) {
    if (!licsOfName.has(n)) licsOfName.set(n, new Set());
    licsOfName.get(n).add(licenses[`${n}@${v}`].license);
}
const mixFor = (p) => {
    const m = new Map();
    for (const n of reach[p]?.prod ?? []) {
        const s = licsOfName.get(n);
        if (!s) continue;
        const k = [...s].sort().join(" / ");
        m.set(k, (m.get(k) ?? 0) + 1);
    }
    return [...m.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([k, c]) => `${esc(k)} ×${c}`)
        .join(", ");
};

/* ---------------- narrative ---------------- */

const SEV = {
    critical: ["Critical", "#d03b3b", "⛔"],
    serious: ["Serious", "#ec835a", "▲"],
    warning: ["Warning", "#fab219", "!"],
    info: ["Advisory", "#0ca30c", "i"],
    noted: ["Noted", "#2a78d6", "◆"],
};
const findings = NARR.findings ?? [];
const nsev = (s) => findings.filter((f) => f.sev === s).length;
const ACTION = nsev("critical") + nsev("serious");

const ARROW = {
    up: ["▲", "#ec835a", "stricter at the pin"],
    down: ["▼", "#0ca30c", "looser at the pin"],
    neutral: ["◆", "#898781", "different, equivalent risk"],
};

/* ---------------- html fragments ---------------- */

const bars = counts
    .map(
        ([n, c]) => `      <div class="brow">
        <div class="blab" title="${esc(n)}">${esc(n)}</div>
        <div class="btrack"><div class="bfill${OKSET.has(n) ? "" : " flag"}" style="width:${((c / maxc) * 100).toFixed(4)}%"
             data-tip="${esc(n)} — ${c} pinned coordinate${c === 1 ? "" : "s"} (${((c / COORDS) * 100).toFixed(1)}%)"></div></div>
        <div class="bval">${c}</div>
      </div>`,
    )
    .join("\n");

const yn = (ok) =>
    `<span style="color:${ok ? "var(--good)" : "var(--serious)"};font-weight:600">${ok ? "yes" : "no"}</span>`;
const manifestRows = [
    ...publishable.map(
        (w) => `      <tr><td class="pkg">${esc(w.name ?? w.path)}</td>
        <td>${w.license ? esc(w.license) : '<span style="color:var(--serious);font-weight:600">none</span>'}</td>
        <td>${yn(!!w.hasLicenseFile)}</td><td>${yn(shipsLicense(w))}</td>
        <td class="note"><code>${esc(JSON.stringify(w.files))}</code></td></tr>`,
    ),
    ...platform.map(
        (
            w,
        ) => `      <tr><td class="pkg">${esc(w.name)} <span class="tag">prebuild</span></td>
        <td>${esc(w.license ?? "")}</td><td colspan="3" class="note">binary-only package; declares the LGPL component</td></tr>`,
    ),
    ...privatePkgs.map(
        (
            w,
        ) => `      <tr><td class="pkg">${esc(w.name)} <span class="tag">private</span></td>
        <td>none</td><td colspan="3" class="note">not published to npm — <code>"private": true</code></td></tr>`,
    ),
].join("\n");

const driftSection = !(NARR.drift ?? []).length
    ? ""
    : `
<h2>What changed by pinning <span class="n">${NARR.drift.length} packages differ from their latest release</span></h2>
<div class="card">
  <table>
    <thead><tr><th>Package · pinned</th><th>At latest</th><th>At the pin</th><th>What it means</th></tr></thead>
    <tbody>
${NARR.drift
    .map((d) => {
        const [sym, col, lab] = ARROW[d.direction] ?? ARROW.neutral;
        return `      <tr><td class="pkg">${esc(d.package)}<span class="ver">${esc(d.pinned)}</span></td>
        <td class="was">${esc(d.atLatest)}</td>
        <td><span class="arrow" style="color:${col}" title="${lab}">${sym}</span> <strong>${esc(d.atPin)}</strong></td>
        <td class="note">${esc(d.note)}</td></tr>`;
    })
    .join("\n")}
    </tbody>
  </table>
</div>`;

const findingsSection = !findings.length
    ? ""
    : `
<h2>Findings <span class="n">${findings.length}, most severe first</span></h2>
${findings
    .map((f) => {
        const [label, color, icon] = SEV[f.sev] ?? SEV.info;
        return `    <article class="finding" id="${esc(f.id)}" data-sev="${esc(f.sev)}">
      <header>
        <span class="chip" style="--c:${color}"><span class="ic">${icon}</span>${label}</span>
        <h3>${esc(f.id)} · ${esc(f.title)}</h3>
      </header>
      <dl class="meta">
        <div><dt>Dependency</dt><dd><code>${f.dep}</code></dd></div>
        <div><dt>License</dt><dd>${f.lic}</dd></div>
        <div><dt>Reached via</dt><dd class="path">${f.where}</dd></div>
      </dl>
      <div class="body">
        <h4>What it is</h4>${f.what}
        <h4>${f.sev === "noted" ? "Why it is worth knowing" : "Why it is a problem"}</h4><p>${f.why}</p>
        <h4>${f.sev === "noted" ? "Optional follow-up" : "Suggested fix"}</h4><p>${f.fix}</p>
      </div>
    </article>`;
    })
    .join("\n")}`;

const PUB_ORDER = [
    "packages/machine",
    "packages/rollup",
    "packages/client",
    "packages/react",
    "packages/wagmi-plugin",
    "packages/codec",
    "packages/rpc",
];
const wsByPath = Object.fromEntries(WS.map((w) => [w.path, w]));
const pubRows = PUB_ORDER.filter((p) => wsByPath[p])
    .map((p) => {
        const w = wsByPath[p];
        const declared = w.license
            ? `${esc(w.license)}${shipsLicense(w) ? "" : ' <span class="tag">no LICENSE shipped</span>'}`
            : '<span style="color:var(--serious);font-weight:600">none</span>';
        return `      <tr><td class="pkg">${esc(w.name)}</td><td>${declared}</td>
        <td>${reach[p].prod.length}</td><td>${mixFor(p)}</td></tr>`;
    })
    .join("\n");

const tableRows = JSON.stringify(
    rows.map((r) => [
        r.n,
        r.v,
        r.l,
        r.prod ? 1 : 0,
        r.pub ? 1 : 0,
        r.imp.join(","),
    ]),
);

const gen = (D.generatedAt ?? "").slice(0, 10);
const revLine = COMMIT
    ? `Revision ${REV} · data collected ${gen} · commit <code>${esc(COMMIT.slice(0, 7))}</code>`
    : `Revision ${REV} · data collected ${gen}`;

/* ---------------- page ---------------- */

const HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Dependency license risk — ${esc(RP.name ?? "workspace")} (rev ${esc(REV)})</title>
<style>
  :root {
    color-scheme: light;
    --surface-1:#fcfcfb; --page:#f9f9f7;
    --ink:#0b0b0b; --ink-2:#52514e; --muted:#898781;
    --grid:#e1e0d9; --axis:#c3c2b7; --border:rgba(11,11,11,0.10);
    --series-1:#2a78d6; --flag:#eb6834;
    --good:#0ca30c; --warning:#fab219; --serious:#ec835a; --critical:#d03b3b;
  }
  @media (prefers-color-scheme: dark) {
    :root:where(:not([data-theme="light"])) {
      color-scheme: dark;
      --surface-1:#1a1a19; --page:#0d0d0d;
      --ink:#ffffff; --ink-2:#c3c2b7; --muted:#898781;
      --grid:#2c2c2a; --axis:#383835; --border:rgba(255,255,255,0.10);
      --series-1:#3987e5; --flag:#d95926;
    }
  }
  * { box-sizing:border-box; }
  body { margin:0; background:var(--page); color:var(--ink);
    font-family:system-ui,-apple-system,"Segoe UI",sans-serif; line-height:1.55;
    -webkit-text-size-adjust:100%; }
  .wrap { max-width:1080px; margin:0 auto; padding:32px 20px 80px; }
  .kicker { font-size:12px; letter-spacing:.09em; text-transform:uppercase; color:var(--muted); font-weight:600; }
  h1 { font-size:30px; line-height:1.2; margin:8px 0 6px; letter-spacing:-.02em; }
  .sub { color:var(--ink-2); font-size:15px; margin:0; }
  .badges { display:flex; gap:8px; flex-wrap:wrap; margin-top:12px; }
  .badge { display:inline-flex; align-items:center; gap:6px; font-size:11.5px; font-weight:650;
    text-transform:uppercase; letter-spacing:.05em; padding:4px 10px; border-radius:999px;
    border:1px solid var(--good); color:var(--good); }
  .badge.warn { border-color:var(--serious); color:var(--serious); }
  h2 { font-size:20px; margin:44px 0 14px; letter-spacing:-.01em; }
  h2 .n { color:var(--muted); font-weight:500; font-size:15px; margin-left:6px; }
  .card { background:var(--surface-1); border:1px solid var(--border); border-radius:12px; padding:20px; }
  .card > p.lede { margin:0 0 14px; font-size:13.5px; color:var(--ink-2); }
  .tiles { display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:12px; margin-top:20px; }
  .tile { background:var(--surface-1); border:1px solid var(--border); border-radius:12px; padding:14px 16px; }
  .tile .v { font-size:30px; font-weight:650; letter-spacing:-.02em; line-height:1.1; }
  .tile .k { font-size:12.5px; color:var(--ink-2); margin-top:2px; }
  .tile .s { font-size:11.5px; color:var(--muted); margin-top:5px; }
  .tile.alert .v { color:var(--critical); }
  .tile.ok .v { color:var(--good); }
  .brow { display:grid; grid-template-columns:190px 1fr 46px; align-items:center; gap:10px; margin:0 0 6px; }
  .blab { font-size:12.5px; color:var(--ink-2); text-align:right; overflow:hidden;
    text-overflow:ellipsis; white-space:nowrap; }
  .btrack { background:var(--grid); border-radius:4px; height:14px; position:relative; }
  .bfill { height:14px; border-radius:0 4px 4px 0; background:var(--series-1); min-width:3px; position:relative; }
  .bfill.flag { background:var(--flag); }
  .bfill:hover::after { content:attr(data-tip); position:absolute; left:100%; top:50%;
    transform:translate(8px,-50%); background:var(--ink); color:var(--surface-1);
    font-size:11.5px; padding:5px 8px; border-radius:6px; white-space:nowrap; z-index:9; pointer-events:none; }
  .bval { font-size:12.5px; color:var(--ink-2); font-variant-numeric:tabular-nums; }
  .legend { display:flex; gap:16px; font-size:12px; color:var(--ink-2); margin:14px 0 16px; flex-wrap:wrap; }
  .legend i { width:10px; height:10px; border-radius:2px; display:inline-block; margin-right:6px; vertical-align:-1px; }
  .finding { background:var(--surface-1); border:1px solid var(--border); border-radius:12px;
    padding:18px 20px; margin-bottom:14px; }
  .finding[data-sev="noted"] { border-style:dashed; }
  .finding header { display:flex; gap:10px; align-items:flex-start; flex-wrap:wrap; }
  .finding h3 { font-size:16.5px; margin:0; line-height:1.35; flex:1 1 260px; letter-spacing:-.01em; }
  .chip { display:inline-flex; align-items:center; gap:5px; font-size:11px; font-weight:650;
    text-transform:uppercase; letter-spacing:.05em; padding:3px 9px; border-radius:999px;
    border:1px solid var(--c); color:var(--c); white-space:nowrap; }
  .chip .ic { font-size:10px; }
  dl.meta { display:grid; gap:8px; margin:14px 0 4px; padding:12px 14px;
    background:var(--page); border-radius:9px; border:1px solid var(--border); }
  dl.meta > div { display:grid; grid-template-columns:110px 1fr; gap:10px; }
  dl.meta dt { font-size:11.5px; text-transform:uppercase; letter-spacing:.05em; color:var(--muted); font-weight:600; padding-top:2px; }
  dl.meta dd { margin:0; font-size:13.5px; color:var(--ink-2); }
  dl.meta dd.path { font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:12px; word-break:break-word; }
  .body h4 { font-size:12px; text-transform:uppercase; letter-spacing:.06em; color:var(--muted);
    margin:16px 0 5px; font-weight:650; }
  .body p { margin:0 0 9px; font-size:14.5px; color:var(--ink-2); }
  code { font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:.9em;
    background:var(--page); border:1px solid var(--border); border-radius:4px; padding:1px 4px; }
  dl.meta dd code, td.note code { background:transparent; border:0; padding:0; }
  .controls { display:flex; gap:10px; flex-wrap:wrap; margin-bottom:12px; }
  .controls input, .controls select { font:inherit; font-size:14px; padding:8px 11px; border-radius:8px;
    border:1px solid var(--axis); background:var(--surface-1); color:var(--ink); }
  .controls input { flex:1 1 220px; }
  table { width:100%; border-collapse:collapse; font-size:13.5px; }
  th { text-align:left; font-size:11.5px; text-transform:uppercase; letter-spacing:.05em;
    color:var(--muted); font-weight:650; padding:8px 10px; border-bottom:1px solid var(--axis);
    position:sticky; top:0; background:var(--surface-1); }
  td { padding:7px 10px; border-bottom:1px solid var(--grid); color:var(--ink-2); vertical-align:top; }
  td.pkg { font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:12.5px; color:var(--ink); word-break:break-all; }
  td.pkg .ver { color:var(--muted); font-size:11.5px; margin-left:7px; }
  td.was { color:var(--muted); text-decoration:line-through; }
  td.note { font-size:12.5px; }
  .arrow { font-size:11px; }
  tr.risky td.lic { color:var(--flag); font-weight:600; }
  .tag { font-size:10.5px; padding:1px 6px; border-radius:999px; border:1px solid var(--axis); color:var(--muted); white-space:nowrap; }
  .tblwrap { max-height:520px; overflow:auto; border:1px solid var(--border); border-radius:12px; background:var(--surface-1); }
  .count { font-size:12.5px; color:var(--muted); margin-top:10px; }
  footer { margin-top:50px; padding-top:18px; border-top:1px solid var(--grid); font-size:12.5px; color:var(--muted); }
  footer p { margin:0 0 7px; }
  @media (max-width:620px) {
    .brow { grid-template-columns:120px 1fr 38px; }
    dl.meta > div { grid-template-columns:1fr; gap:2px; }
    h1 { font-size:24px; }
  }
</style>
</head>
<body>
<div class="wrap">

<header class="top">
  <div class="kicker">Dependency license audit · Revision ${esc(REV)}</div>
  <h1>${esc(RP.name ?? "workspace")}</h1>
  <p class="sub">All <strong>${COORDS} version-pinned entries</strong> in <code>pnpm-lock.yaml</code>,
  resolved at their <strong>exact pinned versions</strong>, plus a direct scan of the workspace
  manifests. ${NAMES} unique packages.</p>
  <div class="badges">
    <span class="badge">✓ ${D.counts.resolved}/${COORDS} resolved · ${D.counts.unresolved} unresolved</span>
    <span class="badge">✓ manifests read in-repo</span>
    ${
        RP.hasRootLicenseFile
            ? '<span class="badge">✓ root LICENSE present</span>'
            : '<span class="badge warn">✗ no root LICENSE</span>'
    }
  </div>
</header>

<div class="tiles">
  <div class="tile"><div class="v">${COORDS}</div><div class="k">pinned coordinates</div>
    <div class="s">${NAMES} unique names</div></div>
  <div class="tile"><div class="v">${prodNames.size}</div><div class="k">names in a runtime closure</div>
    <div class="s">${NAMES - prodNames.size} dev/build only</div></div>
  <div class="tile${ACTION ? " alert" : " ok"}"><div class="v">${ACTION}</div><div class="k">issues needing action</div>
    <div class="s">${nsev("critical")} critical · ${nsev("serious")} serious</div></div>
  <div class="tile${inPub.length ? " alert" : " ok"}"><div class="v">${inPub.length}</div>
    <div class="k">flagged deps in a published library</div>
    <div class="s">${flagged.length} flagged overall</div></div>
</div>

<h2>Workspace manifests <span class="n">measured in-repo</span></h2>
<div class="card">
  <p class="lede">Root: ${RP.hasRootLicenseFile ? "<code>LICENSE</code> present" : "<strong>no <code>LICENSE</code></strong>"},
  ${RP.hasRootNoticeFile ? "<code>NOTICE</code> present" : "no <code>NOTICE</code>"}.
  ${noField.length} of ${publishable.length} publishable packages declare no license field;
  ${noText.length} of ${publishable.length} do not ship the license text.</p>
  <table>
    <thead><tr><th>Package</th><th>Declared license</th><th>LICENSE in package dir</th><th>LICENSE in tarball</th><th><code>files</code></th></tr></thead>
    <tbody>
${manifestRows}
    </tbody>
  </table>
</div>
${driftSection}

<h2>License distribution <span class="n">${COORDS} pinned coordinates</span></h2>
<div class="card">
  <div class="legend">
    <span><i style="background:var(--series-1)"></i>Standard permissive (MIT, ISC, Apache-2.0, BSD, 0BSD, Unlicense)</span>
    <span><i style="background:var(--flag)"></i>Needs a policy decision</span>
  </div>
${bars}
</div>
${findingsSection}

<h2>Runtime closure by published package</h2>
<div class="card">
  <table>
    <thead><tr><th>Package</th><th>Declared license</th><th>Runtime deps</th><th>License mix of runtime closure</th></tr></thead>
    <tbody>
${pubRows}
${privatePkgs
    .map(
        (
            w,
        ) => `      <tr><td class="pkg">${esc(w.name)} <span class="tag">private</span></td>
        <td>none (not published)</td><td>${reach[w.path]?.prod.length ?? 0}</td>
        <td>not published to npm</td></tr>`,
    )
    .join("\n")}
    </tbody>
  </table>
</div>

<h2>All pinned dependencies <span class="n">searchable</span></h2>
<div class="controls">
  <input id="q" type="search" placeholder="Filter by package, version or license…" autocomplete="off">
  <select id="f">
    <option value="all">All coordinates</option>
    <option value="risk">Needs a decision only</option>
    <option value="prod">Runtime closure only</option>
    <option value="pub">Published-library runtime only</option>
  </select>
</div>
<div class="tblwrap">
  <table>
    <thead><tr><th>Package</th><th>License</th><th>Scope</th><th>Workspaces</th></tr></thead>
    <tbody id="tb"></tbody>
  </table>
</div>
<div class="count" id="cnt"></div>

<footer>
  <p><strong>Method.</strong> Data collected by <code>scripts/audit-licenses.mjs</code>, which parses the
  committed <code>pnpm-lock.yaml</code> into ${COORDS} pinned coordinates plus the resolved dependency
  graph, computes runtime-vs-dev reachability per workspace importer, reads every workspace
  <code>package.json</code>, and resolves each coordinate at its <strong>exact pinned version</strong> —
  never <code>latest</code>. Rendered by <code>scripts/render-license-report.mjs</code>; every figure and
  table on this page is computed from that data file.</p>
  <p><strong>Caveats.</strong> Reachability is computed at package-name granularity, so a name in a
  runtime closure marks all of its pinned versions. Native and system dependencies reached outside npm
  are out of scope. This is an engineering review, not legal advice.</p>
  <p>${revLine}</p>
</footer>
</div>

<script>
const ROWS = ${tableRows};
const OK = new Set(["MIT","ISC","Apache-2.0","BSD-2-Clause","BSD-3-Clause","0BSD","Unlicense"]);
const tb = document.getElementById('tb'), q = document.getElementById('q'),
      f = document.getElementById('f'), cnt = document.getElementById('cnt');
function render() {
  const term = q.value.trim().toLowerCase(), mode = f.value;
  const out = []; let n = 0;
  for (const [name, ver, lic, prod, pub, imps] of ROWS) {
    const risky = !OK.has(lic);
    if (mode === 'risk' && !risky) continue;
    if (mode === 'prod' && !prod) continue;
    if (mode === 'pub' && !pub) continue;
    if (term && !name.toLowerCase().includes(term) && !lic.toLowerCase().includes(term)
        && !ver.toLowerCase().includes(term)) continue;
    n++;
    if (n > 400) continue;
    const scope = prod ? (pub ? '<span class="tag">published runtime</span>' : '<span class="tag">runtime</span>')
                       : '<span class="tag">dev / build</span>';
    out.push('<tr class="' + (risky ? 'risky' : '') + '"><td class="pkg">' + name +
             '<span class="ver">' + ver + '</span></td><td class="lic">' + lic + '</td><td>' + scope +
             '</td><td>' + imps.replace(/,/g, ', ') + '</td></tr>');
  }
  tb.innerHTML = out.join('');
  cnt.textContent = n > 400 ? 'Showing first 400 of ' + n + ' matching coordinates — narrow the filter to see more.'
                            : n + (n === 1 ? ' coordinate' : ' coordinates') + ' shown.';
}
q.addEventListener('input', render);
f.addEventListener('change', render);
render();
</script>
</body>
</html>
`;

writeFileSync(OUT, HTML);
console.log(`✓ wrote ${path.relative(ROOT, OUT)}`);
console.log(
    `  ${COORDS} coordinates · ${flagged.length} flagged · ${inPub.length} in a published runtime closure`,
);
console.log(
    `  ${findings.length} findings, ${(NARR.drift ?? []).length} drift entries from ${existsSync(FIND) ? path.relative(ROOT, FIND) : "(none — findings file absent)"}`,
);
