function getOutputAmount(recipe) {
  if (!recipe.output) return 0;
  if (Array.isArray(recipe.output)) {
    const o = recipe.output[0];
    return o.amount * (o.chance != null ? o.chance : 1);
  }
  const o = recipe.output;
  return o.amount * (o.chance != null ? o.chance : 1);
}

// Helper: get display label for output (e.g. "3 (50%)" when chance is set)
function getOutputLabel(recipe) {
  if (!recipe.output) return "0";
  const o = Array.isArray(recipe.output) ? recipe.output[0] : recipe.output;
  if (o.chance != null && o.chance < 1) {
    return `${o.amount} (${Math.round(o.chance * 100)}%)`;
  }
  return String(o.amount);
}

function calculateRecipes() {
  if (!selectedRecipeList.length) return;

  const totals = {};
  const lines = selectedRecipeList
    .map((item) => {
      const r = RECIPES[item.recipeName || item.name]; // support both old and new format
      if (!r || !r.machines[item.machineName]) return null;
      const ct = r.machines[item.machineName].cycleTime;
      const baseEff = r.efficiency != null ? r.efficiency : 0;
      const eff = botEfficiencyOverrides[item.itemName] != null
        ? botEfficiencyOverrides[item.itemName]
        : baseEff;
      const effMultiplier = 1 + eff / 100;
      const miningBonus = MINING_MACHINES.has(item.machineName) ? globalMiningProductivity / 100 : 0;
      const fluidBonus = FLUID_MACHINES.has(item.machineName) ? globalFluidProductivity / 100 : 0;
      const wsBonus = getItemWsBonus(item);
      const opm = (60 / ct) * getOutputAmount(r) * effMultiplier * (1 + miningBonus + fluidBonus + wsBonus);
      const machines = Math.ceil(item.goal / opm);
      const actualOpm = machines * opm;
      const over = actualOpm - item.goal;

      r.ingredients.forEach((ing) => {
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
    .filter(Boolean);

  // ── Summary stats ────────────────────────────────────────
  const totalMachines = lines.reduce((s, r) => s + r.machines, 0);
  const totalOutput = lines.reduce((s, r) => s + r.actualOpm, 0);
  const totalGoal = lines.reduce((s, r) => s + r.goal, 0);
  const uniqueMachines = new Set(lines.map((r) => r.machineName)).size;
  const totalOver = lines.reduce((s, r) => s + r.over, 0);
  const avgMachines = (totalMachines / lines.length).toFixed(1);
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

  let rowIdx = 0;
  const overviewRows = lines
    .map((r) => {
      const recipe = RECIPES[r.recipeName || r.name];
      const ct = recipe.machines[r.machineName].cycleTime;
      const rid = 'rrow_' + (rowIdx++);

      // Build ingredient pills for this recipe
      const ingPills = recipe.ingredients.map((ing) => {
        const ipm = (60 / ct) * ing.amount * r.machines;
        const warn = ipm > 100;
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
      <td style="padding:7px 12px"><div style="display:flex;align-items:center;gap:8px">${getIcon(r.machineName, 24)}<span style="color:var(--text-dim);font-size:13px">${r.machineName}</span></div></td>
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

  // ── Grundmaterialien: rekursive Auflösung ──────────────
  // Expand ingredients recursively: if an item has a RECIPE entry,
  // resolve it further; items with no recipe = raw/ground material.
  // groundTotals[name] = { amount: Number, machine: String|null }
  const groundTotals = {};

  function resolveToGround(itemName, amountPerMin, depth) {
    if (depth > 20) return; // safety cap

    // Resolve variant (e.g. "Xenoferrite Plates" → "Xenoferrite Plates (Tier 2)")
    const resolved = resolveRecipeName(itemName);

    const recipe = RECIPES[resolved];
    if (!recipe || !recipe.machines || Object.keys(recipe.machines).length === 0 ||
      getOutputAmount(recipe) === 0) {
      // Truly raw — no recipe or no machines
      if (!groundTotals[resolved]) groundTotals[resolved] = { amount: 0, machine: null };
      groundTotals[resolved].amount += amountPerMin;
      return;
    }

    if (!recipe.ingredients || recipe.ingredients.length === 0) {
      // Minable ore: no ingredients but has machines → pick preferred miner
      const machineNames = Object.keys(recipe.machines);
      const preferred = minerSettings[resolved];
      const machine = (preferred && machineNames.includes(preferred)) ? preferred : machineNames[0];
      if (!groundTotals[resolved]) groundTotals[resolved] = { amount: 0, machine };
      groundTotals[resolved].amount += amountPerMin;
      return;
    }

    // Has ingredients → recurse
    const [, machData] = Object.entries(recipe.machines)[0];
    const ct = machData.cycleTime;
    const opm = (60 / ct) * getOutputAmount(recipe);
    // How many "recipe runs per minute" produce amountPerMin output?
    const runsPerMin = amountPerMin / opm;
    recipe.ingredients.forEach((ing) => {
      const ingPerMin = runsPerMin * ing.amount * (60 / ct);
      resolveToGround(ing.item, ingPerMin, depth + 1);
    });
  }

  // Resolve each direct ingredient
  Object.entries(totals).forEach(([name, val]) => {
    resolveToGround(name, val, 0);
  });

  const groundCount = Object.keys(groundTotals).length;
  const groundRows = Object.entries(groundTotals)
    .sort((a, b) => b[1].amount - a[1].amount)
    .map(([name, info]) => {
      const val = info.amount;
      const machine = info.machine;
      const cls = val > 100 ? "num-warn" : "num";
      let machineTd = '<td class="label" style="color:var(--text-dim);padding:6px 12px">—</td><td class="num">—</td>';
      if (machine) {
        const rec = RECIPES[name];
        const md = rec && rec.machines[machine];
        if (md) {
          const opm = (60 / md.cycleTime) * getOutputAmount(rec);
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

  // Sankey + Boxen im Hintergrund mitaktualisieren
  renderSankey();
  renderBoxes();
}

// ── Collapsible section toggle ──────────────────────────
