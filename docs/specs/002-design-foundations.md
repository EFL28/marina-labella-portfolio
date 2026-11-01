# 002: Design foundations

- **Status:** In progress (approved 2026-11-01)
- **Phase:** 2 (Design system)
- **Branch:** `feat/002-design-system`
- **Related decisions:** ADR-003 (native CSS + tokens), ADR-006 (minimal motion), ADR-007 (Framer as the base, with improvements), ADR-009 (page builder with design-safe options)

## Goal

Lay the visual foundation every page will be built on: design tokens taken from the current Framer site, the Inter font self-hosted, global base styles, the page layout, and the site header and footer. When this is done, an empty page already looks and feels like Marina's site.

This is also **Elian's first Astro spec**, so most tasks are 👤 or 🤝, and each one introduces one Astro concept (see "Astro concepts covered").

## Out of scope

- Content components (project card, grid, responsive Sanity image, video embed, prev/next, CTA): **spec 003**.
- Sanity, real content, and any real page besides a placeholder home and the styleguide.
- Page-builder blocks (Phase 3+).
- The contact form (About spec, ADR-014).

## Reference values from Framer (Phase 1 inventory)

| Kind        | Values found                                                                                                                                                                                                                                                                                                     |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Colours     | Neutrals `#0e0e0e` `#131014` `#2a3132` `#bababa` `#f2f2f2` `#fff`. Accents `#b80d07` (red) `#f44d01` `#cc4824` (orange) `#8e9cff` `#7081ff` (periwinkle) `#5f94de` (blue) `#001666` (navy) `#00a897` `#1cc0af` (teal) `#a6ce4b` (green) `#e8fa9b` (lime) `#ffeecf` (cream) `#f2eaef` (pink) `#75213b` (burgundy) |
| Breakpoints | 810 px (tablet), 1200 px (desktop), 1800 px (large)                                                                                                                                                                                                                                                              |
| Layout      | content max-width ~1400 px, side padding 20 px (mobile) → 40 px                                                                                                                                                                                                                                                  |
| Type        | most used sizes 12, 15, 16, 19–21, 24, 28–30, 36, 40, 52, 64, 72 px and a huge ~140 px display. Line height 1–1.4 em. Letter spacing −0.01 to −0.04 em on headings                                                                                                                                               |
| Radii       | 10, 15/16, 20/24, 30, 40, 50 px (pills)                                                                                                                                                                                                                                                                          |
| Visual      | black pill buttons/tags, coloured service cards (periwinkle, red, green, orange), black footer with a giant "MARINA LABELLA", nav items separated by ✦ ● ✹ glyphs                                                                                                                                                |

## Requirements

**Tokens**

1. R1: `src/styles/tokens.css` **must** define every design value as a CSS custom property: colours, font families, a fluid type scale, line heights, letter spacing, spacing scale, radii, layout widths, durations/easings. No component may hard-code these values.
2. R2: Colours **must** be in two layers: a raw palette (`--color-red-600`…) and semantic aliases that components use (`--color-text`, `--color-bg`, `--color-accent`, `--color-surface-*`…). The block backgrounds Marina will pick in Sanity (ADR-009) map to a **named, finite list** of surface tokens (e.g. `periwinkle`, `red`, `green`, `orange`, `cream`, `black`).
3. R3: The type scale **must** be fluid (`clamp()`), so headings grow smoothly between mobile and desktop instead of jumping at breakpoints.
4. R4: Text/background pairs used for text **must** meet WCAG 2.2 AA contrast (4.5:1 for body text, 3:1 for large text). Any Framer colour pair that fails gets adjusted, and the change is noted.

**Font**

5. R5: Inter 4 variable (`wght` + `opsz` axes) **must** be self-hosted through **Astro's built-in Fonts API** (stable since Astro 6: it downloads the files at build time and serves them from our domain). Subsets: `latin` + `latin-ext`. `font-display: swap`, with an automatic metric-matched fallback. **No new npm dependency.**
6. R6: Headings use the Display optical size (`font-optical-sizing: auto` or an explicit `opsz`), and body text uses regular Inter, which matches the current Inter / Inter Display look.

**Global styles**

7. R7: `src/styles/global.css` **must** contain a modern minimal reset, base typography (body, headings, links, lists), a visible `:focus-visible` style, `::selection`, and a `prefers-reduced-motion` rule that disables non-essential animation.

