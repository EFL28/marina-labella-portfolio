# 001: Framer inventory

- **Status:** Done (2026-11-01)
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

- [x] AC1: `pnpm inventory` (or similar) runs from a clean checkout and finishes without errors.
- [x] AC2: `inventory.json` has one entry per sitemap URL, and the summary counts match the sitemap.
- [x] AC3: Spot-check against the live site: `illustration/flamenco-series`, `animation/las-croquetas`, `services/novell-wine` and `branding-packaging` have the right title, text, images and prev/next.
- [x] AC4: The known quirks show up in `summary.md`: "Animalium Beers" on `aftertone-soda`, the dot in `love-vs.-time`, the project that appears in two sections (`glow-gang`), and ARTE linking out instead of embedding.
- [x] AC5: Nothing under `migration/` is tracked by git.
- [x] AC6: The findings are copied into `docs/PLAN.md` (Phase 1) and `docs/LOG.md`.

## Open questions (resolved 2026-11-01)

- Q1: HTML parser → **`node-html-parser`** (dev dependency).
- Q2: Screenshots → **(b)**: the agent takes them once with the Chrome extension. No Playwright.
- Q3: Script in **TypeScript**, run with Node 24's native type stripping.
- Q4: Client-side rendering → **not a problem.** Framer server-renders all text and `<img>` tags. The catch is that it renders **every breakpoint variant** (desktop/tablet/phone) as `.ssr-variant` elements hidden with `hidden-<hash>` classes. See Design.

---

## Design

**Files**

```text
scripts/framer-export/
├── index.ts      # entry: sitemap → fetch each page (sequential, delay) → parse → write output
├── parse.ts      # HTML → PageRecord (pure function, no I/O)
├── classify.ts   # path → page type
├── summary.ts    # PageRecord[] → summary.md (counts + anomalies)
└── types.ts      # PageRecord and friends
```

Run with `pnpm inventory` (`node scripts/framer-export/index.ts`). Output goes to `migration/inventory.json` + `migration/summary.md`, with an HTML cache in `migration/cache/` so re-runs don't hit the server again (use `--refresh` to bypass it).

**Removing Framer's breakpoint duplicates**

1. `#main[data-framer-hydrate-v2]` holds a JSON list of `breakpoints: [{ hash, mediaQuery }]`.
2. Evaluate each `mediaQuery` (only `min-width`/`max-width` appear) for a **1440 px desktop** viewport. Every hash that matches is a "desktop hash".
3. Remove every `.ssr-variant` element that has a `hidden-<desktop hash>` class. What's left is exactly what a desktop visitor sees.
4. Drop the `<nav>` and the site `<footer>` elements. They are global, and get recorded once from the home page as `siteChrome`.

**Extraction** (document order, after the clean-up)

- headings: `h1`–`h6` → `{ level, text }`
- text blocks: `p`, `li` and headings, with inline links kept as `{ text, href }`
- images: `<img>` → `{ src (without query string), width, height, alt, order }`, deduplicated by `src`
- videos: Vimeo/YouTube iframes or components (`player.vimeo.com/video/ID`, `youtube.com/embed/ID`) → `{ provider, id }`
- links: internal (normalised to a path) vs external
- prev/next: links whose text matches `/previous|next/i`. "All projects": `/all projects/i`
- project fields: text that follows elements named `Client` / `Category` (`data-framer-name`) when present

**`PageRecord`** (simplified)

```ts
type PageRecord = {
  url: string;
  path: string;
  type: PageType;
  meta: { title: string; description?: string; ogImage?: string };
  headings: { level: number; text: string }[];
  blocks: { tag: string; text: string; links: { text: string; href: string }[] }[];
  images: { src: string; width?: number; height?: number; alt: string; order: number }[];
  videos: { provider: 'vimeo' | 'youtube'; id: string }[];
  links: { internal: string[]; external: string[] };
  nav: { previous?: string; next?: string; index?: string };
  fields: { client?: string; category?: string };
};
```

## Tasks

- [x] 🤖 Add `node-html-parser` (dev), the `inventory` script and `migration/` to `.gitignore` (already done)
- [x] 🤖 `types.ts`, `classify.ts`
- [x] 🤖 `parse.ts` with breakpoint de-duplication, checked against `flamenco-series`, `las-croquetas`, `novell-wine` and `branding-packaging`
- [x] 🤖 `index.ts`: sitemap, polite sequential fetch, cache, write JSON
- [x] 🤖 `summary.ts`: counts and anomalies
- [x] 🤖 Run it on the full site and verify AC1–AC5
- [x] 🤖 Screenshots (one page per type, desktop + mobile). The Chrome extension wasn't connected, so `screenshots.ts` drives the local Chrome over the DevTools protocol instead (still no npm dependency): `pnpm inventory:screenshots`
- [x] 👤 Elian: skim `summary.md` and flag anything that looks wrong or surprising (2026-11-01: corrected the PREVIOUS and Behance findings)
- [x] 🤖 Copy the findings into `docs/PLAN.md` and `docs/LOG.md` (AC6)

## Notes

- **Result:** 65 pages (the sitemap has 65 URLs, not ~70), 556 image references, YouTube embeds on 13 of the 14 animation projects. Two runs give a byte-identical `inventory.json`.
- **Breakpoint de-duplication** has to compare hidden classes against **all** the page's breakpoint hashes, not just the desktop ones. The first version dropped desktop-visible variants that were hidden only on mobile (the "NEXT" button).
- Framer's "Client" slot holds either `Client: X` or a category label ("Personal Project"), and the parser splits them.
- `scripts/` is excluded from `astro check` (see `tsconfig.json`): type-checking it would need `@types/node`, and this is a one-off dev tool.
- Prettier needed two passes on `parse.ts` before it was stable. If `format:check` fails right after `format`, run `format` again.
- All findings are in `docs/PLAN.md` → Phase 1 findings.
