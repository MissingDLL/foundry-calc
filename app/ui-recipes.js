function initRecipeCalc() {
  const tabsEl = document.getElementById("recipeCatTabs");
  RECIPE_CATEGORIES.forEach((cat) => {
    const btn = document.createElement("button");
    btn.textContent = cat;
    btn.style.cssText =
      "padding:7px 14px;background:transparent;border:none;border-right:1px solid rgba(255,255,255,0.07);border-bottom:2px solid transparent;color:rgba(255,255,255,0.40);cursor:pointer;font-family:-apple-system,sans-serif;font-size:12px;white-space:nowrap;transition:all 0.18s;flex-shrink:0";
    btn.onclick = function () {
      activeBrowserCat = cat;
      document.querySelectorAll("#recipeCatTabs button").forEach((b) => {
        b.style.color = "var(--text-dim)";
        b.style.borderBottom = "3px solid transparent";
        b.style.background = "transparent";
      });
      btn.style.color = "var(--accent)";
      btn.style.borderBottom = "3px solid var(--accent)";
      btn.style.background = "rgba(10,132,255,0.10)";
      renderRecipeBrowser();
    };
    if (cat === "Alle") {
      btn.style.color = "var(--accent)";
      btn.style.borderBottom = "3px solid var(--accent)";
      btn.style.background = "rgba(10,132,255,0.10)";
    }
    tabsEl.appendChild(btn);
  });
}

function openRecipePicker() {
  animateModalOpen('recipePickerOverlay', 'recipePickerModal');
  document.getElementById("recipePickerSearch").value = "";
  renderRecipeBrowser();
  document.getElementById("recipePickerSearch").focus();
}

function closeRecipePicker(e) {
  if (!e || e.target === document.getElementById("recipePickerOverlay")) {
    animateModalClose('recipePickerOverlay', 'recipePickerModal');
  }
}

function renderRecipeBrowser() {
  const searchEl = document.getElementById("recipePickerSearch");
  const query = searchEl ? searchEl.value.toLowerCase() : "";
  const grid = document.getElementById("recipeGrid");
  if (!grid) return;

  // Build deduplicated canonical item list
  const shown = new Set();
  const items = [];
  VARIANT_GROUPS.forEach((g) => {
    const name = g.label;
    if (!query || name.toLowerCase().includes(query)) {
      const catMatch =
        activeBrowserCat === "Alle" ||
        RECIPES[g.variants[0]]?.category === activeBrowserCat;
      if (catMatch) {
        shown.add(name);
        items.push({ canonicalName: name, hasMachines: true });
      }
    }
  });
  Object.keys(RECIPES).forEach((name) => {
    if (shown.has(name)) return; // skip if already shown as canonical
    if (VARIANT_GROUPS.some((g) => g.variants.includes(name))) return; // skip variant entries
    const r = RECIPES[name];
    const catMatch =
      activeBrowserCat === "Alle" || r.category === activeBrowserCat;
    const qMatch = !query || name.toLowerCase().includes(query);
    if (catMatch && qMatch)
      items.push({
        canonicalName: name,
        hasMachines: Object.keys(r.machines).length > 0,
      });
  });

  grid.innerHTML = "";
  items.forEach(({ canonicalName, hasMachines }) => {
    const isSelected = selectedRecipeList.some(
      (r) => r.itemName === canonicalName,
    );
    const cell = document.createElement("div");
    cell.style.cssText = [
      "width:64px",
      "height:64px",
      "flex-shrink:0",
      "background:" + (isSelected ? "rgba(10,132,255,0.18)" : "rgba(255,255,255,0.05)"),
      "border:" +
      (isSelected ? "1px solid rgba(10,132,255,0.5)" : "1px solid rgba(255,255,255,0.09)"),
      "border-radius:7px",
      "cursor:" + (hasMachines ? "pointer" : "default"),
      "display:flex",
      "flex-direction:column",
      "align-items:center",
      "justify-content:center",
      "position:relative",
      "opacity:" + (hasMachines ? "1" : "0.4"),
      "transition:all 0.12s",
      "overflow:visible",
    ].join(";");
    cell.title = canonicalName + (hasMachines ? "" : " (no recipe)");
    cell.innerHTML =
      getIcon(canonicalName, 40) +
      (isSelected
        ? '<div style="position:absolute;top:2px;right:4px;font-size:10px;color:var(--accent);font-weight:700">✓</div>'
        : "");

    const label = document.createElement("div");
    label.style.cssText =
      "position:absolute;bottom:-26px;left:50%;transform:translateX(-50%);background:rgba(20,18,40,0.92);border:1px solid rgba(255,255,255,0.12);color:var(--text);font-size:10px;padding:3px 7px;border-radius:6px;white-space:nowrap;pointer-events:none;opacity:0;transition:opacity 0.15s;z-index:20;max-width:160px;overflow:hidden;text-overflow:ellipsis;backdrop-filter:blur(20px)";
    label.textContent = canonicalName;
    cell.appendChild(label);

    if (hasMachines) {
      cell.onmouseenter = function () {
        this.style.background = isSelected ? "rgba(10,132,255,0.25)" : "rgba(255,255,255,0.10)";
        this.style.transform = "scale(1.1)";
        this.style.zIndex = "5";
        label.style.opacity = "1";
      };
      cell.onmouseleave = function () {
        this.style.background = isSelected ? "rgba(10,132,255,0.18)" : "rgba(255,255,255,0.05)";
        this.style.transform = "scale(1)";
        this.style.zIndex = "1";
        label.style.opacity = "0";
      };
      cell.onclick = function () {
        toggleRecipeFromGrid(canonicalName);
      };
    }
    grid.appendChild(cell);
  });
}

