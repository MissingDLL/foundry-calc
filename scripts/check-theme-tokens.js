#!/usr/bin/env node
// ============================================================
// scripts/check-theme-tokens.js
// ============================================================
// Regression check for the theme system (requirement 8):
//   1. Verifies app/tokens.css defines the same token set for all
//      three [data-theme="x"] blocks.
//   2. Scans app/*.js (except theme.js), index.html and styles.css
//      for raw color literals (rgba(...) / #hex) outside of known
//      documented exceptions and reports them.
// Run with: node scripts/check-theme-tokens.js
// ============================================================

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const TOKENS_FILE = path.join(ROOT, 'app/tokens.css');
// theme.js is excluded: it IS the palette/theme-definition file (VIZ_PALETTES),
// exempt per requirement 8.2 same as tokens.css.
const JS_FILES = fs.readdirSync(path.join(ROOT, 'app'))
  .filter(f => f.endsWith('.js') && f !== 'theme.js' && f !== 'icons.js')
  .map(f => path.join(ROOT, 'app', f));

let violations = 0;

// ── 1. Token-set parity across themes ──────────────────────
function checkTokenParity() {
  const css = fs.readFileSync(TOKENS_FILE, 'utf8');
  const blockRe = /\[data-theme="([^"]+)"\]\s*\{([^}]*)\}/g;
  const themeTokens = {};
  let m;
  while ((m = blockRe.exec(css))) {
    const [, theme, body] = m;
    const tokens = [...body.matchAll(/(--[a-z0-9-]+)\s*:/g)].map(x => x[1]);
    themeTokens[theme] = new Set(tokens);
  }
  const themes = Object.keys(themeTokens);
  if (themes.length === 0) {
    console.error(`${TOKENS_FILE}: no [data-theme] blocks found`);
    violations++;
    return;
  }
  const reference = themeTokens[themes[0]];
  themes.slice(1).forEach(theme => {
    const missing = [...reference].filter(t => !themeTokens[theme].has(t));
    const extra = [...themeTokens[theme]].filter(t => !reference.has(t));
    missing.forEach(t => { console.error(`tokens.css: [data-theme="${theme}"] missing ${t}`); violations++; });
    extra.forEach(t => { console.error(`tokens.css: [data-theme="${theme}"] has extra ${t} not in "${themes[0]}"`); violations++; });
  });
}

const COLOR_RE = /(rgba?\s*\([^)]+\)|#[0-9a-fA-F]{3,8}\b)/g;

// Theme-neutral: pure-black shadows/scrims work on every theme, and #fff
// only appears as text on solid accent-colored surfaces (calc button, badge).
function isShadowBlack(lit) { return /^rgba\(0,0,0[,.)]/.test(lit.replace(/\s+/g, '')); }
function isWhiteOnAccent(lit) { return lit === '#fff'; }
// Subtle white inset highlights on glass surfaces (<= 0.20 alpha) are part of
// the glass look and read fine on all three themes.
function isGlassInsetWhite(lit) {
  const m = lit.replace(/\s+/g, '').match(/^rgba\(255,255,255,0?\.(\d+)\)$/);
  return m && parseFloat('0.' + m[1]) <= 0.20;
}

// ── 2. Raw color literals in app/*.js ──────────────────────
function checkJsLiterals() {
  JS_FILES.forEach(file => {
    if (!fs.existsSync(file)) return;
    const lines = fs.readFileSync(file, 'utf8').split('\n');
    // VIZ_COLORS_DARK is itself a palette-definition block (visualization.js's
    // equivalent of tokens.css) — exempt its literal block, same as theme.js.
    let inPaletteBlock = false;
    lines.forEach((line, i) => {
      if (/const VIZ_COLORS_DARK\s*=\s*\{/.test(line)) inPaletteBlock = true;
      if (inPaletteBlock) {
        if (/^\};/.test(line.trim())) inPaletteBlock = false;
        return;
      }
      if (line.trimStart().startsWith('//')) return;
      if (line.includes('console.')) return; // devtools-only styling
      const matches = line.match(COLOR_RE) || [];
      const real = matches.filter(v => !isShadowBlack(v) && !isWhiteOnAccent(v));
      if (real.length) {
        console.error(`${file}:${i + 1}: raw color: ${real.join(', ')}`);
        violations++;
      }
    });
  });
}

