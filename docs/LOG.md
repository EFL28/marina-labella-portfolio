# Log

Progress and learnings, newest first. One entry per work session or finished spec. Keep entries short: what got done, what was learned, what comes next.

---

## 2026-10-31: Project base

**Done**

- Analysed the Framer site: ~70 URLs (sitemap), fonts (Inter / Inter Display, all OFL), page structure of projects, case studies and services.
- Decided the stack and workflow (ADR-001 → ADR-013).
- Upgraded to Astro 7.4.4, Node 24, pnpm 12.16.1 and TypeScript 6. Added Prettier, `.editorconfig` and `.gitattributes`, and removed the starter boilerplate.
- Wrote `AGENTS.md`, `docs/PLAN.md`, this log, `docs/DECISIONS.md` and the spec process.

**Learned**

- pnpm's `minimumReleaseAge` is in **minutes** (`4320` = 3 days). pnpm 12 rejects values like `3d`.
- With `ignoreScripts: true`, pnpm 12 can't install its native binary when it switches versions through `packageManager`, and on Windows the `pnpm` command breaks. Fix: `npm i -g pnpm@<version>`.
- `astro check` doesn't support TypeScript 7 yet, so we stay on TS 6.
- On the Framer site the service landing pages sit at the root (`/branding-packaging`), while `/services/[slug]` holds case studies.

**Next**

- Approve spec 001 (Framer inventory), then implement it.
