# Contractez

Contractez (contractez.ro) is a Romanian services marketplace: clients publish a project for free, a small number of compatible providers apply, they talk in chat, and reviews are only possible after a confirmed collaboration. The interface has one job above all others: **make a stranger trustworthy enough to hire.** The design system is called *Cerneală & hârtie* (ink and paper): a serious, quiet palette in the spirit of a modern bank, with green reserved for verified facts.

The source of truth is the codebase: `src/app/globals.css` (tokens as CSS variables, exposed to Tailwind v4 through `@theme inline`), `src/components/ui/*` (shadcn primitives, restyled) and `src/components/shared/*`. Live reference (palette, components, screens): https://claude.ai/artifact/XaUhL4QTfrdqx2BUGp5NuR

## Principles

1. **Quiet by default, loud only for trust.** Navy and neutrals carry the interface. Green appears only next to something that was actually verified (ANAF, email, phone, a confirmed collaboration). If it is not verified, it is not green.
2. **Borders, not shadows.** Every surface is `card` + a 1px `border` + at most `shadow-xs`. Shadows grow only when something floats (popover, dialog, sticky action bar) or is hovered.
3. **One primary action per view.** `primary` (ink navy) is the button that does what the page is for. Everything else is `outline`, `ghost` or a `brand` link.
4. **Numbers are facts.** Budgets, counts and scores use tabular figures and sit in semibold, never in a coloured pill.
5. **Romanian, with diacritics, always.** ș ț ă î â, „ghilimele românești”, `ro-RO` number formatting (4.000–6.000 lei).

## Content fundamentals

- Address the user with **tu**, short sentences, active voice: „Publică un proiect gratuit”, „Intră în cont”, „Trimite linkul”.
- Buttons start with a verb and say exactly what happens. Loading states repeat the verb: „Se publică…”, „Se verifică…”.
- Errors say what happened and what to do: „Linkul nu este complet. Deschide-l din nou din email.” No apologies, no exclamation marks.
- Trust copy states the limit of the claim: „Firmă activă în registrul public ANAF. Nu garantează calitatea serviciilor.”
- Eyebrows (`.eyebrow`, 12px uppercase, +0.08em) name a context, never a sentence: PENTRU PRESTATORI, TARIF, CONT.

## Visual foundations

### Colour

| Role | Token | Light | Dark | Rule |
| --- | --- | --- | --- | --- |
| Ground | `background` | #f7f7f5 | #0a0f18 | Warm paper; never pure white behind content. |
| Surface | `card` | #ffffff | #101724 | Always with `border`. |
| Ink | `foreground` | #0d1626 | #e8ebf0 | Body text and headings. |
| Primary | `primary` | #142340 | #e8ebf0 | Ink navy. Inverts to near-white in dark mode. |
| Accent | `brand` | #2b4acb | #8aa2ff | Links, focus, AI, unread. Small areas only. |
| Trust | `success` | #17714a | #4cc38a | Verification signals only. |
| Urgency | `warning` | #9a5a07 | #e3a64b | Urgent projects, drafts, pending states. |
| Error | `destructive` | #c4352b | #f2766b | Errors and reporting. |

Tinted signal surfaces use the signal at 6–10% (`bg-success/6`, `bg-warning/8`, `bg-destructive/6`) with a 20–30% border of the same hue, and text in `foreground` (or the signal colour for a one-line message). Contrast: every text pair above passes WCAG AA (4.5:1) on `background` and `card` in both themes.

### Type

**Instrument Sans** (Google Fonts, latin + latin-ext, variable weight 400–700 and width 75–100) for everything; **Instrument Serif italic** (`.serif-em`, `--font-serif`) only for the highlighted word of a display heading; **Geist Mono** for identifiers such as CUI and CAEN. Headings are semibold (600) with negative tracking that tightens as size grows (−0.012em at 17px to −0.03em at 44px) and `text-wrap: balance`. Body text is 14px in UI and 15px/1.7 in long-form reading, capped near 65 characters (`max-w-prose`).

### Space, radius, elevation

8px base grid (`space-2`); cards pad 20px (24px on desktop); sections stack 40px apart; pages end with 64px. Radius base is 8px (`radius-lg`) for controls, 11px (`radius-xl`) for cards, 14px (`radius-2xl`) for the few hero containers (auth card, chat shell, profile header). Badges use `radius-md`: rectangular-ish, not pills, which reads more serious.

### Motion (CSS only, no JS animation libraries)

All motion lives in `src/app/globals.css` and uses CSS only: keyframes, `@property`, scroll-driven animations and `:has()`.

- **Entrances.** Animate once, over 0.7–1s, with ease-out-expo (`cubic-bezier(0.16,1,0.3,1)`): fade up 18px with a 6px blur.
  - `.enter` plays on load and cascades through `--i`.
  - `.reveal` plays on scroll (`animation-timeline: view()`). Browsers without scroll timelines simply show the content.
- **Loops.** Only inside illustrations (hero, bento) and always slow (4–30s): aurora, rotator, radar, status timeline.
- **Interaction.** `.lift` raises a card 3px on hover, with `shadow-lg`. Buttons keep the 1px press.
- **Accessibility.** `prefers-reduced-motion` stops every loop and entrance. The hero demo then freezes in a complete state (`--t: 0.9`).
- **Numbers.**
  - `.count-up` counts on scroll; `.count-in` counts on load, used by `StatTile` when `value` is a number.
  - Both take `style={{"--to": n}}`. Always pair them with an `sr-only` copy of the number.

## Expressive layer (marketing and key moments)

