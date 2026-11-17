// ============================================================
// app/calculation.js
// ============================================================
// Core production math.  All public functions are plain globals
// (no module system) so they can be called from the HTML and
// from visualization.js without any import machinery.
//
// Dependency chain (must be loaded before this file):
//   data/game-data.js   → M, I, CAT
//   data/recipes.js     → RECIPES
//   data/icons.js       → getIcon()
//   app/state.js        → selectedRecipeList, resolveRecipeName,
//                          botEfficiencyOverrides, minerSettings,
//                          mining/pumpjackEfficiencyLevel, modular settings,
//                          getItemWsBonus, MINING_MACHINES, FLUID_MACHINES
//   app/ui-nav.js       → fmt()
// ============================================================

// ── Output helpers ────────────────────────────────────────────

// Returns the expected output amount per cycle, accounting for
// probabilistic outputs (e.g. a recipe that yields 2 items at 50%
// chance contributes an *average* of 1.0 per cycle).
//
// recipe.output can be:
//   { amount, chance? }          – single output
//   [{ item, amount, chance? }]  – multi-output (only index 0 is counted)
function getOutputAmount(recipe) {
  if (!recipe.output) return 0;
  if (Array.isArray(recipe.output)) {
    const o = recipe.output[0];
    return o.amount * (o.chance != null ? o.chance : 1);
  }
  const o = recipe.output;
  return o.amount * (o.chance != null ? o.chance : 1);
}

// Returns a human-readable label for the output quantity.
// If the output has a non-100 % chance the label reads e.g. "3 (50%)".
function getOutputLabel(recipe) {
  if (!recipe.output) return "0";
  const o = Array.isArray(recipe.output) ? recipe.output[0] : recipe.output;
  if (o.chance != null && o.chance < 1) {
    return `${o.amount} (${Math.round(o.chance * 100)}%)`;
  }
  return String(o.amount);
}

// Output items/min of ONE machine, including every productivity bonus:
//   bot efficiency (override → parent-robot override → recipe base),
//   global mining/fluid productivity and workstation bonus.
// `item` needs { machineName, itemName? , wsOverride? } — a selectedRecipeList
// entry, or { itemName, machineName } for items deeper in the chain.
// Single source of truth: table, chain resolution, sidebar and Sankey all use it.
function machineOpm(recipe, item) {
  const ct = recipe.machines[item.machineName].cycleTime;
  const parent = item.itemName?.match(/^(.+)\s+(?:Arm|Head|Leg|Torso)$/)?.[1];
  const eff = botEfficiencyOverrides[item.itemName] ?? botEfficiencyOverrides[parent] ?? recipe.efficiency ?? 0;
  const pumpjackBonus = typeof RESEARCH_BONUSES !== 'undefined' && RESEARCH_BONUSES.pumpjacks.includes(item.machineName)
    ? pumpjackEfficiencyLevel * researchBonus('Pumpjack Efficiency') : 0;
  // All bonuses stack additively in the productivity bracket.
  return (60 / ct) * getOutputAmount(recipe) * (1 + eff / 100)
       * (1 + pumpjackBonus + getItemWsBonus(item));
}

// Byproduct supply pool of the last calculation (item → per min), read by the
// Sankey/Boxes graph so both views take byproducts from the same pool.
let _lastSupply = {};

// ceil() that ignores float noise (3.0000000001 machines → 3, not 4).
const ceilMachines = (x) => Math.ceil(x - 1e-9);

// Small "WS +x %" chip when a workstation bonus applies to this machine/item
// (global per machine group or the line's own override). Empty otherwise.
function wsBadge(item) {
  const b = getItemWsBonus(item);
  return b > 0
    ? `<span title="Workstation bonus" style="font-size:10px;color:var(--accent3);border:1px solid var(--color-success-border);background:var(--color-success-bg);border-radius:3px;padding:0 4px;margin-left:6px;white-space:nowrap">WS +${fmt(Math.round(b * 1000) / 10)}%</span>`
    : '';
}

// ── Infrastructure helpers ─────────────────────────────────────

// Returns the power consumption of a machine in kW.
// Checks the machine's own recipe first; falls back to MACHINE_POWER_KW.
function getMachinePowerKw(machineName) {
  // Assembly Line power = sum of its sub-machines
  if (machineName === M.ASSEMBLY_LINE) {
    return getMachinePowerKw(ASSEMBLY_LINE_COMPOSITION.start.name)    * ASSEMBLY_LINE_COMPOSITION.start.count
         + getMachinePowerKw(ASSEMBLY_LINE_COMPOSITION.producer.name) * ASSEMBLY_LINE_COMPOSITION.producer.count
         + getMachinePowerKw(ASSEMBLY_LINE_COMPOSITION.painter.name)  * ASSEMBLY_LINE_COMPOSITION.painter.count;
  }
  const r = RECIPES[machineName];
  if (r && r.power_consumption != null) {
    return r.power_consumption_unit === 'MW'
      ? r.power_consumption * 1000
      : r.power_consumption;
  }
  return MACHINE_POWER_KW[machineName] || 0;
}

// Power of `count` machines of one type.
// Modular buildings: power scales with module speed (in-game: Air Intake
// 1.4 MW base → 8.4 MW at 600 %). Adjacency bonus (if enabled) assumes all
// buildings of a type stand side by side in one row: the two ends have one
// neighbour, inner ones two; each neighbour cuts `adjacencyPowerDecrease`
// (in-game: Hot Air Stove 10 MW → 7.5 MW with one neighbour).
function machinesPowerKw(machine, count) {
  const mb = _modular(machine);
  // Fracking Tower: power grows per optional module (+100 % each), not with speed
  const factor = mb?.powerPerModule != null ? 1 + (modularModules(machine) - mb.ignored) * mb.powerPerModule
                                            : modularSpeed(machine);
  const each = (getMachinePowerKw(machine) || mb?.basePowerKw || 0) * factor;
  const dec  = adjacencyBonus ? (mb?.adjacencyPowerDecrease || 0) : 0;
  const neighbourSlots = count > 1 ? 2 * (count - 1) : 0;
  return Math.max(0, each * (count - dec * neighbourSlots));
}

// Fracking Towers for depleted veins: one tower feeds one vein, so at least
// one per depleted vein; more only if the liquid exceeds a tower's throughput.
function frackingTowerPlan(liquidPerMin) {
  const entry = liquidPerMin > 0 && typeof MODULAR_BUILDINGS !== 'undefined'
    && Object.entries(MODULAR_BUILDINGS).find(([, mb]) => mb.throughputPerModule);
  if (!entry) return null;
  const [machine, mb] = entry;
  const capacity = modularModules(machine) * mb.throughputPerModule;
  const count = Math.max(depletedVeins, ceilMachines(liquidPerMin / capacity));
  return { machine, count, capacity, powerKw: machinesPowerKw(machine, count) };
}

// Fluid each running machine needs regardless of utilisation, scaled by its
// modules — the Blast Furnace burns Hot Air to hold temperature (it cools down
// and slows without it), so this is per rounded-up machine, never proportional.
// `item` (what the machine produces) adds the vein mining fluid: Ore Vein
// Miners need fracking liquid once a vein is mined to its core (setting).
function fluidNeedsPerMachine(machine, item) {
  const base = (typeof MACHINE_FLUID_MINIMUMS !== 'undefined' && MACHINE_FLUID_MINIMUMS[machine]) || {};
  const mb = _modular(machine);
  const extraModules = mb ? modularModules(machine) - mb.ignored : 0;
  const out = {};
  Object.entries(base).forEach(([fluid, perMin]) => {
    out[fluid] = perMin * (1 + extraModules * (mb?.fluidPerModule?.[fluid] || 0));
  });
  const vein = veinsDepleted && typeof VEIN_MINING_FLUIDS !== 'undefined' && VEIN_MINING_FLUIDS[item];
  if (vein && vein.machines.includes(machine)) {
    // Mining Efficiency: X % more free ore per same fracking liquid (in-game: level 10 → 75 L/min)
    const perMiner = vein.perMinerPerMin / (1 + miningEfficiencyLevel * researchBonus('Mining Efficiency'));
    out[vein.fluid] = (out[vein.fluid] || 0) + perMiner;
  }
  return out;
}

// Returns the first non-Character machine name for a recipe.
// Returns null if only "Character" (hand-crafting) is available —
// Character is never a valid automated producer.
function firstMachineFor(recipe) {
  const entries = Object.entries(recipe.machines || {});
  const nonChar = entries.find(([name]) => name !== 'Character');
  return nonChar ? nonChar[0] : null;
}

// Like firstMachineFor but respects the user's machine family defaults
// and family ordering (lowest tier first when no preference is set).
function preferredMachineFor(recipe) {
  const available = Object.keys(recipe.machines || {});
  for (const family of MACHINE_FAMILIES) {
    // Check if this recipe is built by any machine in this family
    const familyMatch = family.machines.find(m => available.includes(m));
    if (!familyMatch) continue;
    // Use user's saved defaultChoice if it's available in this recipe,
    // otherwise use the lowest-tier family machine that is available.
    const preferred = family.defaultChoice || family.machines[0];
    return available.includes(preferred) ? preferred : familyMatch;
  }
  return firstMachineFor(recipe);
}