function filterRecipesInline(query) {
  const el = document.getElementById("recipeInlineResults");
  const q = (query || "").toLowerCase();
  // Build canonical + deduplicated list
  const shown = new Set();
  const matches = [];
  VARIANT_GROUPS.forEach((g) => {
    const name = g.label;
    if (!q || name.toLowerCase().includes(q)) {
      if (shown.has(name)) return;
      shown.add(name);
      const r = RECIPES[g.variants[0]];
      matches.push({
        canonicalName: name,
        category: r?.category || "",
        hasMachines: true,
      });
    }
  });
  Object.keys(RECIPES).forEach((name) => {
    if (shown.has(name)) return;
    if (VARIANT_GROUPS.some((g) => g.variants.includes(name))) return;
    if (q && !name.toLowerCase().includes(q)) return;
    const r = RECIPES[name];
    matches.push({
      canonicalName: name,
      category: r.category,
      hasMachines: Object.keys(r.machines).length > 0,
    });
    shown.add(name);
  });
  const limited = matches.slice(0, 20);
  if (!limited.length) {
    el.style.display = "none";
    return;
  }

  el.innerHTML = "";
  limited.forEach(({ canonicalName, category, hasMachines }) => {
    const isSelected = selectedRecipeList.some(
      (item) => item.itemName === canonicalName,
    );
    const recipeName = resolveRecipeName(canonicalName);
    const r = RECIPES[recipeName] || {};
    const defaultMachine = hasMachines
      ? getPreferredMachine(recipeName) ||
      Object.keys(r.machines || {})[0]
      : null;
    const opm =
      hasMachines && defaultMachine
        ? (
          (60 / r.machines[defaultMachine].cycleTime) *
          getOutputAmount(r)
        ).toFixed(1)
        : null;

    const row = document.createElement("div");
    row.style.cssText =
      "padding:9px 14px;display:flex;align-items:center;gap:10px;border-bottom:1px solid rgba(255,255,255,0.06);transition:background 0.12s;opacity:" +
      (hasMachines ? "1" : "0.4");
    if (hasMachines) {
      row.style.cursor = "pointer";
      row.onmouseenter = function () {
        this.style.background = "rgba(10,132,255,0.08)";
      };
      row.onmouseleave = function () {
        this.style.background = "transparent";
      };
      row.onclick = function () {
        addRecipeItem(canonicalName);
      };
    }
    const iconEl = document.createElement("div");
    iconEl.innerHTML = getIcon(canonicalName, 28);
    const info = document.createElement("div");
    info.style.flex = "1";
    const variantLabel =
      recipeName !== canonicalName ? " · " + recipeName : "";
    info.innerHTML =
      '<div style="font-size:13px;color:var(--text);font-weight:600">' +
      canonicalName +
      "</div>" +
      '<div style="font-size:11px;color:var(--text-dim)">' +
      category +
      (opm
        ? " · " + defaultMachine + variantLabel + ": " + opm + "/min"
        : " · no recipe") +
      "</div>";
    row.appendChild(iconEl);
    row.appendChild(info);
    if (isSelected) {
      const check = document.createElement("span");
      check.textContent = "✓";
      check.style.cssText = "color:var(--accent);font-weight:700";
      row.appendChild(check);
    }
    el.appendChild(row);
  });
  el.style.display = "block";
}

