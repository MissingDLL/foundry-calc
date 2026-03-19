// ============================================================
// app/layout.js  — Tile-accurate factory layout planner
// ============================================================
// Generates a 2D top-down blueprint showing:
//   • Machine footprints at correct tile sizes
//   • Belt lanes in corridors between production stages
//   • Loader tiles at machine connection points
//   • Splitter / merger junctions where lanes branch
//
// Layout direction: LEFT (raw materials) → RIGHT (final product)
//
// Corridor structure between stage A and stage B:
//   [stage A machines] [out-loaders | belt lanes | in-loaders] [stage B machines]
//
// Within each corridor, one vertical belt "trunk" per item type.
// Horizontal spurs connect each machine's loader to the trunk.
// A junction tile (T-shape) marks every spur–trunk intersection.
//
// Dependencies: same as visualization.js
// ============================================================

// ── Tile type constants ───────────────────────────────────────
const TT = Object.freeze({
  EMPTY:      'empty',
  MACHINE:    'machine',
  LOADER_IN:  'loader_in',
  LOADER_OUT: 'loader_out',
  BELT_H:     'belt_h',
  BELT_V:     'belt_v',
  JUNCTION:   'junction',   // spur meets trunk (merge or split)
});

// ── Layout constants ──────────────────────────────────────────
const LP = Object.freeze({
  TILE:     16,   // px per tile
  MACH_GAP:  2,   // tiles between machines in same group
  BELT_TIER: 4,   // 1=Conveyor I … 4=Conveyor IV
});

const BELT_CAPACITY = { 1: 160, 2: 320, 3: 640, 4: 1280 };

// ── Colour helpers ────────────────────────────────────────────
const LC = {
  bg:   '#030608',
  grid: 'rgba(80,110,180,0.10)',
  machine: {
    raw:   { fill: '#081508', stroke: '#1a5a1a', text: '#50df50' },
    mid:   { fill: '#03080f', stroke: '#152845', text: '#4a80d0' },
    final: { fill: '#0f0600', stroke: '#5a1e04', text: '#d86030' },
  },
  loaderIn:  { fill: '#0a180a', stroke: '#28781e' },
  loaderOut: { fill: '#0a0a1e', stroke: '#28287a' },
  junction:  { fill: '#180e00', stroke: '#b06000' },
};

// Stable item→colour based on name hash
function itemColour(name) {
  let h = 5381;
  for (let i = 0; i < name.length; i++) h = (Math.imul(h, 33) ^ name.charCodeAt(i)) >>> 0;
  const hue = h % 360;
  return {
    fill:   `hsl(${hue},50%,18%)`,
    stroke: `hsl(${hue},70%,48%)`,
    text:   `hsl(${hue},80%,68%)`,
  };
}

// ── Sparse tile map ───────────────────────────────────────────
function makeTileMap() {
  const m = new Map();
  return {
    set(x, y, tile) { m.set(`${x},${y}`, { x, y, ...tile }); },
    get(x, y)       { return m.get(`${x},${y}`); },
    has(x, y)       { return m.has(`${x},${y}`); },
    forEach(fn)     { m.forEach(fn); },
  };
}

// ── Arrow path helper ─────────────────────────────────────────
function arrowPath(cx, cy, dir, r) {
  const h = { right: [[-r,-r/2],[r,0],[-r,r/2]], left:  [[r,-r/2],[-r,0],[r,r/2]],
               down:  [[-r/2,-r],[0,r],[r/2,-r]], up:   [[-r/2,r],[0,-r],[r/2,r]] }[dir];
  return h ? `M${cx+h[0][0]},${cy+h[0][1]} L${cx+h[1][0]},${cy+h[1][1]} L${cx+h[2][0]},${cy+h[2][1]}Z` : '';
}

