# SDSCPA Design & Production — Brand Style Guide

A generic, project-agnostic style guide for the **SDSCPA Design & Production** identity. Paste this into any new Claude project (Project instructions, CLAUDE.md, or system prompt) to make a brand-new tool, site, dashboard, or app look and feel like it belongs to the same family — without any assumption that it's a "virtual lab."

## 1. Identity

- **Program name:** SDSCPA — Design & Production
- **Wordmark:** the letters "SDSCPA" set in `Arial Black` / `Arial Narrow Bold` (fallback `Arial, sans-serif`), `font-weight:900`, tight `letter-spacing:-1.5px`, filled with the rainbow brand gradient (Section 2). Always build it as an inline SVG `<text>` element rather than a raster/PNG logo, so it stays crisp and themeable.
- **Favicon:** a rounded-square tile (`rx` ≈ 22% of the tile size) filled with the rainbow gradient, with a bold white initial letter centered on it — build as a data-URI SVG, no external image file needed.
- **Tagline treatment:** short, all-caps, wide letter-spacing (`letter-spacing:3px`, `font-size:11px`, `text-transform:uppercase`, `color:var(--text-dim)`), placed directly beneath the wordmark. Swap the words per project (e.g. "DESIGN & PRODUCTION" plus whatever the new project does), but keep the same visual treatment.
- **Brand anchor:** the rainbow gradient stripe. Use it sparingly but consistently — as the underline beneath a header, a thin footer strip, a progress-bar fill, or an accent line on printed documents. It's the one element that should appear in every SDSCPA project, however small.

## 2. Color system

Define these exact CSS custom properties on `:root` in every new project. Keep the variable **names** identical across projects (even if a project needs to add a few of its own) so shared snippets and components port over without edits.

```css
:root{
  --ui-dark:#0a0a0a;      /* page background */
  --ui-dark2:#1a1a1a;     /* card / panel background */
  --ui-dark3:#333333;     /* borders, dividers */
  --accent:#3b82f6;       /* primary interactive blue */
  --violet:#8b5cf6;       /* secondary accent */
  --amber:#fbbf24;        /* warnings / caution / secondary CTA */
  --ok:#22c55e;           /* success / confirmation */
  --bad:#ef4444;          /* errors / destructive actions */
  --text-light:#f0f0f0;   /* primary text on dark background */
  --text-dim:#888888;     /* secondary / meta text */
  --mono:'SF Mono','Cascadia Mono','Consolas',ui-monospace,monospace;
  --rainbow:linear-gradient(90deg,#7AC143,#F7941E,#ED1C45,#EC008C,#92278F,#2E3192,#00AEEF);
}
```

**The rainbow gradient**, left to right, is the fixed brand palette — treat these seven hex values as reserved brand colors, not "pick any color":

`#7AC143` (green) → `#F7941E` (orange) → `#ED1C45` (red) → `#EC008C` (pink) → `#92278F` (purple) → `#2E3192` (indigo) → `#00AEEF` (cyan)

**Using accent colors in a new project:**
- The UI is dark-theme by default (`--ui-dark` background, `--text-light` text). Don't build a light-mode variant unless a project specifically needs one.
- `--accent` (blue) is the default interactive color for links, primary buttons, focus rings, and generic highlights when nothing more specific applies.
- When a project has multiple sections/categories/modules, assign each one a fixed color pulled from the rainbow stops above (not `--accent`) — pick unused stops first before reusing one. Apply it consistently to that section's borders, icon color, and a 16%-alpha tint (`rgba(r,g,b,.16)`) for backgrounds, exactly as shown below:
  ```html
  <div style="--section-accent:#00AEEF;--section-tint:rgba(0,174,239,.16)">
  ```
- `--ok` / `--bad` / `--amber` are reserved for semantic meaning only (success, error, warning) — never repurpose them as decorative section colors.

## 3. Typography

- **UI font:** `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif` — use for all on-screen interface text.
- **Monospace:** `'SF Mono','Cascadia Mono','Consolas',ui-monospace,monospace` — use for footers, timestamps, IDs, code, or any "technical readout" text.
- **Print / formal documents** (reports, certificates, exports): `Georgia, serif` — deliberately different from the on-screen UI font so printed output reads as an official document rather than a screenshot of the app.
- **Scale & weight conventions:**
  - Large headings: `font-weight:700–900`, no added letter-spacing.
  - "Eyebrow" labels / section heads: `text-transform:uppercase`, `letter-spacing:2–3px`, `font-size:10–11px`, `color:var(--text-dim)`.
  - Body copy: `12.5–14px`, `line-height:1.5–1.6`.
  - Body text color: never pure white — use a slightly softened light gray (`#a9adb4` to `#f0f0f0` depending on emphasis) against the near-black background for comfortable contrast.

## 4. Layout fundamentals