function clearRecipeSearch() {
  const el = document.getElementById("recipeSearch");
  if (el) el.value = "";
  const ir = document.getElementById("recipeInlineResults");
  if (ir) ir.style.display = "none";
}

function resetRecipes() {
  // Animate results out first, then clear
  const resultsEl = document.getElementById("recipeResults");
  if (resultsEl.innerHTML.trim()) {
    resultsEl.style.animation = 'none';
    resultsEl.offsetHeight;
    resultsEl.style.animation = 'resetFlash 0.35s cubic-bezier(0.45,0,0.15,1) both';
    resultsEl.addEventListener('animationend', function handler() {
      resultsEl.removeEventListener('animationend', handler);
      resultsEl.style.animation = '';
      resultsEl.innerHTML = '';
    }, { once: true });
  }

  // Suche zurücksetzen
  clearRecipeSearch();

  // Auswahl leeren
  selectedRecipeList = [];
  saveSettings();
  renderSelectedRecipes();

  // Alle Checkboxen im Grid deaktivieren
  Object.entries(RECIPES).forEach(([name]) => {
    const chk = document.getElementById("chk_" + name);
    if (chk) chk.checked = false;
  });

  // Kategorie-Buttons zurücksetzen (falls vorhanden)
  const cats = [...new Set(Object.values(RECIPES).map(r => r.category))];
  cats.forEach(cat => {
    const btn = document.getElementById("robotAllBtn_" + cat.replace(/ /g, "_"));
    if (btn) btn.textContent = "All ✓";
  });

  // Globalen Button zurücksetzen (falls du einen hast)
  const globalBtn = document.getElementById("robotAllBtn_General");
  if (globalBtn) globalBtn.textContent = "Alle ✓";

  // Grid neu rendern
  if (document.getElementById("recipeGrid")) renderRecipeBrowser();

  // Sankey + Boxen zurücksetzen
  document.getElementById("sankeySvg").style.display    = "none";
  document.getElementById("sankeyLegend").style.display = "none";
  document.getElementById("sankeyEmpty").style.display  = "flex";
  document.getElementById("boxesSvg").style.display    = "none";
  document.getElementById("boxesLegend").style.display = "none";
  document.getElementById("boxesEmpty").style.display  = "flex";
}


function toggleRecipeFromGrid(canonicalName) {
  const existing = selectedRecipeList.findIndex(
    (item) => item.itemName === canonicalName,
  );
  if (existing >= 0) {
    selectedRecipeList.splice(existing, 1);
    renderSelectedRecipes();
    renderRecipeBrowser();
  } else {
    addRecipeItem(canonicalName);
  }
}

// ── Add / Remove ─────────────────────────────────────────────
function addRecipeItem(canonicalName) {
  if (selectedRecipeList.find((item) => item.itemName === canonicalName))
    return;
  const recipeName = resolveRecipeName(canonicalName);
  const r = RECIPES[recipeName];
  if (!r || !Object.keys(r.machines).length) return;
  const machineName =
    getPreferredMachine(recipeName) || Object.keys(r.machines)[0];
  selectedRecipeList.unshift({
    itemName: canonicalName,
    recipeName,
    machineName,
    goal: 60,
    wsOverride: null,   // null = use global workstation config
    wsExpanded: false,  // UI state: inline WS editor open?
  });
  renderSelectedRecipes();
  renderRecipeBrowser();
  const el = document.getElementById("recipeSearch");
  if (el) el.value = "";
  const ir = document.getElementById("recipeInlineResults");
  if (ir) ir.style.display = "none";
}

