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
//                          globalMiningProductivity/FluidProductivity,
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

// Returns the first non-Character machine name for a recipe,
// falling back to the first entry if only Character is available.
function firstMachineFor(recipe) {
  const entries = Object.entries(recipe.machines || {});
  const nonChar = entries.find(([name]) => name !== 'Character');
  return nonChar ? nonChar[0] : (entries[0] ? entries[0][0] : null);
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
      if (!r || !r.machines[item.machineName]) return null;

      const ct = r.machines[item.machineName].cycleTime; // seconds per cycle

      // Bot efficiency: user override takes priority over the recipe's base value.
      // For robot parts (e.g. "Combat Robot Arm"), the override is stored under
      // the parent robot name ("Combat Robot"), so fall back to that if no
      // direct override exists for the part.
      const baseEff = r.efficiency != null ? r.efficiency : 0;
      const _partParent = item.itemName && item.itemName.match(/^(.+)\s+(?:Arm|Head|Leg|Torso)$/);
      const parentName  = _partParent ? _partParent[1] : null;
      const eff = botEfficiencyOverrides[item.itemName] != null
        ? botEfficiencyOverrides[item.itemName]
        : (parentName != null && botEfficiencyOverrides[parentName] != null
          ? botEfficiencyOverrides[parentName]
          : baseEff);
      const effMultiplier = 1 + eff / 100; // e.g. 50% eff → ×1.5

      // Global productivity bonuses (set in settings panel)
      const miningBonus = MINING_MACHINES.has(item.machineName) ? globalMiningProductivity / 100 : 0;
      const fluidBonus  = FLUID_MACHINES.has(item.machineName)  ? globalFluidProductivity  / 100 : 0;

      // Workstation bonus (robot effects applied to this machine category)
      const wsBonus = getItemWsBonus(item);

      // Core formula:
      //   opm = (60 / cycleTime) × outputPerCycle × effMult × (1 + miningBonus + fluidBonus + wsBonus)
      //
      // (60 / ct) converts cycles/second → cycles/minute.
      // All bonuses stack additively in the productivity bracket.
      const opm = (60 / ct) * getOutputAmount(r) * effMultiplier * (1 + miningBonus + fluidBonus + wsBonus);

      // Machines needed: always round up (you can't run half a machine)
      const machines   = Math.ceil(item.goal / opm);
      const actualOpm  = machines * opm;       // actual output with rounded-up machines
      const over       = actualOpm - item.goal; // overproduction due to rounding

      // Accumulate ingredient usage for the direct-materials table
      r.ingredients.forEach((ing) => {
        // ipm = ingredient items consumed per minute
        const ipm = (60 / ct) * ing.amount * machines;
        totals[ing.item] = (totals[ing.item] || 0) + ipm;
      });

      return {
        ...item,
        displayName: item.itemName || item.name,
        machines,
        actualOpm,
        over,
      };
    })
    .filter(Boolean); // drop any recipes that couldn't be resolved

  // ── Infrastructure: loaders + power per line ────────────────
  const infraByMachine = {}; // aggregated by machineName
  lines.forEach(line => {
    const recipe = RECIPES[line.recipeName || line.name];
    const nSolid  = countSolidConnections(recipe, line.itemName);
    const loaders = calcLoadersForMachine(line.machineName, nSolid);
    const machPwr = getMachinePowerKw(line.machineName);

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
    e.totalMachPwrKw  += machPwr * line.machines;
    e.loaderCount     += loaders.loaderCount     * line.machines;
    e.secondLaneCount += loaders.secondLaneCount * line.machines;
    e.thirdLaneCount  += loaders.thirdLaneCount  * line.machines;
    e.totalLoaderPwrKw += loaders.powerKw        * line.machines;
  });

  const totalMachPwrKw  = Object.values(infraByMachine).reduce((s, e) => s + e.totalMachPwrKw,   0);
  const totalLoaderPwrKw = Object.values(infraByMachine).reduce((s, e) => s + e.totalLoaderPwrKw, 0);
  const totalPwrKw       = totalMachPwrKw + totalLoaderPwrKw;

  // ── Summary stats ────────────────────────────────────────
  const totalMachines   = lines.reduce((s, r) => s + r.machines, 0);
  const totalOutput     = lines.reduce((s, r) => s + r.actualOpm, 0);
  const totalGoal       = lines.reduce((s, r) => s + r.goal, 0);
  const uniqueMachines  = new Set(lines.map((r) => r.machineName)).size;
  const totalOver       = lines.reduce((s, r) => s + r.over, 0);
  const avgMachines     = (totalMachines / lines.length).toFixed(1);
  const ingredientCount = Object.keys(totals).length;

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
          style="padding:5px 14px;border-radius:6px;border:1px solid ${i === calcDepthMode ? 'var(--accent)' : 'rgba(255,255,255,0.15)'};
                 background:${i === calcDepthMode ? 'rgba(10,132,255,0.18)' : 'transparent'};
                 color:${i === calcDepthMode ? 'var(--accent)' : 'rgba(255,255,255,0.5)'};
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
        <div class="summary-value">${fmt(Math.round(totalOutput))}</div>
        <div class="summary-unit">Units / Min (all recipes)</div>
      </div>
      <div class="summary-box">
        <div class="summary-label">Production goal</div>
        <div class="summary-value">${fmt(Math.round(totalGoal))}</div>
        <div class="summary-unit">Units / Min (sum of goals)</div>
      </div>
      <div class="summary-box orange">
        <div class="summary-label">Machine power</div>
        <div class="summary-value">${fmtPwr(totalMachPwrKw)}</div>
        <div class="summary-unit">excl. loaders</div>
      </div>
      <div class="summary-box" style="border-color:rgba(255,149,0,.35);background:rgba(255,149,0,.08)">
        <div class="summary-label" style="color:rgba(255,149,0,.8)">Total power</div>
        <div class="summary-value" style="color:#ff9500">${fmtPwr(totalPwrKw)}</div>
        <div class="summary-unit">machines + loaders</div>
      </div>
    </div>`;

  // ── Icon box helper (full-bleed image with rounded container) ─
  const iconBox = (name, size) =>
    `<div style="width:${size}px;height:${size}px;border-radius:${Math.round(size / 5)}px;overflow:hidden;flex-shrink:0;background:rgba(255,255,255,0.06);display:flex;align-items:center;justify-content:center;">${getIcon(name, size)}</div>`;

  // ── Production overview table rows ───────────────────────
  let rowIdx = 0;
  const overviewRows = lines
    .map((r) => {
      const recipe = RECIPES[r.recipeName || r.name];
      const ct  = recipe.machines[r.machineName].cycleTime;
      const rid = 'rrow_' + (rowIdx++); // unique ID for collapsible detail row

      // Build ingredient pills for this recipe's detail row
      const ingPills = recipe.ingredients.map((ing) => {
        const ipm  = (60 / ct) * ing.amount * r.machines;
        const warn = ipm > 100; // highlight high-throughput ingredients
        return `<span style="display:inline-flex;align-items:center;gap:5px;
            background:${warn ? '#1a1100' : '#0d1a0d'};
            border:1px solid ${warn ? '#554400' : '#1a3a1a'};
            border-radius:4px;padding:3px 8px;font-size:12px;white-space:nowrap">
            ${iconBox(ing.item, 64)}
            <span style="color:var(--text-dim)">${ing.item}</span>
            <span style="font-family:'Share Tech Mono',monospace;color:${warn ? 'var(--warn)' : 'var(--accent3)'}">
              ${fmt(ipm)}<span style="color:var(--text-dim);font-size:10px">/min</span>
            </span>
          </span>`;
      }).join('');

      // Show a badge when output is probabilistic (e.g. Crystal Refiner outputs)
      const hasChance = !Array.isArray(recipe.output) && recipe.output && recipe.output.chance != null && recipe.output.chance < 1;
      const chanceBadge = hasChance
        ? `<span title="${recipe.output.amount} per cycle at ${Math.round(recipe.output.chance * 100)}% chance (avg ${(recipe.output.amount * recipe.output.chance).toFixed(1)}/cycle)" style="display:inline-flex;align-items:center;gap:3px;background:#1a1000;border:1px solid #554400;border-radius:3px;padding:1px 5px;font-size:10px;color:#f5a623;cursor:help;flex-shrink:0">⚡ ${Math.round(recipe.output.chance * 100)}%</span>`
        : '';

      return `
    <tr class="recipe-main-row" onclick="toggleRecipeRow('${rid}')">
      <td style="padding:7px 12px"><div style="display:flex;align-items:center;gap:6px">
        <span class="row-expand-arrow" id="arr_${rid}">▶</span>
        ${iconBox(r.displayName, 64)}<span class="label">${r.displayName}</span>
        ${r.recipeName !== r.itemName && r.itemName ? '<span style="font-size:10px;color:var(--text-dim);margin-left:4px">' + (r.recipeName || "") + "</span>" : ""}
      </div></td>
      <td style="padding:7px 12px">
        <div style="display:flex;align-items:center;gap:8px">${iconBox(r.machineName, 64)}<span style="color:var(--text-dim);font-size:13px">${r.machineName}</span></div>
        ${r.machineName === M.ASSEMBLY_LINE ? `<div style="font-size:10px;color:rgba(255,255,255,0.35);margin-top:3px;padding-left:2px;line-height:1.7">
          └&nbsp;${r.machines * ASSEMBLY_LINE_COMPOSITION.start.count}×&nbsp;${ASSEMBLY_LINE_COMPOSITION.start.name}
          &nbsp;·&nbsp;${r.machines * ASSEMBLY_LINE_COMPOSITION.producer.count}×&nbsp;${ASSEMBLY_LINE_COMPOSITION.producer.name}
          &nbsp;·&nbsp;${r.machines * ASSEMBLY_LINE_COMPOSITION.painter.count}×&nbsp;${ASSEMBLY_LINE_COMPOSITION.painter.name}
        </div>` : ''}
      </td>
      <td class="num">${r.machines}</td>
      <td class="num" style="white-space:nowrap">${fmt(r.actualOpm)}${chanceBadge ? ' ' + chanceBadge : ''}</td>
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
  const resolvedMachines = {}; // machines needed for ingredient chain (modes 1+2)
  const cycleWarnings   = new Set();

  // Build a map: fluid key (lowercase_underscore) → modular building recipe name
  // e.g. "hot_air" → "Hot Air Stove Base"
  const fluidProducerMap = {};
  Object.entries(RECIPES).forEach(([name, r]) => {
    const out = r.modular_building_details?.output;
    if (out && out !== 'none') fluidProducerMap[out] = name;
  });

  // Always compute direct-level materials (mode-0 view) — used for Direct Materials
  // section in modes 0 and 1.
  const directTotals = {};
  Object.entries(totals).forEach(([name, val]) => {
    const resolved = resolveRecipeName(name);
    const recipe   = RECIPES[resolved];
    const machine  = recipe ? preferredMachineFor(recipe) : null;
    const fluidKey = resolved.toLowerCase().replace(/\s+/g, '_');
    directTotals[name] = { amount: val, machine: machine || fluidProducerMap[fluidKey] || null, recipeName: resolved };
  });

  if (calcDepthMode === 0) {
    Object.assign(resolvedTotals, directTotals);
  } else if (calcDepthMode === 3) {
    // Full Detail: collect every item at every level of the production chain
    function resolveAllLevels(itemName, amountPerMin, visitedPath) {
      const resolved = resolveRecipeName(itemName);
      if (visitedPath.has(resolved) || visitedPath.size > 50) return;

      const recipe = RECIPES[resolved];
      const addItem = (machine) => {
        if (!resolvedTotals[itemName]) resolvedTotals[itemName] = { amount: 0, machine, recipeName: resolved };
        resolvedTotals[itemName].amount += amountPerMin;
      };

      if (!recipe || !recipe.machines || Object.keys(recipe.machines).length === 0 || getOutputAmount(recipe) === 0) {
        addItem(fluidProducerMap[resolved.toLowerCase().replace(/\s+/g, '_')] || null);
        return;
      }
      if (!recipe.ingredients || recipe.ingredients.length === 0) {
        const preferred = minerSettings[resolved];
        const machineNames = Object.keys(recipe.machines);
        addItem((preferred && machineNames.includes(preferred)) ? preferred : (firstMachineFor(recipe) || machineNames[0]));
        return;
      }
      // Crafted item: add it, then recurse into ingredients
      const machine = preferredMachineFor(recipe);
      const machData = recipe.machines[machine];
      const ct  = machData.cycleTime;
      const opm = (60 / ct) * getOutputAmount(recipe);
      addItem(machine);
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
      resolvedTotals[key].amount += line.actualOpm;
    });
    Object.entries(totals).forEach(([name, val]) => resolveAllLevels(name, val, new Set()));

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
        const fluidKey = resolved.toLowerCase().replace(/\s+/g, '_');
        addToTotals(fluidProducerMap[fluidKey] || null);
        return;
      }

      // Minable ore (has machines but no ingredients)
      if (!recipe.ingredients || recipe.ingredients.length === 0) {
        // Mode 1: skip raw/mined items
        if (calcDepthMode === 1) return;
        const machineNames = Object.keys(recipe.machines);
        const preferred    = minerSettings[resolved];
        const machine = (preferred && machineNames.includes(preferred)) ? preferred : (firstMachineFor(recipe) || machineNames[0]);
        addToTotals(machine);
        // Track miner machine count
        const md = recipe.machines[machine];
        if (md) {
          const opm = (60 / md.cycleTime) * getOutputAmount(recipe);
          resolvedMachines[machine] = (resolvedMachines[machine] || 0) + Math.ceil(amountPerMin / opm);
        }
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
      const opm = (60 / ct) * getOutputAmount(recipe);
      const runsPerMin = amountPerMin / opm;

      // Track this machine
      resolvedMachines[machineName] = (resolvedMachines[machineName] || 0) + Math.ceil(amountPerMin / opm);

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
  }

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
            const opm         = (60 / md.cycleTime) * getOutputAmount(rec);
            const count       = Math.ceil(val / opm);
            const machPwrKw   = count * getMachinePowerKw(machine);
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
              <td style="padding:6px 12px"><div style="display:flex;align-items:center;gap:8px">${iconBox(machine, 64)}<span class="label">${machine}</span></div></td>
              <td class="num">${count}</td>
              <td class="num">${fmtPwr(machPwrKw)}</td>
              <td style="padding:6px 12px;font-size:12px;color:var(--text-dim)">${loaderDesc}</td>
              <td class="num" style="color:#ff9500">${fmtPwr(machPwrKw + loaderPwrKw)}</td>`;
          } else {
            machineTd = `<td style="padding:6px 12px"><div style="display:flex;align-items:center;gap:8px">${iconBox(machine, 64)}<span class="label">${machine}</span></div></td><td class="num">—</td><td class="num">—</td><td></td><td class="num">—</td>`;
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
      <tr style="border-top:1px solid rgba(255,255,255,0.12);font-weight:600">
        <td style="padding:6px 12px;color:var(--text-dim)" colspan="3">Total</td>
        <td colspan="2"></td>
        <td class="num">${fmtPwr(totMachPwr)}</td>
        <td style="padding:6px 12px;font-size:12px;color:var(--text-dim)">${loaderDesc}</td>
        <td class="num" style="color:#ff9500">${fmtPwr(totMachPwr + totLoaderPwr)}</td>
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
      .sort((a, b) => (a[1].order ?? 999999) - (b[1].order ?? 999999))
      .map(([name, info]) => {
        const val     = info.amount;
        const machine = info.machine;
        const isFluid = FLUID_ITEMS.has(name);
        const rid     = 'fd_' + (fdIdx++);

        let machineCell  = '<span style="color:var(--text-dim);font-size:12px">—</span>';
        let loaderCell   = '';
        let pwrCell      = '<span style="color:var(--text-dim)">—</span>';
        let ingPills     = '';

        // Conveyor applies to all solid (non-fluid) items regardless of machine
        const conveyorCell = isFluid
          ? '<span style="color:var(--text-dim);font-size:12px">—</span>'
          : `<div style="display:flex;align-items:center;gap:4px">${iconBox(conveyorType, 48)}<span style="font-family:'Share Tech Mono',monospace;font-size:13px;color:var(--accent3)">${(val / conveyorThroughput).toFixed(2)}</span></div>`;

        if (machine) {
          const rec = RECIPES[info.recipeName || name];
          const md  = rec && rec.machines[machine];
          if (md) {
            const opm         = (60 / md.cycleTime) * getOutputAmount(rec);
            const count       = Math.ceil(val / opm);
            const machPwrKw   = count * getMachinePowerKw(machine);
            const nSolid      = countSolidConnections(rec, name);
            const loaders     = calcLoadersForMachine(machine, nSolid);
            const loaderPwrKw = loaders.powerKw * count;

            totMachPwr   += machPwrKw;
            totLoaderPwr += loaderPwrKw;

            machineCell = `<div style="display:flex;align-items:center;gap:5px">${iconBox(machine, 48)}<span style="font-size:12px;color:var(--text-dim)">${machine}</span><span style="font-family:'Share Tech Mono',monospace;font-size:13px;color:var(--accent3)">×${count}</span></div>`;

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

            pwrCell = `<span style="font-size:12px;color:#ff9500">${fmtPwr(machPwrKw + loaderPwrKw)}</span>`;

            // Build ingredient pills for expanded detail row
            if (rec.ingredients && rec.ingredients.length) {
              ingPills = rec.ingredients.map((ing) => {
                const ipm  = (60 / md.cycleTime) * ing.amount * count;
                const warn = ipm > 100;
                return `<span style="display:inline-flex;align-items:center;gap:5px;
                    background:${warn ? '#1a1100' : '#0d1a0d'};
                    border:1px solid ${warn ? '#554400' : '#1a3a1a'};
                    border-radius:4px;padding:3px 8px;font-size:12px;white-space:nowrap">
                    ${iconBox(ing.item, 48)}
                    <span style="color:var(--text-dim)">${ing.item}</span>
                    <span style="font-family:'Share Tech Mono',monospace;color:${warn ? 'var(--warn)' : 'var(--accent3)'}">
                      ${fmt(ipm)}<span style="color:var(--text-dim);font-size:10px">/min</span>
                    </span>
                  </span>`;
              }).join('');
            }
          }
        }

        const cls = val > 100 ? 'num-warn' : 'num';
        const hasDetail = ingPills.length > 0;
        return `
      <tr class="recipe-main-row" onclick="${hasDetail ? `toggleRecipeRow('${rid}')` : ''}" style="border-bottom:1px solid rgba(255,255,255,0.05);${hasDetail ? 'cursor:pointer' : ''}">
        <td style="padding:5px 12px"><div style="display:flex;align-items:center;gap:6px">
          ${hasDetail ? `<span class="row-expand-arrow" id="arr_${rid}">▶</span>` : '<span style="display:inline-block;width:14px"></span>'}
          ${iconBox(name, 48)}<span class="label" style="font-size:13px">${name}</span>
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
      <tr style="border-top:1px solid rgba(255,255,255,0.12);font-weight:600">
        <td colspan="2" style="padding:6px 12px;color:var(--text-dim)">Total</td>
        <td colspan="3"></td>
        <td style="padding:6px 12px;text-align:right;color:#ff9500">${fmtPwr(totMachPwr + totLoaderPwr)}</td>
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
      <td class="num" style="color:#ff9500">${fmtPwr(e.totalMachPwrKw + e.totalLoaderPwrKw)}</td>
    </tr>`;
    }).join('');

  const infraFooter = `
    <tr style="border-top:1px solid rgba(255,255,255,0.12);font-weight:600">
      <td style="padding:6px 12px;color:var(--text-dim)">Total</td>
      <td class="num">${fmt(totalMachines)}</td>
      <td class="num">—</td>
      <td class="num">${fmtPwr(totalMachPwrKw)}</td>
      <td></td>
      <td class="num">${fmtPwr(totalLoaderPwrKw)}</td>
      <td class="num" style="color:#ff9500">${fmtPwr(totalPwrKw)}</td>
    </tr>`;

  // ── Machine totals (aggregated by machine type) ──────────
  const machineTotals = {};
  lines.forEach((r) => {
    machineTotals[r.machineName] = (machineTotals[r.machineName] || 0) + r.machines;
  });
  // Add machines from ingredient resolution chain
  Object.entries(resolvedMachines).forEach(([name, count]) => {
    machineTotals[name] = (machineTotals[name] || 0) + count;
  });
  const machineRows = Object.entries(machineTotals)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => {
      const alBreakdown = name === M.ASSEMBLY_LINE
        ? `<div style="font-size:10px;color:rgba(255,255,255,0.35);margin-top:3px;padding-left:2px;line-height:1.7">
            └&nbsp;${count * ASSEMBLY_LINE_COMPOSITION.start.count}×&nbsp;${ASSEMBLY_LINE_COMPOSITION.start.name}
            &nbsp;·&nbsp;${count * ASSEMBLY_LINE_COMPOSITION.producer.count}×&nbsp;${ASSEMBLY_LINE_COMPOSITION.producer.name}
            &nbsp;·&nbsp;${count * ASSEMBLY_LINE_COMPOSITION.painter.count}×&nbsp;${ASSEMBLY_LINE_COMPOSITION.painter.name}
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
          <span class="ch-meta">${lines.length} Recipes · ${fmt(totalMachines)} Machines · ${fmt(Math.round(totalOutput))} /min</span>
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
              <th style="text-align:right">Overproduction</th>
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

    ${cycleWarnings.size > 0 ? `
    <div style="background:#2a0a0a;border:1px solid #8b2020;border-radius:6px;padding:10px 14px;margin-bottom:16px;display:flex;align-items:flex-start;gap:10px;font-size:13px;color:#e05050">
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
}

// ── Collapsible section toggle ──────────────────────────
