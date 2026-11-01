# Log

Progress and learnings, newest first. One entry per work session or finished spec. Keep entries short: what got done, what was learned, what comes next.

---

## 2026-11-01: Spec 001, Framer inventory ✅

**Done**

- `scripts/framer-export/`: `pnpm inventory` (65 pages → `migration/inventory.json` + `summary.md`) and `pnpm inventory:screenshots` (18 full-page screenshots). Dev-only, no new runtime deps (`node-html-parser` is a dev dependency).
- Findings are in `docs/PLAN.md` → Phase 1 findings. Highlights: 98% of images without alt text, 3 projects missing from the gallery grid, and **a contact form we didn't know about** (→ ADR-014: keep it on About only).
- Elian's review corrected two findings: PREVIOUS works in the browser (it's only broken in the server HTML), and the "Behance" icon is really Vimeo (I was misled by a Framer layer name).

**Learned**

- Framer server-renders all content, but it renders **every breakpoint** as `.ssr-variant` + `hidden-<hash>`. To keep the desktop version, compare against the breakpoint list in `#main[data-framer-hydrate-v2]`.
- Node 24 runs `.ts` files directly (type stripping): imports must use `.ts` extensions and `import type`.
- Chrome can be driven without Playwright: `--headless=new --remote-debugging-port` plus Node's built-in `WebSocket` (DevTools protocol). For full-page shots, set the viewport height to `scrollHeight`, otherwise `min-height: 100vh` leaves a gap.
- **Verify findings the way a visitor would before reporting them.** Raw HTML can differ from what the browser shows (JS fixes links), and Framer layer names can be misleading.
- The PC rebooted mid-session: nothing was lost, because everything was on disk. Commit more often.

**Next**

- 👤 Elian: skim `migration/summary.md` and the screenshots.
- Ask Marina: the 3 illustrations missing from the gallery, and the "Indentity" typo.
- Spec 002: design system (Phase 2). This is where Elian starts writing Astro.

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
