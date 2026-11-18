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
//                          mining/pumpjackEfficiencyLevel, getItemWsBonus,
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
  raw:       { fill: '#122a12', stroke: '#2a6a2a', text: '#6adf6a', card: '#0e2010', cborder: '#1a4a1a' },
  mid:       { fill: '#0a1628', stroke: '#1e3a70', text: '#6a9adf', card: '#080f1e', cborder: '#162040' },
  final:     { fill: '#2a1206', stroke: '#7a3010', text: '#e08050', card: '#1e0e04', cborder: '#5a2010' },
  byproduct: { fill: '#1a1200', stroke: '#7a5a00', text: '#d4a020', card: '#110e00', cborder: '#4a3800' },
  sink:      { fill: '#1a0a14', stroke: '#6a2050', text: '#c060a0', card: '#0e060c', cborder: '#421030' },
  link:      '#4a8adf',
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

  // Byproducts get their own node, never merged with the same item used as an
  // ingredient (e.g. Crude Olumite in the barrel loop). Merging double-counted
  // the rate and closed a cycle that cost the real ingredient edge.
  const byproductKey = (item) => item + ' (Byproduct)';

  // Byproduct supply pool from calculateRecipes(): an item the chain needs is
  // taken from here first. Source node: the reprocessing recipe for its
  // product (Slag → "Cement (Slag Reprocessing)") or the byproduct node itself.
  const pool = { ..._lastSupply };
  const supplySource = {};
  if (typeof BYPRODUCT_DISPOSAL !== 'undefined') {
    Object.entries(BYPRODUCT_DISPOSAL).forEach(([b, d]) => {
      if (d.reprocess) supplySource[d.reprocess.produces] = d.reprocess.recipe;
      else supplySource[b] = byproductKey(b);
    });
  }
  // Recycler lines (chanceOutputs): every output is a product node of its own,
  // and the chain takes from it like from a byproduct (same pool as the calc).
  const chanceLabel = (item, machine) => `${item} (${machine})`;
  selectedRecipeList.forEach(line => {
    const r = RECIPES[line.recipeName];
    if (r?.chanceOutputs && !r.output.some(o => o.item === line.itemName))
      r.output.forEach(o => { supplySource[o.item] = chanceLabel(o.item, line.machineName); });
  });
  const take = (item, amount) => {
    const t = supplySource[item] ? Math.min(pool[item] || 0, amount) : 0;
    if (t > 0) pool[item] -= t;
    return t;
  };
  // Existing stock (sidebar): used after byproducts, own source node per item.
  const stockPool = { ..._lastStock };
  const takeStock = (item, amount) => {
    const t = Math.min(stockPool[item] || 0, amount);
    if (t <= 0) return 0;
    stockPool[item] -= t;
    const n = getNode(item + ' (Stock)', 'raw');
    n.icon = item;
    n.rate += t;
    return t;
  };
  // Closed loop (Greenhouse): the share of the output that goes back in.
  // A Sankey cannot draw an edge back into the same node, so it ends in a
  // "back into the loop" node of its own.
  function addLoopBack(fromLabel, item, rate) {
    if (!(rate > 0)) return;
    const n = getNode(`${item} ↻ back into the loop`, 'sink');
    n.icon = item;
    n.rate += rate;
    addEdge(fromLabel, n.label, rate);
  }
  function addByproduct(fromLabel, item, rate) {
    const n = getNode(byproductKey(item), 'byproduct');
    n.icon  = item; // icon lookup needs the plain item name
    n.rate += rate;
    addEdge(fromLabel, n.label, rate);
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
  // Feeds `rate` of `item` into `consumer`. Stock goes straight to the consumer
  // (no extra item node); it is used after byproducts like in calculateRecipes(),
  // so the byproduct share expand() will take is left out here.
  function feed(item, rate, consumer, visitedPath) {
    const bpAvail = supplySource[item] ? (pool[item] || 0) : 0;
    const st = takeStock(item, Math.max(0, rate - bpAvail));
    if (st > 0) addEdge(item + ' (Stock)', consumer, st);
    const rest = rate - st;
    if (rest <= 1e-9 || (st > 0 && rest < STOCK_TOLERANCE)) return; // same tolerance as the results
    const label = expand(item, rest, visitedPath);
    if (label) addEdge(label, consumer, rest);
  }

  function expand(itemName, rateNeeded, visitedPath) {
    const resolved = resolveRecipeName(itemName);
    if (visitedPath.has(resolved)) {
      // Self-feeding loop of an excavated item (Greenhouse Biomass): the input
      // comes from excavation — own source node, like in the results table.
      if (typeof EXCAVATION !== 'undefined' && EXCAVATION.items?.includes(itemName)) {
        const n = getNode(`${itemName} (Excavation)`, 'raw');
        n.icon = itemName;
        n.machineName = excavationSource();
        n.rate += rateNeeded;
        return n.label;
      }
      return null; // cycle — stop expanding
    }
    if (visitedPath.size > 50)    return null; // secondary safety cap

    const raw  = isRaw(resolved);
    const node = getNode(resolved, raw ? 'raw' : 'mid');
    node.rate += rateNeeded; // accumulate total throughput
    // Covered by byproducts first; only the rest is produced below
    const taken = take(itemName, rateNeeded);
    if (taken > 0) {
      addEdge(supplySource[itemName], resolved, taken);
      rateNeeded -= taken;
      if (rateNeeded <= 1e-9) return resolved;
    }
    if (raw) {
      // For mineable ores / resources: still attach the preferred extraction machine
      const rr = RECIPES[resolved];
      if (rr && rr.machines && Object.keys(rr.machines).length > 0) {
        const machineName = preferredMinerFor(resolved, rr);
        if (!node.machineName) node.machineName = machineName;
        const md = rr.machines[machineName];
        if (md) node.machineCount += rateNeeded / machineOpm(rr, { itemName: resolved, machineName });
      }
      return resolved;
    }

    const r  = RECIPES[resolved];
    // Same machine choice + bonuses as the results table
    const machineName = preferredMachineFor(r);
    const md = machineName && r.machines[machineName];
    if (!md) return null;
    const opm  = machineOpm(r, { itemName: resolved, machineName, product: itemName }); // output items/min per machine
    const runs = rateNeeded / opm; // how many machines are needed (fractional, not rounded)

    // Accumulate machine type and fractional count for display in info cards
    node.machineName   = machineName;
    node.machineCount += runs;

    const nextPath = new Set(visitedPath);
    nextPath.add(resolved);

    // Recurse into each ingredient at the computed rate
    r.ingredients.forEach(ing => {
      if (r.selfLoop?.item === ing.item) { // closed loop: fed from its own output
        addLoopBack(resolved, ing.item, runs * ing.amount * (60 / wsCycleTime(r, { itemName: resolved, machineName })));
        return;
      }
      feed(ing.item, runs * ing.amount * (60 / wsCycleTime(r, { itemName: resolved, machineName })), resolved, nextPath);
    });

    // Add secondary outputs (byproducts) as outgoing edges from the
    // primary product node so they appear downstream of the same process.
    sideOutputs(r, itemName).forEach(sec => {
      addByproduct(resolved, sec.item, runs * (sec.amount * (sec.chance ?? 1)) * (60 / wsCycleTime(r, { itemName: resolved, machineName })));
    });

    return resolved;
  }

  // ── Root nodes: the user's selected final products ────────
  selectedRecipeList.forEach(item => {
    const r = RECIPES[item.recipeName || item.name];
    if (!r || !r.machines[item.machineName]) return;

    const ct  = wsCycleTime(r, item); // incl. workstation speed

    const opm      = lineOpm(r, item); // gross for self-feeding loops (goal = machine output)
    const machines = ceilMachines(item.goal / opm); // rounded-up integer
    const runs     = item.goal / opm; // fractional machine-equivalents for the goal

    const node = getNode(item.itemName, 'final');
    node.rate        += item.goal; // flows follow the goal, not idle machine capacity
    node.kind         = 'final';  // override any earlier 'mid' classification
    node.machineName  = item.machineName;
    node.machineCount += machines;

    // Add edges from each ingredient to this final product.
    // Seed the visited path with the final product itself so that any
    // ingredient cycle back to it is caught immediately.
    r.ingredients.forEach(ing => {
      if (r.selfLoop?.item === ing.item) { addLoopBack(item.itemName, ing.item, (60 / ct) * ing.amount * runs); return; }
      feed(ing.item, (60 / ct) * ing.amount * runs, item.itemName, new Set([item.itemName]));
    });

    if (r.chanceOutputs && !r.output.some(o => o.item === item.itemName)) {
      r.output.forEach(o => {
        const n = getNode(chanceLabel(o.item, item.machineName), 'final');
        n.icon = o.item;
        n.rate += (60 / ct) * o.amount * runs;
        addEdge(item.itemName, n.label, (60 / ct) * o.amount * runs);
      });
    } else
    // Secondary outputs of the final product — connect from the
    // primary product itself so byproducts appear downstream of it.
    sideOutputs(r, item.itemName).forEach(sec => {
      addByproduct(item.itemName, sec.item, (60 / ct) * (sec.amount * (sec.chance ?? 1)) * runs);
    });
  });

  // Fixed fluid per running machine (Blast Furnace → Hot Air), per rounded-up
  // machine count of each node — same rule as calculateRecipes().
  // Raw nodes included: depleted veins make Ore Vein Miners need fracking liquid.
  Object.values(nodeMap).filter(n => n.machineName).forEach(n => {
    Object.entries(fluidNeedsPerMachine(n.machineName, n.label)).forEach(([fluid, per]) => {
      const amount = per * ceilMachines(n.machineCount);
      if (amount > 0) feed(fluid, amount, n.label, new Set([n.label]));
    });
  });

  // Byproducts: reprocessing (always, e.g. Slag → Cement) and disposal of
  // whatever the chain did not take from the pool (Flare Stack / Incinerator).
  const addSink = (label, machine, rate, count) => {
    const n = getNode(label, 'sink');
    n.rate += rate; n.machineName = machine; n.machineCount += count;
  };
  if (typeof BYPRODUCT_DISPOSAL !== 'undefined') {
    Object.entries(BYPRODUCT_DISPOSAL).forEach(([itemName, disposal]) => {
      const byproductNode = nodeMap[byproductKey(itemName)];
      if (!byproductNode) return;

      const rp = disposal.reprocess;
      const repRecipe  = rp && RECIPES[rp.recipe];
      const repMachine = repRecipe && preferredMachineFor(repRecipe);
      let leftover = Math.min(byproductNode.rate, pool[itemName] ?? byproductNode.rate);
      if (repMachine) {
        // Only what the chain took from the pool is reprocessed (Slag → Cement)
        const inPerMachine  = (60 / wsCycleTime(repRecipe, { itemName: rp.produces, machineName: repMachine })) * repRecipe.ingredients[0].amount;
        const outPerMachine = machineOpm(repRecipe, { itemName: rp.produces, machineName: repMachine });
        const usedOut = Math.max(0, (_lastSupply[rp.produces] || 0) - (pool[rp.produces] || 0));
        const usedIn  = Math.min(byproductNode.rate, usedOut / outPerMachine * inPerMachine);
        if (usedIn > 0) { // also tiny amounts: the expand() edge already points at this node
          addSink(rp.recipe, repMachine, usedIn, usedIn / inPerMachine);
          addEdge(byproductNode.label, rp.recipe, usedIn);
        }
        leftover = byproductNode.rate - usedIn;
      }
      if (leftover > 0.01) {
        addSink(disposal.machine, disposal.machine, leftover, leftover / disposal.capacityPerMin);
        addEdge(byproductNode.label, disposal.machine, leftover);
      }
    });
  }

  const nodes = Object.values(nodeMap);
  // Need at least 2 nodes and 1 link to draw a meaningful graph
  if (nodes.length < 2 || links.length === 0) return null;
  return { nodes, links: dropCycleEdges(links) };
}

