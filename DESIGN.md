# DESIGN.md

> Design system: TradeWitness Tech-Finance Minimal
> Format: shadcn/ui + Tailwind CSS 3 (apps/app) & v4 (apps/landing) + CSS variables
> Last updated: 2026-05-10

---

## 1. Color Palette

Semantic roles tailored for a financial trading application (dark/tech aesthetic). 
**Note:** Use space-separated HSL values (e.g., `240 5.9% 10%`) for CSS variables to support Tailwind v3 opacity modifiers (`bg-primary/50`).

| Role             | Dark mode (Default)     | HSL Value (Space-separated) |
|------------------|-------------------------|-----------------------------|
| `--background`   | Base page background    | `240 10% 3.9%` (zinc-950)   |
| `--foreground`   | Primary text            | `0 0% 98%` (zinc-50)        |
| `--card`         | Card surface            | `240 5.9% 10%` (zinc-900)   |
| `--card-alt`     | Elevated card / modal   | `240 3.7% 15.9%` (zinc-800) |
| `--primary`      | Primary action (Brand)  | `217.2 91.2% 59.8%` (blue-500) |
| `--primary-fg`   | Text on primary bg      | `0 0% 100%`                 |
| `--muted`        | Muted text, hints       | `240 5% 64.9%` (zinc-400)   |
| `--accent`       | Accent / highlight      | `221.2 83.2% 53.3%` (blue-600)|
| `--destructive`  | Error, danger, loss     | `0 84.2% 60.2%` (red-500)   |
| `--success`      | Success, profit         | `142.1 70.6% 45.3%` (green-500)|
| `--border`       | Borders, dividers       | `240 3.7% 15.9%` (zinc-800) |
| `--ring`         | Focus ring              | `217.2 91.2% 59.8%` (blue-500)|

Dark mode strategy: `.dark` class. TradeWitness is a dark-mode first application for traders.

---

## 2. Typography

Font family: **Geist Sans** (Clean, modern tech font)
Fallback: `system-ui, -apple-system, sans-serif`

Mono font: **Geist Mono** — for financial data, timestamps, and code.

Scale:

| Step    | Size    | Line-height | Letter-spacing  | Weight | Usage                 |
|---------|---------|-------------|-----------------|--------|-----------------------|
| Display | 48px    | 1.1         | 0               | 700    | Hero headline         |
| H1      | 36px    | 1.2         | 0               | 700    | Page title            |
| H2      | 24px    | 1.3         | 0               | 600    | Section header        |
| H3      | 20px    | 1.4         | 0               | 600    | Card header           |
| H4      | 18px    | 1.4         | 0               | 600    | Subhead               |
| Body    | 16px    | 1.6         | 0               | 400    | Main content          |
| Small   | 14px    | 1.5         | 0               | 400    | Secondary text        |
| Caption | 12px    | 1.4         | 0               | 500    | Labels, metadata      |
| Mono    | 14px    | 1.6         | 0               | 400    | PnL data, IDs         |

---

## 3. Spacing Scale

Strict multiples of 8px only. No arbitrary values.

```
8px  — xs  (tight padding, input gaps)
16px — sm  (component inner padding)
24px — md  (card padding, section gaps)
32px — lg  (section padding)
48px — xl  (between major sections)
64px — 2xl (page-level spacing)
96px — 3xl (hero sections)
```

---

## 4. Border Radius Scale

Tech/Finance Minimal scale.

```
none: 0px      — Data grids, tables
sm:   4px      — Badges, chips, inputs
md:   6px      — Buttons
lg:   8px      — Cards
xl:   12px     — Modals, dialogs
full: 9999px   — Avatars, toggle switches
```

---

## 5. Elevation / Shadow Approach

**Philosophy:** NO box shadows — depth from background contrast and subtle borders. 
TradeWitness relies on flat, crisp surfaces.

3-level elevation system:
- **Level 0 (page):** `--background`
- **Level 1 (card):** `--card` with 1px solid `--border`.
- **Level 2 (modal):** `--card-alt` with 1px solid `--border`.

---

## 6. Component Patterns

### Cards
```css
Background:    var(--card)
Padding:       24px
Border radius: 8px
Border:        1px solid var(--border)
Hover:         border-color var(--ring), transition 150ms ease
```

