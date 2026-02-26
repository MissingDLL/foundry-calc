# Foundry Calculator

A browser-based production planner for the game **[Foundry](https://store.steampowered.com/app/983870/Foundry/)**. Calculates machine counts, material requirements, and raw resource needs for arbitrarily complex production chains — with interactive Sankey and box-flow visualizations.

**Live:** https://missingdll.github.io/foundry-calc/

---

## Features

- Recipe selection from a complete game database (~200 recipes)
- Configurable production target in units/minute
- Machine selection and variant support (Tier 1/2/3)
- Recursive resolution down to raw materials (mine output)
- Workstation bonuses (efficiency and speed bots)
- Global research productivity bonuses (Mining, Fluid)
- Sankey diagram (material flow visualization)
- Box diagram (topological production chain)
- 3 themes: Default (Purple), Dark (Apple Black), Light
- Sidebar with bot/recipe browser and inline search

---

## Architecture

### Overview

```
Vanilla JavaScript (ES2015+) · D3.js v7 · HTML5/CSS3
No build tools · No framework · No backend
```

This is a **client-side Single-Page Application**. All data is static and bundled with the code. State lives in browser RAM — nothing is persisted except theme and sidebar preferences (via `localStorage`).

### Data Flow

```
User selects a recipe
  └─ toggleRecipeFromGrid()        [ui-recipes.js]
       └─ addRecipeItem()           → selectedRecipeList[]
            └─ renderSelectedRecipes()    [ui-recipes.js]

User clicks "Calculate"
  └─ calculateRecipes()            [calculation.js]
       ├─ Compute machine counts per recipe
       ├─ Accumulate direct ingredient totals
       ├─ resolveToGround() (recursive)
       │    └─ → Raw material requirements
       ├─ Render 3 result tables (HTML)
       └─ buildSankeyGraph() → renderSankey() / renderBoxes()
```

### State Management

There is **no central state container**. State consists of global variables in `state.js`, read and mutated directly by all modules:

| Variable | Type | Contents |
|---|---|---|
| `selectedRecipeList` | Array | Selected recipes with goal, machine, workstation config |
| `recipeSettings` | Object | Machine override per recipe |
| `variantSettings` | Object | Tier preference per item group |
| `minerSettings` | Object | Mining machine preference per ore group |
| `botEfficiencyOverrides` | Object | Manual efficiency override per bot |
| `globalMiningProductivity` | Number | % bonus for Crusher recipes |
| `globalFluidProductivity` | Number | % bonus for fluid machines |
| `workstationConfigs` | Object | Workstation config per machine category |

### Script Load Order (critical)

Scripts must be loaded in this exact order — each module depends on globals defined by the previous ones:

```html
<script src="app/theme.js"></script>         <!-- 1. Theme system (no deps) -->
<script src="data/game-data.js"></script>    <!-- 2. M, I, CAT constants -->
<script src="data/icons.js"></script>        <!-- 3. Icon maps (no deps) -->
<script src="data/recipes.js"></script>      <!-- 4. RECIPES (needs M, I, CAT) -->
<script src="app/state.js"></script>         <!-- 5. State + validation (needs RECIPES, M, I) -->
<script src="app/ui-settings.js"></script>   <!-- 6. Settings UI (needs state) -->
<script src="app/ui-recipes.js"></script>    <!-- 7. Recipe UI (needs state, RECIPES) -->
<script src="app/calculation.js"></script>   <!-- 8. Calculation engine (needs state, RECIPES) -->
<script src="app/ui-nav.js"></script>        <!-- 9. Navigation (needs UI modules) -->
<script src="app/visualization.js"></script> <!-- 10. D3 rendering (needs state, calculation) -->
```

---

## Installation & Setup

### Running Locally

The project requires **no build step** and **no package installation**. However, a local HTTP server is needed because browsers block loading images from subdirectories when opening HTML files via the `file://` protocol.

```bash
# Clone the repo
git clone https://github.com/MissingDLL/foundry-calc.git
cd foundry-calc

# Start a local server (Python, always available)
python3 -m http.server 8080

# Open in browser
http://localhost:8080
```

Alternative servers:
```bash
npx serve .          # Node.js
# or use VS Code's Live Server extension
```

> **Why not just open `index.html` directly?** Chrome/Chromium blocks loading images from subdirectories (`icons/`) over the `file://` protocol. A local server bypasses this. Firefox is more permissive but a server is the reliable solution.

---

## Project Structure

```
foundry-calc/
│
├── index.html              # Markup, layout, embedded D3 + d3-sankey
├── styles.css              # All styles (CSS variables, components, animations)
│
├── app/                    # Application logic
│   ├── theme.js            # Theme system (3 themes, CSS variables, blob animation)
│   ├── state.js            # Global state, configuration constants, helper functions
│   ├── calculation.js      # Calculation engine (machines, ingredients, raw materials)
│   ├── ui-recipes.js       # Recipe browser, selection list, inline search
│   ├── ui-settings.js      # Settings modal (machines, variants, productivity)
│   ├── ui-nav.js           # Tab navigation, sidebar toggle, number formatting
│   └── visualization.js    # D3 Sankey + box-flow diagram
│
├── data/                   # Game data (static, never modified at runtime)
│   ├── game-data.js        # Constants: M (machines), I (items), CAT (categories)
│   ├── icons.js            # Icon path maps + getIcon() function
│   └── recipes.js          # RECIPES object (~200 recipes, ~5400 lines)
│
└── icons/                  # PNG icons (48×48) for all items and machines
```

---

## Theme System

### How It Works

The theme system in `app/theme.js` is built entirely on **CSS Custom Properties** (`--accent`, `--bg`, `--panel`, etc.) that are set dynamically on the `:root` element at runtime. No CSS-in-JS, no preprocessor, no framework.

### Technical Flow of `__applyTheme(name)`

1. **Reset**: Remove all CSS variables of all themes from `:root`
2. **Apply**: Set new theme variables via `document.documentElement.style.setProperty(key, value)`
3. **Inject extra CSS**: Create/update `<style id="__theme-extra-css">` with theme-specific overrides (background gradients, font overrides, etc.)
4. **Update UI**: Mark active theme button, animate blob indicator to active position
5. **Update D3**: Set `window.__sankeyColors` with theme-appropriate palette
6. **Re-render**: Call `window.__renderSankey()` if Sankey tab is currently visible
7. **Update legend**: Update color swatches in the visualization legend
8. **Cleanup**: Remove `theme-switching` class from body after 500ms

### Theme Object Structure

```javascript
const THEMES = {
  default: {
    vars: { '--accent': '#a855f7', '--bg': '#05000f', ... },
    css: null  // No extra CSS for default theme
  },
  dark: {
    vars: { '--accent': '#0a84ff', '--bg': '#000000', ... },
    css: `body { background: #000000 !important; ... }`  // Apple-style dark mode
  },
  light: {
    vars: { '--accent': '#007aff', '--bg': '#f5f5f7', ... },
    css: `body { background: #f5f5f7 !important; ... }`  // Apple-style light mode
  }
}
```

### CSS Custom Properties Reference

| Variable | Description |
|---|---|
| `--accent` | Primary accent color (buttons, active elements) |
| `--accent2` | Secondary accent (warnings, destructive actions) |
| `--accent3` | Tertiary accent (success, positive values) |
| `--bg` / `--bg2` / `--bg3` | Background layers (dark → slightly lighter) |
| `--panel` | Panel / card background |
| `--border` | Border color |
| `--text` / `--text-dim` | Primary and secondary text |
| `--warn` | Warning color (yellow) |
| `--highlight` | Hover highlight |

### Where Theme State Lives

**Nowhere persistent.** On page reload the default theme is always applied. The active theme is only encoded in:
- Which button has the `active-theme` class
- Which CSS variables are currently set on `:root`

To add persistence, add `localStorage.setItem('theme', name)` in `__applyTheme()` and restore on load.

### Known Issues

- **No persistence**: Theme resets to default on reload
- **Color palette duplication**: Sankey colors are defined in three places (`THEMES`, `_drawBoxes`, `_drawSankey`) — a single source of truth is missing
- **`!important` inflation**: Theme CSS overrides require `!important` throughout, making debugging harder

---

## Sankey & D3 Integration

### What is the Sankey Diagram?

The Sankey diagram is a flow visualization where the **width of each link** is proportional to the flow rate (items/min). It shows how raw materials flow through intermediate products to final outputs.

### Libraries Used

Both D3 libraries are **embedded inline** in `index.html` — no CDN, works offline:

- **D3.js v7** (~7KB minified): General purpose data visualization library. Used for SVG rendering, zoom/pan behavior, and the sankey layout algorithm
- **d3-sankey v0.12.3**: D3 plugin that computes node positions and link paths for Sankey diagrams

### Data Structure (`buildSankeyGraph()`)

```javascript
{
  nodes: [
    {
      label: "Xenoferrite Ore",   // Display name
      rate: 120,                   // Total flow through this node (items/min)
      kind: "raw",                 // "raw" | "mid" | "final"
      machineCount: 4,             // Aggregated machine count
      machineName: "Crusher I"     // Machine producing this item
    }
  ],
  links: [
    {
      source: 0,   // Node index
      target: 2,
      value: 60    // Flow rate (items/min)
    }
  ]
}
```

### Node Types and Colors

| Kind | Meaning | Default Color |
|---|---|---|
| `raw` | Mined/source materials (no ingredients) | Green |
| `mid` | Intermediate products | Blue |
| `final` | Target products being produced | Orange |

Colors are defined in `app/visualization.js` → `const COLOR` and can be overridden per theme via `window.__sankeyColors`.

### Graph Construction Algorithm (`buildSankeyGraph()`)

The graph is built by recursive expansion (`expand(itemName, rateNeeded, depth)`):

1. Start from each item in `selectedRecipeList` → mark as `final` nodes
2. For each ingredient: recursively call `expand()`
3. Leaf nodes with no recipe in the database → mark as `raw`
4. Nodes with recipes but not in `selectedRecipeList` → mark as `mid`
5. Add a directed edge (link) from each ingredient to its consumer

Duplicate nodes are merged: if the same item appears in multiple production chains, its rates are summed.

### Sankey Rendering (`_drawSankey`)

```
D3 sankey layout
  ├─ nodeWidth: 18px
  ├─ nodePadding: 16px
  ├─ iterations: 6 (relaxation passes for node positioning)
  └─ Extent: [0,0] → [containerWidth, containerHeight]