// Number of conflicting link pairs: two links conflict if they swap their
// vertical order (cross) or if their bands overlap anywhere (a thin link running
// through a wide 324,000 L/min Hot Air band). Links follow the real curve
// (sankeyLinkHorizontal: cubic, control points at mid-x) and real width.
// Links sharing a node are not compared.
function countLinkCrossings(links) {
  const N = 16;
  const curve = links.map(l => {
    const x0 = l.source.x1, x1 = l.target.x0, xm = (x0 + x1) / 2, y0 = l.y0, y1 = l.y1;
    const pts = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N, u = 1 - t;
      pts.push([u*u*u*x0 + 3*u*u*t*xm + 3*u*t*t*xm + t*t*t*x1,
                u*u*u*y0 + 3*u*u*t*y0 + 3*u*t*t*y1 + t*t*t*y1]);
    }
    return { l, pts, x0, x1, half: Math.max(1, l.width) / 2 };
  });
  const yAt = (c, x) => {
    const p = c.pts;
    for (let i = 1; i < p.length; i++) if (x <= p[i][0]) {
      const [xa, ya] = p[i - 1], [xb, yb] = p[i];
      return xb === xa ? ya : ya + (yb - ya) * (x - xa) / (xb - xa);
    }
    return p[p.length - 1][1];
  };
  let n = 0;
  for (let i = 0; i < curve.length; i++) for (let j = i + 1; j < curve.length; j++) {
    const A = curve[i], B = curve[j];
    if (A.l.source === B.l.source || A.l.target === B.l.target ||
        A.l.source === B.l.target || A.l.target === B.l.source) continue;
    const lo = Math.max(A.x0, B.x0), hi = Math.min(A.x1, B.x1);
    if (hi <= lo) continue;
    let sign = 0, conflict = false;
    for (let k = 0; k <= 8 && !conflict; k++) {
      const x = lo + (hi - lo) * k / 8, d = yAt(A, x) - yAt(B, x);
      if (Math.abs(d) < A.half + B.half) conflict = true;      // bands overlap
      else if (sign && Math.sign(d) !== sign) conflict = true; // order swapped
      else sign = Math.sign(d);
    }
    if (conflict) n++;
  }
  return n;
}

