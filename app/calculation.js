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

      // Bot efficiency: user override takes priority over the recipe's base value
      const baseEff = r.efficiency != null ? r.efficiency : 0;
      const eff = botEfficiencyOverrides[item.itemName] != null
        ? botEfficiencyOverrides[item.itemName]
        : baseEff;
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
        <div class="summary-label">Rezepte</div>
        <div class="summary-value">${lines.length}</div>
        <div class="summary-unit">ausgewählt</div>
      </div>
      <div class="summary-box orange">
        <div class="summary-label">Maschinen gesamt</div>
        <div class="summary-value">${fmt(totalMachines)}</div>
        <div class="summary-unit">${uniqueMachines} Maschinentypen</div>
      </div>
      <div class="summary-box green">
        <div class="summary-label">Gesamtproduktion</div>
        <div class="summary-value">${fmt(Math.round(totalOutput))}</div>
        <div class="summary-unit">Units / Min (alle Rezepte)</div>
      </div>
      <div class="summary-box">
        <div class="summary-label">Produktionsziel</div>
        <div class="summary-value">${fmt(Math.round(totalGoal))}</div>
        <div class="summary-unit">Units / Min (Summe Ziele)</div>
      </div>
      <div class="summary-box orange">
        <div class="summary-label">Ø Maschinen / Rezept</div>
        <div class="summary-value">${avgMachines}</div>
        <div class="summary-unit">Durchschnitt</div>
      </div>
      <div class="summary-box green">
        <div class="summary-label">Überproduktion gesamt</div>
        <div class="summary-value">${fmt(Math.round(totalOver))}</div>
        <div class="summary-unit">${ingredientCount} Zutatentypen</div>
      </div>
    </div>`;

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
            ${getIcon(ing.item, 18)}
            <span style="color:var(--text-dim)">${ing.item}</span>
            <span style="font-family:'Share Tech Mono',monospace;color:${warn ? 'var(--warn)' : 'var(--accent3)'}">
              ${fmt(ipm)}<span style="color:var(--text-dim);font-size:10px">/min</span>
            </span>
          </span>`;
      }).join('');

      // Show a badge when output is probabilistic (e.g. Crystal Refiner outputs)
      const hasChance = !Array.isArray(recipe.output) && recipe.output && recipe.output.chance != null && recipe.output.chance < 1;
      const chanceBadge = hasChance
        ? `<span title="${recipe.output.amount} pro Zyklus mit ${Math.round(recipe.output.chance * 100)}% Wahrscheinlichkeit (Ø ${(recipe.output.amount * recipe.output.chance).toFixed(1)}/Zyklus)" style="display:inline-flex;align-items:center;gap:3px;background:#1a1000;border:1px solid #554400;border-radius:3px;padding:1px 5px;font-size:10px;color:#f5a623;cursor:help;flex-shrink:0">⚡ ${Math.round(recipe.output.chance * 100)}%</span>`
        : '';

      return `
    <tr class="recipe-main-row" onclick="toggleRecipeRow('${rid}')">
      <td style="padding:7px 12px"><div style="display:flex;align-items:center;gap:6px">
        <span class="row-expand-arrow" id="arr_${rid}">▶</span>
        ${getIcon(r.displayName, 28)}<span class="label">${r.displayName}</span>
        ${r.recipeName !== r.itemName && r.itemName ? '<span style="font-size:10px;color:var(--text-dim);margin-left:4px">' + (r.recipeName || "") + "</span>" : ""}
      </div></td>
      <td style="padding:7px 12px">
        <div style="display:flex;align-items:center;gap:8px">${getIcon(r.machineName, 24)}<span style="color:var(--text-dim);font-size:13px">${r.machineName}</span></div>
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
      <td style="padding:6px 12px"><div style="display:flex;align-items:center;gap:10px">${getIcon(name, 28)}<span class="label">${name}</span></div></td>
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

  // Recursively resolves `itemName` at rate `amountPerMin` down to
  // its raw inputs.  `depth` guards against infinite ingredient cycles
  // (safety cap at 20 levels).
  function resolveToGround(itemName, amountPerMin, depth) {
    if (depth > 20) return; // cycle / excessive depth guard

    // Apply variant substitution (e.g. "Xenoferrite Plates" →
    // whichever tier the user has selected in settings)
    const resolved = resolveRecipeName(itemName);

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

    recipe.ingredients.forEach((ing) => {
      // ingPerMin = ingredient amount per run × runs/min × (60/ct) corrects
      // for the fact that cycleTime is already encoded in opm/runsPerMin.
      // Simplified: runsPerMin × ing.amount × (60/ct) = ing.amount × amountPerMin / outputPerCycle
      const ingPerMin = runsPerMin * ing.amount * (60 / ct);
      resolveToGround(ing.item, ingPerMin, depth + 1);
    });
  }

  // Start recursion from each direct ingredient at its computed rate
  Object.entries(totals).forEach(([name, val]) => {
    resolveToGround(name, val, 0);
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
          machineTd = `<td style="padding:6px 12px"><div style="display:flex;align-items:center;gap:8px">${getIcon(machine, 22)}<span class="label">${machine}</span></div></td><td class="num">${count}</td>`;
        }
      }
      return `
    <tr>
      <td style="padding:6px 12px"><div style="display:flex;align-items:center;gap:10px">${getIcon(name, 28)}<span class="label">${name}</span></div></td>
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
        <span class="ch-title">Produktionsübersicht</span>
        <span style="display:flex;align-items:center;gap:12px">
          <span class="ch-meta">${lines.length} Rezepte · ${fmt(totalMachines)} Maschinen · ${fmt(Math.round(totalOutput))} /min</span>
          <span class="ch-arrow">▼</span>
        </span>
      </div>
      <div class="collapsible-body">
        <table class="results-table">
          <thead>
            <tr>
              <th>Rezept</th><th>Maschine</th>
              <th style="text-align:right">Maschinen</th>
              <th style="text-align:right">Output/Min</th>
              <th style="text-align:right">Überproduktion</th>
            </tr>
          </thead>
          <tbody>${overviewRows}</tbody>
        </table>
      </div>
    </div>

    <div class="collapsible-section">
      <div class="collapsible-header" onclick="toggleSection(this)">
        <span class="ch-title">Direkter Materialbedarf pro Minute</span>
        <span style="display:flex;align-items:center;gap:12px">
          <span class="ch-meta">${ingredientCount} Zutatentypen</span>
          <span class="ch-arrow">▼</span>
        </span>
      </div>
      <div class="collapsible-body">
        <table class="results-table">
          <thead><tr><th>Material</th><th style="text-align:right">/ Minute</th><th style="text-align:right">/ Sekunde</th></tr></thead>
          <tbody>${ingRows}</tbody>
        </table>
      </div>
    </div>

    <div class="collapsible-section">
      <div class="collapsible-header" onclick="toggleSection(this)">
        <span class="ch-title">Grundmaterialien (Abbaubare Rohstoffe)</span>
        <span style="display:flex;align-items:center;gap:12px">
          <span class="ch-meta">${groundCount} Rohstofftypen · vollständig aufgelöst · Varianten via ⚙ einstellbar</span>
          <span class="ch-arrow">▼</span>
        </span>
      </div>
      <div class="collapsible-body">
        <table class="results-table">
          <thead><tr><th>Rohstoff</th><th style="text-align:right">/ Minute</th><th style="text-align:right">/ Sekunde</th><th>Maschine</th><th style="text-align:right">Anzahl</th></tr></thead>
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