### Buttons
```css
Primary:   bg var(--primary), text var(--primary-fg), radius 6px, padding 8px 16px
           Hover: brightness 110%, transition 150ms
Secondary: bg transparent, border 1px var(--border), text var(--foreground)
           Hover: bg var(--card-alt), transition 150ms
Danger:    bg var(--destructive), text white
Ghost:     bg transparent, no border, text var(--muted)
           Hover: text var(--foreground), bg var(--card-alt)
Disabled:  opacity 0.5, cursor not-allowed
```

### Inputs
```css
Background:    var(--background)
Border:        1px solid var(--border)
Border radius: 4px
Padding:       8px 16px
Focus:         border-color var(--ring), outline none, ring 2px var(--ring)/20%
Placeholder:   var(--muted)
```

### Badges / Chips
```css
Padding:       8px 16px
Border radius: 9999px
Font:          12px, weight 500
Background:    var(--primary)/15%, text var(--primary)
```

---

## 7. Interactive States

**EVERY interactive element MUST have ALL of these states defined:**

| Element  | Default | Hover                   | Focus                     | Active        | Loading                 | Empty / Disabled        |
|----------|---------|-------------------------|---------------------------|---------------|-------------------------|-------------------------|
| Button   | normal  | brightness 110%         | ring 2px var(--ring)      | scale(0.98)   | spinner + opacity .5    | opacity .5, no-ptr      |
| Input    | normal  | border slightly lighter | ring 2px, border primary  | —             | skeleton / disabled     | bg muted, read-only     |
| Card     | normal  | border var(--ring)      | outline ring              | —             | skeleton shimmer        | empty state + CTA       |
| Link     | normal  | underline               | outline ring              | color primary | —                       | —                       |

Empty states: Every list/table/feed MUST have a designed empty state (icon + message + optional CTA).
Loading states: Use skeleton shimmer, NOT spinner unless action-triggered (like submitting a form).

---

## 8. Animation / Transitions

Philosophy: Purposeful, fast, not decorative.

```css
Base transition: 150ms ease
Hover effects:   brightness / subtle bg / border color
Fade in:         opacity 0 → 1, 200ms ease-out (modals)
Slide up:        translateY(8px) → 0, 200ms ease-out (toasts)
Skeleton:        shimmer 1.5s infinite linear
```

NEVER: Random animations, aggressive transitions > 300ms.

---

## 9. Accessibility

- Contrast: Body text on background ≥ 4.5:1.
- Keyboard navigation: ALL interactive elements reachable via Tab.
- Focus ring: Visible 2px solid var(--ring), offset 2px.
- ARIA labels required on icon-only buttons or ambiguous elements.

---

## 10. Format Declaration

```
Component library: Radix UI primitives + custom Tailwind (inspired by shadcn/ui)
CSS framework:     Tailwind CSS (v3 in apps/app, v4 in apps/landing)
Token system:      CSS custom properties
Icon set:          Lucide React
```

---

## 11. Anti-AI-slop Guards (Mandatory)

### Layout & composition
- **NO 2-column comparison blocks.** Forbidden patterns: "Without us / With us", "Before / After".
- **ASCII wireframe first.** Before generating UI code, produce an ASCII wireframe.
- **Generous spacing between sections.** Minimum 48px on desktop, 32px on mobile between major sections. Minimum 24px internal padding.

### Visual style
- **NO gradients on backgrounds, buttons, or hero blocks.** Use solid colors only.
- **Cards: NEVER heavy borders.** Use 1px border. Forbidden: `border: 2px+`, `border: 3px solid black`, double borders.
- **shadcn/ui MUST be customized.** Do not ship default slate/zinc out-of-box without applying the variables defined above.
- **M4 touched pages MUST remove legacy visual debt.** If a redesigned page imports child components with `shadow-*`, `box-shadow`, `bg-gradient-*`, `linear-gradient`, `rounded-2xl`, or `rounded-3xl`, update those child components as part of the same task instead of leaving the old look visible.

### UX-first thinking
- **User journey before visual style.** Think about who is on the page, what they want to do, and where the CTA is before coding.
- **Primary CTA must be above the fold.** Hero takes max 60vh.
- **Contrast ≥ 4.5:1 for body text always.** No light-gray text on white just because it looks "aesthetic".

> "Be a human designer so it doesn't look like AI. With design taste."
