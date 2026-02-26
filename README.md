# Foundry Calculator

Ein browserbasierter Produktionsplaner für das Spiel **[Foundry](https://store.steampowered.com/app/983870/Foundry/)**. Berechnet Maschinenanzahl, Materialbedarf und Rohstoffbedarf für beliebig komplexe Produktionsketten – mit interaktiver Sankey- und Box-Visualisierung.

**Live:** https://missingdll.github.io/foundry-calc/

---

## Features

- Rezeptauswahl aus vollständiger Spieldatenbank (~200 Rezepte)
- Zielproduktion in Einheiten/Minute konfigurierbar
- Maschinenauswahl und Variantenunterstützung (Tier 1/2/3)
- Rekursive Auflösung bis zu Rohstoffen (Minen-Output)
- Workstation-Boni (Effizienz- und Geschwindigkeitsbots)
- Globale Forschungs-Produktivitätsboni (Mining, Fluid)
- Sankey-Diagramm (Materialfluss-Visualisierung)
- Box-Diagramm (topologische Produktionskette)
- 3 Themes: Default (Purple), Dark (Apple Black), Light
- Sidebar mit Bot-/Rezept-Browser und Inline-Suche

---

## Architektur

### Überblick

```
Vanilla JavaScript (ES2015+) · D3.js v7 · HTML5/CSS3
Keine Build-Tools · Kein Framework · Kein Backend
```

Das Projekt ist eine **Single-Page Application ohne Server-Komponente**. Alle Daten sind statisch im Code. State wird im Browser-RAM gehalten (kein localStorage außer Theme/Sidebar-Präferenz).

### Datenfluss

```
Nutzer wählt Rezept
  └─ toggleRecipeFromGrid()      [ui-recipes.js]
       └─ addRecipeItem()         → selectedRecipeList[]
            └─ renderSelectedRecipes()  [ui-recipes.js]

Nutzer klickt "Berechnen"
  └─ calculateRecipes()          [calculation.js]
       ├─ Berechne Maschinenanzahl pro Rezept
       ├─ Akkumuliere direkte Zutaten
       ├─ resolveToGround() (rekursiv)
       │    └─ → Rohmaterial-Bedarf
       ├─ Rendere 3 Tabellen (HTML)
       └─ buildSankeyGraph() → renderSankey() / renderBoxes()
```

### State Management

Es gibt **keinen zentralen State-Container**. State besteht aus globalen Variablen in `state.js`, die direkt von allen Modulen gelesen und mutiert werden:

| Variable | Typ | Inhalt |
|---|---|---|
| `selectedRecipeList` | Array | Ausgewählte Rezepte mit Ziel, Maschine, WS-Config |
| `recipeSettings` | Object | Maschinenauswahl pro Rezept |
| `variantSettings` | Object | Tier-Präferenz pro Item-Gruppe |
| `minerSettings` | Object | Bergbaumaschine pro Erzgruppe |
| `botEfficiencyOverrides` | Object | Manuelle Effizienz-Überschreibung pro Bot |
| `globalMiningProductivity` | Number | % Bonus für Crusher-Rezepte |
| `globalFluidProductivity` | Number | % Bonus für Fluid-Maschinen |
| `workstationConfigs` | Object | Workstation-Konfiguration pro Maschinenkategorie |

### Ladereihenfolge (kritisch)

Scripts werden in dieser Reihenfolge geladen – Reihenfolge darf nicht geändert werden:

```html
<script src="app/theme.js"></script>         <!-- 1. Themes (keine Deps) -->
<script src="data/game-data.js"></script>    <!-- 2. M, I, CAT Konstanten -->
<script src="data/icons.js"></script>        <!-- 3. Icons (keine Deps) -->
<script src="data/recipes.js"></script>      <!-- 4. RECIPES (braucht M, I, CAT) -->
<script src="app/state.js"></script>         <!-- 5. State + Validation (braucht RECIPES, M, I) -->
<script src="app/ui-settings.js"></script>   <!-- 6. Settings-UI (braucht State) -->
<script src="app/ui-recipes.js"></script>    <!-- 7. Rezept-UI (braucht State, RECIPES) -->
<script src="app/calculation.js"></script>   <!-- 8. Kalkulation (braucht State, RECIPES) -->
<script src="app/ui-nav.js"></script>        <!-- 9. Navigation (braucht UI-Module) -->
<script src="app/visualization.js"></script> <!-- 10. D3 (braucht State, Kalkulation) -->
```

---

## Installation & Setup

### Voraussetzung

Einen lokalen HTTP-Server – Browser blockieren beim direkten Öffnen von `index.html` das Laden lokaler Unterordner-Ressourcen (Icons).

```bash
# Mit Python (überall verfügbar)
cd /path/to/foundry-calc
python3 -m http.server 8080
# Dann im Browser: http://localhost:8080

# Oder mit Node.js
npx serve .
```

> **Warum kein direktes Öffnen?** Das `file://`-Protokoll blockiert in Chrome/Chromium das Laden von Bildern aus Unterordnern (`icons/`). Firefox ist weniger restriktiv, aber ein lokaler Server ist die zuverlässigste Lösung.

---

## Projektstruktur

```
foundry-calc/
│
├── index.html              # Markup, Layout, eingebettetes D3 + d3-sankey
├── styles.css              # Alle Styles (CSS Variables, Komponenten, Animationen)
│
├── app/                    # Anwendungslogik
│   ├── theme.js            # Theme-System (3 Themes, CSS-Variablen, Blob-Animation)
│   ├── state.js            # State-Variablen, Konfiguration, Hilfsfunktionen
│   ├── calculation.js      # Berechnungs-Engine (Maschinen, Zutaten, Rohstoffe)
│   ├── ui-recipes.js       # Rezept-Browser, Auswahlliste, Inline-Suche
│   ├── ui-settings.js      # Settings-Modal (Maschinen, Varianten, Produktivität)
│   ├── ui-nav.js           # Tab-Navigation, Sidebar, Zahlenformatierung
│   └── visualization.js    # D3 Sankey + Box-Diagramm
│
├── data/                   # Spieldaten (statisch, nie zur Laufzeit modifiziert)
│   ├── game-data.js        # Konstanten: M (Maschinen), I (Items), CAT (Kategorien)
│   ├── icons.js            # Icon-Mappings + getIcon() Funktion
│   └── recipes.js          # RECIPES-Objekt (~200 Rezepte)
│
└── icons/                  # PNG-Icons (48x48) für alle Items und Maschinen
```

---

## Theme-System

### Wie es funktioniert

`app/theme.js` basiert auf **CSS Custom Properties**, die zur Laufzeit auf `:root` gesetzt werden.

#### Ablauf beim Theme-Wechsel (`__applyTheme(name)`)

1. Alle CSS-Variablen aller Themes von `:root` entfernen
2. Neue Variablen des gewählten Themes setzen: `document.documentElement.style.setProperty(key, value)`
3. `<style id="__theme-extra-css">` mit theme-spezifischen CSS-Overrides aktualisieren
4. Theme-Buttons: aktiven markieren, Blob animieren
5. `window.__sankeyColors` setzen → D3 Visualisierung aktualisieren
6. Sankey-Legende aktualisieren
7. Sankey neu rendern (wenn sichtbar)
8. Nach 500ms `theme-switching`-Klasse vom Body entfernen

#### CSS Custom Properties

| Variable | Beschreibung |
|---|---|
| `--accent` | Primäre Akzentfarbe |
| `--accent2` | Sekundäre Akzentfarbe |
| `--accent3` | Tertiäre Akzentfarbe (Erfolg) |
| `--bg` / `--bg2` / `--bg3` | Hintergrundabstufungen |
| `--panel` | Panel/Card-Hintergrund |
| `--border` | Rahmenfarbe |
| `--text` / `--text-dim` | Text-Abstufungen |
| `--warn` | Warnfarbe (gelb) |
| `--highlight` | Hover-Highlight |

#### Bekannte Einschränkungen

- **Kein Persistenz**: Theme wird beim Neuladen nicht gespeichert (localStorage wäre trivial hinzuzufügen)
- **Sankey-Farb-Duplizierung**: Farbpalette ist teilweise dreifach definiert (THEMES, `_drawBoxes`, `_drawSankey`)

---

## CSS-Struktur

### Organisation von `styles.css`

1. CSS Custom Properties (`:root`) – alle Theme-Variablen
2. Reset / Base
3. Layout (`.container` Grid, `header`, `main`)
4. Sidebar und Panels
5. Tabellen und Ergebnisdarstellung
6. Formulare und Controls
7. Modals und Overlays
8. Visualisierungscontainer
9. `@keyframes` Animationen

### Wo Änderungen vornehmen

| Ziel | Ort |
|---|---|
| Farbe (alle Themes) | `styles.css` → `:root` CSS-Variable |
| Farbe (spezifisches Theme) | `app/theme.js` → `THEMES.dark.vars` |
| Layout | `styles.css` → `.container` |
| Sankey-Farben | `app/visualization.js` → `const COLOR` |

### Kritisch: `!important`

Theme-Overrides verwenden extensiv `!important`. Das ist durch das CSS-Variablen-Override-System bedingt, macht aber Debugging schwieriger. Bei neuen Stilen Spezifität prüfen.

---

## Datei-Referenz

### `app/calculation.js` – Berechnungsformel

```
opm = (60 / cycleTime) × outputAmount
        × (1 + efficiency/100)
        × (1 + miningBonus/100 + fluidBonus/100 + wsBonus)

machinesNeeded = ceil(goal / opm)
```

Rekursive Rohstoffauflösung (`resolveToGround`) bis max. 20 Ebenen tief. Keine Zirkelerkennung – RECIPES-Graph wird als azyklisch angenommen.

### `app/state.js` – Wichtige Funktionen

| Funktion | Beschreibung |
|---|---|
| `resolveRecipeName(name)` | Kanonischer Name → tatsächlicher Rezept-Key (Varianten) |
| `getVariantsFor(name)` | Alle Rezept-Varianten für eine Item-Gruppe |
| `calcWsBonusForMachine(machine, config)` | Workstation-Bonus-Multiplikator berechnen |
| `getItemWsBonus(item)` | Workstation-Bonus für ein Rezept-Item |
| `buildRecipeCategoryList()` | Bot-Auswahl-Grid generieren |

### `data/recipes.js` – Datenstruktur

```javascript
"Item Name": {
  category: CAT.METALLURGY,
  ingredients: [{ item: I.ORE, amount: 2 }],
  output: { amount: 1 },               // oder Array für Nebenprodukte
  machines: {
    [M.SMELTER_SMALL]: { cycleTime: 4 },
    [M.ADVANCED_SMELTER]: { cycleTime: 2 }
  },
  efficiency: 10,                      // Optional: Basis-Effizienzbonus %
  workstation_effect: { ... }          // Optional: Bot-Effekt
}
```

---

## Entwicklungsworkflow

### Neues Rezept hinzufügen

`data/recipes.js`:
```javascript
"Neues Item": {
  category: CAT.COMPONENTS,
  ingredients: [{ item: I.XENOFERRITE_ORE, amount: 2 }],
  output: { amount: 1 },
  machines: { [M.ASSEMBLER_I]: { cycleTime: 5 } }
}
```

### Neues Icon hinzufügen

1. PNG (48×48) nach `icons/Neues_Item.png` kopieren
2. In `data/icons.js` eintragen:
```javascript
const COMPONENTS_ICONS = {
  "Neues Item": "icons/Neues_Item.png",
};
```

### Theme anpassen

`app/theme.js` → `THEMES.default.vars`:
```javascript
'--accent': '#neuefarbe',
```

---

## Verbesserungspotential

### Kurzfristig

- **Theme-Persistenz**: `localStorage.setItem('theme', name)` in `__applyTheme()`
- **Input-Validierung**: Min/Max-Grenzen auf Ziel-Inputs
- **Export**: JSON-Export der Produktionspläne
- **Zirkelerkennung**: In `resolveToGround()` statt nur Tiefenbegrenzung
- **Sankey-Farben konsolidieren**: Eine Farbdefinition statt drei

### Mittelfristig

- **Mobile Responsive**: Sidebar als Drawer
- **URL-State**: Produktionspläne als Sharing-Link serialisieren
- **Speichern/Laden**: Pläne in localStorage

### Architektonisch

- **Event-System**: Statt direkter Funktionsaufrufe zwischen Modulen
- **Komponenten-Pattern**: Template-Funktion pro UI-Einheit

---

## Troubleshooting

| Problem | Ursache | Lösung |
|---|---|---|
| Bilder nicht sichtbar | `file://`-Protokoll blockiert Unterordner | `python3 -m http.server 8080` starten |
| `ReferenceError: X is not defined` | Script-Ladereihenfolge falsch | Reihenfolge in `index.html` prüfen |
| Sankey zeigt keine Daten | Lazy-Rendering (Tab war inaktiv) | Auf "Visualisierung" Tab wechseln |
| Berechnungsfehler bei tiefen Ketten | Rekursionstiefe-Cap (20) erreicht | `maxDepth` in `calculation.js` erhöhen |

---

## Technische Entscheidungen

| Entscheidung | Begründung |
|---|---|
| Kein Framework | Minimaler Overhead, keine Build-Pipeline, einfaches Deployment |
| Kein Build-Tool | Direktes Öffnen möglich, keine Node.js-Abhängigkeit |
| Globale Variablen statt ES-Module | `type="module"` funktioniert nicht mit `file://`-Protokoll |
| D3 inline embedded | Kein CDN nötig, funktioniert offline |
| CSS Custom Properties | Browser-native Theme-Unterstützung ohne Präprozessor |
