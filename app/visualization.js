// ============================================================
// app/visualization.js
// ============================================================
// Provides two interchangeable visualizations of the production
// graph built from the currently selected recipes:
//
//   1. SANKEY  – D3 Sankey diagram (flow-width encodes rate)
//   2. BOXES   – Custom BFS box-and-arrow layout (equal-size nodes)
//
// Both views share the same data source: buildSankeyGraph(), which
// traverses selectedRecipeList and recursively expands ingredients
// using RECIPES.  The result is a { nodes, links } graph where:
//
//   nodes[i] = { label, rate, kind, machineCount, machineName }
//     kind = 'raw' | 'mid' | 'final'
//       raw   – ore / fluid with no recipe ingredients (leaves)
//       final – explicitly selected output product (roots)
//       mid   – intermediate product (interior nodes)
//
//   links[i] = { source: label, target: label, value: rate/min }
//
// Both renderers use D3 zoom/pan so the user can navigate large graphs.
// A "dirty flag" per renderer skips redraws when the tab is hidden;
// the render is deferred until the tab becomes visible again.
//
// Dependency chain (must be loaded before this file):
//   data/game-data.js   → M, I (via MINING_MACHINES / FLUID_MACHINES)
//   data/recipes.js     → RECIPES
//   data/icons.js       → getIcon()
//   app/state.js        → selectedRecipeList, resolveRecipeName,
//                          botEfficiencyOverrides, minerSettings,
//                          globalMining/FluidProductivity, getItemWsBonus,
//                          MINING_MACHINES, FLUID_MACHINES
//   app/calculation.js  → getOutputAmount()
//   app/ui-nav.js       → fmt()
// ============================================================

// ============================================================
// COLOR PALETTES
// ============================================================
// Single source of truth for visualization colors.
//
// VIZ_COLORS_DARK  – built-in palette used for the "default" and "dark"
//                    themes.  Both _drawSankey and _drawBoxes fall back to
//                    this when window.__sankeyColors is null.
//
// window.__sankeyColors  – set by __applyTheme() in theme.js whenever the
//                          active theme needs a different palette (e.g. light).
//                          null means "use VIZ_COLORS_DARK".
//
// Shape of each palette:
//   raw   / mid / final: { fill, stroke, text, card, cborder }
//   link: string  (CSS color for flow paths)
const VIZ_COLORS_DARK = {
  raw:   { fill: '#122a12', stroke: '#2a6a2a', text: '#6adf6a', card: '#0e2010', cborder: '#1a4a1a' },
  mid:   { fill: '#0a1628', stroke: '#1e3a70', text: '#6a9adf', card: '#080f1e', cborder: '#162040' },
  final: { fill: '#2a1206', stroke: '#7a3010', text: '#e08050', card: '#1e0e04', cborder: '#5a2010' },
  link:  '#4a8adf',
};
// Expose so theme.js can reference the same palette for legend swatches
// (theme.js is loaded before this file, so it reads this on user-triggered
// theme switches, which always happen after all scripts have loaded).
window.__vizDefaultColors = VIZ_COLORS_DARK;

// ============================================================
// GRAPH DATA BUILDER
// ============================================================

