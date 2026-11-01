# AGENTS.md

Guidance for AI coding agents (and humans) working on this repository.

## Project

Portfolio website for **Marina Labella**, an illustrator and 2D animator. It replaces the current Framer site at https://www.marinalabella.com/.

**Why we are migrating:** **cost** (no Framer subscription; hosting should be free) and **control** (full ownership of code, design and content). Every decision should serve these two goals. Do not add paid services, vendor lock-in or dependencies without a clear reason.

**Who edits content:** Marina is **not a programmer**. She must be able to add, edit, remove and reorder projects and page content herself, through the CMS, without touching code or git. If a change would require a developer for routine content updates, it is the wrong design.

**Who writes the code:** **Elian** (the developer) writes most of it and is **new to Astro**. The agent acts as a guide and pair programmer first, and only implements by itself when a task is tagged 🤖. See "Working mode" below.

## Project documentation

Read these before starting any work, and keep them up to date in the same change:

| File                                     | Purpose                                                                                                       |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| [`docs/PLAN.md`](docs/PLAN.md)           | Roadmap: phases and checklists                                                                                |
| [`docs/specs/`](docs/specs/README.md)    | **Spec-driven development**: one spec per feature, approved before coding                                     |
| [`docs/DECISIONS.md`](docs/DECISIONS.md) | Decision record (ADRs): what was decided and why. Don't contradict an accepted ADR. Propose a new one instead |
| [`docs/LOG.md`](docs/LOG.md)             | Progress and learnings, newest first. This is the project's memory between sessions                           |

## Working mode (spec-driven, Elian codes, agent guides)

1. **No code without an approved spec.** If there is none for the task, draft one from `docs/specs/_template.md` and ask Elian to review it. Small fixes and chores are exempt.
2. **Respect the task tags** in the spec:
   - **👤 Elian:** don't implement it. Explain the Astro, CSS or Sanity concepts involved (with links to the official docs), suggest an approach, leave a skeleton or `TODO(Elian)` markers if that helps, and review Elian's code when asked.
   - **🤖 Agent:** implement it, then explain briefly what was done and why.
   - **🤝 Pair:** build the first instance step by step and explain every step. Elian builds the following ones.
3. **Teach, don't just answer.** When Elian asks for help, explain the _why_ and point to the concept (e.g. "this is an Astro island", "this runs at build time, not in the browser"). Keep explanations in Spanish, with code and comments in English.
4. **Reviewing Elian's code:** check correctness, Astro idioms, accessibility and performance against this file. Suggest changes with explanations instead of silently rewriting the code.
5. **At the end of every session:** update the spec's checkboxes, add an entry to `docs/LOG.md`, and add an ADR for any new decision.

## Stack (decided)

| Concern         | Choice                                                                                                | Notes                                                                                                                                                                                                                                                                               |
| --------------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework       | **Astro 7** (latest stable), static output (`output: 'static'`)                                       | No SSR and no adapter unless a real need appears                                                                                                                                                                                                                                    |
| Runtime         | **Node 24 LTS** (`.node-version`). Astro 7 needs at least 22.23.4 (`engines`)                         | Cloudflare reads `.node-version`                                                                                                                                                                                                                                                    |
| Language        | TypeScript **6** (`^6`), `astro/tsconfigs/strict`                                                     | **Stay on TS 6:** `astro check` doesn't support TS 7. TS 7.1+ only works with the experimental `@astrojs/ts-content-mapper`, so don't upgrade until `astro check` or its replacement is stable                                                                                      |
| Package manager | **pnpm 12**, pinned in `packageManager`                                                               | Never commit `package-lock.json` / `yarn.lock`. pnpm 12 ships a native binary that its install script sets up. If pnpm is installed with scripts disabled (`ignoreScripts`), the `pnpm` command breaks on Windows, so install it globally with `npm i -g pnpm@<version>`            |
| CMS             | **Sanity** (free plan)                                                                                | Content is fetched at build time only, using `@sanity/client` + `@sanity/image-url` + `@portabletext/to-html` (or an Astro Portable Text renderer). **Don't use `@sanity/astro` on the site**: it pulls in React, which the public site doesn't need. React lives only in `studio/` |
| Styling         | **Native CSS**: Astro scoped `<style>` plus global custom properties (design tokens)                  | **No Tailwind, no CSS-in-JS, no UI kits**                                                                                                                                                                                                                                           |
| Motion          | CSS transitions/animations, scroll-driven animations, **Astro View Transitions** (`<ClientRouter />`) | No GSAP/Motion/etc. unless explicitly approved                                                                                                                                                                                                                                      |
| Video           | **Vimeo / YouTube embeds**, loaded lazily (facade: thumbnail first, iframe on click)                  | Never store video files in the repo or in Sanity                                                                                                                                                                                                                                    |
| Hosting         | **Cloudflare** (Pages or Workers static assets)                                                       | Free tier, unlimited bandwidth. Rebuilds are triggered by a Sanity webhook to a deploy hook                                                                                                                                                                                         |
| Contact         | `mailto:` link plus social links                                                                      | **No contact form**                                                                                                                                                                                                                                                                 |
| Languages       | **English only**                                                                                      | Some project titles are Spanish/Catalan proper names; keep them as is. No i18n routing                                                                                                                                                                                              |

