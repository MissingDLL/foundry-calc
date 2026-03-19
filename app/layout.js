// ============================================================
// app/layout.js
// ============================================================
// Factory Layout Planner: generates a 2D top-down blueprint
// view of all machines needed for the current production plan.
//
// Algorithm:
//   1. Build a production graph (items + ingredient edges)
//   2. Assign columns via longest-path BFS (raw left, final right)
//   3. Each node = one machine group (item + machine type + count)
//   4. Arrange multiple machines of same type in a tight sub-grid
//   5. Pack sub-grids into columns; leave conveyor/pipe gaps
//   6. Render to SVG with pan/zoom
//
// Dependencies (loaded before this file):
//   data/game-data.js  → RECIPES, MACHINE_CONNECTIONS
//   app/state.js       → selectedRecipeList, resolveRecipeName,
//                        preferredMachineFor, MINING_MACHINES
//   app/calculation.js → getOutputAmount()
//   app/ui-nav.js      → fmt()
// ============================================================

// ── Constants ─────────────────────────────────────────────────
const LAYOUT = Object.freeze({
  TILE_PX:       18,   // pixels per in-game tile at 1× zoom
  COL_GAP_TILES:  6,   // horizontal gap between columns (conveyor space)
  ROW_GAP_TILES:  3,   // vertical gap between machine groups in same column
  MACH_GAP_TILES: 1,   // gap between individual machines within a group
  MIN_LABEL_TILES: 3,  // minimum size for the label area inside a box
});

// Dark-theme palette matching the rest of the app
const LAYOUT_COLORS = {
  raw:   { fill: '#0e2010', stroke: '#2a6a2a', text: '#6adf6a', accent: '#3a9a3a' },
  mid:   { fill: '#080f1e', stroke: '#1e3a70', text: '#6a9adf', accent: '#2a5aa0' },
  final: { fill: '#1e0e04', stroke: '#7a3010', text: '#e08050', accent: '#a04020' },
  bg:    '#04080f',
  grid:  'rgba(100,140,255,0.07)',
  arrow: 'rgba(168,85,247,0.55)',
  arrowHead: '#a855f7',
});

// ── Data builder ──────────────────────────────────────────────