// Builds the abstract { nodes, links } graph shared by both renderers.
// Returns null if there is nothing to show (empty list or no links).
//
// Algorithm:
//   For each final product in selectedRecipeList:
//     1. Mark the product node as 'final' with the actual (rounded-up)
//        machine count and output rate.
//     2. For each ingredient, call expand() recursively.
//
//   expand(itemName, rateNeeded, visitedPath):
//     • Resolve variant name (e.g. "Xenoferrite Plates" → tier X)
//     • If no recipe / no ingredients → mark as 'raw', stop.
//     • Otherwise compute ingredient rates from cycleTime and recurse.
//     • Accumulate node.rate (total rate passing through this node)
//       and node.machineCount (unrounded, for display).
//     • Record edges via addEdge(), de-duplicating parallel paths.
function buildSankeyGraph() {
  if (!selectedRecipeList.length) return null;

  const nodeMap = {}; // label → node object
  const edgeMap = {}; // "src|||tgt" → link object (for de-duplication)
  const links   = [];

  // Returns (and lazily creates) the node for a given label.
  function getNode(label, kind) {
    if (!nodeMap[label]) nodeMap[label] = { label, rate: 0, kind: kind || 'mid', machineCount: 0, machineName: null };
    return nodeMap[label];
  }

  // Adds a directed edge from srcLabel to tgtLabel with flow `value`.
  // If the edge already exists (two recipes sharing an ingredient),
  // the value is accumulated instead of creating a duplicate link.
  function addEdge(srcLabel, tgtLabel, value) {
    const key = srcLabel + '|||' + tgtLabel;
    if (edgeMap[key]) { edgeMap[key].value += value; }
    else { const lnk = { source: srcLabel, target: tgtLabel, value }; edgeMap[key] = lnk; links.push(lnk); }
  }

  // Returns true if an item has no further recipe to expand into —
  // i.e., it is a raw ore, a pumped fluid, or hand-crafted with no
  // ingredients.  Raw nodes become leaf nodes in the graph.
  function isRaw(name) {
    const r = RECIPES[resolveRecipeName(name)];
    return !r || !r.ingredients || r.ingredients.length === 0 ||
           !r.machines || Object.keys(r.machines).length === 0 ||
           getOutputAmount(r) === 0;
  }

  // Recursively expands an ingredient node.
  // Returns the resolved label (after variant substitution) so the
  // caller can connect an edge to it.
  // `visitedPath` is the Set of resolved names already on the call stack;
  // it detects cycles (A → B → A) and stops expansion at the repeated node.
  function expand(itemName, rateNeeded, visitedPath) {
    const resolved = resolveRecipeName(itemName);
    if (visitedPath.has(resolved)) return null; // cycle — stop expanding
    if (visitedPath.size > 50)    return null; // secondary safety cap

    const raw  = isRaw(resolved);
    const node = getNode(resolved, raw ? 'raw' : 'mid');
    node.rate += rateNeeded; // accumulate total throughput
    if (raw) return resolved; // leaf — do not recurse further

    const r  = RECIPES[resolved];
    const [machineName, md] = Object.entries(r.machines)[0]; // use first machine (default)
    const opm  = (60 / md.cycleTime) * getOutputAmount(r);   // output items/min per machine
    const runs = rateNeeded / opm; // how many machines are needed (fractional, not rounded)

    // Accumulate machine type and fractional count for display in info cards
    node.machineName   = machineName;
    node.machineCount += runs;

    const nextPath = new Set(visitedPath);
    nextPath.add(resolved);

    // Recurse into each ingredient at the computed rate
    r.ingredients.forEach(ing => {
      const ingRate  = runs * ing.amount * (60 / md.cycleTime);
      const ingLabel = expand(ing.item, ingRate, nextPath);
      if (ingLabel) addEdge(ingLabel, resolved, ingRate);
    });

    return resolved;
  }

  // ── Root nodes: the user's selected final products ────────
  selectedRecipeList.forEach(item => {
    const r = RECIPES[item.recipeName || item.name];
    if (!r || !r.machines[item.machineName]) return;

    const ct  = r.machines[item.machineName].cycleTime;

    // Apply the same bonus stack as calculateRecipes()
    const eff = 1 + ((botEfficiencyOverrides[item.itemName] ?? (r.efficiency ?? 0)) / 100);
    const mB  = MINING_MACHINES.has(item.machineName) ? globalMiningProductivity / 100 : 0;
    const fB  = FLUID_MACHINES.has(item.machineName)  ? globalFluidProductivity  / 100 : 0;
    const wsB = getItemWsBonus(item);

    const opm      = (60 / ct) * getOutputAmount(r) * eff * (1 + mB + fB + wsB);
    const machines = Math.ceil(item.goal / opm); // rounded-up integer
    const actualOpm = machines * opm;

    const node = getNode(item.itemName, 'final');
    node.rate        += actualOpm;
    node.kind         = 'final';  // override any earlier 'mid' classification
    node.machineName  = item.machineName;
    node.machineCount += machines;

    // Add edges from each ingredient to this final product.
    // Seed the visited path with the final product itself so that any
    // ingredient cycle back to it is caught immediately.
    r.ingredients.forEach(ing => {
      const ingRate  = (60 / ct) * ing.amount * machines;
      const ingLabel = expand(ing.item, ingRate, new Set([item.itemName]));
      if (ingLabel) addEdge(ingLabel, item.itemName, ingRate);
    });
  });

  const nodes = Object.values(nodeMap);
  // Need at least 2 nodes and 1 link to draw a meaningful graph
  if (nodes.length < 2 || links.length === 0) return null;
  return { nodes, links };
}