Output:
  ├─ Links: SVG paths (d3.sankeyLinkHorizontal), opacity 0.18 → 0.55 on hover
  ├─ Node bars: vertical rectangles, colored by kind
  └─ Info cards: foreignObject elements beside each node
       └─ Show: item icon, machine icon, machine count, rate (items/min)
```

- **Pan + Zoom**: D3 zoom behavior, range 0.15× – 4×
- **Tooltips**: Hover over links shows "Source → Target: X /min"
- **Theme-aware**: Re-renders with new colors on theme switch

### Box Diagram Rendering (`_drawBoxes`)

An alternative visualization using a custom layout algorithm instead of D3's sankey:

1. **BFS traversal** from source nodes (nodes with no incoming edges)
2. **Depth assignment**: each node gets depth = length of longest path to reach it
3. **Column grouping**: nodes at same depth form a visual column
4. **Bezier curves**: connect boxes with curved SVG paths, labeled with flow rate

Box dimensions: `140×64px`, column gap: `110px`, row gap: `24px`.

### Lazy Rendering

Both visualizations use **dirty flags** to avoid re-rendering hidden tabs:

```javascript
let _sankeyDirty = false;
let _boxesDirty = false;
```

When `calculateRecipes()` runs while the visualization tab is hidden, the dirty flag is set. When the user switches to the visualization tab, `switchMainTab()` detects the dirty flag and triggers a render.

---

## CSS Structure

### Organization of `styles.css`

1. CSS Custom Properties (`:root`) — all theme variables with defaults
2. Reset / base styles
3. Layout: `.container` (2-column grid), `header`, `main`
4. Sidebar and collapsible panels
5. Result tables and summary boxes
6. Forms, inputs, buttons, selects
7. Modals and overlays
8. Visualization containers (SVG, tooltips, legend)
9. `@keyframes` animation definitions

### Where to Make Changes

| Goal | Location |
|---|---|
| Color across all themes | `styles.css` → `:root` CSS variable |
| Color in a specific theme | `app/theme.js` → `THEMES.dark.vars` |
| Layout / grid | `styles.css` → `.container` |
| New animation | `styles.css` → new `@keyframes` + class |
| Sankey / box colors | `app/visualization.js` → `const COLOR` |

### Best Practices — Followed

- CSS Custom Properties for all colors ✓
- Consistent border-radius scale (`--radius-lg/md/sm`) ✓
- Transitions on all interactive elements ✓
- `backdrop-filter` for glass morphism effects ✓

### Best Practices — Violated

- **Excessive `!important`**: Unavoidable due to theme override system, but makes debugging harder
- **No scoping**: All class names are global — collision risk when extending
- **No mobile breakpoints**: Fixed 360px sidebar, not responsive
- **Specificity conflicts**: Inline styles in JS-generated templates override CSS rules

---

## File Reference

### `index.html`

Contains:
- Google Fonts import (Share Tech Mono, Rajdhani)
- D3 v7 (inline, minified)
- d3-sankey plugin (inline, minified)
- Complete HTML markup
- Initialization script: `buildRecipeCategoryList()`, `initRecipeCalc()`, `renderSelectedRecipes()`

Key element IDs: `#sidebar`, `#tab-recipes`, `#tab-sankey`, `#tab-boxes`, `#selectedRecipes`, `#calcResults`, `#recipeSettingsOverlay`, `#recipePickerOverlay`