function removeRecipeItem(idx) {
  selectedRecipeList.splice(idx, 1);
  renderSelectedRecipes();
  if (
    document.getElementById("recipePickerOverlay").style.display ===
    "flex"
  )
    renderRecipeBrowser();
  if (selectedRecipeList.length) {
    calculateRecipes();
  } else {
    document.getElementById("recipeResults").innerHTML = "";
  }
}

function updateRecipeMachine(idx, val) {
  selectedRecipeList[idx].machineName = val;
  renderSelectedRecipes();
  if (selectedRecipeList.length) calculateRecipes();
}
function updateRecipeVariant(idx, variantName) {
  const item = selectedRecipeList[idx];
  item.recipeName = variantName;
  // update machine to best option for new recipe
  const r = RECIPES[variantName];
  if (r)
    item.machineName =
      getPreferredMachine(variantName) || Object.keys(r.machines)[0];
  renderSelectedRecipes();
  if (selectedRecipeList.length) calculateRecipes();
}
function updateRecipeGoal(idx, val) {
  const parsed = parseFloat(val);
  if (isNaN(parsed) || parsed <= 0) {
    // Flash the input red and restore the current valid value
    const inp = document.querySelector('#selectedRecipes input[type="number"][data-idx="' + idx + '"]');
    if (inp) {
      inp.style.transition  = 'border-color 0.15s, background 0.15s';
      inp.style.borderColor = 'rgba(255,69,58,0.8)';
      inp.style.background  = 'rgba(255,69,58,0.12)';
      inp.value = selectedRecipeList[idx].goal;
      setTimeout(() => {
        inp.style.borderColor = '';
        inp.style.background  = '';
        setTimeout(() => { inp.style.transition = ''; }, 200);
      }, 600);
    }
    return;
  }
  selectedRecipeList[idx].goal = Math.min(parsed, 999999);
  renderSelectedRecipes();
  if (selectedRecipeList.length) calculateRecipes();
}