- **Reset:** `*{box-sizing:border-box;margin:0;padding:0}` and `html,body{min-height:100%}`.
- **Page background:** solid `var(--ui-dark)` plus two faint radial gradients for depth (adjust position per layout, keep the values):
  ```css
  background-image:
    radial-gradient(900px 480px at 50% -8%, rgba(59,130,246,.10), transparent 70%),
    radial-gradient(700px 420px at 90% 110%, rgba(139,92,246,.08), transparent 70%);
  ```
- **Header pattern:** centered content, generous top padding (~40–46px), wordmark → tagline → optional one-sentence description (max-width ~560px, centered), with a 2px rainbow-gradient strip along the bottom edge of the header.
- **Content width:** cap main content at `max-width:1000px` (widen for data-dense tools like dashboards or tables, but keep it centered with consistent side padding).
- **Panels / cards:** the general-purpose content container for any project (not just lab tiles) —
  ```css
  .panel{
    background:var(--ui-dark2);
    border:1px solid var(--ui-dark3);
    border-radius:14px;
    padding:20px 22px;
  }
  ```
  Add a 4px colored left accent bar when the panel belongs to a specific section/category (see Section 2), and a hover state (`translateY(-3px)`, border → accent color, soft shadow) only when the panel is itself clickable/navigational.
- **Footer:** centered, small rainbow strip (2px tall, ~120px wide, rounded), monospace text, dim color, one line: program name and project name.
- **Responsive:** collapse multi-column grids to a single column and shrink header padding/logo size below `520px` width.

## 5. Reusable components

- **Buttons (primary):** solid fill in `--accent` (or the active section's accent color), `border:none`, `border-radius:8–9px`, white bold text, `padding:9–14px 16–20px`. Hover: `filter:brightness(1.15)`. Disabled: `filter:grayscale(.8) brightness(.55)`, `cursor:not-allowed`.
- **Buttons (secondary/back):** transparent background, `1px solid var(--ui-dark3)` border, `color:var(--text-dim)`; on hover, text goes white and border brightens.
- **Buttons (destructive):** same shape as primary, filled with `--bad`.
- **Buttons (caution/retry):** filled with `--amber`, dark text (`#0a0a0a`) for contrast.
- **Badges / pills / chips:** `border-radius:999px`, tiny bold uppercase text (`font-size:9.5–11.5px`, `letter-spacing:.6px`), used for statuses, tags, and short labels. Neutral badges: `border:1px solid var(--ui-dark3)`, `color:var(--text-dim)`, `background:#000`. Success badges: solid `--ok` background with dark text.
- **Progress / meter bars:** dark track (`background:#000`, thin `--ui-dark3` border, `border-radius:99px`), fill uses the rainbow gradient (or a solid accent for a single-value meter), animated width transitions (`.4s ease`).
- **Forms/inputs:** dark fill matching `--ui-dark2` or darker (`#101014`), `1px solid var(--ui-dark3)` border, `border-radius:8–10px`, light text; focus/hover state brightens the border to `--accent` (or the section's accent).
- **Tables (incl. printed reports):** simple, no heavy borders — bottom-border-only rows, small uppercase gray column headers, generous row padding. On dark UI use `--ui-dark3` borders; on printed/serif output use plain black/gray borders on white.
- **Icons:** inline SVG only, never icon fonts or raster images. Convention: `viewBox="0 0 24 24"`, `stroke="currentColor"`, `stroke-width="1.7"`, rounded line caps/joins, no fill (outline style). Keep every icon in a project drawn in this same stroke style so the set feels unified.
- **Alerts/notices:** left-border accent (2px, colored by severity: `--bad`, `--amber`, `--ok`, or `--accent`), same panel background, no heavy fill — keep alerts feeling like part of the dark UI, not a jarring colored box.

## 6. Voice

- Direct, concrete, and skills/outcomes-oriented — say what the user can *do*, not just what the feature *is*.
- Short sentences. Avoid marketing fluff or exclamation points.
- Section/feature descriptions: one clear sentence on what it does, optionally followed by a short, specific outcome statement (first person works well for anything learner- or user-facing: "I can...").
- Printed/exported documents (reports, certificates, summaries) should read as formal artifacts — serif type, generous whitespace, minimal color (just the rainbow stripe as the brand mark) — even though the on-screen app is a dark, colorful UI.

## 7. Applying this to a brand-new (non-lab) project

1. Copy the `:root` CSS variable block from Section 2 verbatim into the new project's stylesheet — don't rename or drop variables.
2. Build the header using the wordmark + tagline + rainbow underline pattern from Section 4, swapping only the tagline text for what the new project does.
3. Use `--accent` as the default interactive color unless the project has multiple sections, in which case assign each section its own reserved rainbow-stop color per Section 2.
4. Reuse the button, badge, panel, and form patterns in Section 5 as-is rather than designing new ones — consistency across the SDSCPA project family matters more than novelty in any single project.
5. Keep the spacing/sizing scale consistent: `8px` button radius, `14px` panel radius, `999px` pill radius, `1000px` content max-width as the default.
6. If a decision isn't covered here, look at how an existing SDSCPA project solved it before inventing something new.