---

### `app/calculation.js`

**Core production formula:**

```
cyclesPerMin    = 60 / cycleTime
outputPerMin    = cyclesPerMin × outputAmount
                  × (1 + efficiency/100)
                  × (1 + miningBonus/100 + fluidBonus/100 + wsBonus)

machinesNeeded  = ceil(goal / outputPerMin)
actualOutput    = machinesNeeded × outputPerMin
overproduction  = actualOutput - goal
```

**Ingredient calculation:**
```
ingredientsPerMin = (60 / cycleTime) × ingredientAmount × machinesNeeded
```

**Recursive raw material resolution** (`resolveToGround`):
- Maximum depth: 20 levels (hardcoded safety cap)
- No cycle detection — recipe graph is assumed to be acyclic
- Terminates when an item has no recipe (raw material) or no ingredients

---

### `app/state.js`

Key functions:

| Function | Description |
|---|---|
| `resolveRecipeName(name)` | Resolves canonical name to actual recipe key, respecting variant preferences |
| `getVariantsFor(name)` | Returns all recipe variants for an item group |
| `calcWsBonusForMachine(machine, config)` | Computes workstation bonus multiplier: `(eff + speed) × (chargedCore ? 1.33 : 1) / 100` |
| `getItemWsBonus(item)` | Returns workstation bonus for a recipe item (uses per-item override or global config) |
| `buildRecipeCategoryList()` | Generates the bot selection grid in the sidebar |
| `getPreferredMachine(recipeName)` | Returns the user's preferred machine for a recipe |