**Layout and chrome**

8. R8: `BaseLayout.astro` **must** render the full `<head>` (charset, viewport, title, description, canonical, favicon, font preload), a "Skip to content" link, `<Header />`, `<main id="content">`, `<Footer />`, and Astro **View Transitions** (`<ClientRouter />`), and it **must** respect reduced motion.
9. R9: `Header.astro`: Marina's handwritten logo (an SVG linking to `/`), the main nav (HOME ✦ SERVICES ● ILLUSTRATION ✹ ANIMATION ● ABOUT, with the glyphs decorative and hidden from screen readers), an email button (`mailto:`), and the current page marked with `aria-current="page"`.
10. R10: On mobile the nav **must** collapse into a menu button that's accessible by keyboard and screen reader (`aria-expanded`, Esc closes it, focus is managed). It should work **without a framework** (native `<dialog>`/popover, or a tiny inline `<script>`).
11. R11: `Footer.astro`: the black footer with the giant "MARINA LABELLA", the "ILLUSTRATE ✦ ANIMATE ✹ / BRING YOUR PROJECT TO LIFE" tagline, social icons (Instagram, LinkedIn, Vimeo, Behance, each with an accessible name) and the copyright with the **current year computed at build time**.
12. R12: Nav items, socials and email live in **one data file** (`src/data/site.ts`) for now. They'll move to Sanity's `siteSettings` in Phase 3, so components get them as props.

**Styleguide**

13. R13: A `/styleguide` page (`noindex`, excluded from the future sitemap) **must** show every colour token (with its contrast against text), the type scale, spacing, radii, buttons/pills and the header/footer, so design decisions can be reviewed in one place.

**Quality**

14. R14: The home placeholder and `/styleguide` ship **zero JS** apart from the mobile menu script (if any) and Astro's ClientRouter. Lighthouse (mobile) ≥ 95 in every category.

## Acceptance criteria

- [ ] AC1: `/styleguide` shows every token, and comparing it side by side with `migration/screenshots/*` gives the same colours, type feel and pill shapes.
- [ ] AC2: Header and footer look like the Framer ones on desktop (1440) and mobile (390), checked against the reference screenshots.
- [ ] AC3: The mobile menu opens and closes by mouse, by keyboard (Tab, Enter, Esc) and with a screen reader (announces the button, its expanded state and the links).
- [ ] AC4: Inter loads from our own domain (DevTools → Network shows no `fonts.gstatic.com`), there is no visible layout shift when the font swaps, and both the Display and Text optical sizes are visible.
- [ ] AC5: `grep` finds no hard-coded colours or pixel font sizes in `src/components` or `src/layouts` (tokens only).
- [ ] AC6: Every text colour pair in the styleguide passes AA, and the adjusted pairs are listed in Notes.
- [ ] AC7: With `prefers-reduced-motion: reduce`, there are no view-transition or other animations.
- [ ] AC8: Lighthouse mobile ≥ 95 on `/` and `/styleguide`. `pnpm check`, `pnpm format:check` and `pnpm build` pass.

## Astro concepts covered

So Elian knows what to read up on (links go to the official docs):