// Calculates the optimal loader setup for a machine given the number of
// solid (non-fluid) connections needed.
//
// Strategy:
//   Phase 1 – fill up to 2 slots per side across the first 2 sides
//             (avoids Third Lane, which costs more power).
//   Phase 2 – if more connections remain, upgrade existing sides to 3
//             (adds Third Lane where needed).
//   Phase 3 – overflow onto additional sides as last resort.
//
// Returns { powerKw, loaderCount, secondLaneCount, thirdLaneCount }
function calcLoadersForMachine(machineName, nSolidConnections) {
  const connInfo = MACHINE_CONNECTIONS[machineName];
  if (!connInfo || !connInfo.loader_needed || nSolidConnections === 0)
    return { powerKw: 0, loaderCount: 0, secondLaneCount: 0, thirdLaneCount: 0 };

  const sortedSides = [...connInfo.sides].filter(s => s > 0).sort((a, b) => b - a);
  if (!sortedSides.length) return { powerKw: 0, loaderCount: 0, secondLaneCount: 0, thirdLaneCount: 0 };

  const usedSides = new Array(sortedSides.length).fill(0);
  let remaining = nSolidConnections;

  // Phase 1: fill up to 2 per side on first 2 sides
  for (let i = 0; i < Math.min(2, sortedSides.length) && remaining > 0; i++) {
    const add = Math.min(remaining, Math.min(2, sortedSides[i]));
    usedSides[i] += add;
    remaining -= add;
  }
  // Phase 2: upgrade to 3 per side on already-used sides
  for (let i = 0; i < usedSides.length && remaining > 0; i++) {
    if (usedSides[i] === 0) continue;
    const add = Math.min(remaining, sortedSides[i] - usedSides[i]);
    usedSides[i] += add;
    remaining -= add;
  }
  // Phase 3: overflow onto further sides
  for (let i = 2; i < sortedSides.length && remaining > 0; i++) {
    const add = Math.min(remaining, sortedSides[i]);
    usedSides[i] += add;
    remaining -= add;
  }

  let loaderCount = 0, secondLaneCount = 0, thirdLaneCount = 0, powerKw = 0;
  usedSides.forEach(n => {
    if (n >= 1) { loaderCount++;     powerKw += 5;  }
    if (n >= 2) { secondLaneCount++; powerKw += 10; }
    if (n >= 3) { thirdLaneCount++;  powerKw += 12; }
  });

  return { powerKw, loaderCount, secondLaneCount, thirdLaneCount };
}

// Returns the number of solid (non-fluid) connections a recipe needs:
// solid ingredient inputs + solid outputs.
function countSolidConnections(recipe, itemName) {
  const solidInputs = (recipe.ingredients || [])
    .filter(ing => !FLUID_ITEMS.has(ing.item)).length;

  let solidOutputs = 0;
  if (Array.isArray(recipe.output)) {
    solidOutputs = recipe.output.filter(o => !FLUID_ITEMS.has(o.item)).length;
  } else if (recipe.output) {
    // Single output — the produced item is the recipe/item name
    solidOutputs = FLUID_ITEMS.has(itemName) ? 0 : 1;
  }
  return solidInputs + solidOutputs;
}

// Sets the calculation depth mode and re-runs the calculation.
// Called from the depth-mode toggle buttons in the results panel.
function setCalcDepthMode(mode) {
  calcDepthMode = mode;
  saveSettings();
  calculateRecipes();
}

