// ============================================================
// app/theme.js
// ============================================================
// Three visual themes: default (purple-dark), dark (grey-dark), light.
//
// Colors live entirely in app/tokens.css as [data-theme="x"] custom
// properties. This file only:
//   1. sets document.documentElement.dataset.theme = name
//   2. sets window.__sankeyColors from VIZ_PALETTES
//   3. toggles the .active-theme class + slides the blob indicator
//   4. re-renders the visualization if it is currently visible
//
// Called from:
//   index.html       – onclick="__applyTheme('default')" etc.
//   visualization.js – reads window.__sankeyColors at draw time
// ============================================================

// Sankey/box palette per theme. null means "use VIZ_COLORS_DARK"
// (defined in visualization.js) — the default and dark themes share it.
const VIZ_PALETTES = {
  default: null,
  dark:    null,
  light: {
    raw:       { fill: 'rgba(52,199,89,0.38)',   stroke: '#1e7a30', text: '#0e4a1a', card: 'rgba(255,255,255,0.95)', cborder: 'rgba(52,199,89,0.55)'  },
    mid:       { fill: 'rgba(0,122,255,0.30)',   stroke: '#0050b3', text: '#002e80', card: 'rgba(255,255,255,0.95)', cborder: 'rgba(0,122,255,0.50)'  },
    final:     { fill: 'rgba(255,159,10,0.38)',  stroke: '#b36000', text: '#6b3800', card: 'rgba(255,255,255,0.95)', cborder: 'rgba(255,159,10,0.55)' },
    byproduct: { fill: 'rgba(180,140,0,0.35)',   stroke: '#7a5800', text: '#4a3200', card: 'rgba(255,255,255,0.95)', cborder: 'rgba(180,140,0,0.45)'  },
    sink:      { fill: 'rgba(200,60,150,0.32)',  stroke: '#8a2070', text: '#580040', card: 'rgba(255,255,255,0.95)', cborder: 'rgba(200,60,150,0.45)' },
    link:      'rgba(0,80,180,0.45)',
  },
};

// Toggles .active-theme on the pill buttons. Colors are CSS-driven
// (see .__theme-icon-btn.active-theme svg in styles.css) — this only
// manages the class, never sets a color directly.
function _updateThemeButtons(name) {
  document.querySelectorAll('.__theme-btn').forEach(btn => {
    btn.classList.toggle('active-theme', btn.dataset.theme === name);
  });
}

// Slides the floating blob indicator behind the active theme icon button.
function _updateBlobIndicator(name) {
  const activeBtn = document.querySelector(`.__theme-icon-btn[data-theme="${name}"]`);
  const blob = document.getElementById('themeBlobIndicator');
  if (activeBtn && blob) {
    blob.style.transform = `translateX(${activeBtn.offsetLeft}px)`;
    blob.style.top = activeBtn.offsetTop + 'px';
  }
}

// Updates the Sankey legend swatches to match the active palette.
// Falls back to window.__vizDefaultColors (set by visualization.js).
function _updateLegendSwatches() {
  const legendPalette = window.__sankeyColors || window.__vizDefaultColors;
  if (!legendPalette) return;
  const keys = ['raw', 'mid', 'final', 'byproduct', 'sink']; // same order as the legend spans
  ['sankeyLegend', 'boxesLegend'].forEach(id => {
    const legend = document.getElementById(id);
    if (!legend) return;
    legend.querySelectorAll(':scope > span').forEach((outerSpan, i) => {
      const key = keys[i];
      if (!key || !legendPalette[key]) return;
      outerSpan.style.color = legendPalette[key].text;
      const swatch = outerSpan.querySelector('span');
      if (swatch) {
        swatch.style.background = legendPalette[key].fill;
        swatch.style.borderColor = legendPalette[key].stroke;
      }
    });
  });
}

// ── Master theme switcher ────────────────────────────────────
// Called by every theme button: onclick="__applyTheme('default')" etc.
function __applyTheme(name) {
  if (!VIZ_PALETTES.hasOwnProperty(name)) return;

  document.documentElement.dataset.theme = name;
  localStorage.setItem('theme', name);
  window.__sankeyColors = VIZ_PALETTES[name];

  _updateThemeButtons(name);
  _updateBlobIndicator(name);
  _updateLegendSwatches();

  if (typeof window.__renderSankey === 'function') {
    const sankeyTab = document.getElementById('tab-sankey');
    if (sankeyTab && sankeyTab.style.display !== 'none') window.__renderSankey();
    const boxesTab = document.getElementById('tab-boxes');
    if (boxesTab && boxesTab.style.display !== 'none') window.__renderBoxes?.();
  }
}

// Apply the saved theme (or the default purple-dark) immediately when this
// script loads. This runs before DOMContentLoaded, which is fine because all
// theme operations target document.documentElement (available immediately)
// or query elements by ID that exist in the static HTML.
__applyTheme(localStorage.getItem('theme') || 'default');