// d3-sankey throws "circular link" on any cycle. visitedPath in expand() only
// guards a single branch — A→B from one branch and B→A from another still
// close a loop (e.g. Barrel ↔ Olumite). Drop the back-edges found by DFS.
function dropCycleEdges(links) {
  const out = {};
  links.forEach(l => (out[l.source] ||= []).push(l));
  const state = {}; // 1 = on DFS stack, 2 = done
  const back  = new Set();
  const visit = (n) => {
    state[n] = 1;
    for (const l of out[n] || []) {
      if (state[l.target] === 1) back.add(l);
      else if (!state[l.target]) visit(l.target);
    }
    state[n] = 2;
  };
  Object.keys(out).forEach(n => { if (!state[n]) visit(n); });
  if (back.size) console.warn('foundry-calc: dropped cyclic graph edges:', [...back].map(l => `${l.source} → ${l.target}`));
  return links.filter(l => !back.has(l));
}

// ============================================================
// SANKEY — Rendering mit D3
// ============================================================

// Dirty flag: set to true when data changes but the tab is hidden.
// renderSankey() checks this on entry and skips the draw if not visible,
// then redraws on the next call (e.g. when the tab is opened).
// Confirmed working via switchMainTab()'s call path in ui-nav.js: opening
// the Visualize tab calls renderSankey()/renderBoxes() directly, which
// clears the flag and draws — no separate dirty-check-on-show needed.
let _sankeyDirty = false;