// ── Machine footprint sizes (width × depth in tiles) ─────────
const MACHINE_SIZES = {
  'Assembler I':            [3, 3],
  'Assembler II':           [5, 5],
  'Assembler III':          [7, 7],
  'Fluid-Assembler I':      [5, 5],
  'Barrel Filler I':        [5, 5],
  'Crusher I':              [5, 5],
  'Crusher II':             [7, 7],
  'Smelter (Small)':        [3, 3],
  'Advanced Smelter':       [5, 5],
  'Lava-Smelter I':         [5, 5],
  'Lava-Smelter II':        [5, 5],
  'Electric Arc Furnace':   [9, 9],
  'Blast Furnace':          [9, 9],
  'Chemical Processor':     [5, 5],
  'Distillation Column':    [3, 9],
  'Casting Machine':        [7, 7],
  'Greenhouse':             [7, 7],
  'Crystal Refiner':        [5, 5],
  'Incinerator':            [5, 5],
  'Boiler':                 [5, 5],
  'Drone Miner I':          [5, 5],
  'Drone Miner II':         [7, 7],
  'Ore Vein Miner':         [3, 3],
  'Pumpjack I':             [3, 3],
  'Assembly Line':          [3, 3],
  'Assembly Line Start':    [3, 3],
  'Assembly Line Producer': [3, 3],
  'Assembly Line Painter':  [3, 3],
};
const DEFAULT_MACH_SIZE = [3, 3];
const GROUP_COLS = 4; // max machines per row in a group

// Builds a depth-annotated production graph from the current recipe list.
// Returns { nodes, columns, links, nodeMap } or null if nothing to show.
// Reuses buildSankeyGraph() (from visualization.js) for the graph data,
// then adds depth assignment, column grouping, and tile-size info.
function buildLayoutData() {
  const raw = buildSankeyGraph();
  if (!raw) return null;

  const { nodes, links } = raw;

  // Build edge lookup maps
  const inEdges  = {}, outEdges = {};
  nodes.forEach(n => { inEdges[n.label] = []; outEdges[n.label] = []; n.depth = 0; });
  links.forEach(l => {
    const s = typeof l.source === 'object' ? l.source.label : l.source;
    const t = typeof l.target === 'object' ? l.target.label : l.target;
    if (outEdges[s]) outEdges[s].push(t);
    if (inEdges[t])  inEdges[t].push(s);
  });

  // Longest-path depth assignment (BFS from roots)
  const queue   = nodes.filter(n => inEdges[n.label].length === 0).map(n => n.label);
  const visited = new Set(queue);
  while (queue.length) {
    const cur = queue.shift();
    (outEdges[cur] || []).forEach(tgt => {
      const d = nodes.find(n => n.label === cur)?.depth + 1 || 1;
      const tgtNode = nodes.find(n => n.label === tgt);
      if (tgtNode && d > tgtNode.depth) tgtNode.depth = d;
      if (!visited.has(tgt)) { visited.add(tgt); queue.push(tgt); }
    });
  }

  // Build nodeMap
  const nodeMap = {};
  nodes.forEach(n => { nodeMap[n.label] = n; });

  // Group into depth columns (skip sink/byproduct nodes)
  const maxDepth = Math.max(0, ...nodes.map(n => n.depth));
  const columns  = Array.from({ length: maxDepth + 1 }, () => []);
  nodes.forEach(n => {
    if (n.kind === 'sink' || n.kind === 'byproduct') return;
    columns[n.depth].push(n);
  });

  // Add tile size & group layout to every non-sink node
  nodes.forEach(node => {
    if (node.kind === 'sink' || node.kind === 'byproduct') return;
    const [w, d] = MACHINE_SIZES[node.machineName] || DEFAULT_MACH_SIZE;
    node.sizeW     = w;
    node.sizeD     = d;
    node.machCount = Math.max(1, Math.ceil(node.machineCount));
    node.groupCols = Math.min(node.machCount, GROUP_COLS);
    node.groupRows = Math.ceil(node.machCount / node.groupCols);
    node.groupW    = node.groupCols * (w + LP.MACH_GAP) - LP.MACH_GAP;
    node.groupH    = node.groupRows * (d + LP.MACH_GAP) - LP.MACH_GAP;
  });

  return { nodes, columns, links, nodeMap };
}