// ── Render selected list ──────────────────────────────────────
function renderSelectedRecipes() {
  const el = document.getElementById("selectedRecipes");
  if (!selectedRecipeList.length) {
    el.innerHTML = `<div style="color:rgba(255,255,255,0.30);font-size:13px;padding:20px 16px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:12px;text-align:center">
      No item selected yet. Add via search or ⊞.
    </div>`;
    return;
  }
  el.innerHTML = selectedRecipeList
    .map((item, idx) => {
      const r = RECIPES[item.recipeName];
      if (!r) return "";
      const variants = getVariantsFor(item.itemName);
      const hasVariants = variants.length > 1;

      // Variant selector
      const variantOptions = hasVariants
        ? variants
          .map((v) => {
            const sel = v === item.recipeName ? "selected" : "";
            return `<option value="${v}" ${sel}>${v}</option>`;
          })
          .join("")
        : "";

      // Machine selector
      const machineOptions = Object.keys(r.machines)
        .map((m) => {
          const ct = r.machines[m].cycleTime;
          const opm = ((60 / ct) * getOutputAmount(r)).toFixed(1);
          const sel = m === item.machineName ? "selected" : "";
          return `<option value="${m}" ${sel}>${m} — ${opm}/min</option>`;
        })
        .join("");

      const ct = r.machines[item.machineName].cycleTime;
      const baseEff = r.efficiency != null ? r.efficiency : 0;
      const eff = botEfficiencyOverrides[item.itemName] != null ? botEfficiencyOverrides[item.itemName] : baseEff;
      const effMultiplier = 1 + eff / 100;
      const miningBonus = MINING_MACHINES.has(item.machineName) ? globalMiningProductivity / 100 : 0;
      const fluidBonus = FLUID_MACHINES.has(item.machineName) ? globalFluidProductivity / 100 : 0;
      const wsBonus = getItemWsBonus(item);
      const opm = (60 / ct) * getOutputAmount(r) * effMultiplier * (1 + miningBonus + fluidBonus + wsBonus);
      const machinesNeeded = Math.ceil(item.goal / opm);
      const actualOpm = machinesNeeded * opm;

      const ingLines = r.ingredients
        .map((ing) => {
          const ipm = (60 / ct) * ing.amount * machinesNeeded;
          return `<span style="display:inline-flex;align-items:center;gap:3px;color:var(--text-dim);font-size:11px">${getIcon(ing.item, 14)}${ing.item}: <span style="color:var(--accent3)">${fmt(ipm)}</span></span>`;
        })
        .join(" <span style='color:rgba(255,255,255,0.20)'>·</span> ");

      return `
      <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.10);border-radius:12px;padding:9px 10px">
        <!-- Row 1: icon + name + machines badge + remove -->
        <div style="display:flex;align-items:center;gap:8px">
          ${getIcon(item.itemName, 28)}
          <div style="flex:1;min-width:0">
            <div style="font-size:13px;font-weight:700;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${item.itemName}</div>
            <div style="font-size:10px;color:var(--text-dim)">${hasVariants ? item.recipeName : r.category}</div>
          </div>
          <div style="text-align:right;flex-shrink:0">
            <div style="font-family:'Share Tech Mono',monospace;font-size:18px;color:var(--accent);line-height:1">${machinesNeeded}</div>
            <div style="font-size:10px;color:var(--text-dim)">${fmt(actualOpm)}/min</div>
          </div>
          <button data-idx="${idx}" onclick="removeRecipeItem(this.dataset.idx)"
            style="padding:3px 7px;background:transparent;border:1px solid #3a1a1a;color:#f66;border-radius:4px;cursor:pointer;font-size:12px;flex-shrink:0">✕</button>
        </div>
        <!-- Row 2: selects + goal -->
        <div style="display:flex;gap:5px;margin-top:7px;flex-wrap:wrap;align-items:center">
          ${hasVariants ? `<select data-idx="${idx}" onchange="updateRecipeVariant(this.dataset.idx, this.value)"
            style="flex:1;min-width:80px;padding:5px 8px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);color:var(--text);border-radius:8px;font-family:-apple-system,sans-serif;font-size:11px;outline:none">
            ${variantOptions}
          </select>` : ''}
          <div style="display:flex;align-items:center;gap:4px;flex:1;min-width:100px">
            ${getIcon(item.machineName, 18)}
            <select data-idx="${idx}" onchange="updateRecipeMachine(this.dataset.idx, this.value)"
              style="flex:1;padding:5px 8px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);color:var(--text);border-radius:8px;font-family:-apple-system,sans-serif;font-size:11px;outline:none">
              ${machineOptions}
            </select>
          </div>
          <div style="display:flex;align-items:center;gap:4px;flex-shrink:0">
            <span style="font-size:10px;color:var(--text-dim)">Goal</span>
            <input type="number" value="${item.goal}" min="0.01" max="999999" step="any" data-idx="${idx}"
              onchange="updateRecipeGoal(this.dataset.idx, this.value)"
              style="width:64px;padding:5px 8px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);color:var(--text);border-radius:8px;font-family:-apple-system,sans-serif;font-size:11px;text-align:right;outline:none">
          </div>
        </div>
        ${Array.isArray(r.output) && r.output.length > 1
          ? `<div style="margin-top:5px;padding-top:5px;border-top:1px solid rgba(255,255,255,0.07);display:flex;flex-wrap:wrap;gap:5px">
          <span style="font-size:10px;color:var(--text-dim);letter-spacing:1px;text-transform:uppercase">By-products:</span>
          ${r.output.slice(1).map(op => {
            const byOpm = (60 / r.machines[item.machineName].cycleTime) * op.amount * machinesNeeded;
            return `<span style="display:inline-flex;align-items:center;gap:3px;color:var(--text-dim);font-size:11px">${getIcon(op.item, 14)}${op.item}: <span style="color:var(--warn)">${fmt(byOpm)}</span></span>`;
          }).join(' <span style="color:rgba(255,255,255,0.20)">·</span> ')}
        </div>`
          : ""
        }
        ${!Array.isArray(r.output) && r.output && r.output.chance != null && r.output.chance < 1
          ? `<div style="margin-top:5px;padding-top:5px;border-top:1px solid rgba(255,255,255,0.07);display:flex;align-items:center;gap:5px">
          <span style="font-size:10px;color:#f5a623;letter-spacing:1px;text-transform:uppercase">⚡ Chance output:</span>
          <span style="font-size:11px;color:var(--text-dim)">${getOutputLabel(r)} per cycle</span>
          <span style="font-size:10px;color:var(--text-dim);opacity:0.7">(avg ${(r.output.amount * r.output.chance).toFixed(1)}/cycle)</span>
        </div>`
          : ""
        }
        ${!Array.isArray(r.output) && r.output && r.output.chance != null && r.output.chance < 1
          ? `<div style="margin-top:5px;padding-top:5px;border-top:1px solid rgba(255,255,255,0.07);display:flex;align-items:center;gap:5px">
          <span style="font-size:10px;color:#f5a623;letter-spacing:1px;text-transform:uppercase">⚡ Chance output:</span>
          <span style="font-size:11px;color:var(--text-dim)">${getOutputLabel(r)} per cycle</span>
          <span style="font-size:10px;color:var(--text-dim);opacity:0.7">(avg ${(r.output.amount * r.output.chance).toFixed(1)}/cycle)</span>
        </div>`
          : ""
        }
        ${r.ingredients.length
          ? `<div style="margin-top:7px;padding-top:7px;border-top:1px solid rgba(255,255,255,0.07);display:flex;flex-wrap:wrap;gap:5px">
          ${ingLines}
        </div>`
          : ""
        }${r.workstation_effect
          ? (() => {
            const ws = r.workstation_effect;
            const bonuses = [];
            if (ws.machine_efficiency) bonuses.push(`<span style="color:var(--accent3)">+${ws.machine_efficiency}% efficiency</span>`);
            if (ws.machine_speed) bonuses.push(`<span style="color:var(--accent)">+${ws.machine_speed}% speed</span>`);
            if (ws.power_consumption_kw) bonuses.push(`<span style="color:var(--warn)">+${ws.power_consumption_kw}% energy</span>`);
            const targets = (ws.applies_to || []).join(", ");
            const exempt = ws.exempt ? ` <span style="color:var(--text-dim)">(except: ${ws.exempt.join(", ")})</span>` : "";
            const metaParts = [];
            if (r.weight) metaParts.push(`⚖ ${r.weight} kg`);
            if (r.sales_price) metaParts.push(`💰 ${r.sales_price} F`);
            return `<div style="margin-top:10px;padding-top:10px;border-top:1px solid rgba(255,255,255,0.07);display:flex;flex-wrap:wrap;align-items:center;gap:14px">
                  <span style="font-size:11px;color:var(--text-dim);text-transform:uppercase;letter-spacing:1px">Workstation effect: </span>
                  <span style="display:flex;gap:10px;flex-wrap:wrap">${bonuses.join(" · ")}</span>
                  <span style="font-size:12px;color:var(--text-dim)">→ ${targets}${exempt}</span>
                  ${metaParts.length ? `<span style="font-size:12px;color:var(--text-dim);margin-left:auto">${metaParts.join("  ")}</span>` : ""}
                </div>`;
          })()
          : ""
        }
      </div>
        <div style="margin-top:6px;padding-top:6px;border-top:1px solid rgba(255,255,255,0.07)">
          ${buildItemWsRow(item, idx)}
        </div>
      </div>`;
    })
    .join("");
  saveSettings();
}

