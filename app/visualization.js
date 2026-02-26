function buildSankeyGraph() {
  if (!selectedRecipeList.length) return null;

  const nodeMap = {};
  const edgeMap = {};
  const links   = [];

  function getNode(label, kind) {
    if (!nodeMap[label]) nodeMap[label] = { label, rate: 0, kind: kind || 'mid', machineCount: 0, machineName: null };
    return nodeMap[label];
  }

  function addEdge(srcLabel, tgtLabel, value) {
    const key = srcLabel + '|||' + tgtLabel;
    if (edgeMap[key]) { edgeMap[key].value += value; }
    else { const lnk = { source: srcLabel, target: tgtLabel, value }; edgeMap[key] = lnk; links.push(lnk); }
  }

  function isRaw(name) {
    const r = RECIPES[resolveRecipeName(name)];
    return !r || !r.ingredients || r.ingredients.length === 0 ||
           !r.machines || Object.keys(r.machines).length === 0 ||
           getOutputAmount(r) === 0;
  }

  function expand(itemName, rateNeeded, depth) {
    if (depth > 20) return null;
    const resolved = resolveRecipeName(itemName);
    const raw  = isRaw(resolved);
    const node = getNode(resolved, raw ? 'raw' : 'mid');
    node.rate += rateNeeded;
    if (raw) return resolved;

    const r  = RECIPES[resolved];
    const [machineName, md] = Object.entries(r.machines)[0];
    const opm  = (60 / md.cycleTime) * getOutputAmount(r);
    const runs = rateNeeded / opm;
    const cnt  = rateNeeded / opm;  // Maschinen = runs (nicht gerundet, da aggregiert)

    // Maschine + Anzahl akkumulieren
    node.machineName   = machineName;
    node.machineCount += cnt;

    r.ingredients.forEach(ing => {
      const ingRate  = runs * ing.amount * (60 / md.cycleTime);
      const ingLabel = expand(ing.item, ingRate, depth + 1);
      if (ingLabel) addEdge(ingLabel, resolved, ingRate);
    });

    return resolved;
  }

  // Endprodukte
  selectedRecipeList.forEach(item => {
    const r = RECIPES[item.recipeName || item.name];
    if (!r || !r.machines[item.machineName]) return;
    const ct  = r.machines[item.machineName].cycleTime;
    const eff = 1 + ((botEfficiencyOverrides[item.itemName] ?? (r.efficiency ?? 0)) / 100);
    const mB  = MINING_MACHINES.has(item.machineName) ? globalMiningProductivity / 100 : 0;
    const fB  = FLUID_MACHINES.has(item.machineName)  ? globalFluidProductivity  / 100 : 0;
    const wsB = getItemWsBonus(item);
    const opm      = (60 / ct) * getOutputAmount(r) * eff * (1 + mB + fB + wsB);
    const machines = Math.ceil(item.goal / opm);
    const actualOpm = machines * opm;

    const node = getNode(item.itemName, 'final');
    node.rate        += actualOpm;
    node.kind         = 'final';
    node.machineName  = item.machineName;
    node.machineCount += machines;

    r.ingredients.forEach(ing => {
      const ingRate  = (60 / ct) * ing.amount * machines;
      const ingLabel = expand(ing.item, ingRate, 0);
      if (ingLabel) addEdge(ingLabel, item.itemName, ingRate);
    });
  });

  const nodes = Object.values(nodeMap);
  if (nodes.length < 2 || links.length === 0) return null;
  return { nodes, links };
}

// ============================================================
// SANKEY — Rendering mit D3
// ============================================================

let _sankeyDirty = false;  // true = Daten haben sich geändert, neu zeichnen nötig