// ── Core layout builder ───────────────────────────────────────
function buildTileGrid() {
  const graph = buildLayoutData();
  if (!graph) return null;

  const beltCap = BELT_CAPACITY[LP.BELT_TIER];
  const tiles   = makeTileMap();

  // ── 1. Assign machine grid positions within each stage ──────
  // Each stage (column in graph.columns) stacks nodes vertically.
  // Within a node group, machines are arranged in rows of groupCols.
  graph.columns.forEach(col => {
    let curY = 0;
    col.forEach(node => {
      node._physMachines = []; // { gx, gy } local to stage x=0
      for (let mr = 0; mr < node.groupRows; mr++) {
        for (let mc = 0; mc < node.groupCols; mc++) {
          if (mr * node.groupCols + mc >= node.machCount) break;
          node._physMachines.push({
            gx: mc * (node.sizeW + LP.MACH_GAP),
            gy: curY + mr * (node.sizeD + LP.MACH_GAP),
          });
        }
      }
      node._baseY = curY;
      curY += node.groupH + LP.MACH_GAP;
    });
  });

  // ── 2. Compute corridor contents ────────────────────────────
  // For each adjacent stage pair, collect item flows from graph links.
  const corridors = graph.columns.slice(0, -1).map((leftCol, si) => {
    const rightCol = graph.columns[si + 1];
    const items = [];

    graph.links.forEach(link => {
      const src = graph.nodeMap[link.source];
      const tgt = graph.nodeMap[link.target];
      if (!src || !tgt || src.depth !== si || tgt.depth !== si + 1) return;
      const lanes = Math.max(1, Math.ceil(link.value / beltCap));
      items.push({ item: link.source, srcNode: src, tgtNode: tgt,
                   throughput: link.value, lanes, iCol: itemColour(link.source) });
    });

    // Assign x-offsets within the lane zone (after the output-loader column)
    let off = 0;
    items.forEach(it => { it.laneOff = off; off += it.lanes; });
    const totalLanes = off || 1;

    // Corridor layout:  [1 col output-loaders] + [totalLanes cols belts] + [1 col input-loaders]
    return { items, totalLanes, width: 2 + totalLanes, si };
  });

  // ── 3. Compute absolute x for each stage ───────────────────
  let curX = 0;
  graph.columns.forEach((col, si) => {
    const stageW = col.length ? Math.max(...col.map(n => n.groupW)) : 0;
    col.forEach(n => { n._stageX = curX; n._stageW = stageW; });
    curX += stageW;
    if (si < corridors.length) {
      corridors[si].startX = curX;
      curX += corridors[si].width;
    }
  });

  const gridW = curX;
  const gridH = Math.max(1, ...graph.columns.map(col =>
    col.reduce((s, n) => s + n.groupH + LP.MACH_GAP, 0)));

  // ── 4. Place machine tiles ───────────────────────────────────
  graph.columns.forEach(col => {
    col.forEach(node => {
      node._physMachines.forEach(({ gx, gy }) => {
        for (let dy = 0; dy < node.sizeD; dy++) {
          for (let dx = 0; dx < node.sizeW; dx++) {
            tiles.set(node._stageX + gx + dx, gy + dy, {
              type: TT.MACHINE, kind: node.kind, node,
              dx, dy, machW: node.sizeW, machH: node.sizeD,
            });
          }
        }
      });
    });
  });

  // ── 5. Route belts, loaders, and junctions ──────────────────
  corridors.forEach(cor => {
    const leftCol  = graph.columns[cor.si];
    const rightCol = graph.columns[cor.si + 1];
    const outLoaderX = cor.startX;                       // output-loader column
    const inLoaderX  = cor.startX + cor.totalLanes + 1;  // input-loader column

    // Draw vertical trunk belt for each lane
    cor.items.forEach(({ item, lanes, laneOff, iCol }) => {
      for (let l = 0; l < lanes; l++) {
        const lx = cor.startX + 1 + laneOff + l;
        for (let gy = 0; gy < gridH; gy++) {
          if (!tiles.has(lx, gy)) {
            tiles.set(lx, gy, { type: TT.BELT_V, item, dir: 'down', iCol });
          }
        }
      }
    });

    // Output loaders + merge spurs  (left stage → trunk)
    cor.items.forEach(({ item, laneOff, iCol, srcNode }) => {
      if (!srcNode) return;
      const laneX = cor.startX + 1 + laneOff;

      srcNode._physMachines.forEach(({ gy }) => {
        const ly = gy + Math.floor(srcNode.sizeD / 2);

        // Output loader tile
        tiles.set(outLoaderX, ly, { type: TT.LOADER_OUT, item, dir: 'right', iCol });

        // Horizontal belt from loader to trunk
        for (let gx = outLoaderX + 1; gx < laneX; gx++) {
          if (!tiles.has(gx, ly))
            tiles.set(gx, ly, { type: TT.BELT_H, item, dir: 'right', iCol });
        }

        // Junction (merge) where spur meets trunk
        tiles.set(laneX, ly, { type: TT.JUNCTION, item, mode: 'merge', iCol });
      });
    });

    // Input loaders + split spurs  (trunk → right stage)
    cor.items.forEach(({ item, laneOff, iCol }) => {
      const laneX = cor.startX + 1 + laneOff;

      rightCol.forEach(node => {
        // Only connect if this node's recipe consumes the item
        const rec = RECIPES[resolveRecipeName(node.label)];
        if (!rec?.ingredients?.some(ing => ing.item === item)) return;

        node._physMachines.forEach(({ gy }) => {
          const ly = gy + Math.floor(node.sizeD / 2);

          // Input loader tile
          tiles.set(inLoaderX, ly, { type: TT.LOADER_IN, item, dir: 'right', iCol });

          // Horizontal belt from trunk to loader
          for (let gx = laneX + 1; gx < inLoaderX; gx++) {
            if (!tiles.has(gx, ly))
              tiles.set(gx, ly, { type: TT.BELT_H, item, dir: 'right', iCol });
          }

          // Junction (split) where trunk splits to spur
          tiles.set(laneX, ly, { type: TT.JUNCTION, item, mode: 'split', iCol });
        });
      });
    });
  });

  return { tiles, gridW, gridH, graph };
}