| Concept                                                                                 | Where it shows up                        |
| --------------------------------------------------------------------------------------- | ---------------------------------------- |
| [Components, props, slots](https://docs.astro.build/en/basics/astro-components/)        | `BaseLayout`, `Header`, `Footer`         |
| [Layouts](https://docs.astro.build/en/basics/layouts/)                                  | `BaseLayout`                             |
| [Styles: scoped vs global](https://docs.astro.build/en/guides/styling/)                 | `tokens.css`, `global.css`, components   |
| [Fonts API](https://docs.astro.build/en/guides/fonts/)                                  | `astro.config.mjs`, `<Font />` in `head` |
| [Scripts in components](https://docs.astro.build/en/guides/client-side-scripts/)        | mobile menu                              |
| [View Transitions / ClientRouter](https://docs.astro.build/en/guides/view-transitions/) | `BaseLayout`                             |
| [`Astro.url`, active links](https://docs.astro.build/en/reference/api-reference/#url)   | `aria-current` in the nav                |
| Build time vs run time                                                                  | copyright year, data file                |

## Open questions (resolved 2026-11-01)

- Q1: Palette naming → **raw palette + semantic aliases.** Framer has one shade per hue, so the raw names are plain (`--color-red`). Numeric steps get added only if shades appear.
- Q2: Fluid type scale → **about 8 `clamp()` steps + a separate display size.**
- Q3: Mobile menu → **Popover API** (no JS).
- Q4: Logo → no SVG available, so **use Framer's animated GIF for now** (`public/brand/logo.gif`). Its last frame is the static version (`logo-static.webp`), shown when the user prefers reduced motion.
- Q5: Social icons → **inline SVGs in `Icon.astro`.**
- Q6: Improvements → only the accessibility ones listed (contrast, focus, skip link, accessible menu). Elian will propose visual changes later.

---

## Design

**Files**

```text
astro.config.mjs              # fonts: [{ provider: fontProviders.google(), name: 'Inter', … }]
public/brand/
├── logo.gif                  # Framer's animated signature (temporary, Q4)
└── logo-static.webp          # last frame, for prefers-reduced-motion
src/
├── data/site.ts              # nav items, email, socials (→ Sanity siteSettings in Phase 3)
├── styles/
│   ├── tokens.css            # custom properties only, no selectors except :root
│   └── global.css            # reset + base element styles, imports tokens.css
├── components/
│   ├── Icon.astro            # <Icon name="instagram" />: inline SVG, aria-hidden by default
│   ├── Header.astro          # logo + nav + mail button + popover mobile menu
│   └── Footer.astro
├── layouts/BaseLayout.astro  # <head>, skip link, Header, <main>, Footer, ClientRouter
└── pages/
    ├── index.astro           # placeholder home
    └── styleguide.astro      # noindex
```

**Tokens, the shape `tokens.css` should end up with**

```css
:root {
  /* 1. Raw palette: only referenced by the semantic layer below */
  --color-red: #b80d07; /* one shade per hue on Framer → plain names; add -100…-900 steps only if shades appear */
  /* … */

  /* 2. Semantic: what components use */
  --color-text: var(--color-black);
  --color-text-muted: …; /* NOT #bababa: fails contrast (see Notes) */
  --color-bg: var(--color-white);
  --color-surface-periwinkle: var(--color-periwinkle);
  --color-on-surface-periwinkle: var(--color-black); /* text colour that passes AA on it */

  /* 3. Type */
  --font-sans: var(--font-inter); /* from the Fonts API */
  --step-0: clamp(…); /* body ≈ 16 → 19 px */
  --font-size-display: clamp(…); /* footer "MARINA LABELLA" ≈ 56 → 140 px */

  /* 4. Space, radius, layout, motion */
  --space-s: …;
  --radius-pill: 999px;
  --layout-max: 1400px;
  --duration-fast: 150ms;
}
```

Tool for the fluid scales: [utopia.fyi](https://utopia.fyi/type/calculator) (type and space). Plug in min viewport 390 / max 1440 and the Framer sizes as anchors.

**Breakpoints:** custom properties can't be used inside `@media`. Use the literal values `810px`, `1200px` and `1800px` in media queries, documented in a comment at the top of `tokens.css`. Prefer container queries and fluid values so few breakpoints are needed.

**Mobile menu (Popover API)**

```html
<button popovertarget="site-menu" aria-label="Open menu">…</button>
<nav id="site-menu" popover aria-label="Main">…links…</nav>
```

The browser handles opening, Esc, light dismiss and the top layer. CSS shows the button and hides the inline nav below 810 px. On desktop the same links render inline (no popover).

**Logo with reduced motion**

```html
<picture>
  <source srcset="/brand/logo-static.webp" media="(prefers-reduced-motion: reduce)" />
  <img src="/brand/logo.gif" width="1458" height="500" alt="Marina Labella" />
</picture>
```

## Tasks

Order matters: each task builds on the previous one.

- [x] 🤖 T1: Logo assets in `public/brand/` (GIF + static last frame)
- [x] 🤖 T2: Contrast table of the Framer palette (Notes)
- [x] 🤖 T3: `Icon.astro` with inline SVGs (instagram, linkedin, vimeo, behance, mail, menu, close). Exports the `IconName` type
- [x] 🤖 T4: `tokens.css` part 1: the **raw palette** (tedious copy of hex values), with `TODO(Elian)` sections for the rest
- [x] 👤 T5: `src/data/site.ts`: nav items, email, socials, as typed constants. _First TypeScript in the project. Concept: data that's read at build time._
- [x] 🤖 T6: `tokens.css` part 2: semantic colours, type scale (Utopia), spacing, radii, layout, motion. _Reassigned from 👤 to 🤖: Elian prefers to focus on Astro and leave the CSS to the agent._
- [x] 🤖 T7: `global.css`: reset, base typography, focus, selection, reduced motion, `.container`/`.visually-hidden` utilities. Imported by `BaseLayout`. _Reassigned to 🤖 (same reason)._
- [ ] 🤝 T8: Fonts API in `astro.config.mjs` + `<Font />` in the layout. _The agent explains each option, and Elian writes it._
- [ ] 🤝 T9: `BaseLayout.astro`: the agent builds `<head>` and the skip link step by step, and Elian adds Header/Footer/ClientRouter. _Concepts: layouts, props, `<slot />`._
- [ ] 👤 T10: `Footer.astro`. _Concepts: props, build-time values (year), mapping over data (`site.socials.map`)._
- [ ] 🤝 T11: `Header.astro`: the agent does the desktop nav with `aria-current`, and Elian does the logo `<picture>` and the popover mobile menu. _Concepts: `Astro.url`, conditional classes (`class:list`)._
- [ ] 👤 T12: `/styleguide`. _Concept: a page that imports and showcases components._
- [ ] 🤝 T13: QA: compare with the screenshots, keyboard and screen-reader pass, Lighthouse, AC1–AC8

## Notes

**Contrast of the Framer palette (T2).** Ratio against white / against `#0e0e0e`. Every colour has at least one AA text colour:

| Name       | Hex       | vs white | vs black | Text on it |
| ---------- | --------- | -------- | -------- | ---------- |
| black      | `#0e0e0e` | 19.30    | –        | white      |
| ink        | `#131014` | 18.89    | –        | white      |
| slate      | `#2a3132` | 13.26    | –        | white      |
| grey       | `#bababa` | 1.94     | 9.95     | black      |
| mist       | `#f2f2f2` | –        | 17.24    | black      |
| red        | `#b80d07` | 6.78     | 2.85     | white      |
| orange     | `#f44d01` | 3.55     | 5.43     | black      |
| rust       | `#cc4824` | 4.65     | 4.15     | white      |
| periwinkle | `#8e9cff` | 2.52     | 7.68     | black      |
| indigo     | `#7081ff` | 3.35     | 5.77     | black      |
| blue       | `#5f94de` | 3.10     | 6.23     | black      |
| navy       | `#001666` | 16.07    | –        | white      |
| teal       | `#00a897` | 2.98     | 6.48     | black      |
| aqua       | `#1cc0af` | 2.28     | 8.46     | black      |
| green      | `#a6ce4b` | 1.82     | 10.62    | black      |
| lime       | `#e8fa9b` | –        | 17.08    | black      |
| cream      | `#ffeecf` | –        | 16.90    | black      |
| pink       | `#f2eaef` | –        | 16.35    | black      |
| burgundy   | `#75213b` | 10.31    | –        | white      |

⚠️ **Framer uses `#bababa` as muted text on white** (e.g. "Personal Project"), which is **1.94:1 and fails AA.** `--color-text-muted` needs a darker grey (≥ 4.5:1 on white, e.g. around `#6e6e6e`). This is the first visible improvement over Framer (R4).

**Tokens and global CSS (T6, T7)**

- Type scale computed with Utopia's formula (390 → 1440 px; 16 px @ 1.2 → 18 px @ 1.25). `--step-6` reaches 68.7 px on desktop, close to Framer's 64–72 px headings.
- `--color-text-muted: #666666`: passes AA on white (5.7), mist (5.1), cream (5.0) and pink (4.9). `#6e6e6e` failed on cream and pink.
- Second improvement over Framer: its **red cards used dark text (2.85:1)**, so `--color-on-surface-red` is white (6.78:1).
- `--font-size-display` is viewport-based (`9.6vw`, clamped to 36–144 px) instead of a 56 → 140 px clamp: 14 letters at 56 px don't fit in a 390 px screen.
- Checked visually at 1440 and 390 px with `screenshots.ts` against a throwaway page. Headless Chrome's `--window-size` can't go below ~500 px wide, so mobile shots must use the script (device-metrics emulation).
