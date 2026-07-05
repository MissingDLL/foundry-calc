# Theming

Three themes: `default` (purple-dark), `dark` (neutral dark), `light`. Single source of truth: `app/tokens.css`.

## How it works

`app/tokens.css` defines three `[data-theme="x"]` blocks, each with the full token set. `__applyTheme(name)` in `app/theme.js` does exactly three things:

1. `document.documentElement.dataset.theme = name` — flips the CSS scope, every `var(--color-*)` resolves instantly via the cascade.
2. `window.__sankeyColors = VIZ_PALETTES[name]` — the Sankey/Box viz palette (`null` means "use `VIZ_COLORS_DARK`" from `visualization.js`).
3. Re-renders the viz tab if visible, updates the theme-pill button/blob UI and legend swatches.

No CSS is injected at runtime. No inline styles are patched. If a component looks wrong in one theme, the fix is a token value in `tokens.css` or a missing `var(--color-*)` reference in the component — never a per-theme override block.

## Token categories

| Category | Tokens |
|---|---|
| Surfaces | `--color-bg-base`, `--color-bg-elevated`, `--color-bg-overlay`, `--color-surface-input` |
| Text | `--color-text-primary`, `--color-text-secondary`, `--color-text-disabled` |
| Accent / interactive | `--color-accent`, `--color-accent-hover`, `--color-accent-active-bg`, `--color-accent-inactive-bg`, `--color-interactive` |
| Semantic | `--color-danger`, `--color-success`, `--color-warning` |
| Borders | `--color-border`, `--color-border-focus` |
| Viz | `--color-viz-bg`, `--color-viz-tooltip-bg` |

Plus legacy aliases (`--accent`, `--bg`, `--bg2`, `--bg3`, `--panel`, `--border`, `--text`, `--text-dim`, `--warn`, `--highlight`) kept so old selectors in `styles.css` keep working. New code should reference the semantic `--color-*` names directly, not the aliases.

## Adding a new theme

Add one `[data-theme="yourname"]` block to `app/tokens.css` with the full token set (copy an existing block, change values), add a `VIZ_PALETTES.yourname` entry in `app/theme.js` (or `null` to reuse `VIZ_COLORS_DARK`), and add a theme-picker button in `index.html` with `data-theme="yourname"` and `onclick="__applyTheme('yourname')"`. Zero other files change.

## Rules for new components

- Never write a raw color literal (`#fff`, `rgba(...)`) in `app/*.js`. Reference a token: `element.style.background = 'var(--color-accent-active-bg)'`.
- Prefer CSS classes over inline styles for active/inactive state (see `.nav-btn--active`/`.nav-btn--inactive`, `.main-tab-btn--active`/`--inactive` in `styles.css`) — but a direct `var(--color-*)` inline assignment is an acceptable equivalent when a class adds no value (no other consumer).
- SVG elements drawn by D3 read `window.__sankeyColors || VIZ_COLORS_DARK` **at draw time** inside `_drawSankey`/`_drawBoxes`, never cached at module load — this is what makes the viz theme-reactive without CSS attribute-selector hacks.
- A handful of small fixed-color "stat badge" chips (machine efficiency/speed pills, warning/danger micro-badges) intentionally stay hardcoded — there's no token for a translucent themed badge surface yet. Each is marked with a `ponytail:` comment at the site. If you add enough of these to justify it, add proper `--color-badge-*` tokens instead of more one-off literals.

## Regression check

`node scripts/check-theme-tokens.js` — verifies all three `[data-theme]` blocks define the same token set, and scans `app/ui-*.js` + `visualization.js` for raw color literals outside the documented exceptions. Run it after touching any UI component or the token file. Exit code 1 + stderr lines on failure.

## Known browser limitation

`<select>` dropdown *option list* styling (the popup itself) is controlled by the OS/browser, not CSS — only the closed `<select>` box is themeable. `color-scheme: light`/`dark` is set per theme in `tokens.css` so native chrome (scrollbars, etc.) still adapts as far as the browser allows.
