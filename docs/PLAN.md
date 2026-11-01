# Migration plan: Framer → Astro + Sanity

Living document. Tick items as they land and update this file in the same change. Rules and conventions are in [`AGENTS.md`](../AGENTS.md). Each item gets a spec in [`specs/`](specs/README.md) before implementation, and decisions are recorded in [`DECISIONS.md`](DECISIONS.md).

**Done means:** the new site is live on `marinalabella.com`, every current URL still works, the Lighthouse targets are met, Marina manages all content in Sanity on her own, and the Framer subscription can be cancelled.

## Guiding principles

1. **Capture before Framer disappears.** Every text, URL and video link has to be safe in our hands before cut-over. Marina keeps the original images herself.
2. **Content model before pages.** Pages are built against the real Sanity schema, not throwaway mock data.
3. **Migrate content by script, not by hand.** Marina should not have to re-type more than 50 projects.
4. **Ship vertical slices.** Get one page type fully finished (data, design, SEO, a11y) before starting the next.
5. **Maximum layout freedom for Marina.** Pages are built from a library of section blocks she can add, remove, reorder and configure. Design consistency comes from the blocks and their variants, not from fixed page templates.

---

## Phase 0: Project base ✅

- [x] Astro 7, pnpm 12, Node 24, TypeScript 6 + `astro check`
- [x] `AGENTS.md`, `CLAUDE.md`
- [x] `.gitattributes` (`* text=auto eol=lf`)
- [x] `.editorconfig`
- [x] Prettier + `prettier-plugin-astro` (`pnpm format`, `pnpm format:check`)
- [x] Remove the starter boilerplate and replace `README.md`
- [ ] Replace the Astro favicon with Marina's

## Phase 1: Inventory and export from Framer

**Goal:** a complete local snapshot of the current site's **text and structure**, which feeds design reference, content import and redirects.

- [ ] Script `scripts/framer-export/` (dev-only, never shipped):
  - crawl `sitemap.xml` (~70 URLs)
  - per page: URL, title, meta description, OG image, headings, body text, links, image URLs, Vimeo/YouTube/external video links, prev/next links
  - output to `migration/inventory.json`