// ── SVG tile renderer ─────────────────────────────────────────
function drawTile(tile, T) {
  const px = tile.x * T;
  const py = tile.y * T;

  if (tile.type === TT.MACHINE) {
    const c = (LC.machine[tile.kind] || LC.machine.mid);
    // Alternating cell tint for depth cue
    const tint = (tile.dx + tile.dy) % 2 === 0 ? '14' : '00';
    return `<rect x="${px}" y="${py}" width="${T}" height="${T}"
      fill="${c.fill}" stroke="${c.stroke}" stroke-width="0.4" opacity="0.95"/>
      <rect x="${px}" y="${py}" width="${T}" height="${T}" fill="#ffffff${tint}"/>`;
  }

  if (tile.type === TT.LOADER_IN || tile.type === TT.LOADER_OUT) {
    const c  = tile.type === TT.LOADER_IN ? LC.loaderIn : LC.loaderOut;
    const ic = tile.iCol || { stroke: '#888' };
    const ap = arrowPath(px + T/2, py + T/2, 'right', T * 0.22);
    return `<rect x="${px+1}" y="${py+1}" width="${T-2}" height="${T-2}"
        rx="2" fill="${c.fill}" stroke="${ic.stroke}" stroke-width="1.8"/>
      <path d="${ap}" fill="${ic.stroke}"/>`;
  }

  if (tile.type === TT.BELT_H || tile.type === TT.BELT_V) {
    const ic  = tile.iCol || { fill: '#1a1a1a', stroke: '#555' };
    const isH = tile.type === TT.BELT_H;
    const bw  = T * 0.45;
    const bx  = isH ? px       : px + (T - bw) / 2;
    const by  = isH ? py + (T - bw) / 2 : py;
    const bW  = isH ? T        : bw;
    const bH  = isH ? bw       : T;
    const ap  = arrowPath(px + T/2, py + T/2, isH ? 'right' : 'down', T * 0.18);
    return `<rect x="${bx}" y="${by}" width="${bW}" height="${bH}"
        fill="${ic.fill}" stroke="${ic.stroke}" stroke-width="0.5" rx="1"/>
      <path d="${ap}" fill="${ic.stroke}" opacity="0.85"/>`;
  }

  if (tile.type === TT.JUNCTION) {
    const ic = tile.iCol || { fill: '#222', stroke: '#888' };
    const r  = T / 2 - 1;
    // Cross shape: vertical trunk + horizontal spur
    const bw = T * 0.45;
    const hb = `<rect x="${px}" y="${py+(T-bw)/2}" width="${T}" height="${bw}"
      fill="${ic.fill}" stroke="${ic.stroke}" stroke-width="0.5" rx="1"/>`;
    const vb = `<rect x="${px+(T-bw)/2}" y="${py}" width="${bw}" height="${T}"
      fill="${ic.fill}" stroke="${ic.stroke}" stroke-width="0.5" rx="1"/>`;
    const dot = `<circle cx="${px+T/2}" cy="${py+T/2}" r="${T*0.22}"
      fill="${ic.stroke}" opacity="0.9"/>`;
    return hb + vb + dot;
  }

  return '';
}