// ── Main calculation entry point ───────────────────────────────
//
// Called after every user interaction that changes recipes, goals,
// or settings.  Writes results directly into the DOM element
// #recipeResults and then triggers Sankey + Box diagram updates.
//
// High-level flow:
//   1. For each selected recipe → compute output-per-minute (opm)
//      and the number of machines needed to hit the goal.
//   2. Accumulate direct ingredient consumption into `totals`.
//   3. Recursively resolve `totals` down to raw/minable materials
//      using resolveIngredient() → stored in `resolvedTotals` (depth-aware).
//   4. Render three collapsible result tables into #recipeResults.
//   5. Trigger renderSankey() and renderBoxes().
function calculateRecipes() {
  if (!selectedRecipeList.length) return;

  // totals[itemName] = total items/min consumed across all selected recipes
  const totals = {};

  // ── Per-recipe line calculation ────────────────────────────
  const lines = selectedRecipeList
    .map((item) => {
      const r = RECIPES[item.recipeName || item.name]; // support both old and new format
      if (!r) return null;

      if (!r.machines[item.machineName]) return null;

      const ct = r.machines[item.machineName].cycleTime; // seconds per cycle

      const opm = machineOpm(r, item);

      // Machines needed: always round up (you can't run half a machine)
      const machines   = ceilMachines(item.goal / opm);
      const actualOpm  = machines * opm;       // actual output with rounded-up machines
      const over       = actualOpm - item.goal; // overproduction due to rounding
      // Machine-equivalents actually needed for the goal (fractional).
      // Material demand follows the goal, not the rounded-up machine count —
      // the extra machine capacity just idles, it doesn't eat ingredients.
      const runs       = item.goal / opm;

      // Accumulate ingredient usage for the direct-materials table
      r.ingredients.forEach((ing) => {
        // ipm = ingredient items consumed per minute
        const ipm = (60 / ct) * ing.amount * runs;
        totals[ing.item] = (totals[ing.item] || 0) + ipm;
      });

      return {
        ...item,
        displayName: item.itemName || item.name,
        machines,
        runs,
        actualOpm,
        over,
      };
    })
    .filter(Boolean); // drop any recipes that couldn't be resolved

  // ── Fixed fluid supply per machine (Blast Furnace → Hot Air) ──
  const fixedFluids = {}; // fluid → L/min added by fixed per-machine needs (sizes fracking towers)
  lines.forEach(line => {
    Object.entries(fluidNeedsPerMachine(line.machineName, line.recipeName)).forEach(([fluid, perMachine]) => {
      totals[fluid] = (totals[fluid] || 0) + perMachine * line.machines;
      fixedFluids[fluid] = (fixedFluids[fluid] || 0) + perMachine * line.machines;
    });
  });
  // Same rule deeper in the chain: per item, rounded-up machines × fixed fluid.
  const chainFluidDemand = (runsByItem) => {
    const out = {};
    Object.entries(runsByItem).forEach(([item, { machine, runs }]) =>
      Object.entries(fluidNeedsPerMachine(machine, item)).forEach(([fluid, per]) => {
        out[fluid] = (out[fluid] || 0) + per * ceilMachines(runs);
        fixedFluids[fluid] = (fixedFluids[fluid] || 0) + per * ceilMachines(runs);
      }));
    return out;
  };

  // ── Byproducts from selected recipes ────────────────────────
  // Computed from lines directly — independent of depth mode.
  const byproductTotals = {}; // itemName → { amount, machine }
  lines.forEach(line => {
    const r = RECIPES[line.recipeName || line.name];
    if (!Array.isArray(r?.output) || r.output.length < 2) return;
    const ct = r.machines[line.machineName].cycleTime;
    for (let i = 1; i < r.output.length; i++) {
      const sec = r.output[i];
      const apm = line.runs * (60 / ct) * sec.amount * (sec.chance ?? 1);
      if (!byproductTotals[sec.item]) byproductTotals[sec.item] = { amount: 0, machine: null };
      byproductTotals[sec.item].amount += apm;
      const disposal = typeof BYPRODUCT_DISPOSAL !== 'undefined' ? BYPRODUCT_DISPOSAL[sec.item] : null;
      if (disposal) byproductTotals[sec.item].machine = disposal.machine;
    }
  });

  // ── Byproducts from full ingredient chain ───────────────────
  // Collect byproducts from intermediate recipes (e.g. Blast Furnace Slag)
  // that are not direct top-level recipes but appear in the ingredient tree.
  // Byproducts per 1 unit/min of an item, memoised: byproducts scale linearly
  // with the amount, so each item's subtree is walked once. (The old per-path
  // walk was exponential on deep chains — Assault Robot took ~5.5 s.)
  // ponytail: the memo keeps the first cycle-truncated result for an item; fine
  // for the rare loops (barrels, reactor), exact for acyclic chains.
  const bpMemo = new Map();
  function byproductsPerUnit(itemName, visitedPath) {
    const resolved = resolveRecipeName(itemName);
    if (visitedPath.has(resolved) || visitedPath.size > 50) return {};
    if (bpMemo.has(resolved)) return bpMemo.get(resolved);
    const out = {};
    bpMemo.set(resolved, out);
    const recipe = RECIPES[resolved];
    const machine = recipe?.ingredients?.length && Object.keys(recipe.machines || {}).length
      ? preferredMachineFor(recipe) : null;
    const md = machine && recipe.machines[machine];
    if (!md) return out;
    const runsPerUnit = (60 / md.cycleTime) / machineOpm(recipe, { itemName: resolved, machineName: machine });
    if (Array.isArray(recipe.output)) {
      recipe.output.slice(1).forEach(sec => {
        out[sec.item] = (out[sec.item] || 0) + runsPerUnit * sec.amount * (sec.chance ?? 1);
      });
    }
    const nextPath = new Set(visitedPath).add(resolved);
    recipe.ingredients.forEach(ing => {
      const sub = byproductsPerUnit(ing.item, nextPath), f = runsPerUnit * ing.amount;
      Object.entries(sub).forEach(([b, v]) => { out[b] = (out[b] || 0) + v * f; });
    });
    return out;
  }
  Object.entries(totals).forEach(([name, val]) => {
    Object.entries(byproductsPerUnit(name, new Set())).forEach(([b, perUnit]) => {
      if (!byproductTotals[b]) {
        const disposal = typeof BYPRODUCT_DISPOSAL !== 'undefined' ? BYPRODUCT_DISPOSAL[b] : null;
        byproductTotals[b] = { amount: 0, machine: disposal ? disposal.machine : null };
      }
      byproductTotals[b].amount += perUnit * val;
    });
  });

  // ── Byproduct supply pool ────────────────────────────────────
  // Byproducts are real output: wherever the chain needs that item again it is
  // taken from here first (e.g. Crude Olumite from emptying barrels). For a
  // byproduct with a reprocessing recipe the pool holds what it COULD become
  // (Slag → Cement): Concrete anywhere in the chain uses slag cement before
  // cement from raw materials, and only that share is reprocessed. The rest of
  // the byproduct is disposed of directly (liquid slag → Flare Stack).
  // ponytail: byproduct amounts come from the full chain before pool savings;
  // a pooled item whose own chain makes byproducts is slightly over-counted.
  const supply = {};
  Object.entries(byproductTotals).forEach(([name, info]) => {
    const rp = typeof BYPRODUCT_DISPOSAL !== 'undefined' ? BYPRODUCT_DISPOSAL[name]?.reprocess : null;
    const repRecipe  = rp && RECIPES[rp.recipe];
    const repMachine = repRecipe && preferredMachineFor(repRecipe);
    if (!repMachine) { supply[name] = (supply[name] || 0) + info.amount; return; }
    const inPerMachine  = (60 / repRecipe.machines[repMachine].cycleTime) * repRecipe.ingredients[0].amount;
    const outPerMachine = machineOpm(repRecipe, { itemName: rp.produces, machineName: repMachine });
    const potential = (info.amount / inPerMachine) * outPerMachine;
    supply[rp.produces] = (supply[rp.produces] || 0) + potential;
    info.reprocessed = { machine: repMachine, produces: rp.produces, potential, inPerMachine, outPerMachine };
  });
  _lastSupply = { ...supply }; // for the Sankey/Boxes graph
  // Takes up to `amount` of `item` from `pool`; returns what still has to be made.
  const takeFrom = (pool, item, amount) => {
    const t = Math.min(pool[item] || 0, amount);
    if (t > 0) pool[item] -= t;
    return amount - t;
  };

  // ── Infrastructure: loaders + power per line ────────────────
  const infraByMachine = {}; // aggregated by machineName
  lines.forEach(line => {
    const recipe = RECIPES[line.recipeName || line.name];
    const nSolid  = countSolidConnections(recipe, line.itemName);
    const loaders = calcLoadersForMachine(line.machineName, nSolid);
    const machPwr = machinesPowerKw(line.machineName, 1); // per machine, same rules as totals

    const key = line.machineName;
    if (!infraByMachine[key]) {
      infraByMachine[key] = {
        machineName: key, count: 0,
        machPwrKw: machPwr,
        totalMachPwrKw: 0,
        loaderCount: 0, secondLaneCount: 0, thirdLaneCount: 0,
        totalLoaderPwrKw: 0,
      };
    }
    const e = infraByMachine[key];
    e.count           += line.machines;
    e.loaderCount     += loaders.loaderCount     * line.machines;
    e.secondLaneCount += loaders.secondLaneCount * line.machines;
    e.thirdLaneCount  += loaders.thirdLaneCount  * line.machines;
    e.totalLoaderPwrKw += loaders.powerKw        * line.machines;
  });

  // Adjacency needs the whole count per type, so total power is set per type
  Object.values(infraByMachine).forEach(e => { e.totalMachPwrKw = machinesPowerKw(e.machineName, e.count); });
  const totalMachPwrKw  = Object.values(infraByMachine).reduce((s, e) => s + e.totalMachPwrKw,   0);
  const totalLoaderPwrKw = Object.values(infraByMachine).reduce((s, e) => s + e.totalLoaderPwrKw, 0);
  const totalPwrKw       = totalMachPwrKw + totalLoaderPwrKw;

  // ── Summary stats ────────────────────────────────────────
  const totalMachines   = lines.reduce((s, r) => s + r.machines, 0);
  const totalGoal       = lines.reduce((s, r) => s + r.goal, 0);
  const uniqueMachines  = new Set(lines.map((r) => r.machineName)).size;
  const totalOver       = lines.reduce((s, r) => s + r.over, 0);

  const fmtPwr = (kw) => kw >= 1000
    ? `${(kw / 1000).toLocaleString('de-DE', {maximumFractionDigits: 2})} MW`
    : `${fmt(Math.round(kw))} kW`;

  const depthLabels = ['Direct', 'Intermediate', 'Raw Materials', 'Full Detail'];
  const depthDesc   = ['immediate ingredients only', 'down to plates / rods / steel etc.', 'all the way to raw materials', 'complete production chain with conveyor'];
  const modeSelector = `
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:20px;flex-wrap:wrap">
      <span style="font-size:12px;color:var(--text-dim);flex-shrink:0">Material depth:</span>
      ${depthLabels.map((lbl, i) => `
        <button onclick="setCalcDepthMode(${i})" title="${depthDesc[i]}"
          style="padding:5px 14px;border-radius:6px;border:1px solid ${i === calcDepthMode ? 'var(--accent)' : 'var(--color-border)'};
                 background:${i === calcDepthMode ? 'var(--color-accent-active-bg)' : 'transparent'};
                 color:${i === calcDepthMode ? 'var(--accent)' : 'var(--color-text-secondary)'};
                 cursor:pointer;font-size:12px;font-family:-apple-system,sans-serif;transition:all 0.15s">
          ${lbl}
        </button>`).join('')}
    </div>`;

  const summaryHtml = modeSelector + `
    <div class="summary-grid" style="margin-bottom:28px">
      <div class="summary-box">
        <div class="summary-label">Recipes</div>
        <div class="summary-value">${lines.length}</div>
        <div class="summary-unit">selected</div>
      </div>
      <div class="summary-box orange">
        <div class="summary-label">Total machines</div>
        <div class="summary-value">${fmt(totalMachines)}</div>
        <div class="summary-unit">${uniqueMachines} Machine types</div>
      </div>
      <div class="summary-box green">
        <div class="summary-label">Total production</div>
        <div class="summary-value">${fmt(totalGoal)}</div>
        <div class="summary-unit">Units / Min (sum of goals)</div>
      </div>
      <div class="summary-box">
        <div class="summary-label">Spare capacity</div>
        <div class="summary-value">${fmt(totalOver)}</div>
        <div class="summary-unit">Units / Min (idle, rounded-up machines)</div>
      </div>
      <div class="summary-box orange">
        <div class="summary-label">Machine power</div>
        <div class="summary-value">${fmtPwr(totalMachPwrKw)}</div>
        <div class="summary-unit">excl. loaders</div>
      </div>
      <div class="summary-box" style="border-color:var(--color-power-border);background:var(--color-power-bg)">
        <div class="summary-label" style="color:var(--color-power)">Total power</div>
        <div class="summary-value" style="color:var(--color-power)">${fmtPwr(totalPwrKw)}</div>
        <div class="summary-unit">machines + loaders</div>
      </div>
    </div>`;

  // ── Icon box helper (full-bleed image with rounded container) ─
  const iconBox = (name, size) =>
    `<div style="width:${size}px;height:${size}px;border-radius:${Math.round(size / 5)}px;overflow:hidden;flex-shrink:0;background:var(--color-bg-elevated);display:flex;align-items:center;justify-content:center;">${getIcon(name, size)}</div>`;

  // ── Production overview table rows ───────────────────────
  let rowIdx = 0;
  const overviewRows = lines
    .map((r) => {
      const recipe = RECIPES[r.recipeName || r.name];
      const ct  = recipe.machines[r.machineName].cycleTime;
      const rid = 'rrow_' + (rowIdx++); // unique ID for collapsible detail row

      // Build ingredient pills for this recipe's detail row
      let ingPills = recipe.ingredients.map((ing) => {
        const ipm  = (60 / ct) * ing.amount * r.runs;
        const warn = ipm > 100; // highlight high-throughput ingredients
        return `<span style="display:inline-flex;align-items:center;gap:5px;
            background:${warn ? 'var(--color-warning-bg)' : 'var(--color-success-bg)'};
            border:1px solid ${warn ? 'var(--color-warning-border)' : 'var(--color-success-border)'};
            border-radius:4px;padding:3px 8px;font-size:12px;white-space:nowrap">
            ${iconBox(ing.item, 64)}
            <span style="color:var(--text-dim)">${ing.item}</span>
            <span style="font-family:'Share Tech Mono',monospace;color:${warn ? 'var(--warn)' : 'var(--accent3)'}">
              ${fmt(ipm)}<span style="color:var(--text-dim);font-size:10px">/min</span>
            </span>
          </span>`;
      }).join('');

      // Add byproduct pills if the recipe has secondary outputs
      if (Array.isArray(recipe.output) && recipe.output.length > 1) {
        const byproductPills = recipe.output.slice(1).map(sec => {
          const apm = (60 / ct) * sec.amount * (sec.chance ?? 1) * r.runs;
          return `<span style="display:inline-flex;align-items:center;gap:5px;
              background:var(--color-byproduct-bg);border:1px solid var(--color-byproduct-border);
              border-radius:4px;padding:3px 8px;font-size:12px;white-space:nowrap">
              ${iconBox(sec.item, 64)}
              <span style="color:var(--color-byproduct)">${sec.item}</span>
              <span style="font-family:'Share Tech Mono',monospace;color:var(--color-byproduct)">
                ${fmt(apm)}<span style="color:var(--text-dim);font-size:10px">/min</span>
              </span>
              <span style="font-size:10px;color:var(--color-byproduct);background:var(--color-byproduct-bg);border:1px solid var(--color-byproduct-border);border-radius:3px;padding:1px 4px">Nebenprodukt</span>
            </span>`;
        }).join('');
        ingPills += byproductPills;
      }

      // Show a badge when output is probabilistic (e.g. Crystal Refiner outputs)
      const hasChance = !Array.isArray(recipe.output) && recipe.output && recipe.output.chance != null && recipe.output.chance < 1;
      const chanceBadge = hasChance
        ? `<span title="${recipe.output.amount} per cycle at ${Math.round(recipe.output.chance * 100)}% chance (avg ${(recipe.output.amount * recipe.output.chance).toFixed(1)}/cycle)" style="display:inline-flex;align-items:center;gap:3px;background:var(--color-byproduct-bg);border:1px solid var(--color-warning-border);border-radius:3px;padding:1px 5px;font-size:10px;color:var(--color-warning-text);cursor:help;flex-shrink:0">⚡ ${Math.round(recipe.output.chance * 100)}%</span>`
        : '';

      return `
    <tr class="recipe-main-row" onclick="toggleRecipeRow('${rid}')">
      <td style="padding:7px 12px"><div style="display:flex;align-items:center;gap:6px">
        <span class="row-expand-arrow" id="arr_${rid}">▶</span>
        ${iconBox(r.displayName, 64)}<span class="label">${r.displayName}</span>
        ${r.recipeName !== r.itemName && r.itemName ? '<span style="font-size:10px;color:var(--text-dim);margin-left:4px">' + (r.recipeName || "") + "</span>" : ""}
      </div></td>
      <td style="padding:7px 12px">
        <div style="display:flex;align-items:center;gap:8px">${iconBox(r.machineName, 64)}<span style="color:var(--text-dim);font-size:13px">${r.machineName}</span>${wsBadge(r)}</div>
        ${r.machineName === M.ASSEMBLY_LINE ? `<div style="font-size:10px;color:var(--color-text-disabled);margin-top:3px;padding-left:2px;line-height:1.7">
          └&nbsp;${r.machines * ASSEMBLY_LINE_COMPOSITION.start.count}×&nbsp;${ASSEMBLY_LINE_COMPOSITION.start.name}
          &nbsp;·&nbsp;${r.machines * ASSEMBLY_LINE_COMPOSITION.producer.count}×&nbsp;${ASSEMBLY_LINE_COMPOSITION.producer.name}
          &nbsp;·&nbsp;${r.machines * ASSEMBLY_LINE_COMPOSITION.painter.count}×&nbsp;${ASSEMBLY_LINE_COMPOSITION.painter.name}
        </div>` : ''}
      </td>
      <td class="num">${r.machines}</td>
      <td class="num" style="white-space:nowrap">${fmt(r.goal)}${chanceBadge ? ' ' + chanceBadge : ''}</td>
      <td style="text-align:right;padding:7px 12px">
        ${r.over > 0.05
          ? `<span style="color:var(--warn)">+${fmt(r.over)}</span>`
          : `<span style="color:var(--accent3)">✓</span>`}
      </td>
    </tr>
    <tr class="recipe-detail-row collapsed" id="${rid}">
      <td colspan="5" style="padding:4px 12px 10px 52px">
        <div style="display:flex;flex-wrap:wrap;gap:5px">${ingPills}</div>
      </td>
    </tr>`;
    })
    .join("");


  // ── Material resolution (depth-aware) ───────────────────────
  //
  // resolvedTotals holds the final per-item demand shown in the
  // materials table. What it contains depends on calcDepthMode:
  //   0 = Direct      → just `totals` (no recursion)
  //   1 = Intermediate → recurse, but stop at INTERMEDIATE_ITEMS
  //   2 = Full         → recurse all the way to raw materials
  //
  // resolvedTotals[name] = { amount: Number, machine: String|null }
  const resolvedTotals  = {};
  // Fractional machine count per resolved item (modes 1+2). The same item can be
  // reached via several paths — sum first, round up once per item at the end.
  const resolvedMachineRuns = {}; // resolvedItem → { machine, runs }
  const addMachineRuns = (item, machine, runs) => {
    const e = (resolvedMachineRuns[item] ||= { machine, runs: 0 });
    e.runs += runs;
  };
  const cycleWarnings   = new Set();

  // Build a map: fluid key (lowercase_underscore) → producer machine name
  // Populated from modular building recipes (e.g. "hot_air" → "Hot Air Stove Base")
  // and from FLUID_SOURCE_MACHINES (e.g. "water" → "Pipe Intake").
  const fluidProducerMap = {};
  Object.entries(RECIPES).forEach(([name, r]) => {
    const out = r.modular_building_details?.output;
    if (out && out !== 'none') fluidProducerMap[out] = name;
  });
  if (typeof FLUID_SOURCE_MACHINES !== 'undefined') {
    Object.entries(FLUID_SOURCE_MACHINES).forEach(([key, info]) => {
      // keyed by item name ("Water"); lookups below use the normalised key
      fluidProducerMap[key.toLowerCase().replace(/\s+/g, '_')] = info.machine;
    });
  }

  // Source shown for a raw item without a producing machine: fluid intake or
  // an external delivery (Firmarlite Bar ← Space Station).
  const rawSource = (item) => fluidProducerMap[item.toLowerCase().replace(/\s+/g, '_')]
    || (typeof EXTERNAL_SOURCES !== 'undefined' && EXTERNAL_SOURCES[item]) || null;

  // Always compute direct-level materials (mode-0 view) — used for Direct Materials
  // section in modes 0 and 1.
  const directTotals = {};
  const directPool   = { ...supply };
  Object.entries(totals).forEach(([name, val]) => {
    val = takeFrom(directPool, name, val);
    if (val <= 1e-9) return;
    const resolved = resolveRecipeName(name);
    const recipe   = RECIPES[resolved];
    // Raw (no ingredients) → miner choice; crafted → machine family default
    const machine  = !recipe ? null
      : recipe.ingredients?.length ? preferredMachineFor(recipe) : preferredMinerFor(resolved, recipe);
    directTotals[name] = { amount: val, machine: machine || rawSource(resolved), recipeName: resolved };
  });

  if (calcDepthMode === 0) {
    Object.assign(resolvedTotals, directTotals);
  } else if (calcDepthMode === 3) {
    // Full Detail: collect every item at every level of the production chain
    function resolveAllLevels(itemName, amountPerMin, visitedPath) {
      const resolved = resolveRecipeName(itemName);
      if (visitedPath.has(resolved)) { cycleWarnings.add(resolved); return; }
      if (visitedPath.size > 50) return;
      amountPerMin = takeFrom(supply, itemName, amountPerMin); // byproducts first
      if (amountPerMin <= 1e-9) return;

      const recipe = RECIPES[resolved];
      const addItem = (machine) => {
        if (!resolvedTotals[itemName]) resolvedTotals[itemName] = { amount: 0, machine, recipeName: resolved };
        resolvedTotals[itemName].amount += amountPerMin;
      };

      if (!recipe || !recipe.machines || Object.keys(recipe.machines).length === 0 || getOutputAmount(recipe) === 0) {
        addItem(rawSource(resolved));
        return;
      }
      if (!recipe.ingredients || recipe.ingredients.length === 0) {
        addItem(preferredMinerFor(resolved, recipe));
        return;
      }
      // Crafted item: add it, then recurse into ingredients
      const machine = preferredMachineFor(recipe);
      const machData = recipe.machines[machine];
      const ct  = machData.cycleTime;
      const opm = machineOpm(recipe, { itemName: resolved, machineName: machine });
      addItem(machine);

      // Byproducts are NOT tracked here: they come from byproductTotals (same
      // source as the Byproducts panel, incl. the supply pool) — see below.
      // Tracking them here mixed them with the same item used as an ingredient
      // (Xeno-Crystal: 2/min byproduct + 238/min demand shown as "Incinerator").

      const nextPath = new Set(visitedPath);
      nextPath.add(resolved);
      recipe.ingredients.forEach(ing => {
        resolveAllLevels(ing.item, (amountPerMin / opm) * ing.amount * (60 / ct), nextPath);
      });
    }
    // Start from direct ingredients AND include the produced items themselves
    lines.forEach(line => {
      const recipe = RECIPES[line.recipeName || line.name];
      if (!recipe || !recipe.machines[line.machineName]) return;
      const key = line.displayName || line.itemName;
      if (!resolvedTotals[key]) resolvedTotals[key] = { amount: 0, machine: line.machineName, recipeName: line.recipeName || line.name };
      resolvedTotals[key].amount += line.goal;
    });
    Object.entries(totals).forEach(([name, val]) => resolveAllLevels(name, val, new Set()));
    {
      const lineKeys = new Set(lines.map(l => l.displayName || l.itemName)); // already in totals
      const runsByItem = {};
      Object.entries(resolvedTotals).forEach(([name, info]) => {
        const rec = RECIPES[info.recipeName];
        if (info.byproduct || lineKeys.has(name) || !rec?.machines?.[info.machine]) return;
        if (!Object.keys(fluidNeedsPerMachine(info.machine, info.recipeName)).length) return;
        runsByItem[info.recipeName] = { machine: info.machine, runs: info.amount / machineOpm(rec, { itemName: info.recipeName, machineName: info.machine }) };
      });
      Object.entries(chainFluidDemand(runsByItem)).forEach(([f, amt]) => resolveAllLevels(f, amt, new Set()));
    }

    // Max-depth ordering: each item gets the DEEPEST level at which it appears.
    // This ensures raw materials (used by multiple levels) always appear at the bottom.
    {
      const depthMap = {};
      function computeMaxDepth(itemName, depth, visitedPath) {
        if (visitedPath.has(itemName)) return;
        depthMap[itemName] = Math.max(depthMap[itemName] ?? 0, depth);
        const info = resolvedTotals[itemName];
        if (!info) return;
        const rec = RECIPES[info.recipeName || itemName];
        if (rec && rec.ingredients) {
          const next = new Set(visitedPath);
          next.add(itemName);
          rec.ingredients.forEach(ing => computeMaxDepth(ing.item, depth + 1, next));
        }
      }
      lines.forEach(line => computeMaxDepth(line.displayName || line.itemName, 0, new Set()));
      Object.entries(resolvedTotals).forEach(([name, info]) => {
        // Byproducts always appear at the bottom, after all regular items
        if (info.byproduct) { info.order = 1000000; return; }
        info.order = depthMap[name] ?? 999999;
      });
    }
  } else {
    // Modes 1 + 2: recursive resolution
    function resolveIngredient(itemName, amountPerMin, visitedPath) {
      const resolved = resolveRecipeName(itemName);

      if (visitedPath.has(resolved)) {
        cycleWarnings.add(resolved);
        console.warn('foundry-calc: ingredient cycle detected at:', resolved, '← path:', [...visitedPath]);
        return;
      }
      if (visitedPath.size > 50) return;
      amountPerMin = takeFrom(supply, itemName, amountPerMin); // byproducts first
      if (amountPerMin <= 1e-9) return;

      const recipe = RECIPES[resolved];

      // Helper: add item to resolvedTotals using canonical itemName as display key
      const addToTotals = (machine) => {
        if (!resolvedTotals[itemName]) resolvedTotals[itemName] = { amount: 0, machine, recipeName: resolved };
        resolvedTotals[itemName].amount += amountPerMin;
      };

      // No recipe or no output → raw material (or fluid from modular building)
      if (!recipe || !recipe.machines || Object.keys(recipe.machines).length === 0 ||
          getOutputAmount(recipe) === 0) {
        // Mode 1: skip raw materials — only crafted intermediates are shown
        if (calcDepthMode === 1) return;
        addToTotals(rawSource(resolved));
        return;
      }

      // Minable ore (has machines but no ingredients)
      if (!recipe.ingredients || recipe.ingredients.length === 0) {
        // Mode 1: skip raw/mined items
        if (calcDepthMode === 1) return;
        const machine = preferredMinerFor(resolved, recipe);
        addToTotals(machine);
        // Track miner machine count
        if (recipe.machines[machine]) addMachineRuns(resolved, machine, amountPerMin / machineOpm(recipe, { itemName: resolved, machineName: machine }));
        return;
      }

      // Mode 1 stop: intermediate item → treat as a leaf
      if (calcDepthMode === 1 && INTERMEDIATE_ITEMS.has(resolved)) {
        addToTotals(preferredMachineFor(recipe));
        return;
      }

      // Recurse into sub-ingredients, tracking the machine used at this level
      const machineName = preferredMachineFor(recipe);
      const machData    = recipe.machines[machineName];
      const ct  = machData.cycleTime;
      const opm = machineOpm(recipe, { itemName: resolved, machineName });
      const runsPerMin = amountPerMin / opm;

      // Track this machine
      addMachineRuns(resolved, machineName, runsPerMin);

      const nextPath = new Set(visitedPath);
      nextPath.add(resolved);

      recipe.ingredients.forEach(ing => {
        const ingPerMin = runsPerMin * ing.amount * (60 / ct);
        resolveIngredient(ing.item, ingPerMin, nextPath);
      });
    }

    Object.entries(totals).forEach(([name, val]) => {
      resolveIngredient(name, val, new Set());
    });
    Object.entries(chainFluidDemand(resolvedMachineRuns)).forEach(([f, amt]) => resolveIngredient(f, amt, new Set()));
  }

  // What the chain did not use of each byproduct (or its reprocessed product)
  // still has to be disposed of.
  Object.entries(byproductTotals).forEach(([name, info]) => {
    const rp = info.reprocessed;
    if (!rp) { info.leftover = supply[name] ?? info.amount; return; }
    rp.producedPerMin = Math.max(0, rp.potential - (supply[rp.produces] || 0)); // used by the chain
    const usedInput   = rp.producedPerMin / rp.outPerMachine * rp.inPerMachine;
    rp.count          = ceilMachines(usedInput / rp.inPerMachine);
    info.leftover     = Math.max(0, info.amount - usedInput);
  });
  // Full Detail: one row per byproduct that really leaves the chain — the
  // unused rest (→ disposal) or the reprocessed share (→ e.g. Chemical Processor).
  if (calcDepthMode === 3) {
    Object.entries(byproductTotals).forEach(([name, info]) => {
      const amount = info.reprocessed?.count > 0 ? info.amount : info.leftover;
      if (!(amount > 0.01) || resolvedTotals[name]) return;
      const disposal = typeof BYPRODUCT_DISPOSAL !== 'undefined' ? BYPRODUCT_DISPOSAL[name] : null;
      resolvedTotals[name] = { amount, machine: disposal ? disposal.machine : null,
                               recipeName: name, byproduct: true, order: 1000000 };
    });
  }
  const frackPlan = frackingTowerPlan(
    typeof VEIN_MINING_FLUIDS !== 'undefined' && veinsDepleted
      ? fixedFluids[Object.values(VEIN_MINING_FLUIDS)[0]?.fluid] || 0 : 0);

  // ── Material table builder (shared by Direct + resolved sections) ───────────
  function buildMaterialRows(totalsMap) {
    let totMachPwr = 0, totLoaderPwr = 0;
    let totLoader = 0, totSecond = 0, totThird = 0;

    const rows = Object.entries(totalsMap)
      .sort((a, b) => b[1].amount - a[1].amount)
      .map(([name, info]) => {
        const val     = info.amount;
        const machine = info.machine;
        const cls = val > 100 ? "num-warn" : "num";

        let machineTd = '<td colspan="5"></td>';
        if (machine) {
          const rec = RECIPES[info.recipeName || name];
          const md  = rec && rec.machines[machine];
          if (md) {
            const opm         = machineOpm(rec, { itemName: info.recipeName || name, machineName: machine });
            const count       = ceilMachines(val / opm);
            const machPwrKw   = machinesPowerKw(machine, count);
            const nSolid      = countSolidConnections(rec, name);
            const loaders     = calcLoadersForMachine(machine, nSolid);
            const loaderPwrKw = loaders.powerKw * count;
            const loaderDesc  = [
              loaders.loaderCount     ? `${loaders.loaderCount     * count}× Loader` : '',
              loaders.secondLaneCount ? `${loaders.secondLaneCount * count}× 2nd`    : '',
              loaders.thirdLaneCount  ? `${loaders.thirdLaneCount  * count}× 3rd`    : '',
            ].filter(Boolean).join(' · ') || '—';

            totMachPwr  += machPwrKw;
            totLoaderPwr += loaderPwrKw;
            totLoader   += loaders.loaderCount     * count;
            totSecond   += loaders.secondLaneCount * count;
            totThird    += loaders.thirdLaneCount  * count;

            machineTd = `
              <td style="padding:6px 12px"><div style="display:flex;align-items:center;gap:8px">${iconBox(machine, 64)}<span class="label">${machine}</span>${wsBadge({ itemName: info.recipeName || name, machineName: machine })}</div></td>
              <td class="num">${count}</td>
              <td class="num">${fmtPwr(machPwrKw)}</td>
              <td style="padding:6px 12px;font-size:12px;color:var(--text-dim)">${loaderDesc}</td>
              <td class="num" style="color:var(--color-power)">${fmtPwr(machPwrKw + loaderPwrKw)}</td>`;
          } else {
            // Check for capacity-based machines (fluid sources with throughput_l_per_min)
            const machineRec = RECIPES[machine];
            const fluidKey = name.toLowerCase().replace(/\s+/g, '_');
            const fluidSrc = typeof FLUID_SOURCE_MACHINES !== 'undefined' ? (FLUID_SOURCE_MACHINES[name] || FLUID_SOURCE_MACHINES[fluidKey]) : null;
            const capacityLpm = fluidSrc?.capacityPerMin ?? machineRec?.throughput_l_per_min ?? null;
            if (capacityLpm) {
              const count = Math.ceil(val / capacityLpm);
              const machPwrKw = machinesPowerKw(machine, count);
              totMachPwr += machPwrKw;
              machineTd = `
                <td style="padding:6px 12px"><div style="display:flex;align-items:center;gap:8px">${iconBox(machine, 64)}<span class="label">${machine}</span></div></td>
                <td class="num">${count}</td>
                <td class="num">${fmtPwr(machPwrKw)}</td>
                <td style="padding:6px 12px;font-size:12px;color:var(--text-dim)">—</td>
                <td class="num" style="color:var(--color-power)">${fmtPwr(machPwrKw)}</td>`;
            } else {
              machineTd = `<td style="padding:6px 12px"><div style="display:flex;align-items:center;gap:8px">${iconBox(machine, 64)}<span class="label">${machine}</span></div></td><td class="num">—</td><td class="num">—</td><td></td><td class="num">—</td>`;
            }
          }
        }
        return `
      <tr>
        <td style="padding:6px 12px"><div style="display:flex;align-items:center;gap:10px">${iconBox(name, 64)}<span class="label">${name}</span></div></td>
        <td class="${cls}">${fmt(val)}</td>
        <td class="num">${fmt(val / 60)}/s</td>
        ${machineTd}
      </tr>`;
      }).join('');

    const loaderDesc = [
      totLoader ? `${totLoader}× Loader` : '',
      totSecond ? `${totSecond}× 2nd`    : '',
      totThird  ? `${totThird}× 3rd`     : '',
    ].filter(Boolean).join(' · ') || '—';

    const footer = `
      <tr style="border-top:1px solid var(--color-border);font-weight:600">
        <td style="padding:6px 12px;color:var(--text-dim)" colspan="3">Total</td>
        <td colspan="2"></td>
        <td class="num">${fmtPwr(totMachPwr)}</td>
        <td style="padding:6px 12px;font-size:12px;color:var(--text-dim)">${loaderDesc}</td>
        <td class="num" style="color:var(--color-power)">${fmtPwr(totMachPwr + totLoaderPwr)}</td>
      </tr>`;

    return { rows, footer, count: Object.keys(totalsMap).length };
  }

  const depthTitles = ['Direct Materials', 'Intermediate Materials', 'Raw Materials', 'Full Detail'];

  // ── Conveyor throughput (for Full Detail mode) ───────────────
  const conveyorFamily  = MACHINE_FAMILIES.find(f => f.label === 'Conveyor Belt');
  const conveyorType    = conveyorFamily?.defaultChoice || conveyorFamily?.machines[0] || 'Conveyor I';
  const conveyorThroughput = RECIPES[conveyorType]?.items_per_min || 160;

  // ── Full Detail: compact Factorio-calc-style rows ─────────────
  function buildFullDetailRows(totalsMap) {
    let totMachPwr = 0, totLoaderPwr = 0;
    let fdIdx = 0;

    const rows = Object.entries(totalsMap)
      .sort((a, b) => {
        const oA = a[1].order ?? 999999, oB = b[1].order ?? 999999;
        if (oA !== oB) return oA - oB;
        // Within same depth: crafted items (have ingredients) before raw/mined
        const recA = RECIPES[a[1].recipeName || a[0]];
        const recB = RECIPES[b[1].recipeName || b[0]];
        const rawA = (!recA || !recA.ingredients || recA.ingredients.length === 0) ? 1 : 0;
        const rawB = (!recB || !recB.ingredients || recB.ingredients.length === 0) ? 1 : 0;
        return rawA - rawB;
      })
      .map(([name, info]) => {
        const val     = info.amount;
        const machine = info.machine;
        const isFluid = FLUID_ITEMS.has(name);
        const rid     = 'fd_' + (fdIdx++);

        let machineCell  = '<span style="color:var(--text-dim);font-size:12px">—</span>';
        let loaderCell   = '';
        let pwrCell      = '<span style="color:var(--text-dim)">—</span>';
        let ingPills     = '';

        // Conveyor (solids) or Pipe (fluids)
        const pipeThroughput = RECIPES['Pipe']?.throughput_l_per_min || 36000;
        const conveyorCell = isFluid
          ? `<div style="display:flex;align-items:center;gap:4px">${iconBox('Pipe', 48)}<span style="font-family:'Share Tech Mono',monospace;font-size:13px;color:var(--accent3)">${(val / pipeThroughput).toFixed(2)}</span></div>`
          : `<div style="display:flex;align-items:center;gap:4px">${iconBox(conveyorType, 48)}<span style="font-family:'Share Tech Mono',monospace;font-size:13px;color:var(--accent3)">${(val / conveyorThroughput).toFixed(2)}</span></div>`;

        // Byproduct disposal machines (e.g. Flare Stack for Waste Gas) don't have
        // a cycleTime-based recipe — handle them with their capacity directly.
        // If a reprocessing option exists and was triggered, show that instead.
        const disposal = (typeof BYPRODUCT_DISPOSAL !== 'undefined') ? BYPRODUCT_DISPOSAL[name] : null;
        if (disposal && info.byproduct) {
          const rp = byproductTotals[name]?.reprocessed;
          if (rp?.count > 0) {
            // Reprocessing: e.g. Chemical Processor for Blast Furnace Slag → Cement
            const machPwrKw = machinesPowerKw(rp.machine, rp.count);
            totMachPwr += machPwrKw;
            machineCell = `<div style="display:flex;align-items:center;gap:5px">${iconBox(rp.machine, 48)}<span style="font-size:12px;color:var(--text-dim)">${rp.machine}</span><span style="font-family:'Share Tech Mono',monospace;font-size:13px;color:var(--accent3)">×${rp.count}</span><span style="font-size:10px;color:var(--color-success-text);margin-left:4px">→ ${fmt(rp.producedPerMin)}/min ${rp.produces}</span></div>`;
            // Unused rest goes straight to disposal (e.g. 200/min slag → Flare Stack)
            const rest = byproductTotals[name]?.leftover || 0;
            if (rest > 0.01) machineCell += `<div style="display:flex;align-items:center;gap:5px;margin-top:3px">${iconBox(disposal.machine, 48)}<span style="font-size:12px;color:var(--text-dim)">${disposal.machine}</span><span style="font-family:'Share Tech Mono',monospace;font-size:13px;color:var(--accent3)">×${ceilMachines(rest / disposal.capacityPerMin)}</span><span style="font-size:10px;color:var(--text-dim);margin-left:4px">rest ${fmt(rest)}/min</span></div>`;
            if (machPwrKw > 0) pwrCell = `<span style="font-size:12px;color:var(--color-power)">${fmtPwr(machPwrKw)}</span>`;
          } else {
            const count     = Math.ceil(val / disposal.capacityPerMin);
            const machPwrKw = machinesPowerKw(disposal.machine, count);
            totMachPwr += machPwrKw;
            machineCell = `<div style="display:flex;align-items:center;gap:5px">${iconBox(disposal.machine, 48)}<span style="font-size:12px;color:var(--text-dim)">${disposal.machine}</span><span style="font-family:'Share Tech Mono',monospace;font-size:13px;color:var(--accent3)">×${count}</span></div>`;
            if (machPwrKw > 0) pwrCell = `<span style="font-size:12px;color:var(--color-power)">${fmtPwr(machPwrKw)}</span>`;
          }
        } else if (machine) {
          const rec = RECIPES[info.recipeName || name];
          const md  = rec && rec.machines[machine];
          // Fluid source machines from fluidProducerMap (no cycleTime-based recipe for this item)
          const machineRec = RECIPES[machine];
          const fluidKey   = name.toLowerCase().replace(/\s+/g, '_');
          const fluidSrc   = typeof FLUID_SOURCE_MACHINES !== 'undefined' ? (FLUID_SOURCE_MACHINES[name] || FLUID_SOURCE_MACHINES[fluidKey]) : null;
          const capacityLpm = fluidSrc?.capacityPerMin ?? machineRec?.throughput_l_per_min ?? null;
          if (!md && capacityLpm) {
            // Capacity-based count (e.g. Pipe Intake → ceil(waterRate / 30000))
            const count     = Math.ceil(val / capacityLpm);
            const machPwrKw = machinesPowerKw(machine, count);
            totMachPwr += machPwrKw;
            machineCell = `<div style="display:flex;align-items:center;gap:5px">${iconBox(machine, 48)}<span style="font-size:12px;color:var(--text-dim)">${machine}</span><span style="font-family:'Share Tech Mono',monospace;font-size:13px;color:var(--accent3)">×${count}</span></div>`;
            if (machPwrKw > 0) pwrCell = `<span style="font-size:12px;color:var(--color-power)">${fmtPwr(machPwrKw)}</span>`;
          } else if (!md) {
            // No capacity data — show machine name only (e.g. Air Intake Base)
            machineCell = `<div style="display:flex;align-items:center;gap:5px">${iconBox(machine, 48)}<span style="font-size:12px;color:var(--text-dim)">${machine}</span></div>`;
          } else if (md) {
            const opm         = machineOpm(rec, { itemName: info.recipeName || name, machineName: machine });
            const count       = ceilMachines(val / opm);
            const machPwrKw   = machinesPowerKw(machine, count);
            const nSolid      = countSolidConnections(rec, name);
            const loaders     = calcLoadersForMachine(machine, nSolid);
            const loaderPwrKw = loaders.powerKw * count;

            totMachPwr   += machPwrKw;
            totLoaderPwr += loaderPwrKw;

            machineCell = `<div style="display:flex;align-items:center;gap:5px">${iconBox(machine, 48)}<span style="font-size:12px;color:var(--text-dim)">${machine}</span><span style="font-family:'Share Tech Mono',monospace;font-size:13px;color:var(--accent3)">×${count}</span>${wsBadge({ itemName: info.recipeName || name, machineName: machine })}</div>`;

            const totalLoaders = loaders.loaderCount * count;
            const totalSecond  = loaders.secondLaneCount * count;
            const totalThird   = loaders.thirdLaneCount  * count;
            if (totalLoaders || totalSecond || totalThird) {
              const parts = [
                totalLoaders ? `${totalLoaders}×L1` : '',
                totalSecond  ? `${totalSecond}×L2`  : '',
                totalThird   ? `${totalThird}×L3`   : '',
              ].filter(Boolean).join(' ');
              loaderCell = `<span style="font-size:11px;color:var(--text-dim)">${parts}</span>`;
            }

            pwrCell = `<span style="font-size:12px;color:var(--color-power)">${fmtPwr(machPwrKw + loaderPwrKw)}</span>`;

            // Build ingredient pills for expanded detail row
            if (rec.ingredients && rec.ingredients.length) {
              ingPills = rec.ingredients.map((ing) => {
                // Use demand-proportional rate (val = needed output/min), not machine-capacity × count.
                // This avoids showing a higher number than the row above due to Math.ceil rounding.
                const ipm  = (val / opm) * (60 / md.cycleTime) * ing.amount;
                const warn = ipm > 100;
                return `<span style="display:inline-flex;align-items:center;gap:5px;
                    background:${warn ? 'var(--color-warning-bg)' : 'var(--color-success-bg)'};
                    border:1px solid ${warn ? 'var(--color-warning-border)' : 'var(--color-success-border)'};
                    border-radius:4px;padding:3px 8px;font-size:12px;white-space:nowrap">
                    ${iconBox(ing.item, 48)}
                    <span style="color:var(--text-dim)">${ing.item}</span>
                    <span style="font-family:'Share Tech Mono',monospace;color:${warn ? 'var(--warn)' : 'var(--accent3)'}">
                      ${fmt(ipm)}<span style="color:var(--text-dim);font-size:10px">/min</span>
                    </span>
                  </span>`;
              }).join('');
            }

            // Add byproduct pills for secondary outputs of this recipe
            if (Array.isArray(rec.output) && rec.output.length > 1) {
              ingPills += rec.output.slice(1).map(sec => {
                const bpm = (val / opm) * (60 / md.cycleTime) * sec.amount * (sec.chance ?? 1);
                return `<span style="display:inline-flex;align-items:center;gap:5px;
                    background:var(--color-byproduct-bg);border:1px solid var(--color-byproduct-border);
                    border-radius:4px;padding:3px 8px;font-size:12px;white-space:nowrap">
                    ${iconBox(sec.item, 48)}
                    <span style="color:var(--color-byproduct)">${sec.item}</span>
                    <span style="font-family:'Share Tech Mono',monospace;color:var(--color-byproduct)">
                      ${fmt(bpm)}<span style="color:var(--text-dim);font-size:10px">/min</span>
                    </span>
                    <span style="font-size:10px;color:var(--color-byproduct);background:var(--color-byproduct-bg);border:1px solid var(--color-byproduct-border);border-radius:3px;padding:1px 4px">↗</span>
                  </span>`;
              }).join('');
            }
          }
        }

        const cls = val > 100 ? 'num-warn' : 'num';
        const hasDetail = ingPills.length > 0;
        const isByproduct = !!info.byproduct;
        const rowBg = isByproduct ? 'background:var(--color-byproduct-bg);' : '';
        const byproductBadge = isByproduct
          ? `<span style="font-size:10px;color:var(--color-byproduct);background:var(--color-byproduct-bg);border:1px solid var(--color-byproduct-border);border-radius:3px;padding:1px 5px;margin-left:4px">Nebenprodukt</span>`
          : '';
        return `
      <tr class="recipe-main-row" onclick="${hasDetail ? `toggleRecipeRow('${rid}')` : ''}" style="border-bottom:1px solid var(--color-border);${hasDetail ? 'cursor:pointer' : ''}${rowBg}">
        <td style="padding:5px 12px"><div style="display:flex;align-items:center;gap:6px">
          ${hasDetail ? `<span class="row-expand-arrow" id="arr_${rid}">▶</span>` : '<span style="display:inline-block;width:14px"></span>'}
          ${iconBox(name, 48)}<span class="label" style="font-size:13px">${name}</span>${byproductBadge}
        </div></td>
        <td class="${cls}" style="font-size:13px">${fmt(val)}/min</td>
        <td style="padding:5px 12px">${machineCell}</td>
        <td style="padding:5px 12px">${conveyorCell}</td>
        <td style="padding:5px 12px">${loaderCell}</td>
        <td style="padding:5px 12px;text-align:right">${pwrCell}</td>
      </tr>
      ${hasDetail ? `<tr class="recipe-detail-row collapsed" id="${rid}">
        <td colspan="6" style="padding:4px 12px 10px 52px">
          <div style="display:flex;flex-wrap:wrap;gap:5px">${ingPills}</div>
        </td>
      </tr>` : ''}`;
      }).join('');

    const footer = `
      <tr style="border-top:1px solid var(--color-border);font-weight:600">
        <td colspan="2" style="padding:6px 12px;color:var(--text-dim)">Total</td>
        <td colspan="3"></td>
        <td style="padding:6px 12px;text-align:right;color:var(--color-power)">${fmtPwr(totMachPwr + totLoaderPwr)}</td>
      </tr>`;

    return { rows, footer, count: Object.keys(totalsMap).length };
  }

  const direct   = buildMaterialRows(directTotals);
  const resolved = buildMaterialRows(resolvedTotals);
  const fullDetail = calcDepthMode === 3 ? buildFullDetailRows(resolvedTotals) : null;

  // ── Infrastructure table rows ─────────────────────────────
  const infraRows = Object.values(infraByMachine)
    .sort((a, b) => b.totalMachPwrKw - a.totalMachPwrKw)
    .map(e => {
      const loaderDesc = [
        e.loaderCount     ? `${e.loaderCount}× Loader`            : '',
        e.secondLaneCount ? `${e.secondLaneCount}× 2nd Lane`       : '',
        e.thirdLaneCount  ? `${e.thirdLaneCount}× 3rd Lane`        : '',
      ].filter(Boolean).join(' · ') || '—';
      return `
    <tr>
      <td style="padding:6px 12px"><div style="display:flex;align-items:center;gap:8px">${iconBox(e.machineName, 64)}<span class="label">${e.machineName}</span></div></td>
      <td class="num">${e.count}</td>
      <td class="num">${fmtPwr(e.machPwrKw)}</td>
      <td class="num">${fmtPwr(e.totalMachPwrKw)}</td>
      <td style="padding:6px 12px;font-size:12px;color:var(--text-dim)">${loaderDesc}</td>
      <td class="num">${e.totalLoaderPwrKw ? fmtPwr(e.totalLoaderPwrKw) : '—'}</td>
      <td class="num" style="color:var(--color-power)">${fmtPwr(e.totalMachPwrKw + e.totalLoaderPwrKw)}</td>
    </tr>`;
    }).join('');

  const infraFooter = `
    <tr style="border-top:1px solid var(--color-border);font-weight:600">
      <td style="padding:6px 12px;color:var(--text-dim)">Total</td>
      <td class="num">${fmt(totalMachines)}</td>
      <td class="num">—</td>
      <td class="num">${fmtPwr(totalMachPwrKw)}</td>
      <td></td>
      <td class="num">${fmtPwr(totalLoaderPwrKw)}</td>
      <td class="num" style="color:var(--color-power)">${fmtPwr(totalPwrKw)}</td>
    </tr>`;

  // ── Machine totals (aggregated by machine type) ──────────
  const machineTotals = {};
  lines.forEach((r) => {
    machineTotals[r.machineName] = (machineTotals[r.machineName] || 0) + r.machines;
  });
  // Add machines from ingredient resolution chain
  Object.values(resolvedMachineRuns).forEach(({ machine, runs }) => {
    machineTotals[machine] = (machineTotals[machine] || 0) + ceilMachines(runs);
  });
  if (frackPlan) machineTotals[frackPlan.machine] = (machineTotals[frackPlan.machine] || 0) + frackPlan.count;
  const machineRows = Object.entries(machineTotals)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => {
      const alBreakdown = name === M.ASSEMBLY_LINE
        ? `<div style="font-size:10px;color:var(--color-text-disabled);margin-top:3px;padding-left:2px;line-height:1.7">
            └&nbsp;${count * ASSEMBLY_LINE_COMPOSITION.start.count}×&nbsp;${ASSEMBLY_LINE_COMPOSITION.start.name}
            &nbsp;·&nbsp;${count * ASSEMBLY_LINE_COMPOSITION.producer.count}×&nbsp;${ASSEMBLY_LINE_COMPOSITION.producer.name}
            &nbsp;·&nbsp;${count * ASSEMBLY_LINE_COMPOSITION.painter.count}×&nbsp;${ASSEMBLY_LINE_COMPOSITION.painter.name}
          </div>`
        : name === frackPlan?.machine
        ? `<div style="font-size:10px;color:var(--color-text-disabled);margin-top:3px">
            ${depletedVeins} depleted vein(s) · ${fmt(frackPlan.capacity)} L/min each · ${fmtPwr(frackPlan.powerKw)}
          </div>`
        : '';
      return `
    <tr>
      <td style="padding:6px 12px">
        <div style="display:flex;align-items:center;gap:10px">${iconBox(name, 64)}<div><span class="label">${name}</span>${alBreakdown}</div></div>
      </td>
      <td class="num">${fmt(count)}</td>
    </tr>`;
    })
    .join("");

  // ── Inject HTML into results panel ───────────────────────
  document.getElementById("recipeResults").innerHTML =
    summaryHtml +
    `
    ${calcDepthMode !== 3 ? `
    <div class="collapsible-section">
      <div class="collapsible-header" onclick="toggleSection(this)">
        <span class="ch-title">Production Overview</span>
        <span style="display:flex;align-items:center;gap:12px">
          <span class="ch-meta">${lines.length} Recipes · ${fmt(totalMachines)} Machines · ${fmt(totalGoal)} /min</span>
          <span class="ch-arrow">▼</span>
        </span>
      </div>
      <div class="collapsible-body">
        <table class="results-table">
          <thead>
            <tr>
              <th>Recipe</th><th>Machine</th>
              <th style="text-align:right">Machines</th>
              <th style="text-align:right">Output/Min</th>
              <th style="text-align:right" title="Idle capacity of the rounded-up machines">Spare capacity</th>
            </tr>
          </thead>
          <tbody>${overviewRows}</tbody>
        </table>
      </div>
    </div>

    <div class="collapsible-section">
      <div class="collapsible-header" onclick="toggleSection(this)">
        <span class="ch-title">Infrastructure &amp; Power</span>
        <span style="display:flex;align-items:center;gap:12px">
          <span class="ch-meta">${fmtPwr(totalMachPwrKw)} machines · ${fmtPwr(totalLoaderPwrKw)} loaders · ${fmtPwr(totalPwrKw)} total</span>
          <span class="ch-arrow">▼</span>
        </span>
      </div>
      <div class="collapsible-body">
        <table class="results-table">
          <thead><tr>
            <th>Machine</th>
            <th style="text-align:right">Count</th>
            <th style="text-align:right">kW each</th>
            <th style="text-align:right">Machine total</th>
            <th>Loaders</th>
            <th style="text-align:right">Loader power</th>
            <th style="text-align:right">Combined</th>
          </tr></thead>
          <tbody>${infraRows}${infraFooter}</tbody>
        </table>
      </div>
    </div>` : ''}

    ${Object.keys(byproductTotals).length > 0 ? `
    <div class="collapsible-section">
      <div class="collapsible-header" onclick="toggleSection(this)">
        <span class="ch-title" style="color:var(--color-byproduct)">Byproducts</span>
        <span style="display:flex;align-items:center;gap:12px">
          <span class="ch-meta">${Object.keys(byproductTotals).length} item type(s) — must be handled</span>
          <span class="ch-arrow">▼</span>
        </span>
      </div>
      <div class="collapsible-body">
        <div style="display:flex;flex-wrap:wrap;gap:8px;padding:10px 12px">
          ${Object.entries(byproductTotals).map(([name, info]) => {
            const disposal = typeof BYPRODUCT_DISPOSAL !== 'undefined' ? BYPRODUCT_DISPOSAL[name] : null;
            let machineHtml = '';
            const machineLine = (m, n) => `<span style="display:flex;align-items:center;gap:4px;margin-top:3px">${iconBox(m, 48)}<span style="font-size:10px;color:var(--text-dim)">${m} ×${n}</span></span>`;
            const note = (txt) => `<span style="font-size:10px;color:var(--color-success-text);margin-top:2px">${txt}</span>`;
            const rp = info.reprocessed;
            if (rp?.producedPerMin > 0.01) {
              machineHtml = machineLine(rp.machine, rp.count)
                + note(`→ ${fmt(rp.producedPerMin)}/min ${rp.produces} for the chain`);
              if (info.leftover > 0.01 && disposal) {
                machineHtml += note(`rest ${fmt(info.leftover)}/min →`)
                  + machineLine(disposal.machine, ceilMachines(info.leftover / disposal.capacityPerMin));
              }
            } else if (info.leftover <= 0.01) {
              machineHtml = note('fully used in the chain');
            } else if (disposal) {
              const used = info.amount - info.leftover;
              if (used > 0.01) machineHtml = note(`${fmt(used)}/min used in chain`);
              machineHtml += machineLine(disposal.machine, ceilMachines(info.leftover / disposal.capacityPerMin));
            }
            return `<span style="display:inline-flex;flex-direction:column;gap:2px;
                background:var(--color-byproduct-bg);border:1px solid var(--color-byproduct-border);
                border-radius:6px;padding:6px 10px;font-size:12px">
              <span style="display:flex;align-items:center;gap:5px">
                ${iconBox(name, 48)}
                <span style="color:var(--color-byproduct);font-weight:600">${name}</span>
                <span style="font-family:'Share Tech Mono',monospace;color:var(--accent3)">${fmt(info.amount)}<span style="color:var(--text-dim);font-size:10px">/min</span></span>
              </span>
              ${machineHtml}
            </span>`;
          }).join('')}
        </div>
      </div>
    </div>` : ''}

    ${cycleWarnings.size > 0 ? `
    <div style="background:var(--color-danger-bg);border:1px solid var(--color-danger-border);border-radius:6px;padding:10px 14px;margin-bottom:16px;display:flex;align-items:flex-start;gap:10px;font-size:13px;color:var(--color-danger)">
      <span style="font-size:16px;flex-shrink:0">⚠</span>
      <span><strong>Circular dependency detected:</strong> ${[...cycleWarnings].join(', ')} — these ingredient(s) appear in their own ingredient tree. Affected branches were not fully resolved.</span>
    </div>` : ''}

    ${calcDepthMode === 1 ? `
    <div class="collapsible-section">
      <div class="collapsible-header" onclick="toggleSection(this)">
        <span class="ch-title">Direct Materials</span>
        <span style="display:flex;align-items:center;gap:12px">
          <span class="ch-meta">${direct.count} item types · ${depthDesc[0]}</span>
          <span class="ch-arrow">▼</span>
        </span>
      </div>
      <div class="collapsible-body">
        <table class="results-table">
          <thead><tr><th>Material</th><th style="text-align:right">/ Minute</th><th style="text-align:right">/ Second</th><th>Producer</th><th style="text-align:right">Count</th><th style="text-align:right">Machine Power</th><th>Loaders</th><th style="text-align:right">Combined</th></tr></thead>
          <tbody>${direct.rows}${direct.footer}</tbody>
        </table>
      </div>
    </div>` : ''}

    ${calcDepthMode === 3 ? `
    <div class="collapsible-section">
      <div class="collapsible-header" onclick="toggleSection(this)">
        <span class="ch-title">Full Detail</span>
        <span style="display:flex;align-items:center;gap:12px">
          <span class="ch-meta">${fullDetail.count} items · ${conveyorType}</span>
          <span class="ch-arrow">▼</span>
        </span>
      </div>
      <div class="collapsible-body">
        <table class="results-table">
          <thead><tr><th>Item</th><th style="text-align:right">/ Minute</th><th>Producer</th><th>Conveyor</th><th>Loader</th><th style="text-align:right">Power</th></tr></thead>
          <tbody>${fullDetail.rows}${fullDetail.footer}</tbody>
        </table>
      </div>
    </div>` : `
    <div class="collapsible-section">
      <div class="collapsible-header" onclick="toggleSection(this)">
        <span class="ch-title">${depthTitles[calcDepthMode]}</span>
        <span style="display:flex;align-items:center;gap:12px">
          <span class="ch-meta">${resolved.count} item types · ${depthDesc[calcDepthMode]}</span>
          <span class="ch-arrow">▼</span>
        </span>
      </div>
      <div class="collapsible-body">
        <table class="results-table">
          <thead><tr><th>Material</th><th style="text-align:right">/ Minute</th><th style="text-align:right">/ Second</th><th>Producer</th><th style="text-align:right">Count</th><th style="text-align:right">Machine Power</th><th>Loaders</th><th style="text-align:right">Combined</th></tr></thead>
          <tbody>${resolved.rows}${resolved.footer}</tbody>
        </table>
      </div>
    </div>`}

  `;

  // Sankey and box diagrams subscribe to recipe data changes via
  // their own dirty-flag mechanism; calling render here ensures
  // the visualize tab stays in sync even if it is currently hidden.
  renderSankey();
  renderBoxes();
  if (typeof markLayoutDirty === 'function') markLayoutDirty();
}

// ── Collapsible section toggle ──────────────────────────