// ============================================================
// SANKEY — Rendering mit D3
// ============================================================

// Dirty flag: set to true when data changes but the tab is hidden.
// renderSankey() checks this on entry and skips the draw if not visible,
// then redraws on the next call (e.g. when the tab is opened).
let _sankeyDirty = false;

// Entry point for the Sankey view.
// Called by calculateRecipes() after every state change, and by
// switchMainTab() / switchVizMode() when the Sankey tab becomes visible.
function renderSankey() {
  const tab = document.getElementById('tab-sankey');
  // If the tab is hidden, mark dirty and return — avoids wasted D3 work
  if (!tab || tab.style.display === 'none') {
    _sankeyDirty = true;
    return;
  }

  const svg    = document.getElementById('sankeySvg');
  const empty  = document.getElementById('sankeyEmpty');
  const legend = document.getElementById('sankeyLegend');

  const data = buildSankeyGraph();
  if (!data) {
    // No recipes selected → show empty-state placeholder
    svg.style.display    = 'none';
    legend.style.display = 'none';
    empty.style.display  = 'flex';
    _sankeyDirty = false;
    return;
  }
  empty.style.display  = 'none';
  svg.style.display    = 'block';
  legend.style.display = 'flex';
  _sankeyDirty = false;

  _drawSankey(svg, data);
}
// Expose renderSankey so that __applyTheme() in theme.js can call it
// after a palette change without importing this module.
window.__renderSankey = renderSankey;

// ============================================================
// BOXES & LINES — Renderer
// ============================================================

// Same dirty-flag pattern as the Sankey view.
let _boxesDirty = false;

// Entry point for the Box view.
// Shares the same data builder as Sankey; only the rendering differs.
function renderBoxes() {
  const tab = document.getElementById('tab-boxes');
  if (!tab || tab.style.display === 'none') { _boxesDirty = true; return; }

  const svg    = document.getElementById('boxesSvg');
  const empty  = document.getElementById('boxesEmpty');
  const legend = document.getElementById('boxesLegend');
  const data   = buildSankeyGraph();

  if (!data) {
    svg.style.display    = 'none';
    legend.style.display = 'none';
    empty.style.display  = 'flex';
    _boxesDirty = false;
    return;
  }
  empty.style.display  = 'none';
  svg.style.display    = 'block';
  legend.style.display = 'flex';
  _boxesDirty = false;
  _drawBoxes(svg, data);
}
window.__renderBoxes = renderBoxes;