function buildLayoutData() {
  if (!selectedRecipeList || !selectedRecipeList.length) return null;

  const nodeMap  = {}; // label → node
  const edgeMap  = {}; // "src|||tgt" → link
  const links    = [];

  function getNode(label, kind) {
    if (!nodeMap[label]) {
      nodeMap[label] = {
        label, kind: kind || 'mid', rate: 0,
        machineName: null, machineCount: 0,
        sizeW: 3, sizeD: 3,
      };
    }
    return nodeMap[label];
  }

  function addEdge(src, tgt, value) {
    const key = src + '|||' + tgt;
    if (edgeMap[key]) { edgeMap[key].value += value; return; }
    const lnk = { source: src, target: tgt, value };
    edgeMap[key] = lnk;
    links.push(lnk);
  }

  function parseSize(sizeStr) {
    if (!sizeStr) return { w: 3, d: 3 };
    const parts = sizeStr.split('x').map(Number);
    return { w: parts[0] || 3, d: (parts[2] || parts[0] || 3) };
  }

  function isRaw(resolved) {
    const r = RECIPES[resolved];
    return !r || !r.ingredients || r.ingredients.length === 0 ||
           !r.machines || Object.keys(r.machines).length === 0 ||
           getOutputAmount(r) === 0;
  }

  function expand(itemName, rateNeeded, visited) {
    const resolved = resolveRecipeName(itemName);
    if (visited.has(resolved) || visited.size > 60) return null;

    const raw  = isRaw(resolved);
    const node = getNode(resolved, raw ? 'raw' : 'mid');
    node.rate += rateNeeded;

    if (raw) {
      const rr = RECIPES[resolved];
      if (rr && rr.machines) {
        const mEntries = Object.entries(rr.machines).filter(([n]) => n !== 'Character');
        if (mEntries.length) {
          const [mName] = mEntries[0];
          node.machineName = mName;
          const machRec = RECIPES[mName];
          if (machRec?.size) { const s = parseSize(machRec.size); node.sizeW = s.w; node.sizeD = s.d; }
          const md = rr.machines[mName];
          if (md) node.machineCount += rateNeeded / ((60 / md.cycleTime) * getOutputAmount(rr));
        }
      }
      return resolved;
    }

    const r        = RECIPES[resolved];
    const mEntries = Object.entries(r.machines).filter(([n]) => n !== 'Character');
    if (!mEntries.length) return null;

    const [machineName, md] = mEntries[0];
    const preferred = (typeof preferredMachineFor === 'function') ? preferredMachineFor(r) : machineName;
    const preferredMd = r.machines[preferred] || md;
    const usedMachine = preferred;
    const usedMd      = preferredMd;

    const opm  = (60 / usedMd.cycleTime) * getOutputAmount(r);
    const runs = rateNeeded / opm;

    node.machineName    = usedMachine;
    node.machineCount  += runs;

    // Machine footprint — look up in RECIPES for the machine building itself
    if (!node.sizeSet) {
      const machRec = RECIPES[usedMachine];
      if (machRec?.size) {
        const s = parseSize(machRec.size);
        node.sizeW = s.w; node.sizeD = s.d;
        node.sizeSet = true;
      } else if (r.size) {
        // Fallback: use the recipe's own size (for modular buildings)
        const s = parseSize(r.size);
        node.sizeW = s.w; node.sizeD = s.d;
        node.sizeSet = true;
      }
    }

    const next = new Set(visited);
    next.add(resolved);

    r.ingredients.forEach(ing => {
      const ingRate  = runs * ing.amount * (60 / usedMd.cycleTime);
      const ingLabel = expand(ing.item, ingRate, next);
      if (ingLabel) addEdge(ingLabel, resolved, ingRate);
    });

    return resolved;
  }

  // ── Root: selected recipes ────────────────────────────────
  selectedRecipeList.forEach(item => {
    const r = RECIPES[item.recipeName || item.name];
    if (!r || !r.machines[item.machineName]) return;

    const ct       = r.machines[item.machineName].cycleTime;
    const opm      = (60 / ct) * getOutputAmount(r);
    const machines = Math.ceil(item.goal / opm);
    const actualOpm = machines * opm;

    const label = item.itemName || item.name;
    const node  = getNode(label, 'final');
    node.rate        += actualOpm;
    node.kind         = 'final';
    node.machineName  = item.machineName;
    node.machineCount = machines;

    const machRec = RECIPES[item.machineName];
    if (machRec?.size) {
      const s = parseSize(machRec.size);
      node.sizeW = s.w; node.sizeD = s.d;
      node.sizeSet = true;
    } else if (r.size) {
      const s = parseSize(r.size);
      node.sizeW = s.w; node.sizeD = s.d;
      node.sizeSet = true;
    }

    r.ingredients.forEach(ing => {
      const ingRate  = (60 / ct) * ing.amount * machines;
      const ingLabel = expand(ing.item, ingRate, new Set([label]));
      if (ingLabel) addEdge(ingLabel, label, ingRate);
    });
  });

  const nodes = Object.values(nodeMap);
  if (!nodes.length) return null;

  // ── BFS longest-path depth assignment ────────────────────
  const inEdges  = {};
  const outEdges = {};
  nodes.forEach(n => { inEdges[n.label] = []; outEdges[n.label] = []; n.depth = 0; });
  links.forEach(l => {
    const s = l.source, t = l.target;
    outEdges[s].push(t);
    inEdges[t].push(s);
  });

  const visited = new Set();
  const queue   = nodes.filter(n => inEdges[n.label].length === 0)
                       .map(n => { n.depth = 0; return n.label; });
  queue.forEach(l => visited.add(l));
  while (queue.length) {
    const cur = queue.shift();
    outEdges[cur].forEach(tgt => {
      const d = nodeMap[cur].depth + 1;
      if (d > nodeMap[tgt].depth) nodeMap[tgt].depth = d;
      if (!visited.has(tgt)) { visited.add(tgt); queue.push(tgt); }
    });
  }

  // ── Group into columns ────────────────────────────────────
  const maxDepth = Math.max(...nodes.map(n => n.depth));
  const columns  = Array.from({ length: maxDepth + 1 }, () => []);
  nodes.forEach(n => columns[n.depth].push(n));

  // Sort each column: final first, then by rate desc
  columns.forEach(col => col.sort((a, b) => {
    if (a.kind === 'final' && b.kind !== 'final') return -1;
    if (b.kind === 'final' && a.kind !== 'final') return  1;
    return b.rate - a.rate;
  }));

  // ── Compute machine group layout ──────────────────────────
  // For each node, decide how to arrange its N machines as a grid
  const G = LAYOUT.MACH_GAP_TILES;
  nodes.forEach(n => {
    const count = Math.max(1, Math.ceil(n.machineCount));
    const cols  = Math.max(1, Math.ceil(Math.sqrt(count)));
    const rows  = Math.ceil(count / cols);
    n.groupCols  = cols;
    n.groupRows  = rows;
    n.machCount  = count;
    n.groupW     = cols * n.sizeW + (cols - 1) * G;  // total width in tiles
    n.groupH     = rows * n.sizeD + (rows - 1) * G;  // total height in tiles
  });

  return { nodes, columns, links, nodeMap };
}