function renderSankey() {
  const tab = document.getElementById('tab-sankey');
  // Wenn Tab nicht sichtbar: nur als dirty markieren, beim Öffnen neu zeichnen
  if (!tab || tab.style.display === 'none') {
    _sankeyDirty = true;
    return;
  }

  const svg    = document.getElementById('sankeySvg');
  const empty  = document.getElementById('sankeyEmpty');
  const legend = document.getElementById('sankeyLegend');

  const data = buildSankeyGraph();
  if (!data) {
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
window.__renderSankey = renderSankey; // exposed for theme switching

// ============================================================
// BOXES & LINES — Renderer
// ============================================================

let _boxesDirty = false;

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

function _drawBoxes(svgEl, data) {
  const wrap = document.getElementById('boxesWrap');
  const W = (wrap ? wrap.getBoundingClientRect().width  : 0) || 1100;
  const H = (wrap ? wrap.getBoundingClientRect().height : 0) || 650;

  const COLOR = window.__sankeyColors || {
    raw:   { fill: '#0e2010', stroke: '#2a6a2a', text: '#6adf6a', card: '#0a1a0a', cborder: '#1a4a1a' },
    mid:   { fill: '#080f1e', stroke: '#1e3a70', text: '#6a9adf', card: '#060c18', cborder: '#162040' },
    final: { fill: '#1e0e04', stroke: '#7a3010', text: '#e08050', card: '#180a02', cborder: '#5a2010' },
    link:  '#4a8adf',
  };

  // ── Topological depth assignment ──────────────────────────
  const nodeMap = {};
  data.nodes.forEach(n => { nodeMap[n.label] = n; n.depth = 0; });

  // Build adjacency
  const inEdges  = {}; // label → [source labels]
  const outEdges = {}; // label → [target labels]
  data.nodes.forEach(n => { inEdges[n.label] = []; outEdges[n.label] = []; });
  data.links.forEach(l => {
    const s = typeof l.source === 'object' ? l.source.label : l.source;
    const t = typeof l.target === 'object' ? l.target.label : l.target;
    outEdges[s].push(t);
    inEdges[t].push(s);
  });

  // BFS from sources (no incoming) to assign column depth
  const visited = new Set();
  const queue   = data.nodes.filter(n => inEdges[n.label].length === 0).map(n => { n.depth = 0; return n.label; });
  queue.forEach(l => visited.add(l));

  while (queue.length) {
    const cur = queue.shift();
    outEdges[cur].forEach(tgt => {
      const d = nodeMap[cur].depth + 1;
      if (d > nodeMap[tgt].depth) nodeMap[tgt].depth = d;
      if (!visited.has(tgt)) { visited.add(tgt); queue.push(tgt); }
    });
  }

  // Group by depth column
  const maxDepth  = Math.max(...data.nodes.map(n => n.depth));
  const columns   = Array.from({ length: maxDepth + 1 }, () => []);
  data.nodes.forEach(n => columns[n.depth].push(n));

  // ── Layout constants ──────────────────────────────────────
  const BOX_W  = 140;
  const BOX_H  = 64;
  const GAP_X  = 110;  // horizontal gap between columns
  const GAP_Y  = 24;   // vertical gap between nodes in same column
  const PAD    = { top: 40, left: 40 };

  // Total width / height needed
  const totalW = (maxDepth + 1) * (BOX_W + GAP_X) - GAP_X;
  const colH   = columns.map(col => col.length * (BOX_H + GAP_Y) - GAP_Y);
  const maxColH = Math.max(...colH);
  const totalH  = maxColH;

  // Assign (x, y) to each node
  columns.forEach((col, ci) => {
    const x = ci * (BOX_W + GAP_X);
    const colTotalH = col.length * (BOX_H + GAP_Y) - GAP_Y;
    const offsetY   = (maxColH - colTotalH) / 2;
    col.forEach((n, ri) => {
      n._x = x;
      n._y = offsetY + ri * (BOX_H + GAP_Y);
    });
  });

  // ── SVG setup ─────────────────────────────────────────────
  const svg = d3.select(svgEl);
  svg.selectAll('*').remove();

  // Declare g first so zoom handler can reference it
  const g = svg.append('g');

  const zoom = d3.zoom().scaleExtent([0.15, 4]).on('zoom', e => g.attr('transform', e.transform));
  svg.call(zoom);
  svgEl.style.cursor = 'grab';

  // Initial zoom to fit
  const scaleX = (W - 80) / (totalW || 1);
  const scaleY = (H - 80) / (totalH || 1);
  const scale  = Math.min(scaleX, scaleY, 1);
  const tx = (W - totalW * scale) / 2;
  const ty = (H - totalH * scale) / 2;
  svg.call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));

  // Arrow marker
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
  defs.append('marker')
    .attr('id', 'arrow-default')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 10).attr('refY', 0)
    .attr('markerWidth', 7).attr('markerHeight', 7)
    .attr('orient', 'auto')
    .append('path').attr('d', 'M0,-5L10,0L0,5').attr('fill', COLOR.link).attr('opacity', 0.7);

  // ── Draw links ────────────────────────────────────────────
  const linkG = g.append('g');
  data.links.forEach(link => {
    const s = nodeMap[typeof link.source === 'object' ? link.source.label : link.source];
    const t = nodeMap[typeof link.target === 'object' ? link.target.label : link.target];
    if (!s || !t) return;

    const x1 = s._x + BOX_W;
    const y1 = s._y + BOX_H / 2;
    const x2 = t._x;
    const y2 = t._y + BOX_H / 2;
    const mx = (x1 + x2) / 2;

    const markerKind = t.kind || 'mid';
    const strokeColor = t.kind === 'raw' ? COLOR.raw.stroke
                      : t.kind === 'final' ? COLOR.final.stroke
                      : COLOR.mid.stroke;

    // Bezier path
    linkG.append('path')
      .attr('d', `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`)
      .attr('fill', 'none')
      .attr('stroke', strokeColor)
      .attr('stroke-width', 1.8)
      .attr('stroke-opacity', 0.65)
      .attr('marker-end', `url(#arrow-${markerKind})`);

    // Rate label on midpoint
    const rateVal = link.value;
    const rateText = rateVal >= 1000
      ? (rateVal / 1000).toFixed(1) + 'k/min'
      : Math.round(rateVal * 10) / 10 + '/min';

    const lx = mx;
    const ly = (y1 + y2) / 2 - 6;

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

  // ── Draw nodes (boxes) ────────────────────────────────────
  const nodeG = g.append('g');
  data.nodes.forEach(n => {
    const C = COLOR[n.kind] || COLOR.mid;
    const ng = nodeG.append('g')
      .attr('transform', `translate(${n._x},${n._y})`)
      .style('cursor', 'default');

    // Shadow rect
    ng.append('rect')
      .attr('x', 2).attr('y', 3)
      .attr('width', BOX_W).attr('height', BOX_H)
      .attr('rx', 10)
      .attr('fill', 'rgba(0,0,0,0.35)')
      .attr('filter', 'blur(4px)');

    // Main box
    ng.append('rect')
      .attr('width', BOX_W).attr('height', BOX_H)
      .attr('rx', 10)
      .attr('fill', C.fill)
      .attr('stroke', C.stroke)
      .attr('stroke-width', 1.5)
      .attr('stroke-opacity', 0.9);

    // Top accent line
    ng.append('rect')
      .attr('x', 10).attr('y', 0)
      .attr('width', BOX_W - 20).attr('height', 2)
      .attr('rx', 1)
      .attr('fill', C.stroke)
      .attr('opacity', 0.8);

    // Item name (wrapping)
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

    // Divider
    ng.append('line')
      .attr('x1', 10).attr('y1', 32)
      .attr('x2', BOX_W - 10).attr('y2', 32)
      .attr('stroke', C.stroke).attr('stroke-opacity', 0.3);

    // Machine count
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

    // Rate
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

function _drawSankey(svgEl, data) {
  const wrap = document.getElementById('sankeyWrap');
  const W = (wrap ? wrap.getBoundingClientRect().width  : 0) || 1100;
  const H = (wrap ? wrap.getBoundingClientRect().height : 0) || 650;

  const NODE_W = 18;
  const CARD_W = 150;   // Breite der Info-Karte neben dem Node
  const CARD_H = 62;    // Höhe der Karte
  const PAD    = { top: 20, right: CARD_W + 20, bottom: 40, left: CARD_W + 20 };
  const IW     = W - PAD.left - PAD.right;
  const IH     = H - PAD.top  - PAD.bottom;

  const COLOR = window.__sankeyColors || {
    raw:   { fill: '#122a12', stroke: '#2a6a2a', text: '#6adf6a', card: '#0e2010', cborder: '#1a4a1a' },
    mid:   { fill: '#0a1628', stroke: '#1e3a70', text: '#6a9adf', card: '#080f1e', cborder: '#162040' },
    final: { fill: '#2a1206', stroke: '#7a3010', text: '#e08050', card: '#1e0e04', cborder: '#5a2010' },
    link:  '#4a8adf',
  };

  const svg = d3.select(svgEl);
  svg.selectAll('*').remove();

  const zoom = d3.zoom().scaleExtent([0.25, 4]).on('zoom', e => {
    g.attr('transform', e.transform);
  });
  svg.call(zoom);
  svgEl.style.cursor = 'grab';

  const g = svg.append('g').attr('transform', `translate(${PAD.left},${PAD.top})`);

  const sankeyLayout = d3.sankey()
    .nodeId(d => d.label)
    .nodeWidth(NODE_W)
    .nodePadding(16)
    .extent([[0, 0], [IW, IH]]);

  const graph = sankeyLayout({
    nodes: data.nodes.map(d => ({ ...d })),
    links: data.links.map(d => ({ ...d })),
  });

  // ── Links ──────────────────────────────────────────────
  g.append('g').attr('fill', 'none')
    .selectAll('path').data(graph.links).join('path')
      .attr('d', d3.sankeyLinkHorizontal())
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

  // ── Node-Bars ──────────────────────────────────────────
  const nodeG = g.append('g').selectAll('g').data(graph.nodes).join('g');

  nodeG.append('rect')
    .attr('x',      d => d.x0).attr('y', d => d.y0)
    .attr('width',  d => d.x1 - d.x0)
    .attr('height', d => Math.max(3, d.y1 - d.y0))
    .attr('rx', 3)
    .attr('fill',   d => COLOR[d.kind].fill)
    .attr('stroke', d => COLOR[d.kind].stroke)
    .attr('stroke-width', 1.5);

  // ── Info-Karten via foreignObject ──────────────────────
  // Karte links vom Node wenn Node rechts von Mitte, sonst rechts
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
    .style('width',         CARD_W + 'px')
    .style('height',        '100%')
    .style('display',       'flex')
    .style('align-items',   'center')
    .style('box-sizing',    'border-box')
    .html(d => {
      const c = COLOR[d.kind];
      const nodeH = Math.max(CARD_H, d.y1 - d.y0);

      // Icons
      const itemIconHtml    = getIcon(d.label, 24);
      const machineIconHtml = d.machineName ? getIcon(d.machineName, 20) : '';

      // Maschinenzahl: gerundet (Miner/Pumps immer ceil, Zwischenprodukte 1 Dezimale)
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

// Tooltip-Hilfsfunktionen
function _showTooltip(event, html) {
  const tt   = document.getElementById('sankeyTooltip');
  tt.innerHTML     = html;
  tt.style.display = 'block';
  _moveTooltip(event);
}
function _moveTooltip(event) {
  const tt   = document.getElementById('sankeyTooltip');
  const wrap = document.getElementById('sankeyWrap');
  if (!wrap) return;
  const rect = wrap.getBoundingClientRect();
  let x = event.clientX - rect.left + 14;
  let y = event.clientY - rect.top  - 10;
  // Rand-Korrektur
  if (x + 250 > wrap.clientWidth)  x = event.clientX - rect.left - 260;
  if (y + 100 > wrap.clientHeight) y = event.clientY - rect.top  - 80;
  tt.style.left = x + 'px';
  tt.style.top  = y + 'px';
}
function _hideTooltip() {
  document.getElementById('sankeyTooltip').style.display = 'none';
}

document.addEventListener("click", function (e) {
  // Suche-Dropdown schließen
  const search = document.getElementById("recipeSearch");
  const results = document.getElementById("recipeInlineResults");
  if (results && search && !search.contains(e.target) && !results.contains(e.target)) {
    results.style.display = "none";
  }

  // Workstation-Modus-Buttons (data-action="wsmode")
  const btn = e.target.closest("[data-action]");
  if (!btn) return;
  const action = btn.dataset.action;
  const idx = parseInt(btn.dataset.idx);

  if (action === "wstoggle") {
    selectedRecipeList[idx].wsExpanded = !selectedRecipeList[idx].wsExpanded;
    renderSelectedRecipes();
  } else if (action === "wsmode") {
    updateItemWsMode2(idx, btn.dataset.mode);
  }
});
// ============================================================
// INIT
// ============================================================
buildRecipeCategoryList();