// Draws the box-and-arrow layout onto `svgEl`.
//
// Layout algorithm:
//   1. Build an adjacency list from data.links.
//   2. BFS from source nodes (no incoming edges) to assign each node
//      a column depth (longest-path assignment ensures correct order).
//   3. Group nodes by depth → columns.
//   4. Vertically center each column; assign (x, y) to each node.
//   5. Draw Bezier curves between box right/left edges.
//   6. Draw boxes as rounded rectangles with a top accent stripe,
//      item name, machine type + count, and flow rate label.
//
// Uses D3 only for SVG manipulation and zoom/pan; the layout is custom.
function _drawBoxes(svgEl, data) {
  const wrap = document.getElementById('boxesWrap');
  const W = (wrap ? wrap.getBoundingClientRect().width  : 0) || 1100;
  const H = (wrap ? wrap.getBoundingClientRect().height : 0) || 650;

  // Color palette — overridden by __applyTheme() for the light theme
  const COLOR = window.__sankeyColors || VIZ_COLORS_DARK;

  // ── Step 1: Assign topological depth (column) to each node ──
  const nodeMap = {};
  data.nodes.forEach(n => { nodeMap[n.label] = n; n.depth = 0; });

  // Build adjacency lists
  const inEdges  = {}; // label → [source labels that feed into it]
  const outEdges = {}; // label → [target labels it feeds into]
  data.nodes.forEach(n => { inEdges[n.label] = []; outEdges[n.label] = []; });
  data.links.forEach(l => {
    // Links may have resolved D3 objects or plain strings as source/target
    const s = typeof l.source === 'object' ? l.source.label : l.source;
    const t = typeof l.target === 'object' ? l.target.label : l.target;
    outEdges[s].push(t);
    inEdges[t].push(s);
  });

  // BFS from source nodes (no incoming edges).
  // Uses longest-path assignment: if multiple paths reach a node,
  // the deepest depth wins so nodes always appear to the right of all
  // their predecessors.
  const visited = new Set();
  const queue   = data.nodes.filter(n => inEdges[n.label].length === 0).map(n => { n.depth = 0; return n.label; });
  queue.forEach(l => visited.add(l));

  while (queue.length) {
    const cur = queue.shift();
    outEdges[cur].forEach(tgt => {
      const d = nodeMap[cur].depth + 1;
      if (d > nodeMap[tgt].depth) nodeMap[tgt].depth = d; // longest path wins
      if (!visited.has(tgt)) { visited.add(tgt); queue.push(tgt); }
    });
  }

  // ── Step 2: Group nodes into depth columns ────────────────
  const maxDepth  = Math.max(...data.nodes.map(n => n.depth));
  const columns   = Array.from({ length: maxDepth + 1 }, () => []);
  data.nodes.forEach(n => columns[n.depth].push(n));

  // ── Step 3: Compute (x, y) positions ─────────────────────
  const BOX_W  = 140;
  const BOX_H  = 64;
  const GAP_X  = 110; // horizontal spacing between column left edges
  const GAP_Y  = 24;  // vertical spacing between boxes in the same column

  const totalW  = (maxDepth + 1) * (BOX_W + GAP_X) - GAP_X;
  const colH    = columns.map(col => col.length * (BOX_H + GAP_Y) - GAP_Y);
  const maxColH = Math.max(...colH);

  // Vertically center each column relative to the tallest column
  columns.forEach((col, ci) => {
    const x         = ci * (BOX_W + GAP_X);
    const colTotalH = col.length * (BOX_H + GAP_Y) - GAP_Y;
    const offsetY   = (maxColH - colTotalH) / 2;
    col.forEach((n, ri) => {
      n._x = x;
      n._y = offsetY + ri * (BOX_H + GAP_Y);
    });
  });

  // ── Step 4: SVG setup with D3 zoom/pan ───────────────────
  const svg = d3.select(svgEl);
  svg.selectAll('*').remove(); // clear previous render

  const g = svg.append('g'); // main drawing group (transformed by zoom)

  const zoom = d3.zoom().scaleExtent([0.15, 4]).on('zoom', e => g.attr('transform', e.transform));
  svg.call(zoom);
  svgEl.style.cursor = 'grab';

  // Fit the whole graph into the visible area on first render
  const scaleX = (W - 80) / (totalW || 1);
  const scaleY = (H - 80) / (maxColH || 1);
  const scale  = Math.min(scaleX, scaleY, 1); // never zoom in beyond 1:1
  const tx = (W - totalW * scale) / 2;
  const ty = (H - maxColH * scale) / 2;
  svg.call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));

  // ── Step 5: Arrow markers (one per node kind) ────────────
  const defs = svg.append('defs');
  ['raw','mid','final'].forEach(kind => {
    const c = COLOR[kind];
    defs.append('marker')
      .attr('id', `arrow-${kind}`)
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 10).attr('refY', 0)
      .attr('markerWidth', 7).attr('markerHeight', 7)
      .attr('orient', 'auto')
      .append('path').attr('d', 'M0,-5L10,0L0,5').attr('fill', c.stroke).attr('opacity', 0.85);
  });
  // Fallback arrow for links whose target kind is undefined
  defs.append('marker')
    .attr('id', 'arrow-default')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 10).attr('refY', 0)
    .attr('markerWidth', 7).attr('markerHeight', 7)
    .attr('orient', 'auto')
    .append('path').attr('d', 'M0,-5L10,0L0,5').attr('fill', COLOR.link).attr('opacity', 0.7);

  // ── Step 6: Draw links (Bezier curves) ───────────────────
  const linkG = g.append('g');
  data.links.forEach(link => {
    const s = nodeMap[typeof link.source === 'object' ? link.source.label : link.source];
    const t = nodeMap[typeof link.target === 'object' ? link.target.label : link.target];
    if (!s || !t) return;

    // Connect right edge of source to left edge of target, mid-point control
    const x1 = s._x + BOX_W;
    const y1 = s._y + BOX_H / 2;
    const x2 = t._x;
    const y2 = t._y + BOX_H / 2;
    const mx = (x1 + x2) / 2; // x of both cubic Bezier control points

    const markerKind  = t.kind || 'mid';
    const strokeColor = t.kind === 'raw'   ? COLOR.raw.stroke
                      : t.kind === 'final' ? COLOR.final.stroke
                      : COLOR.mid.stroke;

    // Cubic Bezier curve: C mx,y1  mx,y2  x2,y2
    linkG.append('path')
      .attr('d', `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`)
      .attr('fill', 'none')
      .attr('stroke', strokeColor)
      .attr('stroke-width', 1.8)
      .attr('stroke-opacity', 0.65)
      .attr('marker-end', `url(#arrow-${markerKind})`);

    // Flow rate label centred on the Bezier midpoint
    const rateVal  = link.value;
    const rateText = rateVal >= 1000
      ? (rateVal / 1000).toFixed(1) + 'k/min'
      : Math.round(rateVal * 10) / 10 + '/min';

    const lx = mx;
    const ly = (y1 + y2) / 2 - 6;

    // Pill background for readability
    linkG.append('rect')
      .attr('x', lx - 26).attr('y', ly - 11)
      .attr('width', 52).attr('height', 16)
      .attr('rx', 4)
      .attr('fill', 'rgba(8,8,24,0.75)')
      .attr('stroke', strokeColor).attr('stroke-opacity', 0.4).attr('stroke-width', 0.8);

    linkG.append('text')
      .attr('x', lx).attr('y', ly)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('fill', strokeColor)
      .attr('font-size', 9)
      .attr('font-family', 'monospace')
      .text('× ' + rateText);
  });

  // ── Step 7: Draw node boxes ───────────────────────────────
  const nodeG = g.append('g');
  data.nodes.forEach(n => {
    const C  = COLOR[n.kind] || COLOR.mid;
    const ng = nodeG.append('g')
      .attr('transform', `translate(${n._x},${n._y})`)
      .style('cursor', 'default');

    // Drop shadow for depth effect
    ng.append('rect')
      .attr('x', 2).attr('y', 3)
      .attr('width', BOX_W).attr('height', BOX_H)
      .attr('rx', 10)
      .attr('fill', 'rgba(0,0,0,0.35)')
      .attr('filter', 'blur(4px)');

    // Main box rectangle
    ng.append('rect')
      .attr('width', BOX_W).attr('height', BOX_H)
      .attr('rx', 10)
      .attr('fill', C.fill)
      .attr('stroke', C.stroke)
      .attr('stroke-width', 1.5)
      .attr('stroke-opacity', 0.9);

    // Top accent stripe (matches node kind colour)
    ng.append('rect')
      .attr('x', 10).attr('y', 0)
      .attr('width', BOX_W - 20).attr('height', 2)
      .attr('rx', 1)
      .attr('fill', C.stroke)
      .attr('opacity', 0.8);

    // Item label (truncated at 18 chars to fit box width)
    const label = n.label.length > 18 ? n.label.slice(0, 17) + '…' : n.label;
    ng.append('text')
      .attr('x', BOX_W / 2).attr('y', 20)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('fill', C.text)
      .attr('font-size', 11)
      .attr('font-weight', 600)
      .attr('font-family', '-apple-system,sans-serif')
      .text(label);

    // Divider line between label and stats
    ng.append('line')
      .attr('x1', 10).attr('y1', 32)
      .attr('x2', BOX_W - 10).attr('y2', 32)
      .attr('stroke', C.stroke).attr('stroke-opacity', 0.3);

    // Machine name (left) + count (right)
    if (n.machineName && n.machineCount > 0) {
      const mcText = n.machineName.length > 12 ? n.machineName.slice(0,11)+'…' : n.machineName;
      ng.append('text')
        .attr('x', 10).attr('y', 46)
        .attr('dominant-baseline', 'middle')
        .attr('fill', C.text)
        .attr('font-size', 9.5)
        .attr('opacity', 0.75)
        .attr('font-family', 'monospace')
        .text(mcText);

      // Show one decimal for small counts, integer for large ones
      const cnt = Math.ceil(n.machineCount * 10) / 10;
      ng.append('text')
        .attr('x', BOX_W - 8).attr('y', 46)
        .attr('text-anchor', 'end')
        .attr('dominant-baseline', 'middle')
        .attr('fill', C.text)
        .attr('font-size', 10)
        .attr('font-weight', 700)
        .attr('font-family', 'monospace')
        .text('×' + (cnt === Math.floor(cnt) ? cnt : cnt.toFixed(1)));
    }

    // Flow rate at bottom centre
    const rate = n.rate >= 1000 ? (n.rate/1000).toFixed(1)+'k' : Math.round(n.rate*10)/10;
    ng.append('text')
      .attr('x', BOX_W / 2).attr('y', 57)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('fill', C.text)
      .attr('font-size', 8.5)
      .attr('opacity', 0.55)
      .attr('font-family', 'monospace')
      .text(rate + '/min');
  });
}