The calm product UI is framed by a few bold, editorial moments. Use them for landing, pricing, auth, onboarding, empty dashboards and success states. Never use them in dense tools such as tables, forms or chat.

- **Ink panel** (`.ink-panel`):
  - A deep blue-black panel (`--ink` #060b16), identical in both themes, with a faint grid.
  - Inside it go 2–3 `.aurora` blobs (`aurora-a` cobalt, `aurora-b` cyan, `aurora-c` violet; `size-[520px]`, positioned partly off-edge).
  - It is inset from the page edges (`px-2 sm:px-3`) with `rounded-[1.75rem] sm:rounded-[2.25rem]`.
  - Text on it is white at 100/65/50% for heading, body and meta. Primary buttons on ink are white with ink text.
- **Glass** (`.glass`): a translucent card on ink panels.
- **Display type:** `.display-xl` (hero, up to 96px), `.display-lg` (section titles, up to 60px), `.display-md`.
- **Highlighted terms.** There are three tools. Use at most one or two highlights per heading or paragraph.
  - `.serif-em`: Instrument Serif italic, for the single emotional word of a heading. Combine it with `.text-gradient` (light sections) or `.text-gradient-ink` (ink panels).
  - `.hl` (light) or `.hl-ink` (ink): a marker underline for factual terms such as „maximum 5 oferte” or „gratuit”.
  - Add `.reveal-hl` on the parent, or `.enter-hl` on the `<mark>`, to draw the marker in. On a `<mark>`, also add `bg-transparent`.
- **Ring glow** (`.ring-glow`): a rotating light on the border. Use it for ONE element per page: the hero prompt or the recommended plan.
- **Live dot** (`.live-dot`, currentColor): pulsing; only for genuinely live data.
- **Product demos:**
  - Illustrations are built from real UI fragments, never stock art, and labelled „Exemplu”.
  - Reviews and counts shown on marketing pages come from the database, never invented.

## Iconography

lucide-react at 16px (`size-4`) inline with text and 14px inside badges. Decorative icons in empty states and info tiles sit in a 36–44px bordered square with `strokeWidth={1.75}`. Icons inherit `muted-foreground`; they take `success` only in trust contexts and `brand` only for AI (Sparkles, Wand).

## Components

- **Button**: `default` (navy, one per view), `outline` (card + border-strong), `ghost`, `secondary`, `brand` (cobalt, for AI or provider upsell), `destructive` (tinted), `link`. Sizes 28 / 32 / 36 / 44px.
- **Badge**: `secondary`, `outline`, `success` (verification), `warning`, `brand`, `destructive`. 22px tall, `radius-md`.
- **Input / Select / Textarea**: 36px, card background, `input` border, cobalt focus border with a 3px 20% halo.
- **Card**: card + border + `shadow-xs`; `CardHeader className="border-b"` for settings-style sections.
- **ProjectCard**: category / time, title, two-line summary, a fact row (budget in semibold, location, invoice, urgency in `warning`, „Client verificat” in `success`), and the **slot meter**: one segment per application slot, filled for each offer received. The slot meter is the system's signature: it shows, honestly, how much competition there is.
- **PlanCards / UsageMeter** (`components/billing`): three equal plan cards; price as a large tabular number, the monthly application quota in a framed row, the recommended plan marked by a navy border and a `default` badge, the current plan by a cobalt ring and a `brand` badge. Feature ticks are neutral, not green. The usage meter turns `destructive` only when the quota is exhausted.
- **StatTile**: label with a 14px icon, a 28px tabular value, one muted hint line.
- **EmptyState**: dashed `border-strong` frame, bordered icon tile, one sentence, one action.
- **PageHeader**: optional eyebrow, 32px title, 15px description, actions aligned to the bottom edge.
- **AuthCard**: split layout on desktop: trust statements left, the form card right.

## Dark mode

Class-based (`.dark` on `<html>`, via next-themes, default = system). Dark is not an inversion: the ground is a deep blue-black (#0a0f18), cards lift by lightness (#101724), primary flips to near-white so primary buttons stay the strongest element, and signal colours are lightened to keep AA contrast.

## Brand

**The mark** is an open C holding a check: the request, closed with a verified person. It sits on a navy tile (gradient `#1c2f57 → #142340 → #2b4acb`). The check is the verified green `#4cc38a`, because green means "verified" throughout the product. On ink panels use `tone="ink"`, which gives a lighter tile with a fine white outline.

**The wordmark** is `contractez` in lower case, Instrument Sans 600, letter-spacing −0.045em. In running text the name is written "Contractez", capitalised.

**Where it lives:**

| What | Where |
| --- | --- |
| React component | `src/components/brand/logo.tsx` (`Logo`, `LogoMark`) |
| Favicon | `src/app/icon.svg`, `src/app/favicon.ico` (16/32/48) |
| Apple touch icon | `src/app/apple-icon.png` (180, full-bleed) |
| PWA / web manifest | `public/icon-192.png`, `public/icon-512.png`, `public/icon-maskable-512.png` (`src/app/manifest.ts`) |
| OG / Twitter image | `src/app/opengraph-image.png`, `src/app/twitter-image.png` (1200×630) |
| Mark as files (light, ink, mono, 1024 px PNG) | `public/brand/contractez-mark*.svg` and `.png` |
| Full logo (light, ink) | `public/brand/contractez-logo.png`, `public/brand/contractez-logo-ink.png` |
| Social avatar | `public/brand/contractez-avatar-400.png` |

The source design is the Claude Design canvas "Contractez — identitate de brand". It includes the explored alternatives.
