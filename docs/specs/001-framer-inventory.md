# 001: Framer inventory

- **Status:** Draft
- **Phase:** 1 (Inventory and export from Framer)
- **Related decisions:** ADR-010 (keep URLs), ADR-011 (images stay with Marina)

## Goal

Build a complete, machine-readable snapshot of the current Framer site's text, structure, links and media references, so that:

- pages and the content model are based on real content, not guesses
- content can be imported into Sanity by script (Phase 4)
- old URLs can be verified after launch (Phase 6)
- nothing is lost when the Framer plan is cancelled

## Out of scope

- Downloading images or videos (ADR-011). We only record their URLs.
- Reproducing Framer's layout or CSS (that's Phase 2: design tokens).
- Importing into Sanity (Phase 4).

## Requirements

1. R1: The script **must** read every URL in `https://www.marinalabella.com/sitemap.xml` (~70 today).
2. R2: For each page it **must** record:
   - URL and path
   - `<title>`, meta description and OG image
   - the page type, inferred from the path (`home`, `illustration-index`, `illustration-project`, `animation-index`, `animation-project`, `services-index`, `service-landing`, `case-study`, `about`, `other`)
   - headings in order (level + text)
   - text blocks in document order, with links kept
   - images (src, alt, width/height if present, order on the page)
   - video embeds (provider + ID) and external links (e.g. ARTE)
   - prev/next and "all projects" links
   - project-like fields when present (client, category label such as "Personal Project")
3. R3: Output **must** go to `migration/inventory.json` (gitignored), one object per page, pretty-printed and stable between runs (the same input gives the same output).
4. R4: The script **must** be polite: run requests one at a time with a small delay, use a descriptive User-Agent and make no parallel hammering.
5. R5: The script **must** be dev-only. It must not be imported by the site or included in the build.
6. R6: The script **should** also write `migration/summary.md`: a table of pages by type, counts of projects per section, and a list of anomalies (missing alt, title/slug mismatch, empty sections, external-only videos, broken links).
7. R7: Screenshots of one page per page type (desktop + mobile) **should** exist in `migration/screenshots/` for design reference. See Q2 for how.

## Acceptance criteria

- [ ] AC1: `pnpm inventory` (or similar) runs from a clean checkout and finishes without errors.
- [ ] AC2: `inventory.json` has one entry per sitemap URL, and the summary counts match the sitemap.
- [ ] AC3: Spot-check against the live site: `illustration/flamenco-series`, `animation/las-croquetas`, `services/novell-wine` and `branding-packaging` have the right title, text, images and prev/next.
- [ ] AC4: The known quirks show up in `summary.md`: "Animalium Beers" on `aftertone-soda`, the dot in `love-vs.-time`, the project that appears in two sections (`glow-gang`), and ARTE linking out instead of embedding.
- [ ] AC5: Nothing under `migration/` is tracked by git.
- [ ] AC6: The findings are copied into `docs/PLAN.md` (Phase 1) and `docs/LOG.md`.

## Open questions

- Q1: HTML parsing needs a dev dependency. Proposal: **`node-html-parser`** (small and fast) or **`cheerio`** (jQuery-like, more familiar). Both are dev-only.
- Q2: Screenshots. Options:
  - **(a)** Playwright as a dev dependency (heavy, ~100 MB of browsers)
  - **(b)** the agent takes them with the Chrome extension, one time only
  - **(c)** Elian takes them manually

  Proposal: **(b)**. It's a one-time job and doesn't justify a permanent dependency.

- Q3: Script language: TypeScript run with Node 24's native type stripping (`node scripts/framer-export/index.ts`), so no extra tool is needed. Proposal: yes.
- Q4: Framer renders some content client-side. If text or images are missing from the server HTML, we may need to read Framer's embedded data or fall back to a browser. To be checked in the first task.

---

_Design and Tasks will be filled in once the spec is approved._
