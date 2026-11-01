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

## Phase 1: Inventory and export from Framer ✅

**Spec:** [001: Framer inventory](specs/001-framer-inventory.md)

- [x] `pnpm inventory`: crawls the sitemap → `migration/inventory.json` + `migration/summary.md` (HTML cached in `migration/cache/`, `--refresh` to re-download)
- [x] Images not downloaded: their Framer URLs are recorded (ADR-011)
- [x] `pnpm inventory:screenshots`: full-page desktop + mobile screenshots of one page per type → `migration/screenshots/`
- [x] Findings reviewed (below)
- [ ] 👤 Elian skims `migration/summary.md`

### Phase 1 findings

**Content counts:** 65 pages: 36 illustration projects, 14 animation projects, 6 case studies (`/services/*`), 4 service pages (3 landings + `/science-communication/science-illustration`), plus home, about, `/illustration`, `/animation` and `/services`.

**Structure**

- Project pages (Framer CMS template): section label (h1, e.g. "ILLUSTRATION PROJECT"), title (h2), a "Client: X" **or** category label ("Personal Project"), 1–3 paragraphs, an image grid, and PREVIOUS / all projects / NEXT.
- Animation projects: a **YouTube** embed (13 of 14) and often an external link to the client's site (ARTE, CLICCS, ESiWACE…). `roadtrip` has no video, only 3 GIFs. No Vimeo embeds anywhere (Vimeo only appears as a social link).
- Case studies have more structure: an overview, a concept and a bullet list, plus "Rejected alternatives" / "Final design" sections that are images only.
- Service landings are long and bespoke: intro + list, project overview cards, "building blocks" (pillars), "Let's talk!" CTA. This confirms the page-builder approach (ADR-009).
- Home: hero, 12 featured illustrations, "See more" → `/illustration`, an animation section, services cards, **Live drawing** (a card with photos from WindEnergy Hamburg 2026, **no page of its own**), "How can I help you?" tag cloud, about, closing CTA.

**Issues on the live site (don't reproduce them)**

- 🟡 **"PREVIOUS" on the 6 case studies is broken in the server HTML** (`../illustration/:w0K4L5pzB`, an unresolved Framer CMS variable). Framer's JavaScript fixes it in the browser, so visitors don't notice (checked by Elian), but crawlers and no-JS clients get a broken link. Our own prev/next won't have this problem.
- 🟠 **Alt text missing on 546 of 556 images.** It has to be written during the import (Phase 4), and the schema will require it.
- 🟡 3 illustration projects **have pages but aren't in the `/illustration` grid** (33 tiles): `depression`, `love-vs.-time`, `the-animal-in-me`. This is **an oversight** (confirmed by Elian): **all 36 must appear in the new gallery.**
- 🟡 Typo "Visual **Indentity**" → **fix to "Visual Identity"** in the import. It appears (a) on the home, as a black tag pill in the "How can I help you?" section (bottom left, next to PACKAGING; crop in `migration/screenshots/typo-visual-indentity.jpg`), and (b) on `/branding-packaging`, in the list of service tags under the intro.
- 🟡 `/services/aftertone-soda` is titled "Animalium Beers" (ADR-010: kept for now). `love-vs.-time` has a dot in the slug.
- 🟡 `glow-gang` appears both as `/illustration/glow-gang` and `/services/glow-gang-branding`.
- 🟡 Page titles are inconsistent ("Marina Labella - Animation Portfolio" on service pages).

**⚠️ Conflicts with our decisions (ask Marina)**

- ~~Contact form~~ → resolved by **ADR-014**: the form stays **only on About**. Home and service pages get email + socials.
- Behance: the Framer layer _named_ "Behance…" is actually the Vimeo icon, so Framer never linked Behance. But Marina **does** have a profile (`behance.net/marinalabella`, verified 2026-11-01), and **the new site shows it** (Elian). Socials: Instagram, LinkedIn, Vimeo, Behance.

## Phase 2: Design system

**Goal:** tokens and base components that reproduce the Framer look, with improvements.

**Specs:** [002: Design foundations](specs/002-design-foundations.md) (tokens, font, global CSS, layout, header, footer, styleguide). Spec 003 covers the content components (cards, grid, image, video, prev/next, CTA).

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
- [ ] Apply the Phase 1 content fixes: "Visual Identity" typo, and include `depression`, `love-vs.-time` and `the-animal-in-me` in the illustration gallery
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
| 6   | Contact form                                    | ✅ Only on About (ADR-014). Backend chosen in its spec                            |

**Decision 4: previews.** With a static site, Marina publishes in Sanity, the site rebuilds (~1–2 min), and only then can she see the change on the real website. The alternatives are:

- **A. Publish and check** (simplest, free). She edits in the Studio's form view, publishes, and checks the site. A mistake goes live briefly.
- **B. Live visual preview** (Sanity Presentation tool). She sees the real page update as she types, _before_ publishing. This needs one server-rendered preview route (Cloudflare Workers, still free tier) next to the static site. It adds complexity, but it fits well with a page builder that gives maximum freedom.

**Decided:** start with A. Keep components data-driven (props in, HTML out, no direct fetching inside blocks) so B can be added later without a rewrite.