// ── Per-item workstation row ──────────────────────────────────
function buildItemWsRow(item, idx) {
  const cat = MACHINE_TO_CATEGORY[item.machineName];
  const globalConfig = cat ? workstationConfigs[cat] : null;
  const hasOverride = item.wsOverride !== null && item.wsOverride !== undefined;
  const isDisabled = hasOverride && item.wsOverride.disabled;
  const useOverride = hasOverride && !isDisabled;
  const activeConfig = useOverride ? item.wsOverride : (isDisabled ? null : globalConfig);
  const bonus = calcWsBonusForMachine(item.machineName, activeConfig);
  const bonusLabel = bonus > 0
    ? `<span style="color:var(--accent3);font-family:'Share Tech Mono',monospace;font-size:11px">+${Math.round(bonus * 1000) / 10}%</span>`
    : `<span style="color:var(--text-dim);font-size:11px">no bonus</span>`;
  const modeLabel = useOverride ? "Custom WS" : (isDisabled ? "No WS" : (globalConfig ? "Global WS" : "No WS"));

  // Only bots compatible with this item's machine category
  const compatBots = Object.entries(RECIPES)
    .filter(([, r]) => r.category === "Robots" && r.workstation_effect &&
      (r.workstation_effect.applies_to || []).some(c =>
        (APPLIES_TO_MACHINES[c] || []).includes(item.machineName)
      ))
    .sort(([a], [b]) => a.localeCompare(b));

  const editorHtml = (() => {
    if (!item.wsExpanded) return "";
    const cfg = activeConfig || { tier: 1, robots: [null], chargedCore: false };
    const slotCount = cfg.tier || 1;
    const slotsHtml = Array.from({ length: slotCount }, (_, si) => {
      const botName = (cfg.robots || [])[si] || "";
      const botOpts = compatBots.map(([n, r]) => {
        const we = r.workstation_effect;
        const parts = [];
        if (we.machine_efficiency) parts.push("+" + we.machine_efficiency + "% Eff");
        if (we.machine_speed) parts.push("+" + we.machine_speed + "% Speed");
        const label = n + (parts.length ? "  [" + parts.join(" · ") + "]" : "");
        return `<option value="${n}" ${n === botName ? "selected" : ""}>${label}</option>`;
      }).join("");
      const opts = `<option value="">— no bot —</option>` + botOpts;
      return `<div style="display:flex;align-items:center;gap:6px;margin-top:5px">
          <span style="font-size:10px;color:var(--text-dim);width:38px;flex-shrink:0">Slot ${si + 1}</span>
          <select data-idx="${idx}" data-slot="${si}" onchange="updateItemWsBot(this)"
            style="flex:1;padding:5px 8px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);color:var(--text);border-radius:8px;font-family:-apple-system,sans-serif;font-size:11px;outline:none">
            ${opts}
          </select>
        </div>`;
    }).join("");

    const tierOpts = [1, 2, 3].map(t =>
      `<option value="${t}" ${t === slotCount ? "selected" : ""}>${t} Slot${t > 1 ? "s" : ""}</option>`
    ).join("");
    const coreCheck = slotCount === 3
      ? `<label style="display:flex;align-items:center;gap:4px;font-size:11px;color:var(--accent3);cursor:pointer;flex-shrink:0">
            <input type="checkbox" ${cfg.chargedCore ? "checked" : ""} data-idx="${idx}"
              onchange="updateItemWsCore(this)" style="accent-color:var(--accent3)">
            Charged Core
          </label>`
      : "";

    return `<div style="margin-top:6px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:8px">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <span style="font-size:10px;color:var(--text-dim);text-transform:uppercase;letter-spacing:1px">Modus:</span>
          ${["none", "global", "custom"].map(mode => {
      const isActive = mode === "custom" ? useOverride
        : mode === "none" ? (isDisabled || (!hasOverride && !globalConfig))
          : (!hasOverride && !isDisabled && !!globalConfig);
      const label = mode === "none" ? "No WS" : mode === "global" ? "Global WS" : "Custom WS";
      return `<button data-action="wsmode" data-idx="${idx}" data-mode="${mode}"
              style="padding:3px 10px;border-radius:4px;cursor:pointer;font-family:inherit;font-size:11px;transition:all 0.15s;${isActive
          ? 'background:rgba(10,132,255,0.18);border:1px solid rgba(10,132,255,0.5);color:#f5f5f7;font-weight:600;'
          : 'background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.10);color:rgba(255,255,255,0.45);'
        }">${label}</button>`;
    }).join("")}
          ${useOverride ? `
          <span style="font-size:10px;color:var(--text-dim);text-transform:uppercase;letter-spacing:1px">Tier:</span>
          <select data-idx="${idx}" onchange="updateItemWsTier(this)"
            style="padding:4px 8px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);color:var(--text);border-radius:8px;font-family:-apple-system,sans-serif;font-size:11px;outline:none">
            ${tierOpts}
          </select>
          ${coreCheck}
          ` : ""}
        </div>
        ${useOverride
        ? slotsHtml
        : globalConfig && !useOverride
          ? `<div style="font-size:11px;color:var(--text-dim);margin-top:5px">Using global WS for: <span style="color:var(--accent)">${cat || "—"}</span></div>`
          : `<div style="font-size:11px;color:#444;margin-top:5px">No WS bonus active.</div>`
      }
      </div>`;
  })();

  return `<div style="display:flex;align-items:center;gap:6px">
      <span style="font-size:10px;color:var(--text-dim);text-transform:uppercase;letter-spacing:1px">Workstation:</span>
      <button data-action="wstoggle" data-idx="${idx}"
        style="padding:2px 8px;background:${item.wsExpanded ? "rgba(10,132,255,0.15)" : "rgba(255,255,255,0.06)"};border:1px solid ${item.wsExpanded ? "rgba(10,132,255,0.4)" : "rgba(255,255,255,0.10)"};color:rgba(255,255,255,0.55);border-radius:6px;cursor:pointer;font-size:11px;display:flex;align-items:center;gap:5px">
        ${modeLabel} ${bonusLabel} <span style="font-size:9px">${item.wsExpanded ? "▲" : "▼"}</span>
      </button>
    </div>
    ${editorHtml}`;
}


function updateItemWsMode2(idx, mode) {
  const item = selectedRecipeList[idx];
  if (mode === "custom") {
    const cat = MACHINE_TO_CATEGORY[item.machineName];
    const globalCfg = cat ? workstationConfigs[cat] : null;
    item.wsOverride = globalCfg
      ? { tier: globalCfg.tier, robots: [...globalCfg.robots], chargedCore: globalCfg.chargedCore }
      : { tier: 1, robots: [null], chargedCore: false };
  } else if (mode === "none") {
    item.wsOverride = { tier: 1, robots: [], chargedCore: false, disabled: true };
  } else {
    // "global" — remove override entirely
    item.wsOverride = null;
  }
  renderSelectedRecipes();
}

function updateItemWsTier(sel) {
  const idx = parseInt(sel.dataset.idx);
  const item = selectedRecipeList[idx];
  if (!item.wsOverride) return;
  const t = parseInt(sel.value);
  item.wsOverride.tier = t;
  while (item.wsOverride.robots.length < t) item.wsOverride.robots.push(null);
  item.wsOverride.robots = item.wsOverride.robots.slice(0, t);
  if (t < 3) item.wsOverride.chargedCore = false;
  renderSelectedRecipes();
}

function updateItemWsBot(sel) {
  const idx = parseInt(sel.dataset.idx);
  const slot = parseInt(sel.dataset.slot);
  const item = selectedRecipeList[idx];
  if (!item.wsOverride) return;
  item.wsOverride.robots[slot] = sel.value || null;
  renderSelectedRecipes();
}

function updateItemWsCore(chk) {
  const idx = parseInt(chk.dataset.idx);
  const item = selectedRecipeList[idx];
  if (!item.wsOverride) return;
  item.wsOverride.chargedCore = chk.checked;
  renderSelectedRecipes();
}

// ── Bot-aware calculation ─────────────────────────────────────
//
// Reads the "goalProd" input (complete robots / min) and sets the
// production goal for every selected Robots-category recipe so that
// the assembly ratio is respected:
//   Head  × 1  (1 per complete robot)
//   Torso × 1  (1 per complete robot)
//   Arm   × 2  (2 per complete robot)
//   Leg   × 2  (2 per complete robot)
// Non-assembly robots/bots/drones get the raw goalProd value directly.
function calculateBots() {
  const goal = parseFloat(document.getElementById("goalProd").value) || 32;
  selectedRecipeList.forEach(item => {
    const r = RECIPES[item.recipeName];
    if (r && r.category === "Robots") item.goal = goal;
  });
  calculateRecipes();
}

// Helper: get primary output amount (supports both single object and array)
// Multiplies by chance if present (e.g. 0.5 → expected value)