// ============================================================
// SANKEY — D3 Rendering
// ============================================================
//
// Uses d3-sankey (v0.12.3) embedded in index.html.
// The layout computes vertical node position and link widths
// proportional to flow rate.
//
// Info cards are rendered as HTML <div>s inside SVG <foreignObject>
// elements placed left or right of each node depending on which side
// has more space (determined by whether x0 < half the inner width).
function _drawSankey(svgEl, data) {
  const wrap = document.getElementById('sankeyWrap');
  const W = (wrap ? wrap.getBoundingClientRect().width  : 0) || 1100;
  const H = (wrap ? wrap.getBoundingClientRect().height : 0) || 650;

  const NODE_W = 18;          // width of each Sankey bar
  const CARD_W = 150;         // info card width (rendered as HTML div)
  const CARD_H = 62;          // minimum info card height
  // Horizontal padding reserves space for the info cards on both sides
  const PAD    = { top: 20, right: CARD_W + 20, bottom: 40, left: CARD_W + 20 };
  const IW     = W - PAD.left - PAD.right;   // inner drawable width
  const IH     = H - PAD.top  - PAD.bottom;  // inner drawable height

  // Color palette — overridden by __applyTheme() for the light theme
  const COLOR = window.__sankeyColors || VIZ_COLORS_DARK;

  const svg = d3.select(svgEl);
  svg.selectAll('*').remove();

  // D3 zoom/pan — applies to the inner <g> group
  const zoom = d3.zoom().scaleExtent([0.25, 4]).on('zoom', e => {
    g.attr('transform', e.transform);
  });
  svg.call(zoom);
  svgEl.style.cursor = 'grab';

  // g is declared before zoom handler so closure captures it correctly
  const g = svg.append('g').attr('transform', `translate(${PAD.left},${PAD.top})`);

  // Configure the d3-sankey layout
  const sankeyLayout = d3.sankey()
    .nodeId(d => d.label)      // unique node identifier
    .nodeWidth(NODE_W)
    .nodePadding(16)            // vertical gap between stacked nodes
    .extent([[0, 0], [IW, IH]]);

  // Run the layout — mutates copies of nodes/links with x0,x1,y0,y1,width
  const graph = sankeyLayout({
    nodes: data.nodes.map(d => ({ ...d })), // shallow copy to avoid mutating originals
    links: data.links.map(d => ({ ...d })),
  });

  // ── Draw flow links ───────────────────────────────────────
  // Link width is proportional to flow value (items/min).
  // Opacity increases on hover for readability; tooltip shows exact rate.
  g.append('g').attr('fill', 'none')
    .selectAll('path').data(graph.links).join('path')
      .attr('d', d3.sankeyLinkHorizontal()) // d3-sankey cubic Bezier path generator
      .attr('stroke', COLOR.link)
      .attr('stroke-width', d => Math.max(1, d.width))
      .attr('stroke-opacity', 0.18)
      .on('mouseenter', function(event, d) {
        d3.select(this).attr('stroke-opacity', 0.55);
        _showTooltip(event,
          `<div style="color:var(--accent);font-weight:700;margin-bottom:3px">${d.source.label} → ${d.target.label}</div>
           <div style="color:var(--accent3)">${fmt(Math.round(d.value))} / min</div>`);
      })
      .on('mousemove', _moveTooltip)
      .on('mouseleave', function() {
        d3.select(this).attr('stroke-opacity', 0.18);
        _hideTooltip();
      });

  // ── Draw node bars ────────────────────────────────────────
  const nodeG = g.append('g').selectAll('g').data(graph.nodes).join('g');

  nodeG.append('rect')
    .attr('x',      d => d.x0).attr('y', d => d.y0)
    .attr('width',  d => d.x1 - d.x0)
    .attr('height', d => Math.max(3, d.y1 - d.y0)) // minimum 3px so tiny flows remain visible
    .attr('rx', 3)
    .attr('fill',   d => COLOR[d.kind].fill)
    .attr('stroke', d => COLOR[d.kind].stroke)
    .attr('stroke-width', 1.5);

  // ── Info cards (HTML inside foreignObject) ────────────────
  // Cards are placed to the right of nodes in the left half of the
  // diagram, and to the left of nodes in the right half, so they
  // never overlap the main layout area.
  nodeG.append('foreignObject')
    .attr('x', d => {
      const onLeft = d.x0 < IW / 2;
      return onLeft ? d.x1 + 8 : d.x0 - CARD_W - 8;
    })
    .attr('y', d => {
      const h = Math.max(CARD_H, d.y1 - d.y0);
      return (d.y0 + d.y1) / 2 - h / 2;
    })
    .attr('width',  CARD_W)
    .attr('height', d => Math.max(CARD_H, d.y1 - d.y0))
    .append('xhtml:div')
    .style('width',       CARD_W + 'px')
    .style('height',      '100%')
    .style('display',     'flex')
    .style('align-items', 'center')
    .style('box-sizing',  'border-box')
    .html(d => {
      const c      = COLOR[d.kind];
      const nodeH  = Math.max(CARD_H, d.y1 - d.y0);

      const itemIconHtml    = getIcon(d.label, 24);
      const machineIconHtml = d.machineName ? getIcon(d.machineName, 20) : '';

      // Machine count display:
      //   raw nodes (ores/miners) → ceil to integer
      //   small intermediate counts → one decimal
      //   large intermediate counts → ceil
      const cntRaw = d.machineCount || 0;
      const cntFmt = d.kind === 'raw'
        ? Math.ceil(cntRaw)
        : cntRaw < 10 ? (Math.round(cntRaw * 10) / 10) : Math.ceil(cntRaw);

      const machineLabel = d.machineName
        ? `<div style="display:flex;align-items:center;gap:4px;margin-top:3px">
            ${machineIconHtml}
            <span style="color:#aaa;font-size:10px">×${cntFmt}</span>
           </div>`
        : '';

      return `<div style="
        background:${c.card};
        border:1px solid ${c.cborder};
        border-radius:5px;
        padding:5px 7px;
        width:100%;
        min-height:${Math.min(nodeH, CARD_H)}px;
        display:flex;flex-direction:column;justify-content:center;
        box-sizing:border-box;overflow:hidden">
        <div style="display:flex;align-items:center;gap:5px">
          ${itemIconHtml}
          <span style="color:${c.text};font-size:10px;font-family:monospace;
            white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:${CARD_W - 46}px">
            ${d.label}
          </span>
        </div>
        <div style="color:var(--accent3);font-family:monospace;font-size:11px;margin-top:2px">
          ${fmt(Math.round(d.rate))}<span style="color:#666;font-size:9px">/min</span>
        </div>
        ${machineLabel}
      </div>`;
    });
}