// ── Machine label overlay ─────────────────────────────────────
function drawMachineLabels(graph, T) {
  let out = '';
  graph.nodes.forEach(node => {
    if (!node._physMachines || !node._physMachines.length) return;
    const mc  = LC.machine[node.kind] || LC.machine.mid;
    // Bounding box of entire group
    const xs = node._physMachines.map(m => node._stageX + m.gx);
    const ys = node._physMachines.map(m => m.gy);
    const x0 = Math.min(...xs);
    const y0 = Math.min(...ys);
    const x1 = Math.max(...xs) + node.sizeW;
    const y1 = Math.max(...ys) + node.sizeD;
    const cx = (x0 + x1) / 2 * T;
    const cy = (y0 + y1) / 2 * T;
    const bw = (x1 - x0) * T - 4;
    const bh = 44;

    // Semi-transparent pill background
    out += `<rect x="${cx - bw/2}" y="${cy - bh/2}" width="${bw}" height="${bh}"
      rx="3" fill="rgba(0,0,0,0.72)" stroke="${mc.stroke}" stroke-width="0.8"/>`;
    // Item name
    const nameStr = node.label.length > 18 ? node.label.slice(0, 16) + '…' : node.label;
    out += `<text x="${cx}" y="${cy - 9}" text-anchor="middle"
      font-family="-apple-system,sans-serif" font-size="9" font-weight="600"
      fill="${mc.text}">${nameStr}</text>`;
    // Machine name (shortened)
    const mach = (node.machineName || '').replace(/ I$/, ' I').replace(/ II$/, ' II');
    const machStr = mach.length > 20 ? mach.slice(0, 18) + '…' : mach;
    out += `<text x="${cx}" y="${cy + 2}" text-anchor="middle"
      font-family="-apple-system,sans-serif" font-size="8"
      fill="rgba(255,255,255,0.45)">${machStr}</text>`;
    // Count + footprint
    out += `<text x="${cx}" y="${cy + 14}" text-anchor="middle"
      font-family="'Share Tech Mono',monospace" font-size="10" font-weight="700"
      fill="${mc.text}">×${node.machCount} <tspan font-size="8" opacity="0.5"
      >${node.sizeW}×${node.sizeD}</tspan></text>`;
    // Rate
    const rStr = node.rate >= 1000
      ? (node.rate/1000).toFixed(1) + 'k/m'
      : (Math.round(node.rate * 10) / 10) + '/m';
    out += `<text x="${cx}" y="${cy + 26}" text-anchor="middle"
      font-family="'Share Tech Mono',monospace" font-size="8" opacity="0.6"
      fill="${mc.text}">${rStr}</text>`;
  });
  return out;
}