## Design direction

Use the **current Framer site as the base, with improvements**. Keep its identity (layout spirit, typography, colours, tone), and feel free to improve UX, accessibility, performance and details. When you diverge noticeably from the current site, say so in the PR or summary.

## Site map

These are the URLs of the current Framer site, taken from its `sitemap.xml` (October 2026). **Preserve them** so SEO and shared links keep working. If any URL changes, add a 301 in `public/_redirects` (Cloudflare format).

| Route                                                           | Content                                                                                                        | Live examples                                                                       |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `/`                                                             | Hero, featured illustration and animation projects, services, live drawing, "How can I help you?", closing CTA |                                                                                     |
| `/illustration`                                                 | Illustration gallery                                                                                           |                                                                                     |
| `/illustration/[slug]`                                          | Illustration project (~38 today)                                                                               | `/illustration/flamenco-series`, `/illustration/love-vs.-time`                      |
| `/animation`                                                    | Animation gallery                                                                                              |                                                                                     |
| `/animation/[slug]`                                             | Animation project (~14 today)                                                                                  | `/animation/las-croquetas`, `/animation/lt-climate`                                 |
| `/services`                                                     | Services overview                                                                                              |                                                                                     |
| `/branding-packaging`, `/advertising`, `/science-communication` | Service landing pages, **at the root, not under `/services/`**                                                 |                                                                                     |
| `/services/[slug]`                                              | Service **case studies** (branding/campaign projects)                                                          | `/services/glow-gang-branding`, `/services/novell-wine`, `/services/aftertone-soda` |
| `/science-communication/science-illustration`                   | Science communication sub-page                                                                                 |                                                                                     |
| `/about-contact`                                                | Bio and contact                                                                                                |                                                                                     |

Notes:

- Some slugs contain dots (`love-vs.-time`). Keep them exactly as they are, or redirect them.
- The same project can show up in more than one section (e.g. `/illustration/glow-gang` and `/services/glow-gang-branding`). Model the content so one project can appear in several sections, but give every published URL a single canonical page.
- "Live drawing" (e.g. WindEnergy Hamburg 2026) appears on the home page. Its exact URL is not decided yet.

## Planned repository layout

```text
/
├── AGENTS.md
├── astro.config.mjs
├── public/               # favicon, robots.txt, _redirects, static files
├── src/
│   ├── components/       # .astro components, PascalCase
│   ├── layouts/          # BaseLayout.astro etc.
│   ├── lib/sanity/       # client, GROQ queries, image URL helper, TS types
│   ├── pages/            # routes (see site map)
│   └── styles/           # tokens.css (custom properties), global.css (reset/base)
└── studio/               # Sanity Studio (separate package, deployed to *.sanity.studio)
```

Adjust this layout if needed, but keep Sanity access centralised in `src/lib/sanity/`.

## Content model (Sanity)

**Principle: maximum layout freedom for Marina.** Pages and project bodies are built from **section blocks** (a page builder) that she can add, remove, reorder and configure. Consistency comes from the blocks: each one exposes a few **design-safe options** (layout variant, width, background drawn from the palette tokens). **Never** expose free-form CSS, arbitrary colours or pixel values. See `docs/PLAN.md` (Phase 3) for the initial block list.

