import { resolve } from "node:path";
import type { NextConfig } from "next";

const config: NextConfig = {
    // The app lives in a workspace, so the files a build traces reach outside
    // its own directory; without this Next guesses a root from the nearest
    // lockfile and says so on every run.
    outputFileTracingRoot: resolve(process.cwd(), "..", ".."),

    // Next writes an AGENTS.md and a CLAUDE.md of its own into the app on every
    // dev run; the repository documents itself in one CLAUDE.md at the root.
    agentRules: false,
};

export default config;