// ── SVG renderer ──────────────────────────────────────────────

function drawLayoutSVG(data) {
  const T  = LAYOUT.TILE_PX;
  const CG = LAYOUT.COL_GAP_TILES;
  const RG = LAYOUT.ROW_GAP_TILES;
  const C  = LAYOUT_COLORS;

  // ── Compute column widths and heights ─────────────────────
  const colWidths  = data.columns.map(col =>
    col.length ? Math.max(...col.map(n => n.groupW)) : 0
  );
  const colHeights = data.columns.map(col =>
    col.reduce((sum, n, i) => sum + n.groupH + (i > 0 ? RG : 0), 0)
  );

  const totalW = colWidths.reduce((s, w, i) => s + w + (i > 0 ? CG : 0), 0);
  const totalH = Math.max(...colHeights);

  const PAD  = 40;  // canvas padding (px)
  const svgW = totalW * T + PAD * 2;
  const svgH = totalH * T + PAD * 2;

  // ── Assign pixel positions to every node ─────────────────
  let curX = PAD;
  data.columns.forEach((col, ci) => {
    const colW = colWidths[ci];
    let curY = PAD;
    col.forEach(n => {
      n.px = curX + ((colW - n.groupW) / 2) * T; // center within column
      n.py = curY;
      curY += (n.groupH + RG) * T;
    });
    curX += (colW + CG) * T;
  });

  // ── Build SVG ─────────────────────────────────────────────
  let defs = `
  <defs>
    <marker id="lArrow" markerWidth="8" markerHeight="8" refX="7" refY="3.5" orient="auto">
      <path d="M0,0 L0,7 L8,3.5 Z" fill="${C.arrowHead}" opacity="0.8"/>
    </marker>
    <pattern id="gridPat" width="${T}" height="${T}" patternUnits="userSpaceOnUse">
      <path d="M ${T} 0 L 0 0 0 ${T}" fill="none" stroke="${C.grid}" stroke-width="0.5"/>
    </pattern>
  </defs>`;

  // Background + grid
  let body = `
  <rect width="${svgW}" height="${svgH}" fill="${C.bg}"/>
  <rect width="${svgW}" height="${svgH}" fill="url(#gridPat)"/>`;

  // ── Draw edges first (behind nodes) ──────────────────────
  data.links.forEach(l => {
    const src = data.nodeMap[l.source];
    const tgt = data.nodeMap[l.target];
    if (!src || !tgt) return;

    // Start from right edge center of source, end at left edge center of target
    const x1 = src.px + src.groupW * T;
    const y1 = src.py + (src.groupH * T) / 2;
    const x2 = tgt.px;
    const y2 = tgt.py + (tgt.groupH * T) / 2;

    const cx = (x1 + x2) / 2;
    const thickness = Math.max(1.5, Math.min(8, Math.sqrt(l.value) * 0.3));

    body += `<path d="M${x1},${y1} C${cx},${y1} ${cx},${y2} ${x2},${y2}"
      fill="none" stroke="${C.arrow}" stroke-width="${thickness}"
      marker-end="url(#lArrow)" opacity="0.7"/>`;

    // Flow rate label on the midpoint
    const mx = cx;
    const my = (y1 + y2) / 2;
    const rateStr = l.value >= 1000 ? (l.value / 1000).toFixed(1) + 'k' : Math.round(l.value) + '';
    body += `<text x="${mx}" y="${my - 4}" text-anchor="middle"
      font-family="-apple-system,sans-serif" font-size="9" fill="${C.arrowHead}" opacity="0.8">${rateStr}/min</text>`;
  });

  // ── Draw nodes ────────────────────────────────────────────
  data.nodes.forEach(n => {
    const color  = C[n.kind] || C.mid;
    const G      = LAYOUT.MACH_GAP_TILES * T;
    const count  = n.machCount;

    // Draw each individual machine tile
    for (let r = 0; r < n.groupRows; r++) {
      for (let c = 0; c < n.groupCols; c++) {
        const idx = r * n.groupCols + c;
        if (idx >= count) break;

        const mx = n.px + c * (n.sizeW * T + G);
        const my = n.py + r * (n.sizeD * T + G);
        const mw = n.sizeW * T;
        const mh = n.sizeD * T;

        // Machine tile background
        body += `<rect x="${mx}" y="${my}" width="${mw}" height="${mh}"
          rx="3" fill="${color.fill}" stroke="${color.stroke}" stroke-width="1.5" opacity="0.95"/>`;

        // Subtle size indicator stripes (every 2 tiles)
        for (let tx = 2; tx < n.sizeW; tx += 2) {
          body += `<line x1="${mx + tx * T}" y1="${my}" x2="${mx + tx * T}" y2="${my + mh}"
            stroke="${color.stroke}" stroke-width="0.5" opacity="0.4"/>`;
        }
        for (let tz = 2; tz < n.sizeD; tz += 2) {
          body += `<line x1="${mx}" y1="${my + tz * T}" x2="${mx + mw}" y2="${my + tz * T}"
            stroke="${color.stroke}" stroke-width="0.5" opacity="0.4"/>`;
        }

        // Machine number badge (only if multiple machines)
        if (count > 1) {
          const numStr = `#${idx + 1}`;
          body += `<text x="${mx + 4}" y="${my + 12}" font-family="monospace"
            font-size="9" fill="${color.stroke}" opacity="0.6">${numStr}</text>`;
        }
      }
    }

    // Group border
    body += `<rect x="${n.px}" y="${n.py}" width="${n.groupW * T}" height="${n.groupH * T}"
      rx="4" fill="none" stroke="${color.accent}" stroke-width="2" stroke-dasharray="4,3" opacity="0.5"/>`;

    // Label area — centered over the group
    const labelX = n.px + (n.groupW * T) / 2;
    const labelY = n.py + (n.groupH * T) / 2;

    // Semi-transparent pill background for labels
    const lblW = Math.min(n.groupW * T - 8, 130);
    const lblH = 46;
    body += `<rect x="${labelX - lblW/2}" y="${labelY - lblH/2}"
      width="${lblW}" height="${lblH}" rx="4"
      fill="rgba(0,0,0,0.65)" stroke="${color.stroke}" stroke-width="1" opacity="0.9"/>`;

    // Item name
    const displayName = n.label.length > 18 ? n.label.slice(0, 16) + '…' : n.label;
    body += `<text x="${labelX}" y="${labelY - 10}" text-anchor="middle"
      font-family="-apple-system,sans-serif" font-size="10" font-weight="600"
      fill="${color.text}">${displayName}</text>`;

    // Machine name + count
    const machShort = (n.machineName || '?').replace(' I', ' I').length > 20
      ? (n.machineName || '?').slice(0, 18) + '…' : (n.machineName || '?');
    body += `<text x="${labelX}" y="${labelY + 4}" text-anchor="middle"
      font-family="-apple-system,sans-serif" font-size="9"
      fill="rgba(255,255,255,0.55)">${machShort}</text>`;

    // Count + footprint
    const footprint = `${n.sizeW}×${n.sizeD}`;
    body += `<text x="${labelX}" y="${labelY + 17}" text-anchor="middle"
      font-family="'Share Tech Mono',monospace" font-size="11" font-weight="700"
      fill="${color.text}">×${count} <tspan font-size="9" opacity="0.6">${footprint}</tspan></text>`;

    // Rate
    const rateStr = n.rate >= 1000
      ? (n.rate / 1000).toFixed(1) + 'k/min'
      : Math.round(n.rate * 10) / 10 + '/min';
    body += `<text x="${labelX}" y="${labelY + 30}" text-anchor="middle"
      font-family="'Share Tech Mono',monospace" font-size="9" opacity="0.7"
      fill="${color.text}">${rateStr}</text>`;
  });

  // ── Scale bar ─────────────────────────────────────────────
  const scaleBarTiles = 10;
  const scaleBarPx    = scaleBarTiles * T;
  const sbX = PAD;
  const sbY = svgH - 22;
  body += `
  <line x1="${sbX}" y1="${sbY}" x2="${sbX + scaleBarPx}" y2="${sbY}"
    stroke="rgba(255,255,255,0.4)" stroke-width="1.5"/>
  <line x1="${sbX}" y1="${sbY - 4}" x2="${sbX}" y2="${sbY + 4}"
    stroke="rgba(255,255,255,0.4)" stroke-width="1.5"/>
  <line x1="${sbX + scaleBarPx}" y1="${sbY - 4}" x2="${sbX + scaleBarPx}" y2="${sbY + 4}"
    stroke="rgba(255,255,255,0.4)" stroke-width="1.5"/>
  <text x="${sbX + scaleBarPx / 2}" y="${sbY - 7}" text-anchor="middle"
    font-family="-apple-system,sans-serif" font-size="9" fill="rgba(255,255,255,0.4)"
    >${scaleBarTiles} tiles</text>`;

  // ── Total area info ───────────────────────────────────────
  body += `
  <text x="${svgW - PAD}" y="${svgH - 10}" text-anchor="end"
    font-family="-apple-system,sans-serif" font-size="9" fill="rgba(255,255,255,0.3)"
    >${totalW}×${totalH} tiles (excl. gaps)</text>`;

  return `<svg xmlns="http://www.w3.org/2000/svg"
    width="${svgW}" height="${svgH}"
    viewBox="0 0 ${svgW} ${svgH}"
    style="display:block;max-width:100%">
    ${defs}${body}
  </svg>`;
}