- **page**: title, slug, SEO, `sections[]`. Covers the home page, galleries, service landings, sub-pages and about.
- **project**: title, slug (must match the current URL), primary section (`illustration` | `animation` | `service case study`: this sets the canonical URL), extra sections it is also listed in, client, category label, year, cover image (with hotspot and alt), SEO, `sections[]` for the body.
- **Singleton** `siteSettings`: nav, footer, email, social links, SEO defaults.
- Each block maps to one component in `src/components/blocks/`, and a single `Sections.astro` renders `sections[]`. Adding a block means schema + component + Studio preview.
- **Ordering**: Marina must be able to **reorder projects by drag and drop** (orderable document list plugin, or ordered reference arrays on the pages). Do not rely on dates for order.
- Every image field requires **alt text** (validation in the schema).
- Write field titles and descriptions in plain English for a non-technical editor.

## Images

- CMS images are served by the **Sanity image CDN** through `@sanity/image-url`. Generate a responsive `srcset` with `auto=format`, respect the hotspot/crop, and always set `width`/`height` (or `aspect-ratio`) to avoid layout shift.
- Local images in `src/assets/` use Astro's `<Image>` / `<Picture>`.
- Use `loading="lazy"` below the fold. For the LCP image use `loading="eager"` and `fetchpriority="high"`.
- This is an illustration portfolio, so image quality matters. Do not over-compress artwork.

## Quality bar

- **Performance:** ship **zero client JS by default**. Islands or `<script>` only when needed, and kept small. Target Lighthouse ≥ 95 in every category on mobile.
- **Accessibility:** semantic HTML, keyboard navigation, visible focus, meaningful alt text, and `prefers-reduced-motion` respected by every animation and view transition. Aim for WCAG 2.2 AA colour contrast.
- **SEO:** a unique title and description on every page, Open Graph/Twitter images, canonical URLs, `sitemap` (`@astrojs/sitemap`) and `robots.txt`.
- **Fonts:** self-host them (no Google Fonts CDN), use `font-display: swap`, and preload only what is critical.

## Typography

Fonts found on the current site (October 2026). All of them are **open source (SIL OFL)**, so self-hosting them is allowed:

| Use on current site            | Font                                      | Weights seen        |
| ------------------------------ | ----------------------------------------- | ------------------- |
| Headings                       | **Inter Display**                         | 500, 600, 700       |
| Body / UI                      | **Inter**                                 | 400, 500 (some 600) |
| Barely used (one element each) | DM Sans, Fragment Mono, Libre Baskerville | 400                 |

Plan: ship a **single self-hosted Inter 4 variable font** (`wght` + `opsz` axes) with `font-optical-sizing: auto`. Since Inter 4, the Display cut is the large end of the `opsz` axis, so one file covers both families. Subset it to Latin plus Latin Extended (for Spanish, Catalan and German). Drop DM Sans, Fragment Mono and Libre Baskerville unless a design need for them shows up.

## Commands

```sh
pnpm install
pnpm dev        # http://localhost:4321
pnpm build      # static build to ./dist
pnpm preview
pnpm check     # astro check (type-check)
pnpm format    # Prettier
pnpm format:check
```

## Conventions

- Components: `PascalCase.astro`. Utilities: `camelCase.ts`. Routes and CSS custom properties: `kebab-case`.
- Keep components small and presentational. Data fetching happens in pages/layouts via `src/lib/sanity/`.
- Design tokens (colours, type scale, spacing, radii, durations) live in `src/styles/tokens.css`. **Don't hard-code values that should be tokens.**
- Prefer modern CSS (nesting, `clamp()`, container queries, `:has()`, logical properties) and stay within Baseline-supported features.
- Secrets (Sanity tokens, if any) go in `.env` and are never committed. The public project ID and dataset may live in config.
- Code, comments and commit messages are in **English**. Chat with the user is usually in Spanish.

## Working agreements for agents

- Ask before adding any dependency, paid service or new third-party script.
- Ask before changing the content model once Marina has started entering content, because schema changes may need migrations.
- Don't commit or push unless asked.
- Run `pnpm check`, `pnpm format:check` and `pnpm build` before calling a task done, and report failures honestly.
- When something here is outdated or wrong, update this file in the same change.
- Don't create other "memory" or notes files. Lasting knowledge goes in `docs/LOG.md` (learnings) or `docs/DECISIONS.md` (decisions).

## Deferred (decide once the site is further along)

- Analytics: probably Cloudflare Web Analytics (free, no cookies).
- Domain/DNS: where `marinalabella.com` is registered, and the cut-over plan from Framer. **Before cut-over, download every image and video reference from Framer**, since `framerusercontent.com` URLs will stop working when the Framer plan is cancelled.
