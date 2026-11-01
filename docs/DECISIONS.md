# Decisions

A lightweight architecture decision record (ADR). Each entry records **what** was decided and **why**, so nobody re-litigates it without new information. To change a decision, add a new entry that supersedes the old one. Don't rewrite history.

Format: `ADR-NNN · date · status (Accepted / Superseded by ADR-XXX)`.

---

### ADR-001 · 2026-10-31 · Accepted

**Leave Framer for Astro (static).**
Why: cost (no Framer subscription) and control (own the code, design and content). The site is image-heavy, mostly static and barely interactive, which is Astro's sweet spot: zero JS by default and a built-in image pipeline.

### ADR-002 · 2026-10-31 · Accepted

**Sanity as the CMS (free plan), content fetched at build time.**
Why: Marina is not a programmer and needs a polished editor with drag-and-drop ordering, image hotspot/crop and an image CDN. Git-based CMSs (Sveltia, Keystatic) were cheaper in dependencies, but would keep heavy images in the repo and give her a weaker editing experience.
Consequence: the public site uses `@sanity/client` directly, not `@sanity/astro`, to avoid shipping React.

### ADR-003 · 2026-10-31 · Accepted

**Native CSS with design tokens, no Tailwind or UI kits.**
Why: control and zero dependencies. Astro's scoped styles plus custom properties are enough for a portfolio.

### ADR-004 · 2026-10-31 · Accepted

**Hosting on Cloudflare (free tier).**
Why: unlimited bandwidth on the free tier (important for an image portfolio), deploy hooks for Sanity, and commercial use allowed.

### ADR-005 · 2026-10-31 · Accepted

**English only, contact by email and socials (no form), videos embedded from Vimeo/YouTube.**
Why: it matches the current site and avoids form backends and video hosting costs.

### ADR-006 · 2026-10-31 · Accepted

**Minimal motion: CSS and View Transitions only.**
Why: performance and accessibility. A JS animation library needs explicit approval.

### ADR-007 · 2026-10-31 · Accepted

**Design: the current Framer site as the base, with improvements.**

### ADR-008 · 2026-10-31 · Accepted

**Tooling: Astro 7, Node 24, pnpm 12, TypeScript 6, Prettier.**
Why: the project was empty, so starting on the latest versions was free. TypeScript stays on 6 because `astro check` doesn't support TS 7 yet. pnpm 12 is installed globally with npm because the global `ignoreScripts: true` setting breaks its native binary on Windows.

### ADR-009 · 2026-10-31 · Accepted

**Maximum layout freedom: a section-block page builder for every page and project body.**
Why: Marina should be able to arrange content however she wants without a developer. Consistency comes from design-safe block options (variants, widths, palette backgrounds), never from free-form styling.

### ADR-010 · 2026-10-31 · Accepted

**Keep the current URLs, including `/services/aftertone-soda` ("Animalium Beers"), for now.**
Why: SEO and shared links. Marina may rename titles or URLs later, and every rename gets a 301.

### ADR-011 · 2026-10-31 · Accepted

**Images: Marina keeps the originals. During development we use Framer URLs or placeholders.**
Why: no need to scrape and store assets. The originals have better quality and go in at the real import.

### ADR-012 · 2026-10-31 · Accepted

**Previews: "publish and check" first (option A). Live visual preview (option B) may come after launch.**
Why: simplicity and a fully static site. Block components stay data-driven (props in, HTML out) so B can be added without a rewrite.

### ADR-013 · 2026-10-31 · Accepted

**Spec-driven workflow, with Elian coding and the agent guiding.**
Why: everything stays documented, and Elian learns Astro by building. Specs live in `docs/specs/`, decisions here, and progress/learnings in `docs/LOG.md`.