// Entry point for the Sankey view.
// Called by calculateRecipes() after every state change, and by
// switchMainTab() / switchVizMode() when the Sankey tab becomes visible.
function renderSankey() {
  const tab = document.getElementById('tab-sankey');
  // If the tab is hidden, mark dirty and return — avoids wasted D3 work
  if (!tab || tab.offsetParent === null) {
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
  if (!tab || tab.offsetParent === null) { _boxesDirty = true; return; }

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
//   3b. Barycenter heuristic: sort nodes within each column to minimise
//       edge crossings (two left-to-right + one right-to-left pass).
//   4. Vertically center each column; assign (x, y) to each node.
//   5. Draw Bezier curves between box right/left edges.
//      Rate labels are hidden by default and appear in a tooltip on hover.
//   6. Draw boxes as rounded rectangles with a top accent stripe,
//      item name, machine type + count, and flow rate label.
//   7. Click a node (or an edge) to highlight the upstream dependency chain;
//      click background or same node again to reset.
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

  // Topological order (Kahn). The graph is acyclic — buildSankeyGraph()
  // drops cycle edges. A plain BFS with a visited-set froze a node's column
  // on first visit, so e.g. the final product could land in the same column
  // as its own ingredient.
  const indeg = {};
  data.nodes.forEach(n => { indeg[n.label] = inEdges[n.label].length; });
  const topo  = data.nodes.filter(n => indeg[n.label] === 0).map(n => n.label);
  for (let i = 0; i < topo.length; i++) {
    outEdges[topo[i]].forEach(t => { if (--indeg[t] === 0) topo.push(t); });
  }
  // Longest path from the sources: every node right of all its predecessors.
  topo.forEach(l => outEdges[l].forEach(t => {
    nodeMap[t].depth = Math.max(nodeMap[t].depth, nodeMap[l].depth + 1);
  }));
  // Then pull every node with successors as far right as possible
  // (directly before its earliest consumer). Otherwise raw materials all sit
  // in column 0 and their edges skip columns, cutting through other boxes.
  [...topo].reverse().forEach(l => {
    if (outEdges[l].length) nodeMap[l].depth = Math.min(...outEdges[l].map(t => nodeMap[t].depth)) - 1;
  });

  // ── Step 2: Group nodes into depth columns ────────────────
  const maxDepth  = Math.max(...data.nodes.map(n => n.depth));
  const columns   = Array.from({ length: maxDepth + 1 }, () => []);
  data.nodes.forEach(n => columns[n.depth].push(n));

  // ── Step 2b: Crossing minimization (barycenter heuristic) ─
  // Left-to-right pass: sort each column by the average position-index
  // of the nodes' predecessors in the immediately preceding column.
  for (let ci = 1; ci < columns.length; ci++) {
    const prevIdx = {};
    columns[ci - 1].forEach((n, i) => { prevIdx[n.label] = i; });
    columns[ci].forEach(n => {
      const preds = inEdges[n.label].filter(s => nodeMap[s].depth === ci - 1);
      n._bary = preds.length > 0
        ? preds.reduce((sum, s) => sum + (prevIdx[s] ?? 0), 0) / preds.length
        : columns[ci].indexOf(n);
    });
    columns[ci].sort((a, b) => a._bary - b._bary);
  }
  // Right-to-left pass: sort by average position of successors
  for (let ci = columns.length - 2; ci >= 0; ci--) {
    const nextIdx = {};
    columns[ci + 1].forEach((n, i) => { nextIdx[n.label] = i; });
    columns[ci].forEach(n => {
      const succs = outEdges[n.label].filter(t => nodeMap[t].depth === ci + 1);
      n._bary = succs.length > 0
        ? succs.reduce((sum, t) => sum + (nextIdx[t] ?? 0), 0) / succs.length
        : (n._bary ?? columns[ci].indexOf(n));
    });
    columns[ci].sort((a, b) => a._bary - b._bary);
  }
  // Second left-to-right pass for better convergence
  for (let ci = 1; ci < columns.length; ci++) {
    const prevIdx = {};
    columns[ci - 1].forEach((n, i) => { prevIdx[n.label] = i; });
    columns[ci].forEach(n => {
      const preds = inEdges[n.label].filter(s => nodeMap[s].depth === ci - 1);
      n._bary = preds.length > 0
        ? preds.reduce((sum, s) => sum + (prevIdx[s] ?? 0), 0) / preds.length
        : (n._bary ?? columns[ci].indexOf(n));
    });
    columns[ci].sort((a, b) => a._bary - b._bary);
  }

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
  ['raw','mid','final','byproduct','sink'].forEach(kind => {
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

  // ── Tooltip helpers ───────────────────────────────────────
  const tooltip = document.getElementById('boxesTooltip');
  function showTooltip(event, html) {
    if (!tooltip) return;
    tooltip.innerHTML = html;
    tooltip.style.display = 'block';
    moveTooltip(event);
  }
  function moveTooltip(event) {
    if (!tooltip || !wrap) return;
    const rect = wrap.getBoundingClientRect();
    let x = event.clientX - rect.left + 14;
    let y = event.clientY - rect.top  - 10;
    if (x + 220 > wrap.clientWidth)  x = event.clientX - rect.left - 230;
    if (y + 80  > wrap.clientHeight) y = event.clientY - rect.top  - 60;
    tooltip.style.left = x + 'px';
    tooltip.style.top  = y + 'px';
  }
  function hideTooltip() { if (tooltip) tooltip.style.display = 'none'; }

  // ── Highlight state ───────────────────────────────────────
  let _activeHighlight = null;
  const linkEntries = []; // { path, srcLabel, tgtLabel } for highlight updates
  const nodeGMap    = {}; // label → d3 node-group selection

  function triggerHighlight(targetLabel) {
    if (_activeHighlight === targetLabel) { resetHighlight(); return; }
    _activeHighlight = targetLabel;

    // BFS backwards: collect all upstream nodes and links
    const hlNodes = new Set([targetLabel]);
    const hlLinkIdx = new Set();
    const bfsQ = [targetLabel];
    while (bfsQ.length) {
      const cur = bfsQ.shift();
      linkEntries.forEach(({ srcLabel, tgtLabel }, i) => {
        if (tgtLabel === cur && !hlLinkIdx.has(i)) {
          hlLinkIdx.add(i);
          if (!hlNodes.has(srcLabel)) { hlNodes.add(srcLabel); bfsQ.push(srcLabel); }
        }
      });
    }
    linkEntries.forEach(({ path }, i) =>
      path.attr('stroke-opacity', hlLinkIdx.has(i) ? 0.9 : 0.06)
    );
    Object.entries(nodeGMap).forEach(([lbl, ng]) =>
      ng.style('opacity', hlNodes.has(lbl) ? 1 : 0.12)
    );
  }

  function resetHighlight() {
    _activeHighlight = null;
    linkEntries.forEach(({ path }) => path.attr('stroke-opacity', 0.6));
    Object.values(nodeGMap).forEach(ng => ng.style('opacity', 1));
    hideTooltip();
  }

  // ── Step 6: Draw links (Bezier curves) ───────────────────
  // Rate labels are shown in a hover tooltip rather than always-on,
  // which removes the bulk of the visual clutter on large graphs.
  const linkG = g.append('g');
  const lbl = (end) => typeof end === 'object' ? end.label : end;
  // Spread edge endpoints along the box sides, ordered by the other end's
  // height, so arrows into the same box neither stack nor cross each other.
  const port = {}; // "out|src|tgt" / "in|src|tgt" → y-offset on the box side
  const spread = (links, side, other) => {
    links.sort((a, b) => nodeMap[lbl(a[other])]._y - nodeMap[lbl(b[other])]._y)
      .forEach((l, i) => { (port[side + '|' + lbl(l.source) + '|' + lbl(l.target)] = BOX_H * (i + 1) / (links.length + 1)); });
  };
  data.nodes.forEach(n => {
    spread(data.links.filter(l => lbl(l.source) === n.label), 'out', 'target');
    spread(data.links.filter(l => lbl(l.target) === n.label), 'in',  'source');
  });
  data.links.forEach(link => {
    const s = nodeMap[lbl(link.source)];
    const t = nodeMap[lbl(link.target)];
    if (!s || !t) return;
    const key = '|' + s.label + '|' + t.label;

    // Connect right edge of source to left edge of target, mid-point control
    const x1 = s._x + BOX_W;
    const y1 = s._y + port['out' + key];
    const x2 = t._x;
    const y2 = t._y + port['in' + key];
    const mx = (x1 + x2) / 2; // x of both cubic Bezier control points

    const markerKind  = (COLOR[t.kind] ? t.kind : null) || 'mid';
    const strokeColor = (COLOR[t.kind] || COLOR.mid).stroke;

    const rateVal  = link.value;
    const rateText = rateVal >= 1000
      ? (rateVal / 1000).toFixed(1) + 'k/min'
      : Math.round(rateVal * 10) / 10 + '/min';

    const srcLabel = typeof link.source === 'object' ? link.source.label : link.source;
    const tgtLabel = typeof link.target === 'object' ? link.target.label : link.target;

    // Invisible wide hit-target layered under the visible path for easier hover
    linkG.append('path')
      .attr('d', `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`)
      .attr('fill', 'none').attr('stroke', 'transparent').attr('stroke-width', 12)
      .style('cursor', 'pointer')
      .on('mouseenter', function(event) {
        if (!_activeHighlight) path.attr('stroke-opacity', 0.95);
        showTooltip(event,
          `<div style="color:var(--accent);font-weight:700;margin-bottom:3px">${srcLabel} → ${tgtLabel}</div>
           <div style="color:var(--accent3);font-family:monospace;font-size:11px">${rateText}</div>
           <div style="color:var(--color-text-secondary);font-size:10px;margin-top:2px">Klicken zum Hervorheben</div>`);
      })
      .on('mousemove', moveTooltip)
      .on('mouseleave', function() {
        if (!_activeHighlight) path.attr('stroke-opacity', 0.6);
        hideTooltip();
      })
      .on('click', function(event) { event.stopPropagation(); triggerHighlight(tgtLabel); });

    // Cubic Bezier curve: C mx,y1  mx,y2  x2,y2
    const path = linkG.append('path')
      .attr('d', `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`)
      .attr('fill', 'none')
      .attr('stroke', strokeColor)
      .attr('stroke-width', 1.8)
      .attr('stroke-opacity', 0.6)
      .attr('pointer-events', 'none')
      .attr('marker-end', `url(#arrow-${markerKind})`);

    linkEntries.push({ path, srcLabel, tgtLabel });
  });

  // ── Step 7: Draw node boxes ───────────────────────────────
  const nodeG = g.append('g');
  data.nodes.forEach(n => {
    const C  = COLOR[n.kind] || COLOR.mid;
    const ng = nodeG.append('g')
      .attr('transform', `translate(${n._x},${n._y})`)
      .style('cursor', 'pointer')
      .on('click', function(event) { event.stopPropagation(); triggerHighlight(n.label); })
      .on('mouseenter', function() {
        if (!_activeHighlight) d3.select(this).select('.main-box').attr('stroke-width', 2.5);
      })
      .on('mouseleave', function() {
        if (!_activeHighlight) d3.select(this).select('.main-box').attr('stroke-width', 1.5);
      });

    nodeGMap[n.label] = ng;

    // Drop shadow for depth effect
    ng.append('rect')
      .attr('x', 2).attr('y', 3)
      .attr('width', BOX_W).attr('height', BOX_H)
      .attr('rx', 10)
      .attr('fill', 'rgba(0,0,0,0.35)')
      .attr('filter', 'blur(4px)');

    // Main box rectangle
    ng.append('rect')
      .attr('class', 'main-box')
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

      // Whole machines, rounded up — same as the results table
      const cnt = ceilMachines(n.machineCount);
      ng.append('text')
        .attr('x', BOX_W - 8).attr('y', 46)
        .attr('text-anchor', 'end')
        .attr('dominant-baseline', 'middle')
        .attr('fill', C.text)
        .attr('font-size', 10)
        .attr('font-weight', 700)
        .attr('font-family', 'monospace')
        .text('×' + cnt);
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

  // Click on SVG background resets highlight
  svg.on('click', resetHighlight);
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
// elements placed right of each node; columns keep >= COL_GAP apart.
function _drawSankey(svgEl, data) {
  const wrap = document.getElementById('sankeyWrap');
  const W = (wrap ? wrap.getBoundingClientRect().width  : 0) || 1100;
  const H = (wrap ? wrap.getBoundingClientRect().height : 0) || 650;

  const NODE_W  = 18;          // width of each Sankey bar
  const LABEL_W = 165;         // inline label width
  const LABEL_H = 54;          // inline label height (3 lines: name + rate + machine)
  // Labels always sit right of their bar → only the right side needs label room
  const PAD    = { top: 20, right: LABEL_W + 20, bottom: 40, left: 20 };
  const IW     = W - PAD.left - PAD.right;   // inner drawable width (viewport)
  // Min. distance between columns: label + link-rate pill must fit in the gap,
  // otherwise neighbouring labels overlap in narrow windows.
  const COL_GAP = LABEL_W + 80;
  const IH     = H - PAD.top  - PAD.bottom;  // inner drawable height

  // Color palette — overridden by __applyTheme() for the light theme
  const COLOR = window.__sankeyColors || VIZ_COLORS_DARK;
  // Theme-reactive read for the link-label pill background (no dedicated
  // palette field for it) — SVG fill attrs don't resolve CSS var(), so read
  // the computed value once per draw instead.
  const LABEL_BG = getComputedStyle(document.documentElement).getPropertyValue('--color-viz-tooltip-bg').trim();

  const svg = d3.select(svgEl);
  svg.selectAll('*').remove();

  // D3 zoom/pan — applies to the inner <g> group
  const zoom = d3.zoom().scaleExtent([0.1, 4]).on('zoom', e => {
    g.attr('transform', e.transform);
  });
  svg.call(zoom);
  svgEl.style.cursor = 'grab';

  // g is declared before zoom handler so closure captures it correctly
  const g = svg.append('g');

  // Configure the d3-sankey layout
  const sankeyLayout = d3.sankey()
    .nodeId(d => d.label)      // unique node identifier
    .nodeWidth(NODE_W)
    // Right-align: each node sits directly before its first consumer, so raw
    // materials feeding a late step (Mineral Rocks → Molten Xenoferrite) don't
    // start in column 0 and cut across other chains (same rule as Boxes).
    .nodeAlign(d3.sankeyRight)
    .nodePadding(50);
  // Run the layout — mutates copies of nodes/links with x0,x1,y0,y1,width
  // d3-sankey's vertical ordering depends on its relaxation iteration count and
  // the best count differs per graph (e.g. Mineral Rocks crossing the Ignium
  // chain at 6, clean at 32). Try a few, keep the layout with the fewest link
  // crossings — a few ms for typical graphs.
  const layoutOnce = (w, it, rank) => sankeyLayout
    .iterations(it)
    .nodeSort(rank ? (a, b) => rank.get(a.label) - rank.get(b.label) : undefined) // fixed order or d3's
    .extent([[0, 0], [w, IH]])({
      nodes: data.nodes.map(d => ({ ...d })), // shallow copy to avoid mutating originals
      links: data.links.map(d => ({ ...d, amount: d.value })), // amount: shown in labels/tooltips
    });
  const runLayout = (w) => {
    // Time budget: big graphs (Assault Robot, ~60 nodes) took seconds; keep
    // the best layout found within the budget.
    const deadline = performance.now() + 250;
    const outOfTime = () => performance.now() > deadline;
    let best = null;
    for (const it of [6, 16, 32, 48, 64, 96]) {
      const g = layoutOnce(w, it);
      const c = countLinkCrossings(g.links);
      if (!best || c < best.c) best = { g, c, it };
      if (c === 0) return g;
    }
    // Then swap neighbours inside a column while that removes conflicts. A
    // single swap often only helps together with one in the neighbouring
    // column (Ignium row ↔ Xenoferrite row spans 2 columns), so a swap that
    // doesn't help alone is retried combined with each swap next door.
    const rank = new Map([...best.g.nodes]
      .sort((a, b) => a.layer - b.layer || a.y0 - b.y0).map((n, i) => [n.label, i]));
    const byLayer = {};
    best.g.nodes.forEach(n => (byLayer[n.layer] ||= []).push(n.label));
    const layers = Object.keys(byLayer).map(Number).sort((a, b) => a - b);
    const col = (L) => byLayer[L].sort((a, b) => rank.get(a) - rank.get(b));
    const swap = (a, b) => { const r = rank.get(a); rank.set(a, rank.get(b)); rank.set(b, r); };
    const tryRank = () => {
      const g = layoutOnce(w, best.it, rank), c = countLinkCrossings(g.links);
      if (c < best.c) { best = { g, c, it: best.it }; return true; }
      return false;
    };
    // Move a node to any other slot of its column (Mineral Rocks from top to
    // bottom = 2 neighbour swaps, the first of which alone doesn't help).
    const moveNode = (L, from, to) => {
      const c = col(L), slots = c.map(l => rank.get(l)).sort((x, y) => x - y);
      const order = [...c]; order.splice(to, 0, order.splice(from, 1)[0]);
      order.forEach((l, k) => rank.set(l, slots[k]));
    };
    for (let pass = 0, improved = true; improved && pass < 4 && best.c > 0 && !outOfTime(); pass++) {
      improved = false;
      for (const L of layers) {
        const n = col(L).length;
        for (let from = 0; from < n && best.c > 0 && !outOfTime(); from++) {
          for (let to = 0; to < n && best.c > 0 && !outOfTime(); to++) {
            if (to === from) continue;
            const saved = col(L).map(l => [l, rank.get(l)]);
            moveNode(L, from, to);
            if (tryRank()) { improved = true; break; }
            saved.forEach(([l, r]) => rank.set(l, r)); // undo
          }
        }
      }
      for (const L of layers) {
        const cl = col(L);
        for (let i = 0; i + 1 < cl.length && best.c > 0 && !outOfTime(); i++) {
          const [a, b] = [col(L)[i], col(L)[i + 1]];
          swap(a, b);
          if (tryRank()) { improved = true; continue; }
          let combined = false;
          for (const L2 of [L - 1, L + 1].filter(x => byLayer[x])) {
            const c2 = col(L2);
            for (let j = 0; j + 1 < c2.length && !combined && !outOfTime(); j++) {
              const [p, q] = [c2[j], c2[j + 1]];
              swap(p, q);
              if (tryRank()) combined = true; else swap(p, q);
            }
            if (combined) break;
          }
          if (combined) improved = true; else swap(a, b); // undo
        }
      }
    }
    return best.g;
  };
  // Straighten each node's widest incoming link: d3 centres a node between
  // ALL its inputs, so e.g. Molten Xenoferrite sits ~50 px below the huge
  // Hot Air band and the band kinks. Shift a node only if it stays inside the
  // area, overlaps no node in its column and adds no link conflict.
  const straighten = (gr, height) => {
    const pad = 10;
    [...gr.nodes].sort((a, b) => a.layer - b.layer).forEach(n => {
      const main = n.targetLinks.reduce((m, l) => (!m || l.width > m.width ? l : m), null);
      const dy = main ? main.y0 - main.y1 : 0;
      if (Math.abs(dy) < 1 || n.y0 + dy < 0 || n.y1 + dy > height) return;
      if (gr.nodes.some(o => o !== n && o.layer === n.layer &&
          n.y0 + dy < o.y1 + pad && n.y1 + dy > o.y0 - pad)) return;
      const before = countLinkCrossings(gr.links);
      n.y0 += dy; n.y1 += dy; sankeyLayout.update(gr);
      if (countLinkCrossings(gr.links) > before) { n.y0 -= dy; n.y1 -= dy; sankeyLayout.update(gr); }
    });
    return gr;
  };
  let graph = runLayout(IW);
  // Too many columns for the window → lay out wider, then zoom out to fit.
  const cols   = d3.max(graph.nodes, d => d.depth) || 0;
  const needW  = cols * COL_GAP + NODE_W;
  const layoutW = Math.max(IW, needW);
  if (layoutW > IW) graph = runLayout(layoutW);
  straighten(graph, IH);
  const k = Math.min(1, IW / layoutW);
  // Initial transform goes through the zoom behaviour so the first
  // pan/zoom continues from it instead of jumping.
  svg.call(zoom.transform, d3.zoomIdentity.translate(PAD.left, PAD.top).scale(k));

  // ── Draw flow links ───────────────────────────────────────
  // Link width is proportional to flow value (items/min).
  // Opacity increases on hover; click highlights the full upstream path.
  const linkPaths = g.append('g').attr('fill', 'none')
    .selectAll('path').data(graph.links).join('path')
      .attr('d', d3.sankeyLinkHorizontal()) // d3-sankey cubic Bezier path generator
      .attr('stroke', COLOR.link)
      .attr('stroke-width', d => Math.max(1, d.width))
      .attr('stroke-opacity', 0.18)
      .style('cursor', 'pointer')
      .on('mouseenter', function(event, d) {
        if (!_activeHighlight) d3.select(this).attr('stroke-opacity', 0.55);
        _showTooltip(event,
          `<div style="color:var(--accent);font-weight:700;margin-bottom:3px">${d.source.label} → ${d.target.label}</div>
           <div style="color:var(--accent3)">${fmt(d.amount)} / min</div>
           <div style="color:var(--color-text-secondary);font-size:10px;margin-top:3px">Klicken zum Hervorheben</div>`);
      })
      .on('mousemove', _moveTooltip)
      .on('mouseleave', function(event, d) {
        if (!_activeHighlight) d3.select(this).attr('stroke-opacity', 0.18);
        _hideTooltip();
      })
      .on('click', function(event, d) {
        event.stopPropagation();
        highlightUpstream(d.target);
      });

  // ── Link rate labels ─────────────────────────────────────
  // Each pill sits ON its own link. Candidate spots along the curve (middle
  // first) are tried; a spot is used only if the pill touches no other link,
  // pill or node label — otherwise the link stays unlabelled (value is in the
  // tooltip). Biggest flows are placed first.
  const linkLabelG = g.append('g').attr('pointer-events', 'none');
  const taken = graph.nodes.map(n => ({ // node label boxes (right of each bar)
    x0: n.x1 + 6, x1: n.x1 + 6 + LABEL_W, y0: (n.y0 + n.y1) / 2 - LABEL_H / 2, y1: (n.y0 + n.y1) / 2 + LABEL_H / 2 }));
  const overlaps = (b) => taken.some(t => b.x0 < t.x1 && b.x1 > t.x0 && b.y0 < t.y1 && b.y1 > t.y0);
  const pathOf = new Map();
  linkPaths.each(function (d) { pathOf.set(d, this); });
  // Sampled centre line of every link, with its half stroke width
  const samples = [];
  graph.links.forEach(l => {
    const p = pathOf.get(l), len = p.getTotalLength();
    for (let i = 0; i <= 40; i++) {
      const pt = p.getPointAtLength(len * i / 40);
      samples.push({ l, x: pt.x, y: pt.y, r: Math.max(1, l.width) / 2 });
    }
  });
  const hitsOtherLink = (b, own) => samples.some(sp => sp.l !== own &&
    sp.x > b.x0 && sp.x < b.x1 && sp.y + sp.r > b.y0 && sp.y - sp.r < b.y1);

  [...graph.links].sort((a, b) => b.amount - a.amount).forEach(lnk => {
    const val = lnk.amount >= 1000
      ? (lnk.amount / 1000).toFixed(1) + 'k'
      : Math.round(lnk.amount * 10) / 10;
    const txt = val + '/min';
    const pw  = txt.length * 5.5 + 10; // pill width estimate
    const p = pathOf.get(lnk), len = p.getTotalLength();
    let spot = null;
    for (const t of [0.5, 0.4, 0.6, 0.3, 0.7, 0.2, 0.8]) {
      const pt  = p.getPointAtLength(len * t);
      const box = { x0: pt.x - pw / 2 - 2, x1: pt.x + pw / 2 + 2, y0: pt.y - 9, y1: pt.y + 9 };
      if (!overlaps(box) && !hitsOtherLink(box, lnk)) { spot = { pt, box }; break; }
    }
    if (!spot) return;
    taken.push(spot.box);
    const mx = spot.pt.x, my = spot.pt.y;

    linkLabelG.append('rect')
      .attr('x', mx - pw / 2).attr('y', my - 8)
      .attr('width', pw).attr('height', 14)
      .attr('rx', 3)
      .attr('fill', LABEL_BG)
      .attr('stroke', COLOR.link).attr('stroke-opacity', 0.25).attr('stroke-width', 0.7);

    linkLabelG.append('text')
      .attr('x', mx).attr('y', my)
      .attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
      .attr('fill', COLOR.link)
      .attr('font-size', 8.5)
      .attr('font-family', 'monospace')
      .attr('opacity', 0.8)
      .text(txt);
  });

  // ── Draw node bars ────────────────────────────────────────
  const nodeG = g.append('g').selectAll('g').data(graph.nodes).join('g');

  nodeG.append('rect')
    .attr('x',      d => d.x0).attr('y', d => d.y0)
    .attr('width',  d => d.x1 - d.x0)
    .attr('height', d => Math.max(3, d.y1 - d.y0)) // minimum 3px so tiny flows remain visible
    .attr('rx', 3)
    .attr('fill',   d => (COLOR[d.kind] || COLOR.mid).fill)
    .attr('stroke', d => (COLOR[d.kind] || COLOR.mid).stroke)
    .attr('stroke-width', 1.5)
    .style('cursor', 'pointer')
    .on('click', function(event, d) {
      event.stopPropagation();
      highlightUpstream(d);
    });

  // ── Inline labels: icon + name + rate directly at each bar ─
  // Positioned at the node bar edge, centred vertically on the bar.
  // Always right of the bar (PAD.right reserves room for the last column),
  // so two labels can never face each other across the same gap.
  // labelFOs is kept as a D3 selection so highlight can update opacity.
  const labelG  = g.append('g');
  const labelFOs = labelG.selectAll('foreignObject')
    .data(graph.nodes)
    .join('foreignObject')
    .attr('x', d => d.x1 + 6)
    .attr('y', d => (d.y0 + d.y1) / 2 - LABEL_H / 2)
    .attr('width',  LABEL_W)
    .attr('height', LABEL_H);

  labelFOs.append('xhtml:div')
    .style('width',          LABEL_W + 'px')
    .style('height',         LABEL_H + 'px')
    .style('display',        'flex')
    .style('align-items',    'center')
    .style('gap',            '5px')
    .style('overflow',       'visible')
    .html(d => {
      const c        = COLOR[d.kind] || COLOR.mid;
      const textAlign = 'left';
      const maxTxtW   = LABEL_W - 30;
      const cntRaw    = d.machineCount || 0;
      const cntFmt    = ceilMachines(cntRaw); // whole machines, same as the results table
      const machineText = d.machineName && d.machineCount > 0
        ? `<div style="color:var(--color-text-secondary);font-size:8.5px;font-family:monospace;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
             ${d.machineName.length > 15 ? d.machineName.slice(0, 14) + '…' : d.machineName} ×${cntFmt}
           </div>`
        : '';
      return `
        <div style="flex-shrink:0;line-height:0">${getIcon(d.icon || d.label, 20)}</div>
        <div style="text-align:${textAlign};overflow:hidden;line-height:1.25;min-width:0">
          <div style="color:${c.text};font-size:10.5px;font-weight:600;
            font-family:-apple-system,sans-serif;white-space:nowrap;
            overflow:hidden;text-overflow:ellipsis;max-width:${maxTxtW}px">
            ${d.label}
          </div>
          <div style="color:var(--accent3);font-family:monospace;font-size:10px;white-space:nowrap">
            ${fmt(d.rate >= 100 ? Math.round(d.rate) : d.rate)}<span style="color:var(--color-text-secondary);font-size:8px">/min</span>
          </div>
          ${machineText}
        </div>`;
    });

  // ── Upstream highlight logic ──────────────────────────────
  let _activeHighlight = null;

  function highlightUpstream(targetNode) {
    if (_activeHighlight === targetNode.label) { resetHighlight(); return; }
    _activeHighlight = targetNode.label;

    // BFS backwards: collect all nodes and links that feed into targetNode
    const hlNodes = new Set([targetNode.label]);
    const hlLinks = new Set();
    const queue   = [targetNode];
    while (queue.length) {
      const cur = queue.shift();
      graph.links.forEach(lnk => {
        if (lnk.target.label === cur.label && !hlLinks.has(lnk)) {
          hlLinks.add(lnk);
          if (!hlNodes.has(lnk.source.label)) {
            hlNodes.add(lnk.source.label);
            queue.push(lnk.source);
          }
        }
      });
    }

    linkPaths.attr('stroke-opacity', lnk => hlLinks.has(lnk) ? 0.7  : 0.04);
    nodeG    .style('opacity',       n   => hlNodes.has(n.label) ? 1 : 0.15);
    labelFOs .style('opacity',       n   => hlNodes.has(n.label) ? 1 : 0.15);
  }

  function resetHighlight() {
    _activeHighlight = null;
    linkPaths.attr('stroke-opacity', 0.18);
    nodeG    .style('opacity', 1);
    labelFOs .style('opacity', 1);
  }

  // Click on SVG background resets highlight
  svg.on('click', resetHighlight);
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