// ── 3. Raw color literals in index.html ────────────────────
// Allowed there:
//   - pure-black shadows
//   - glass-pill whites: the theme/viz pills keep a fixed frosted-glass look
//     on dark themes; [data-theme="light"] overrides live in styles.css.
//   - legend swatch colors: initial dark-palette values, replaced at runtime
//     by _updateLegendSwatches() on every theme switch.
const HTML_ALLOWED = new Set([
  // glass pills + icon base colors (overridden per theme via !important CSS)
  'rgba(255,255,255,0.18)', 'rgba(255,255,255,0.10)', 'rgba(255,255,255,0.08)',
  'rgba(255,255,255,0.35)', 'rgba(255,255,255,0.40)', 'rgba(255,255,255,0.45)',
  'rgba(255,255,255,0.92)',
  // legend swatches (runtime-themed)
  '#6aaa6a', '#1a4a1a', '#2a6a2a', '#6a9adf', '#1a2a4a', '#2a4a8a',
  '#e08050', '#3a1a08', '#7a3a10',
]);

function checkHtmlLiterals() {
  const file = path.join(ROOT, 'index.html');
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, i) => {
    if (line.length > 500) return; // skip inlined d3 bundle
    const matches = line.match(COLOR_RE) || [];
    const real = matches.filter(v => {
      const n = v.replace(/\s+/g, '');
      return !isShadowBlack(n) && !HTML_ALLOWED.has(n);
    });
    if (real.length) {
      console.error(`index.html:${i + 1}: raw color: ${real.join(', ')}`);
      violations++;
    }
  });
}

// ── 4. Raw color literals in styles.css ────────────────────
// Rules whose selector mentions [data-theme= are theme-scoped by definition
// (e.g. the purple glows only exist under [data-theme="default"]) — exempt.
// Everything else must use var(--color-*) except shadows/glass whites.
// Icon base colors on the glass pills: dark-theme values in the base rule,
// [data-theme="light"] override rules follow directly below them.
const CSS_ALLOWED = new Set([
  'rgba(255,255,255,0.92)', 'rgba(255,255,255,0.45)', 'rgba(255,255,255,0.40)',
]);

function checkCssLiterals() {
  const file = path.join(ROOT, 'styles.css');
  const css = fs.readFileSync(file, 'utf8');
  const ruleRe = /([^{}]+)\{([^{}]*)\}/g;
  let m;
  while ((m = ruleRe.exec(css))) {
    const [, selector, body] = m;
    if (selector.includes('[data-theme=')) continue;
    if (selector.includes(':root')) continue; // legacy --glass-*/--shadow-* block
    const matches = body.match(COLOR_RE) || [];
    const real = matches.filter(v => {
      const n = v.replace(/\s+/g, '');
      return !isShadowBlack(n) && !isGlassInsetWhite(n) && !isWhiteOnAccent(n) && !CSS_ALLOWED.has(n);
    });
    if (real.length) {
      const line = css.slice(0, m.index).split('\n').length;
      console.error(`styles.css:${line} (${selector.trim().split('\n').pop().trim()}): raw color: ${real.join(', ')}`);
      violations++;
    }
  }
}

checkTokenParity();
checkJsLiterals();
checkHtmlLiterals();
checkCssLiterals();

if (violations > 0) {
  console.error(`\n${violations} violation(s) found.`);
  process.exit(1);
} else {
  console.log('OK: token parity holds and no un-tokenized color literals found.');
  process.exit(0);
}