---

### `data/game-data.js`

Exports (global): `M`, `I`, `CAT` — all frozen with `Object.freeze()`.

- **`M`**: 27 machine constants (e.g. `M.ASSEMBLER_I = "Assembler I"`)
- **`I`**: 140+ item constants (e.g. `I.XENOFERRITE_ORE = "Xenoferrite Ore"`)
- **`CAT`**: 7 category constants (e.g. `CAT.METALLURGY = "Metallurgy"`)

Using frozen objects ensures that typos in recipe definitions produce a clear `undefined` rather than silently creating a new property. The startup validation in `state.js` catches these at load time.

---

### `data/recipes.js`

Exports (global): `RECIPES`

**Recipe data structure:**

```javascript
"Item Name": {
  category: CAT.METALLURGY,
  ingredients: [
    { item: I.XENOFERRITE_ORE, amount: 2 }
  ],
  output: { amount: 1 },
  // or multi-output with byproducts:
  output: [
    { item: I.MAIN_OUTPUT, amount: 3 },
    { item: I.BYPRODUCT,   amount: 1, chance: 0.5 }
  ],
  machines: {
    [M.SMELTER_SMALL]:    { cycleTime: 4 },   // seconds per cycle
    [M.ADVANCED_SMELTER]: { cycleTime: 2 }    // faster alternative
  },
  efficiency: 10,                              // optional: base efficiency bonus (%)
  workstation_effect: {                        // optional: bot workstation effect
    applies_to: ["Assemblers"],
    machine_efficiency: 10,
    machine_speed: 5,
    power_consumption_kw: 0,
    exempt: [M.FLUID_ASSEMBLER_I]
  }
}
```

