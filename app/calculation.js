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
//      using resolveToGround() → stored in `groundTotals`.
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

  // ── Summary stats ────────────────────────────────────────
  const totalMachines   = lines.reduce((s, r) => s + r.machines, 0);
  const totalOutput     = lines.reduce((s, r) => s + r.actualOpm, 0);
  const totalGoal       = lines.reduce((s, r) => s + r.goal, 0);
  const uniqueMachines  = new Set(lines.map((r) => r.machineName)).size;
  const totalOver       = lines.reduce((s, r) => s + r.over, 0);
  const avgMachines     = (totalMachines / lines.length).toFixed(1);
  const ingredientCount = Object.keys(totals).length;

  const summaryHtml = `
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
        <div class="summary-label">Avg machines / recipe</div>
        <div class="summary-value">${avgMachines}</div>
        <div class="summary-unit">Average</div>
      </div>
      <div class="summary-box green">
        <div class="summary-label">Total overproduction</div>
        <div class="summary-value">${fmt(Math.round(totalOver))}</div>
        <div class="summary-unit">${ingredientCount} Ingredient types</div>
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

  // ── Direct ingredient rows (sorted by consumption rate) ──
  const ingRows = Object.entries(totals)
    .sort((a, b) => b[1] - a[1])
    .map(([name, val]) => {
      const cls = val > 100 ? "num-warn" : "num";
      return `
    <tr>
      <td style="padding:6px 12px"><div style="display:flex;align-items:center;gap:10px">${iconBox(name, 64)}<span class="label">${name}</span></div></td>
      <td class="${cls}">${fmt(val)}</td>
      <td class="num">${fmt(val / 60)}/s</td>
    </tr>`;
    })
    .join("");

  // ── Raw material resolution (recursive) ──────────────────
  //
  // resolveToGround() walks the ingredient tree depth-first.
  // At each node it checks whether the ingredient itself has a
  // recipe.  If yes, it recurses; if no (= raw ore / pumped fluid
  // / hand-crafted item), the quantity is credited to groundTotals.
  //
  // groundTotals[name] = { amount: Number, machine: String|null }
  //   amount  – total items/min required
  //   machine – preferred mining machine (from minerSettings), or
  //             null for items with no extraction recipe at all
  const groundTotals = {};

  // Collects items where a cycle in the ingredient graph was detected.
  // Populated by resolveToGround(); rendered as a warning banner below.
  const cycleWarnings = new Set();

  // Recursively resolves `itemName` at rate `amountPerMin` down to its raw
  // inputs.  `visitedPath` is the Set of resolved item names on the current
  // call stack; it is used for cycle detection — if an item appears in its
  // own ingredient tree the recursion stops and the item is recorded in
  // cycleWarnings so the user can see a warning in the results panel.
  // A secondary size cap (> 50) guards against pathological data.
  function resolveToGround(itemName, amountPerMin, visitedPath) {
    // Apply variant substitution (e.g. "Xenoferrite Plates" →
    // whichever tier the user has selected in settings)
    const resolved = resolveRecipeName(itemName);

    // Cycle detection: if this item is already on the resolution path we have
    // a circular dependency — record it and stop expanding this branch.
    if (visitedPath.has(resolved)) {
      cycleWarnings.add(resolved);
      console.warn('foundry-calc: ingredient cycle detected at:', resolved,
                   '← path:', [...visitedPath]);
      return;
    }
    if (visitedPath.size > 50) return; // secondary safety cap

    const recipe = RECIPES[resolved];

    // Case 1: No recipe OR no machine OR zero output → truly raw material
    if (!recipe || !recipe.machines || Object.keys(recipe.machines).length === 0 ||
      getOutputAmount(recipe) === 0) {
      if (!groundTotals[resolved]) groundTotals[resolved] = { amount: 0, machine: null };
      groundTotals[resolved].amount += amountPerMin;
      return;
    }

    // Case 2: Has machines but NO ingredients → minable ore (Drone Miner, Ore Vein Miner)
    if (!recipe.ingredients || recipe.ingredients.length === 0) {
      const machineNames = Object.keys(recipe.machines);
      // Honour the user's preferred miner for this ore (set in settings)
      const preferred = minerSettings[resolved];
      const machine = (preferred && machineNames.includes(preferred)) ? preferred : machineNames[0];
      if (!groundTotals[resolved]) groundTotals[resolved] = { amount: 0, machine };
      groundTotals[resolved].amount += amountPerMin;
      return;
    }

    // Case 3: Has both machines and ingredients → intermediate product, recurse
    const [, machData] = Object.entries(recipe.machines)[0];
    const ct  = machData.cycleTime;
    const opm = (60 / ct) * getOutputAmount(recipe);

    // How many recipe runs per minute are needed to supply `amountPerMin`?
    const runsPerMin = amountPerMin / opm;

    const nextPath = new Set(visitedPath);
    nextPath.add(resolved);

    recipe.ingredients.forEach((ing) => {
      // ingPerMin = ingredient amount per run × runs/min × (60/ct) corrects
      // for the fact that cycleTime is already encoded in opm/runsPerMin.
      // Simplified: runsPerMin × ing.amount × (60/ct) = ing.amount × amountPerMin / outputPerCycle
      const ingPerMin = runsPerMin * ing.amount * (60 / ct);
      resolveToGround(ing.item, ingPerMin, nextPath);
    });
  }

  // Start recursion from each direct ingredient at its computed rate
  Object.entries(totals).forEach(([name, val]) => {
    resolveToGround(name, val, new Set());
  });

  // ── Raw material table rows ───────────────────────────────
  const groundCount = Object.keys(groundTotals).length;
  const groundRows = Object.entries(groundTotals)
    .sort((a, b) => b[1].amount - a[1].amount)
    .map(([name, info]) => {
      const val     = info.amount;
      const machine = info.machine;
      const cls = val > 100 ? "num-warn" : "num";

      // If there is a known extraction machine, show it with a machine count
      let machineTd = '<td class="label" style="color:var(--text-dim);padding:6px 12px">—</td><td class="num">—</td>';
      if (machine) {
        const rec = RECIPES[name];
        const md  = rec && rec.machines[machine];
        if (md) {
          const opm   = (60 / md.cycleTime) * getOutputAmount(rec);
          const count = Math.ceil(val / opm);
          machineTd = `<td style="padding:6px 12px"><div style="display:flex;align-items:center;gap:8px">${iconBox(machine, 64)}<span class="label">${machine}</span></div></td><td class="num">${count}</td>`;
        }
      }
      return `
    <tr>
      <td style="padding:6px 12px"><div style="display:flex;align-items:center;gap:10px">${iconBox(name, 64)}<span class="label">${name}</span></div></td>
      <td class="${cls}">${fmt(val)}</td>
      <td class="num">${fmt(val / 60)}/s</td>
      ${machineTd}
    </tr>`;
    })
    .join("");

  // ── Inject HTML into results panel ───────────────────────
  document.getElementById("recipeResults").innerHTML =
    summaryHtml +
    `
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
        <span class="ch-title">Direct material demand per minute</span>
        <span style="display:flex;align-items:center;gap:12px">
          <span class="ch-meta">${ingredientCount} Ingredient types</span>
          <span class="ch-arrow">▼</span>
        </span>
      </div>
      <div class="collapsible-body">
        <table class="results-table">
          <thead><tr><th>Material</th><th style="text-align:right">/ Minute</th><th style="text-align:right">/ Second</th></tr></thead>
          <tbody>${ingRows}</tbody>
        </table>
      </div>
    </div>

    ${cycleWarnings.size > 0 ? `
    <div style="background:#2a0a0a;border:1px solid #8b2020;border-radius:6px;padding:10px 14px;margin-bottom:16px;display:flex;align-items:flex-start;gap:10px;font-size:13px;color:#e05050">
      <span style="font-size:16px;flex-shrink:0">⚠</span>
      <span><strong>Circular dependency detected:</strong> ${[...cycleWarnings].join(', ')} — these ingredient(s) appear in their own ingredient tree. Affected branches were not fully resolved.</span>
    </div>` : ''}

    <div class="collapsible-section">
      <div class="collapsible-header" onclick="toggleSection(this)">
        <span class="ch-title">Raw Materials (Minable Resources)</span>
        <span style="display:flex;align-items:center;gap:12px">
          <span class="ch-meta">${groundCount} Resource types · fully resolved · variants configurable via ⚙</span>
          <span class="ch-arrow">▼</span>
        </span>
      </div>
      <div class="collapsible-body">
        <table class="results-table">
          <thead><tr><th>Resource</th><th style="text-align:right">/ Minute</th><th style="text-align:right">/ Second</th><th>Machine</th><th style="text-align:right">Count</th></tr></thead>
          <tbody>${groundRows}</tbody>
        </table>
      </div>
    </div>
  `;

  // Sankey and box diagrams subscribe to recipe data changes via
  // their own dirty-flag mechanism; calling render here ensures
  // the visualize tab stays in sync even if it is currently hidden.
  renderSankey();
  renderBoxes();
}

// ── Collapsible section toggle ──────────────────────────