// ============================================================
// TOOLTIP HELPERS (Sankey link hover)
// ============================================================

// Shows the link tooltip with given HTML content near the cursor.
function _showTooltip(event, html) {
  const tt         = document.getElementById('sankeyTooltip');
  tt.innerHTML     = html;
  tt.style.display = 'block';
  _moveTooltip(event);
}

// Repositions the tooltip to follow the cursor, keeping it within
// the sankeyWrap container bounds.
function _moveTooltip(event) {
  const tt   = document.getElementById('sankeyTooltip');
  const wrap = document.getElementById('sankeyWrap');
  if (!wrap) return;
  const rect = wrap.getBoundingClientRect();
  let x = event.clientX - rect.left + 14;
  let y = event.clientY - rect.top  - 10;
  // Flip to the left / up if the tooltip would overflow the container
  if (x + 250 > wrap.clientWidth)  x = event.clientX - rect.left - 260;
  if (y + 100 > wrap.clientHeight) y = event.clientY - rect.top  - 80;
  tt.style.left = x + 'px';
  tt.style.top  = y + 'px';
}

// Hides the tooltip.
function _hideTooltip() {
  document.getElementById('sankeyTooltip').style.display = 'none';
}

// ============================================================
// GLOBAL CLICK HANDLER
// ============================================================
// Handles two click-delegation patterns to avoid attaching many
// individual listeners to dynamically rendered elements:
//
//   1. Close the recipe search dropdown when clicking outside it.
//   2. Workstation row expand/collapse and mode-switch buttons
//      (data-action="wstoggle" / "wsmode") in the recipe list.
document.addEventListener("click", function (e) {
  // Close recipe inline search dropdown on outside click
  const search  = document.getElementById("recipeSearch");
  const results = document.getElementById("recipeInlineResults");
  if (results && search && !search.contains(e.target) && !results.contains(e.target)) {
    results.style.display = "none";
  }

  // Workstation expand / mode buttons use data-action attribute delegation
  const btn = e.target.closest("[data-action]");
  if (!btn) return;
  const action = btn.dataset.action;
  const idx    = parseInt(btn.dataset.idx);

  if (action === "wstoggle") {
    // Toggle the workstation config section open/closed for this recipe row
    selectedRecipeList[idx].wsExpanded = !selectedRecipeList[idx].wsExpanded;
    renderSelectedRecipes();
  } else if (action === "wsmode") {
    // Switch the workstation assignment mode (global / per-item / disabled)
    updateItemWsMode2(idx, btn.dataset.mode);
  }
});

// ============================================================
// INIT
// ============================================================
// Build the bot sidebar list on first load.
// The recipe list itself is initialised by initRecipeCalc() called
// from the inline <script> at the bottom of index.html.
buildRecipeCategoryList();