// ── Belt-lane legend ──────────────────────────────────────────
function drawLegend(graph, svgW, T) {
  // Collect all unique items in all corridors
  const seen = new Map();
  graph.links.forEach(l => {
    if (!seen.has(l.source)) seen.set(l.source, { item: l.source, rate: 0 });
    seen.get(l.source).rate += l.value;
  });
  if (!seen.size) return '';
  const items = [...seen.values()];
  const LH = 16, LW = 140, PAD = 8;
  const boxH = items.length * LH + PAD * 2 + 14;
  const bx   = svgW - LW - 12;
  const by   = 12;

  let out = `<rect x="${bx}" y="${by}" width="${LW}" height="${boxH}"
    rx="4" fill="rgba(0,0,0,0.75)" stroke="rgba(255,255,255,0.12)" stroke-width="0.8"/>
    <text x="${bx+PAD}" y="${by+PAD+9}" font-family="-apple-system,sans-serif"
      font-size="9" font-weight="600" fill="rgba(255,255,255,0.5)">BELT LANES</text>`;

  items.forEach(({ item, rate }, i) => {
    const ic  = itemColour(item);
    const iy  = by + PAD + 14 + i * LH;
    const cap = BELT_CAPACITY[LP.BELT_TIER];
    const lanes = Math.max(1, Math.ceil(rate / cap));
    out += `<rect x="${bx+PAD}" y="${iy}" width="10" height="10"
      rx="2" fill="${ic.fill}" stroke="${ic.stroke}" stroke-width="1"/>`;
    const label = item.length > 20 ? item.slice(0, 18) + '…' : item;
    out += `<text x="${bx+PAD+14}" y="${iy+8}"
      font-family="-apple-system,sans-serif" font-size="8" fill="${ic.text}"
      >${label} <tspan fill="rgba(255,255,255,0.35)">${lanes}×</tspan></text>`;
  });
  return out;
}

// ── SVG builder ───────────────────────────────────────────────
function buildLayoutSVG(tileData) {
  const T   = LP.TILE;
  const { tiles, gridW, gridH, graph } = tileData;
  const PAD = 24;
  const svgW = gridW * T + PAD * 2;
  const svgH = gridH * T + PAD * 2;

  const defs = `<defs>
    <pattern id="lGrid" width="${T}" height="${T}" patternUnits="userSpaceOnUse"
      x="${PAD}" y="${PAD}">
      <path d="M${T} 0H0V${T}" fill="none" stroke="${LC.grid}" stroke-width="0.5"/>
    </pattern>
  </defs>`;

  let body = `<rect width="${svgW}" height="${svgH}" fill="${LC.bg}"/>
  <rect x="${PAD}" y="${PAD}" width="${gridW*T}" height="${gridH*T}" fill="url(#lGrid)"/>
  <g transform="translate(${PAD},${PAD})">`;

  // Tile layer
  tiles.forEach(tile => { body += drawTile(tile, T); });

  // Label overlay (on top of tiles)
  body += drawMachineLabels(graph, T);

  // Stage column headers
  graph.columns.forEach((col, si) => {
    if (!col.length) return;
    const stageX = col[0]._stageX;
    const stageW = col[0]._stageW;
    const cx = (stageX + stageW / 2) * T;
    const depthLabels = ['Raw', 'Stage 1', 'Stage 2', 'Stage 3', 'Stage 4',
                         'Stage 5', 'Stage 6', 'Stage 7', 'Stage 8'];
    const lbl = depthLabels[si] || `Stage ${si}`;
    body += `<text x="${cx}" y="-6" text-anchor="middle"
      font-family="-apple-system,sans-serif" font-size="9"
      fill="rgba(255,255,255,0.25)">${lbl}</text>`;
  });

  body += `</g>`;

  // Legend (outside the main transform)
  body += `<g transform="translate(0,0)">${drawLegend(graph, svgW, T)}</g>`;

  // Scale bar
  const scTiles = 10, scPx = scTiles * T;
  const scX = PAD, scY = svgH - 14;
  body += `<line x1="${scX}" y1="${scY}" x2="${scX+scPx}" y2="${scY}"
    stroke="rgba(255,255,255,0.3)" stroke-width="1.5"/>
  <line x1="${scX}"     y1="${scY-3}" x2="${scX}"     y2="${scY+3}" stroke="rgba(255,255,255,0.3)" stroke-width="1.5"/>
  <line x1="${scX+scPx}" y1="${scY-3}" x2="${scX+scPx}" y2="${scY+3}" stroke="rgba(255,255,255,0.3)" stroke-width="1.5"/>
  <text x="${scX+scPx/2}" y="${scY-5}" text-anchor="middle"
    font-family="-apple-system,sans-serif" font-size="8"
    fill="rgba(255,255,255,0.3)">${scTiles} tiles</text>`;

  return `<svg xmlns="http://www.w3.org/2000/svg"
    width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}"
    style="display:block;min-width:${svgW}px">${defs}${body}</svg>`;
}