- [ ] Images: **don't download them.** Record each `framerusercontent.com` URL in the inventory with its page and position. During development we use those URLs (or placeholders), and Marina provides the originals for the real import
- [ ] Full-page screenshots of every page type (desktop + mobile) into `migration/screenshots/` for visual reference
- [ ] Review the inventory and note the quirks found so far:
  - `/services/aftertone-soda` shows **"Animalium Beers"** (slug and title don't match)
  - `love-vs.-time` contains a dot
  - projects that live in two sections (`/illustration/glow-gang` ↔ `/services/glow-gang-branding`)
  - empty sections on case studies ("Rejected Alternatives" / "Final Design" headings with only images)
  - animation projects that link out (e.g. ARTE) instead of embedding a video
- [ ] Find the URL and structure of "see more" on `/illustration`, and of live drawing

**Spec:** [001: Framer inventory](specs/001-framer-inventory.md)

**Deliverable:** `inventory.json` + screenshots, plus a short findings list added to this file. `migration/` is gitignored.

## Phase 2: Design system

**Goal:** tokens and base components that reproduce the Framer look, with improvements.

- [ ] Extract colours, type scale, spacing, radii, breakpoints and motion timings from the Framer CSS into `src/styles/tokens.css`
- [ ] Self-host Inter 4 variable (`wght` + `opsz`), subset to Latin + Latin Extended, and preload it
- [ ] `src/styles/global.css`: reset, base typography, focus styles, `prefers-reduced-motion`
- [ ] `BaseLayout.astro`: `<head>` SEO slot, `<ClientRouter />` view transitions, skip link
- [ ] Base components: `Header`/`Nav` (responsive, accessible menu), `Footer`, `ProjectCard`, `ProjectGrid`, `ResponsiveImage` (Sanity), `VideoEmbed` (facade, lite-loading), `PrevNext`, `ContactCta`, `Tag`
- [ ] Simple `/styleguide` page (dev-only or `noindex`) showing every token and component

## Phase 3: Content model and Sanity Studio

**Goal:** Marina can edit everything, and the schema matches what the pages need.

- [ ] Create the Sanity project (free plan) and the `production` dataset
- [ ] `studio/` as a pnpm workspace (`pnpm-workspace.yaml`)
- [ ] Schemas (refine the draft in `AGENTS.md` using the Phase 1 findings):
  - **Section blocks (page builder)**, shared by every page and project. Initial set, to grow with real needs: hero, rich text, image (with size/alignment variants), image gallery/grid (columns, gap, aspect variants), image + text (side switchable), video embed, external link/CTA button, project list (manual picks or by section, with layout variants), bullet/feature list, pillars/columns, quote, spacer/divider, contact CTA. Each block has a few **design-safe options** (layout, width, background from the palette tokens) instead of free-form styling
  - `page`: title, slug, SEO, `sections[]` (blocks). This covers the home page, gallery pages, service landing pages, sub-pages and about
  - `project`: title, slug, primary section, also-listed-in, client, category label (e.g. "Personal Project"), year, cover, SEO, plus `sections[]` (same blocks) for the body
  - singleton `siteSettings`: nav, footer, email, socials, SEO defaults
  - block previews in the Studio (thumbnail + label) so Marina can tell blocks apart
  - orderable project lists (drag & drop)
  - validation: required alt text, unique slugs, slug format that allows the existing dots
- [ ] Desk structure arranged for Marina (Home, Projects by section, Services, Settings) with plain-English field help
- [ ] Deploy the Studio to `*.sanity.studio` (free)
- [ ] **Review the schema with Marina before importing any content**

## Phase 4: Content import

- [ ] Script that turns `inventory.json` into Sanity documents (map texts to blocks, keep the original slugs, set the order). Images: Framer URLs or placeholders for now, replaced with Marina's originals before launch
- [ ] Run it on a test dataset first, check, then run it on `production`
- [ ] Manual pass: alt texts (missing on Framer), anything the script couldn't map
- [ ] Marina reviews every project in the Studio

## Phase 5: Pages (vertical slices)

Each slice covers data query, page, design, SEO metadata and a11y check.

1. [ ] `/illustration/[slug]` and `/animation/[slug]`, project detail with prev/next and "all projects"
2. [ ] `/illustration` and `/animation` galleries
3. [ ] `/services/[slug]` case studies
4. [ ] Generic `page` route: service landings, `/services`, science-communication sub-page, `/about-contact`
5. [ ] `/`, the home page (built from blocks too, and last, since it reuses everything)
6. [ ] `404`

Each block gets its Astro component (`src/components/blocks/`) as soon as the first page that uses it is built.

## Phase 6: SEO and redirects

- [ ] Per-page title/description/OG image (Sanity defaults + overrides)
- [ ] `@astrojs/sitemap`, `robots.txt`, canonical URLs
- [ ] JSON-LD: `Person` (Marina) on home/about, `CreativeWork` on projects
- [ ] `public/_redirects` for any changed URL. Automated check: every URL in the old `sitemap.xml` answers 200 or 301 on the new site

## Phase 7: Deploy and editorial workflow

- [ ] Cloudflare project linked to the repo (Node from `.node-version`, pnpm from `packageManager`)
- [ ] Preview deploys on branches/PRs
- [ ] Sanity webhook → Cloudflare deploy hook (publish → site rebuilt in ~1–2 min)
- [ ] Short guide for Marina **in Spanish** (`docs/editor-guide.md`): add/edit/reorder projects, images and alt text, video links, what "publish" does and how long it takes

## Phase 8: QA

- [ ] Lighthouse ≥ 95 (mobile) on every page type
- [ ] Accessibility: keyboard pass, screen-reader spot check, contrast, reduced motion
- [ ] Browsers: Chrome, Firefox, Safari (iOS + macOS)
- [ ] Visual comparison against the Phase 1 screenshots
- [ ] Old-URL check script passes (Phase 6)

## Phase 9: Cut-over (deferred)

- [ ] Find the registrar/DNS for `marinalabella.com`
- [ ] Point the domain to Cloudflare, with HTTPS, and redirect `www` ↔ apex consistently with today's canonical (`www`)
- [ ] Search Console: verify, submit sitemap, watch for 404s
- [ ] Analytics (Cloudflare Web Analytics)
- [ ] Keep Framer alive ~2 weeks as a fallback, then cancel

---

## Decisions

Summary only. The source of truth, with the reasoning, is [`DECISIONS.md`](DECISIONS.md).

| #   | Decision                                        | Status                                                                            |
| --- | ----------------------------------------------- | --------------------------------------------------------------------------------- |
| 1   | Prettier                                        | ✅ Yes (tabs, single quotes, width 100)                                           |
| 2   | How flexible pages are                          | ✅ Maximum freedom: section-block page builder for every page and project body    |
| 3   | "Animalium Beers" at `/services/aftertone-soda` | ✅ Keep it for now. Marina may rename titles/URLs later (add a 301 when she does) |
| 4   | Draft previews (see below)                      | ✅ A (publish and check) now. Evaluate B (live preview) after launch              |
| 5   | Images                                          | ✅ Marina keeps the originals. Dev uses Framer URLs or placeholders               |

**Decision 4: previews.** With a static site, Marina publishes in Sanity, the site rebuilds (~1–2 min), and only then can she see the change on the real website. The alternatives are:

- **A. Publish and check** (simplest, free). She edits in the Studio's form view, publishes, and checks the site. A mistake goes live briefly.
- **B. Live visual preview** (Sanity Presentation tool). She sees the real page update as she types, _before_ publishing. This needs one server-rendered preview route (Cloudflare Workers, still free tier) next to the static site. It adds complexity, but it fits well with a page builder that gives maximum freedom.

**Decided:** start with A. Keep components data-driven (props in, HTML out, no direct fetching inside blocks) so B can be added later without a rewrite.