// ── Public entry point ────────────────────────────────────────

let _layoutDirty = true;

function renderLayout() {
  const container = document.getElementById('layoutCanvas');
  if (!container) return;
  _layoutDirty = false;

  if (!selectedRecipeList || !selectedRecipeList.length) {
    container.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;
        height:100%;gap:12px;color:rgba(255,255,255,0.3);font-family:-apple-system,sans-serif">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="1.5" opacity="0.3">
          <rect x="3" y="3" width="7" height="7" rx="1"/>
          <rect x="14" y="3" width="7" height="7" rx="1"/>
          <rect x="3" y="14" width="7" height="7" rx="1"/>
          <rect x="14" y="14" width="7" height="7" rx="1"/>
        </svg>
        <span>No recipes selected — add items to your production list first.</span>
      </div>`;
    return;
  }

  const data = buildLayoutData();
  if (!data) {
    container.innerHTML = '<div style="padding:24px;color:rgba(255,255,255,0.4)">Could not build layout.</div>';
    return;
  }

  // Summary stats
  const totalMachines = data.nodes.reduce((s, n) => s + n.machCount, 0);
  const totalTiles = data.columns.reduce((s, col, ci) => {
    const w = Math.max(...col.map(n => n.groupW), 0);
    const h = col.reduce((sh, n, i) => sh + n.groupH + (i > 0 ? LAYOUT.ROW_GAP_TILES : 0), 0);
    return s + w * h;
  }, 0);
  const cols = data.columns.length;

  // Stats bar
  const statsHtml = `
    <div style="display:flex;align-items:center;gap:20px;padding:10px 16px;
      background:rgba(255,255,255,0.04);border-bottom:1px solid rgba(255,255,255,0.08);
      flex-shrink:0;font-family:-apple-system,sans-serif;font-size:12px;flex-wrap:wrap">
      <span style="color:rgba(255,255,255,0.4)">
        <span style="color:var(--accent);font-weight:600">${data.nodes.length}</span> machine types
      </span>
      <span style="color:rgba(255,255,255,0.4)">
        <span style="color:var(--accent);font-weight:600">${totalMachines}</span> total machines
      </span>
      <span style="color:rgba(255,255,255,0.4)">
        <span style="color:var(--accent);font-weight:600">${cols}</span> production stages
      </span>
      <span style="flex:1"></span>
      <button onclick="renderLayout()" style="
        background:rgba(168,85,247,0.15);border:1px solid rgba(168,85,247,0.3);
        color:#a855f7;padding:4px 12px;border-radius:4px;cursor:pointer;
        font-size:11px;font-family:-apple-system,sans-serif">
        ↺ Refresh
      </button>
    </div>`;

  const svgHtml = drawLayoutSVG(data);

  container.innerHTML = statsHtml + `
    <div id="layoutSvgWrap" style="flex:1;overflow:auto;padding:16px;
      display:flex;align-items:flex-start;justify-content:flex-start">
      ${svgHtml}
    </div>`;
}

// Mark layout as dirty whenever the recipe list changes so it redraws on tab open
function markLayoutDirty() { _layoutDirty = true; }