// ── Public entry point ────────────────────────────────────────
let _layoutDirty = true;
function markLayoutDirty() { _layoutDirty = true; }

function renderLayout() {
  const container = document.getElementById('layoutCanvas');
  if (!container) return;
  _layoutDirty = false;

  if (!selectedRecipeList || !selectedRecipeList.length) {
    container.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;
      height:100%;flex-direction:column;gap:10px;color:rgba(255,255,255,0.25);
      font-family:-apple-system,sans-serif;font-size:13px">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="1.5" opacity="0.3">
        <rect x="3" y="3" width="7" height="7" rx="1"/>
        <rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/>
        <rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
      Keine Rezepte ausgewählt — zuerst Produkte zur Produktionsliste hinzufügen.
    </div>`;
    return;
  }

  const tileData = buildTileGrid();
  if (!tileData) {
    container.innerHTML = '<div style="padding:20px;color:rgba(255,255,255,0.4)">Layout konnte nicht berechnet werden.</div>';
    return;
  }

  const { graph, gridW, gridH } = tileData;
  const totalMachines = graph.nodes.reduce((s, n) => s + (n.machCount || 0), 0);
  const totalTileArea = gridW * gridH;

  const statsBar = `<div style="display:flex;align-items:center;gap:20px;padding:8px 14px;
    background:rgba(255,255,255,0.04);border-bottom:1px solid rgba(255,255,255,0.07);
    flex-shrink:0;font-family:-apple-system,sans-serif;font-size:11px;flex-wrap:wrap">
    <span style="color:rgba(255,255,255,0.35)">
      <b style="color:var(--accent)">${graph.nodes.length}</b> Maschinentypen
    </span>
    <span style="color:rgba(255,255,255,0.35)">
      <b style="color:var(--accent)">${totalMachines}</b> Maschinen gesamt
    </span>
    <span style="color:rgba(255,255,255,0.35)">
      Raster <b style="color:var(--accent)">${gridW}×${gridH}</b> Tiles
    </span>
    <span style="color:rgba(255,255,255,0.35)">
      Conveyor ${['', 'I', 'II', 'III', 'IV'][LP.BELT_TIER]} (${BELT_CAPACITY[LP.BELT_TIER]}/min)
    </span>
    <span style="flex:1"></span>
    <button onclick="renderLayout()" style="background:rgba(168,85,247,0.15);
      border:1px solid rgba(168,85,247,0.3);color:#a855f7;padding:3px 10px;
      border-radius:4px;cursor:pointer;font-size:10px;font-family:-apple-system,sans-serif">
      ↺ Aktualisieren
    </button>
  </div>`;

  container.innerHTML = statsBar + `<div style="flex:1;overflow:auto;padding:16px">
    ${buildLayoutSVG(tileData)}
  </div>`;
}