---

### `data/icons.js`

Exports (global): `ICON_ALIASES`, all `*_ICONS` maps, `getIcon()`

**`getIcon(name, size = 28, isBot = false)` → HTML string**

1. Merge all icon sets via `Object.assign({}, BOT_ICONS, BUILDING_ICONS, ...)`
2. Look up `name` in merged map
3. If not found, check `ICON_ALIASES` for a fallback name and retry
4. Return `<img src="icons/..." style="...">` or an empty placeholder `<div>`

---

### `app/visualization.js`

Exports (global): `buildSankeyGraph()`, `renderSankey()`, `renderBoxes()`

Sets: `window.__renderSankey` — called by `theme.js` on theme change to re-render with new colors.

---

### `app/ui-nav.js`

Key utility: `fmt(n)` — formats numbers for German locale:
- `0` → `"-"`
- Integer → `1.234`
- Decimal → `1.234,56`

Sidebar state is persisted: `localStorage['sidebarCollapsed']`.

---

## Development Workflow

### Add a New Recipe

In `data/recipes.js`:
```javascript
"New Item": {
  category: CAT.COMPONENTS,
  ingredients: [{ item: I.XENOFERRITE_ORE, amount: 2 }],
  output: { amount: 1 },
  machines: { [M.ASSEMBLER_I]: { cycleTime: 5 } }
}
```

The startup validation in `state.js` will warn in the browser console if any item/machine key is unknown.

### Add a New Icon

1. Place PNG (48×48) in `icons/New_Item.png`
2. Register in `data/icons.js`:
```javascript
const COMPONENTS_ICONS = {
  "New Item": "icons/New_Item.png",
};
```

### Customize a Theme

In `app/theme.js` → `THEMES.default.vars`:
```javascript
'--accent': '#new-color',
```

For theme-specific CSS overrides:
```javascript
THEMES.dark.css = `
  .my-element { background: #000 !important; }
`;
```

---

## Known Issues & Improvement Potential

### Short-term (low effort)

| Issue | Fix |
|---|---|
| Theme not persisted on reload | Add `localStorage.setItem('theme', name)` in `__applyTheme()` |
| No input validation on goal fields | Add `min="0"` and bounds checking |
| No export functionality | JSON export of production plans via `JSON.stringify(selectedRecipeList)` |
| Sankey color triple-definition | Reference colors from `THEMES` object in `_drawBoxes` / `_drawSankey` |
| No cycle detection in recursion | Implement visited-set check in `resolveToGround()` |

### Medium-term

- **Mobile responsive**: Sidebar as a drawer overlay instead of fixed column
- **URL state**: Serialize selected recipes + settings as URL params (shareable links)
- **Save/load plans**: Persist production plans in `localStorage`

### Architectural

- **Event system**: Replace direct cross-module function calls with a minimal EventEmitter
- **Component pattern**: One template function per UI unit instead of inline HTML strings
- **Dependency injection**: Explicitly pass dependencies instead of relying on global scope

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Images not loading | `file://` protocol blocks subdirectory access | Start a local server: `python3 -m http.server 8080` |
| `ReferenceError: X is not defined` | Wrong script load order or missing script tag | Check order in `index.html` |
| Sankey shows no data | Lazy rendering — tab was inactive during calculation | Switch to the Visualization tab to trigger render |
| Calculation stops at deep chains | Recursion depth cap (20 levels) reached | Increase `maxDepth` in `resolveToGround()` in `calculation.js` |
| Theme colors wrong after changes | Inline styles in JS templates override CSS variables | Add `!important` or use more specific selector in theme CSS |

---

## Design Decisions

| Decision | Rationale |
|---|---|
| No framework (React/Vue/etc.) | Zero overhead, no build pipeline, deployable as static files |
| No build tool | Open directly with local server, no Node.js dependency |
| Global variables instead of ES modules | `type="module"` does not work with `file://` protocol; classic scripts are simpler |
| D3 embedded inline | No CDN dependency, works fully offline |
| CSS Custom Properties for theming | Native browser support, no preprocessor needed |
| German UI language | Target audience is German-speaking |
