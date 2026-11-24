function initRecipeCalc() {
  const tabsEl = document.getElementById("recipeCatTabs");
  RECIPE_CATEGORIES.forEach((cat) => {
    const btn = document.createElement("button");
    btn.textContent = cat;
    btn.style.cssText =
      "padding:7px 14px;background:transparent;border:none;border-right:1px solid var(--color-border);border-bottom:2px solid transparent;color:var(--color-interactive);cursor:pointer;font-family:-apple-system,sans-serif;font-size:12px;white-space:nowrap;transition:all 0.18s;flex-shrink:0";
    btn.onclick = function () {
      activeBrowserCat = cat;
      document.querySelectorAll("#recipeCatTabs button").forEach((b) => {
        b.style.color = "var(--text-dim)";
        b.style.borderBottom = "3px solid transparent";
        b.style.background = "transparent";
      });
      btn.style.color = "var(--accent)";
      btn.style.borderBottom = "3px solid var(--accent)";
      btn.style.background = "var(--color-accent-active-bg)";
      renderRecipeBrowser();
    };
    if (cat === "Alle") {
      btn.style.color = "var(--accent)";
      btn.style.borderBottom = "3px solid var(--accent)";
      btn.style.background = "var(--color-accent-active-bg)";
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
  // Fuel variants (BURNABLE_GROUPS) are excluded from the browser —
  // they are only relevant as power-plant inputs, not as production targets.
  const burnableVariants = new Set(BURNABLE_GROUPS.flatMap(g => g.variants));

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
    // skip variant entries (recyclers stay: they belong to several groups and are recipes of their own)
    if (!RECIPES[name]?.chanceOutputs && VARIANT_GROUPS.some((g) => g.variants.includes(name))) return;
    if (burnableVariants.has(name)) return; // skip fuel recipes
    if (!recipeAvailable(RECIPES[name])) return; // Deluxe Edition not owned
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

  // Build a cell element for a single item
  function buildCell({ canonicalName, hasMachines }) {
    const isSelected = selectedRecipeList.some(
      (r) => r.itemName === canonicalName,
    );
    const cell = document.createElement("div");
    cell.style.cssText = [
      "width:64px",
      "height:64px",
      "flex-shrink:0",
      "background:" + (isSelected ? "var(--color-accent-active-bg)" : "var(--color-accent-inactive-bg)"),
      "border:" +
      (isSelected ? "2px solid var(--color-border-focus)" : "1px solid var(--color-border)"),
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
      '<div style="position:absolute;inset:0;border-radius:6px;overflow:hidden;display:flex;align-items:center;justify-content:center;">' +
        getIcon(canonicalName, 64) +
      '</div>' +
      (isSelected
        ? '<div style="position:absolute;top:4px;right:4px;width:16px;height:16px;background:var(--accent);border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:11px;color:#fff;font-weight:800;z-index:1;line-height:1">✓</div>'
        : "");

    const label = document.createElement("div");
    label.style.cssText =
      "position:absolute;bottom:-26px;left:50%;transform:translateX(-50%);background:var(--color-viz-tooltip-bg);border:1px solid var(--color-border);color:var(--color-text-primary);font-size:10px;padding:3px 7px;border-radius:6px;white-space:nowrap;pointer-events:none;opacity:0;transition:opacity 0.15s;z-index:20;max-width:160px;overflow:hidden;text-overflow:ellipsis;backdrop-filter:blur(20px)";
    label.textContent = canonicalName;
    cell.appendChild(label);

    if (hasMachines) {
      cell.onmouseenter = function () {
        this.style.border = "2px solid var(--color-border-focus)";
        label.style.opacity = "1";
      };
      cell.onmouseleave = function () {
        this.style.border = isSelected ? "2px solid var(--color-border-focus)" : "1px solid var(--color-border)";
        label.style.opacity = "0";
      };
      cell.onclick = function () {
        toggleRecipeFromGrid(canonicalName);
      };
    }
    return cell;
  }

  // Use subgroups when viewing a specific category that has subgroup definitions
  const subgroupDefs = activeBrowserCat !== "Alle" &&
    RECIPE_SUBGROUPS[activeBrowserCat] &&
    RECIPE_SUBGROUPS[activeBrowserCat].length > 0
    ? RECIPE_SUBGROUPS[activeBrowserCat]
    : null;

  if (subgroupDefs) {
    // Partition items into subgroups
    const itemMap = new Map(items.map(item => [item.canonicalName, item]));
    const groups = subgroupDefs.map(sg => ({
      label: sg.label,
      // sg.rows: string[][] — resolve names to item objects, drop unknowns/filtered-out
      rows: sg.rows.map(row => row.map(name => itemMap.get(name)).filter(Boolean)),
    }));
    // Remaining items not in any named subgroup → "Other" (single row, wraps naturally)
    const assignedNames = new Set(subgroupDefs.flatMap(sg => sg.rows.flat()));
    const otherItems = items.filter(item => !assignedNames.has(item.canonicalName));
    if (otherItems.length) groups.push({ label: "Other", rows: [otherItems] });

    groups.forEach(({ label, rows }) => {
      const totalItems = rows.reduce((n, r) => n + r.length, 0);
      if (!totalItems) return;

      const isCollapsed = _collapsedSubgroups.has(activeBrowserCat + "|" + label);

      const header = document.createElement("div");
      header.className = "recipe-subgroup-header";
      header.innerHTML =
        '<span class="recipe-subgroup-toggle">' + (isCollapsed ? "+" : "—") + "</span>" +
        "<span>" + label + "</span>";

      const itemGrid = document.createElement("div");
      itemGrid.className = "recipe-subgroup-grid";
      if (isCollapsed) itemGrid.style.display = "none";

      rows.forEach((row) => {
        const rowEl = document.createElement("div");
        rowEl.className = "recipe-subgroup-row";
        row.forEach(item => rowEl.appendChild(buildCell(item)));
        itemGrid.appendChild(rowEl);
      });

      header.onclick = function () {
        const key = activeBrowserCat + "|" + label;
        if (_collapsedSubgroups.has(key)) {
          _collapsedSubgroups.delete(key);
          itemGrid.style.display = "";
          header.querySelector(".recipe-subgroup-toggle").textContent = "—";
        } else {
          _collapsedSubgroups.add(key);
          itemGrid.style.display = "none";
          header.querySelector(".recipe-subgroup-toggle").textContent = "+";
        }
      };

      grid.appendChild(header);
      grid.appendChild(itemGrid);
    });
  } else {
    // Flat rendering (Alle or no subgroups defined)
    items.forEach(item => grid.appendChild(buildCell(item)));
  }
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
    if (!RECIPES[name]?.chanceOutputs && VARIANT_GROUPS.some((g) => g.variants.includes(name))) return;
    if (!recipeAvailable(RECIPES[name])) return; // Deluxe Edition not owned
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
      "padding:9px 14px;display:flex;align-items:center;gap:10px;border-bottom:1px solid var(--color-border);transition:background 0.12s;opacity:" +
      (hasMachines ? "1" : "0.4");
    if (hasMachines) {
      row.style.cursor = "pointer";
      row.onmouseenter = function () {
        this.style.background = "var(--color-accent-active-bg)";
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

  // Auswahl leeren — mit ihr die Optimierung der Kette (WS★ + Marker)
  selectedRecipeList = [];
  wsRecipeConfigs = {};
  wsOptimized = null;
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
  if (selectedRecipeList.length) calculateRecipes();
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
// "Sell" toggle: the line's output is shipped up to the space station.
function setRecipeForSale(idx, on) {
  const item = selectedRecipeList[idx];
  if (!item) return;
  item.forSale = !!on;
  saveSettings();
  calculateRecipes();
}

// ── Item datalist (shared by "Where used?" and "Existing stock") ──
function fillItemDatalist() {
  const dl = document.getElementById("allItemsList");
  if (!dl || dl.childElementCount) return;
  allItemNames().forEach(n => dl.appendChild(new Option(n)));
}

// Canonical (selectable) name of a recipe key: its variant group label.
function _canonicalOf(recipeKey) {
  if (RECIPES[recipeKey]?.chanceOutputs) return recipeKey; // recyclers are recipes of their own
  const g = VARIANT_GROUPS.find(g => g.variants.includes(recipeKey));
  return g ? g.label : recipeKey;
}

// "Where used?": every recipe that takes the item as ingredient; click adds it.
function renderWhereUsed(query) {
  const el = document.getElementById("whereUsedResults");
  if (!el) return;
  el.innerHTML = "";
  const item = allItemNames().find(n => n.toLowerCase() === (query || "").trim().toLowerCase());
  if (!item) return;
  const users = Object.entries(RECIPES)
    .filter(([, r]) => recipeAvailable(r) && (r.ingredients || []).some(i => i.item === item))
    .sort(([a], [b]) => a.localeCompare(b));
  if (!users.length) {
    el.innerHTML = '<div style="font-size:11px;color:var(--color-text-disabled)">Not used in any recipe</div>';
    return;
  }
  users.forEach(([key, r]) => {
    const ing = r.ingredients.find(i => i.item === item);
    const canonical = _canonicalOf(key);
    const added = selectedRecipeList.some(l => l.itemName === canonical);
    const row = document.createElement("button");
    row.className = "reset-btn";
    row.title = added ? "Already selected" : "Add this recipe";
    row.style.cssText = "margin:0;padding:4px 8px;display:flex;align-items:center;gap:6px;text-align:left;font-size:11px;width:100%";
    row.innerHTML = `${getIcon(key, 18)}<span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis">${key}</span>` +
      `<span style="color:var(--color-text-disabled)">${fmt(ing.amount)}×</span>${added ? "✓" : "+"}`;
    row.onclick = () => { addRecipeItem(canonical); renderWhereUsed(item); };
    el.appendChild(row);
  });
}

// ── Existing stock ──
function addStockItem() {
  const itemEl = document.getElementById("stockItemInput");
  const amtEl  = document.getElementById("stockAmountInput");
  const item = allItemNames().find(n => n.toLowerCase() === itemEl.value.trim().toLowerCase());
  const amt  = parseFloat(amtEl.value);
  if (!item || !(amt > 0)) { (item ? amtEl : itemEl).focus(); return; }
  stockItems[item] = amt;
  itemEl.value = ""; amtEl.value = "";
  _stockChanged();
}
function setStockAmount(item, val) {
  const v = parseFloat(val);
  if (v > 0) stockItems[item] = v; else delete stockItems[item];
  _stockChanged();
}
function _stockChanged() {
  renderStockList();
  saveSettings();
  if (selectedRecipeList.length) calculateRecipes();
}
function renderStockList() {
  const el = document.getElementById("stockList");
  if (!el) return;
  const items = Object.keys(stockItems).sort();
  document.getElementById("stockCount").textContent = items.length ? `(${items.length})` : "";
  el.innerHTML = "";
  items.forEach(item => {
    const row = document.createElement("div");
    row.style.cssText = "display:flex;align-items:center;gap:6px;font-size:11px;color:var(--text)";
    row.innerHTML = `${getIcon(item, 18)}<span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis">${item}</span>`;
    const inp = document.createElement("input");
    inp.type = "number"; inp.min = "0"; inp.step = "any"; inp.value = stockItems[item];
    inp.style.cssText = "width:64px;text-align:right;padding:6px 10px;background:var(--color-surface-input);border:1px solid var(--color-border);color:var(--text);border-radius:8px;font-family:-apple-system,sans-serif;font-size:12px;outline:none;box-sizing:border-box";
    inp.onchange = () => setStockAmount(item, inp.value);
    const del = document.createElement("button");
    del.className = "reset-btn"; del.textContent = "✕"; del.title = "Remove";
    del.style.cssText = "margin:0;padding:3px 7px;font-size:11px;width:auto;flex:none";
    del.onclick = () => setStockAmount(item, 0);
    row.append(inp, del);
    el.appendChild(row);
  });
}

// Bots view "Sell all": toggles forSale on every selected bot line.
function toggleBotsForSale() {
  const bots = selectedRecipeList.filter(l => RECIPES[l.recipeName]?.category === 'Robots');
  if (!bots.length) return;
  const on = !bots.every(l => l.forSale);
  bots.forEach(l => { l.forSale = on; });
  renderSelectedRecipes();
  saveSettings();
  calculateRecipes();
}

function updateRecipeGoal(idx, val) {
  const parsed = parseFloat(val);
  if (isNaN(parsed) || parsed <= 0) {
    // Flash the input red and restore the current valid value
    const inp = document.querySelector('#selectedRecipes input[type="number"][data-idx="' + idx + '"]');
    if (inp) {
      inp.style.transition  = 'border-color 0.15s, background 0.15s';
      inp.style.borderColor = 'var(--color-danger)';
      // ponytail: translucent danger tint has no token yet (only solid --color-danger exists)
      inp.style.background  = 'var(--color-danger-bg)';
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
// ── Recent calculations ────────────────────────────────────────
function renderHistory() {
  const el = document.getElementById("historyList");
  if (!el) return;
  const h = loadHistory().filter(e => e.version === GAME_VERSION_ID);
  if (!h.length) {
    el.innerHTML = `<div style="font-size:12px;color:var(--color-text-disabled)">Nothing calculated yet.</div>`;
    return;
  }
  el.innerHTML = h.map((e, i) => {
    const label = e.list.map(l => `${+l.goal.toFixed(2)}/min ${l.itemName}`).join(", ");
    const when = new Date(e.at).toLocaleString([], { dateStyle: "short", timeStyle: "short" });
    return `<div style="display:flex;gap:6px;align-items:stretch">
      <button class="reset-btn" style="margin:0;padding:4px 8px;font-size:11px;flex:1;min-width:0;text-align:left;line-height:1.35"
        title="${label}" onclick="loadHistoryEntry(${i})">
        <div style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--color-text-primary)">${label}</div>
        <div style="font-size:10px;color:var(--color-text-disabled)">${when}</div></button>
      <button class="reset-btn" style="margin:0;padding:4px 7px;font-size:11px;width:auto;flex:none" title="Remove" onclick="deleteHistoryEntry(${i})">✕</button>
    </div>`;
  }).join("");
}

// ── Saved plans (name → full plan incl. settings and Custom WS) ──
function loadSavedPlans() {
  try { return JSON.parse(localStorage.getItem("fc_saved") || "[]"); } catch (e) { return []; }
}
function _storeSavedPlans(list) {
  try { localStorage.setItem("fc_saved", JSON.stringify(list)); }
  catch (e) { alert("Could not save (browser storage full or blocked)."); }
}
function saveCurrentPlan() {
  const input = document.getElementById("savePlanName");
  const name = (input?.value || "").trim();
  if (!selectedRecipeList.some(l => !l.auto)) { alert("No recipes selected – please add recipes first."); return; }
  if (!name) { input?.focus(); return; }
  const list = loadSavedPlans().filter(e => !(e.name === name && e.version === GAME_VERSION_ID));
  if (list.length !== loadSavedPlans().length && !confirm(`Overwrite "${name}"?`)) return;
  list.unshift({ name, version: GAME_VERSION_ID, at: Date.now(), plan: _buildPlanObject() });
  _storeSavedPlans(list);
  input.value = "";
  renderSavedPlans();
}
function loadSavedPlan(i) {
  const e = loadSavedPlans().filter(e => e.version === GAME_VERSION_ID)[i];
  if (e) _applyImportedPlan(e.plan);
}
function deleteSavedPlan(i) {
  const all = loadSavedPlans();
  const e = all.filter(e => e.version === GAME_VERSION_ID)[i];
  if (!e || !confirm(`Delete "${e.name}"?`)) return;
  _storeSavedPlans(all.filter(x => x !== e));
  renderSavedPlans();
}
function renderSavedPlans() {
  const el = document.getElementById("savedList");
  if (!el) return;
  const list = loadSavedPlans().filter(e => e.version === GAME_VERSION_ID);
  const esc = t => String(t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  el.innerHTML = list.length ? list.map((e, i) => {
    const label = e.plan.selectedRecipeList.map(l => `${+l.goal.toFixed(2)}/min ${l.itemName}`).join(", ");
    const when = new Date(e.at).toLocaleString([], { dateStyle: "short", timeStyle: "short" });
    return `<div style="display:flex;gap:6px;align-items:stretch">
      <button class="reset-btn" style="margin:0;padding:4px 8px;font-size:11px;flex:1;min-width:0;text-align:left;line-height:1.35"
        title="${esc(label)}" onclick="loadSavedPlan(${i})">
        <div style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--color-text-primary);font-weight:600">${esc(e.name)}</div>
        <div style="font-size:10px;color:var(--color-text-disabled);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${when} · ${esc(label)}</div></button>
      <button class="reset-btn" style="margin:0;padding:4px 7px;font-size:11px;width:auto;flex:none" title="Delete" onclick="deleteSavedPlan(${i})">✕</button>
    </div>`;
  }).join("") : `<div style="font-size:12px;color:var(--color-text-disabled)">Nothing saved yet.</div>`;
}

function loadHistoryEntry(i) {
  const e = loadHistory().filter(e => e.version === GAME_VERSION_ID)[i];
  if (!e) return;
  selectedRecipeList = sanitizeRecipeList(e.list);
  saveSettings();
  renderSelectedRecipes();
  calculateRecipes();
}

function deleteHistoryEntry(i) {
  const all = loadHistory();
  const e = all.filter(e => e.version === GAME_VERSION_ID)[i];
  localStorage.setItem("fc_history", JSON.stringify(all.filter(x => x !== e)));
  renderHistory();
}

function renderSelectedRecipes() {
  renderOptimizeButton();
  // bot sidebar checkboxes follow the list (load, import, history, reset)
  const picked = new Set(selectedRecipeList.map(l => l.itemName));
  document.querySelectorAll('#botList input[id^="chk_"]').forEach(c => { c.checked = picked.has(c.id.slice(4)); });
  const botLine = selectedRecipeList.find(l => RECIPES[l.recipeName]?.category === "Robots");
  const goalEl = document.getElementById("goalProd");
  if (botLine && goalEl && document.activeElement !== goalEl) goalEl.value = +botLine.goal.toFixed(2);
  renderPlanOptions();
  renderStockList(); // stock is part of the plan (load / import / reset)
  const sellBtn = document.getElementById("botSellAllBtn");
  if (sellBtn) {
    const bots = selectedRecipeList.filter(l => RECIPES[l.recipeName]?.category === 'Robots');
    sellBtn.textContent = bots.length && bots.every(l => l.forSale) ? "✗ Unsell all" : "Sell all";
  }
  const el = document.getElementById("selectedRecipes");
  if (!selectedRecipeList.length) {
    el.innerHTML = `<div style="color:var(--color-text-disabled);font-size:13px;padding:20px 16px;background:var(--color-bg-elevated);border:1px solid var(--color-border);border-radius:12px;text-align:center">
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

      const ct = wsCycleTime(r, item); // incl. workstation speed
      const opm = lineOpm(r, item); // gross for self-feeding loops (goal = machine output)
      const machinesNeeded = ceilMachines(item.goal / opm);
      const actualOpm = machinesNeeded * opm;

      const ingLines = r.ingredients
        .map((ing) => {
          const ipm = (60 / ct) * ing.amount * (item.goal / opm); // goal-based, like calculateRecipes()
          return `<span style="display:inline-flex;align-items:center;gap:3px;color:var(--text-dim);font-size:11px">${getIcon(ing.item, 14)}${ing.item}: <span style="color:var(--accent3)">${fmt(ipm)}</span></span>`;
        })
        .join(" <span style='color:var(--color-text-disabled)'>·</span> ");

      return `
      <div style="background:var(--color-bg-elevated);border:1px solid var(--color-border);border-radius:12px;padding:9px 10px">
        <!-- Row 1: icon + name + machines badge + remove -->
        <div style="display:flex;align-items:center;gap:8px">
          <div data-idx="${idx}" onclick="toggleRecipeCard(this.dataset.idx)" title="${item.open ? 'Collapse' : 'Expand'}"
            style="display:flex;align-items:center;gap:8px;flex:1;min-width:0;cursor:pointer">
          <span style="font-size:9px;color:var(--text-dim);width:8px">${item.open ? '▼' : '▶'}</span>
          ${getIcon(item.itemName, 28)}
          <div style="flex:1;min-width:0">
            <div style="font-size:13px;font-weight:700;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${item.itemName}</div>
            <div style="font-size:10px;color:var(--text-dim)">${item.auto === 'power' ? '<span style="color:var(--color-power)">⚡ fuel for the power plant (automatic)</span> · ' : item.auto === 'build' ? '<span style="color:var(--accent3)">🏗 build material (automatic)</span> · ' : ''}${hasVariants ? item.recipeName : r.category}${Array.isArray(r.output) && !r.chanceOutputs && r.output[0]?.item !== item.itemName && r.output[0]?.item !== item.recipeName ? ' → ' + r.output[0].item : ''}</div>
          </div>
          </div>
          <div style="text-align:right;flex-shrink:0">
            <div style="font-family:'Share Tech Mono',monospace;font-size:18px;color:var(--accent);line-height:1">${machinesNeeded}</div>
            <div style="font-size:10px;color:var(--text-dim)">${fmt(actualOpm)}/min</div>
          </div>
          <button data-idx="${idx}" onclick="${item.auto === 'power' ? 'setPowerPlan({ on: false })' : item.auto === 'build' ? "setBuildPlan({ mode: 'once' })" : 'removeRecipeItem(this.dataset.idx)'}"
            ${item.auto === 'power' ? 'title="Turn off Calculate power"' : item.auto === 'build' ? 'title="Build cost back to one-time"' : ''}
            style="padding:3px 7px;background:transparent;border:1px solid var(--color-danger-border);color:var(--color-danger);border-radius:4px;cursor:pointer;font-size:12px;flex-shrink:0">✕</button>
        </div>
        <div style="display:${item.open ? 'block' : 'none'}">
        <!-- Row 2: selects + goal -->
        <div style="display:flex;gap:5px;margin-top:7px;flex-wrap:wrap;align-items:center">
          ${hasVariants ? `<select data-idx="${idx}" onchange="updateRecipeVariant(this.dataset.idx, this.value)"
            style="flex:1;min-width:80px;padding:5px 8px;background:var(--color-surface-input);border:1px solid var(--color-border);color:var(--color-text-primary);border-radius:8px;font-family:-apple-system,sans-serif;font-size:11px;outline:none">
            ${variantOptions}
          </select>` : ''}
          <div style="display:flex;align-items:center;gap:4px;flex:1;min-width:100px">
            ${getIcon(item.machineName, 18)}
            <select data-idx="${idx}" onchange="updateRecipeMachine(this.dataset.idx, this.value)"
              style="flex:1;padding:5px 8px;background:var(--color-surface-input);border:1px solid var(--color-border);color:var(--color-text-primary);border-radius:8px;font-family:-apple-system,sans-serif;font-size:11px;outline:none">
              ${machineOptions}
            </select>
          </div>
          <div style="display:flex;align-items:center;gap:4px;flex-shrink:0">
            <span style="font-size:10px;color:var(--text-dim)">Goal</span>
            <input type="number" value="${item.auto ? +item.goal.toFixed(2) : item.goal}" ${item.auto ? `disabled title="${item.auto === 'build' ? 'Set under Build cost in the sidebar' : 'Set by the chain\'s power demand'}"` : ''} min="0.01" max="999999" step="any" data-idx="${idx}"
              onchange="updateRecipeGoal(this.dataset.idx, this.value)"
              style="width:64px;padding:5px 8px;background:var(--color-surface-input);border:1px solid var(--color-border);color:var(--color-text-primary);border-radius:8px;font-family:-apple-system,sans-serif;font-size:11px;text-align:right;outline:none">
          </div>
          <label title="Ship this item up to the space station (for sale) — counts shipping pads"
            style="display:flex;align-items:center;gap:3px;font-size:10px;color:var(--text-dim);cursor:pointer;flex-shrink:0">
            <input type="checkbox" data-idx="${idx}" ${item.forSale ? "checked" : ""}
              onchange="setRecipeForSale(this.dataset.idx, this.checked)">Sell
          </label>
        </div>
        ${r.selfLoop
          ? `<div style="margin-top:5px;font-size:11px;color:var(--text-dim)" title="Part of the output feeds the machines again; the first items come from excavation once">↻ ${fmt(item.goal - item.goal * machineOpm(r, item) / opm)}/min back into the loop · <span style="color:var(--accent3)">net +${fmt(item.goal * machineOpm(r, item) / opm)}/min</span></div>`
          : ""}
        ${r.chanceOutputs
          ? `<div style="margin-top:5px;padding-top:5px;border-top:1px solid var(--color-border);display:flex;flex-wrap:wrap;gap:5px">
          <span style="font-size:10px;color:var(--text-dim);letter-spacing:1px;text-transform:uppercase">Products:</span>
          ${r.output.map(op => `<span style="display:inline-flex;align-items:center;gap:3px;color:var(--text-dim);font-size:11px">${getIcon(op.item, 14)}${op.item}: <span style="color:var(--accent3)">${fmt((item.goal / opm) * (60 / ct) * op.amount)}</span> (${Math.round(op.amount * 100)} %)</span>`).join(' <span style="color:var(--color-text-disabled)">·</span> ')}
        </div>`
          : Array.isArray(r.output) && r.output.length > 1
          ? `<div style="margin-top:5px;padding-top:5px;border-top:1px solid var(--color-border);display:flex;flex-wrap:wrap;gap:5px">
          <span style="font-size:10px;color:var(--text-dim);letter-spacing:1px;text-transform:uppercase">By-products:</span>
          ${r.output.slice(1).map(op => {
            const byOpm = (item.goal / opm) * (60 / ct) * op.amount * (op.chance ?? 1); // goal-based like the tables
            return `<span style="display:inline-flex;align-items:center;gap:3px;color:var(--text-dim);font-size:11px">${getIcon(op.item, 14)}${op.item}: <span style="color:var(--warn)">${fmt(byOpm)}</span></span>`;
          }).join(' <span style="color:var(--color-text-disabled)">·</span> ')}
        </div>`
          : ""
        }
        ${!Array.isArray(r.output) && r.output && r.output.chance != null && r.output.chance < 1
          ? `<div style="margin-top:5px;padding-top:5px;border-top:1px solid var(--color-border);display:flex;align-items:center;gap:5px">
          <span style="font-size:10px;color:var(--color-warning);letter-spacing:1px;text-transform:uppercase">⚡ Chance output:</span>
          <span style="font-size:11px;color:var(--text-dim)">${getOutputLabel(r)} per cycle</span>
          <span style="font-size:10px;color:var(--text-dim);opacity:0.7">(avg ${(r.output.amount * r.output.chance).toFixed(1)}/cycle)</span>
        </div>`
          : ""
        }
        ${r.ingredients.length
          ? `<div style="margin-top:7px;padding-top:7px;border-top:1px solid var(--color-border);display:flex;flex-wrap:wrap;gap:5px">
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
            return `<div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--color-border);display:flex;flex-wrap:wrap;align-items:center;gap:14px">
                  <span style="font-size:11px;color:var(--text-dim);text-transform:uppercase;letter-spacing:1px">Workstation effect: </span>
                  <span style="display:flex;gap:10px;flex-wrap:wrap">${bonuses.join(" · ")}</span>
                  <span style="font-size:12px;color:var(--text-dim)">→ ${targets}${exempt}</span>
                  ${metaParts.length ? `<span style="font-size:12px;color:var(--text-dim);margin-left:auto">${metaParts.join("  ")}</span>` : ""}
                </div>`;
          })()
          : ""
        }
        <div style="margin-top:6px;padding-top:6px;border-top:1px solid var(--color-border)">
          ${buildItemWsRow(item, idx)}
        </div>
        </div>
      </div>`;
    })
    .join("");
  saveSettings();
}

// Card collapsed by default (UI state, not saved): header shows count + ✕ only
function toggleRecipeCard(idx) {
  const item = selectedRecipeList[idx];
  if (!item) return;
  item.open = !item.open;
  renderSelectedRecipes();
}

// ── Per-item workstation row ──────────────────────────────────
// Machine groups along the item's full chain that have a global workstation
// (same machine choice as the calculation).
function chainWsCategories(item) {
  const cats = new Set(), seen = new Set();
  const walk = (recipeName, machine) => {
    const c = globalWsCategory(machine);
    if (c && workstationConfigs[c]) cats.add(c);
    if (seen.has(recipeName)) return;
    seen.add(recipeName);
    (RECIPES[recipeName]?.ingredients || []).forEach(ing => {
      const rn = resolveRecipeName(ing.item), rr = RECIPES[rn];
      if (!rr) return;
      walk(rn, rr.ingredients?.length ? preferredMachineFor(rr) : preferredMinerFor(rn, rr));
    });
  };
  walk(item.recipeName, item.machineName);
  return [...cats];
}

function buildItemWsRow(item, idx) {
  const cat = globalWsCategory(item.machineName);
  const globalConfig = cat ? workstationConfigs[cat] : null;
  const hasOverride = !!item.wsOverride && !item.wsOverride.useGlobal;
  const usesGlobal = !hasOverride && (wsGlobalOn || !!item.wsOverride?.useGlobal);
  const isDisabled = (hasOverride && item.wsOverride.disabled) || (!hasOverride && !usesGlobal);
  const useOverride = hasOverride && !isDisabled;
  const activeConfig = useOverride ? item.wsOverride : (isDisabled ? null : globalConfig);
  const effHtml = wsEffectHtml(calcWsEffectForMachine(item.machineName, getItemWsConfig(item)));
  const bonusLabel = effHtml
    ? `<span style="font-family:'Share Tech Mono',monospace;font-size:11px">${effHtml}</span>`
    : `<span style="color:var(--text-dim);font-size:11px">${!hasOverride && !usesGlobal ? 'global off' : 'no bonus'}</span>`;
  const modeLabel = useOverride ? "Custom WS" : (isDisabled ? "No WS" : "Global WS");

  // Only bots compatible with this item's machine category
  const compatBots = Object.entries(RECIPES)
    .filter(([, r]) => r.category === "Robots" && r.workstation_effect &&
      wsBotFits(r.workstation_effect, item.machineName))
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
            style="flex:1;padding:5px 8px;background:var(--color-surface-input);border:1px solid var(--color-border);color:var(--color-text-primary);border-radius:8px;font-family:-apple-system,sans-serif;font-size:11px;outline:none">
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
            ${I.XENO_POWER_CORE}
          </label>`
      : "";

    return `<div style="margin-top:6px;background:var(--color-bg-elevated);border:1px solid var(--color-border);border-radius:10px;padding:8px">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <span style="font-size:10px;color:var(--text-dim);text-transform:uppercase;letter-spacing:1px">Mode:</span>
          ${["none", "global", "custom"].map(mode => {
      const isActive = mode === "custom" ? useOverride
        : mode === "none" ? isDisabled
          : usesGlobal;
      const label = mode === "none" ? "No WS" : mode === "global" ? "Global WS" : "Custom WS";
      return `<button data-action="wsmode" data-idx="${idx}" data-mode="${mode}"
              style="padding:3px 10px;border-radius:4px;cursor:pointer;font-family:inherit;font-size:11px;transition:all 0.15s;${isActive
          ? 'background:var(--color-accent-active-bg);border:1px solid var(--color-border-focus);color:var(--color-text-primary);font-weight:600;'
          : 'background:var(--color-accent-inactive-bg);border:1px solid var(--color-border);color:var(--color-interactive);'
        }">${label}</button>`;
    }).join("")}
          ${useOverride ? `
          <span style="font-size:10px;color:var(--text-dim);text-transform:uppercase;letter-spacing:1px">Tier:</span>
          <select data-idx="${idx}" onchange="updateItemWsTier(this)"
            style="padding:4px 8px;background:var(--color-surface-input);border:1px solid var(--color-border);color:var(--color-text-primary);border-radius:8px;font-family:-apple-system,sans-serif;font-size:11px;outline:none">
            ${tierOpts}
          </select>
          ${coreCheck}
          ` : ""}
        </div>
        ${useOverride
        ? slotsHtml
        : usesGlobal && globalConfig
          ? `<div style="font-size:11px;color:var(--text-dim);margin-top:5px">Global WS: <span style="color:var(--color-text-primary)">${wsConfigText(globalConfig)}</span></div>`
          : !hasOverride && !wsGlobalOn
          ? `<div style="font-size:11px;color:var(--color-text-disabled);margin-top:5px">Global workstations are off (Options) — pick Global WS to use them for this recipe.</div>`
          : `<div style="font-size:11px;color:var(--color-text-disabled);margin-top:5px">No WS bonus active.</div>`
      }
      </div>`;
  })();

  return `<div style="display:flex;align-items:center;gap:6px">
      <span style="font-size:10px;color:var(--text-dim);text-transform:uppercase;letter-spacing:1px">Workstation:</span>
      <button data-action="wstoggle" data-idx="${idx}"
        style="padding:2px 8px;background:${item.wsExpanded ? "var(--color-accent-active-bg)" : "var(--color-accent-inactive-bg)"};border:1px solid ${item.wsExpanded ? "var(--color-border-focus)" : "var(--color-border)"};color:var(--color-interactive);border-radius:6px;cursor:pointer;font-size:11px;display:flex;align-items:center;gap:5px">
        ${modeLabel} ${bonusLabel} <span style="font-size:9px" title="${wsConfigText(getItemWsConfig(item))}">${item.wsExpanded ? "▲" : "▼"}</span>
      </button>
      ${compatBots.length ? `<button onclick="event.stopPropagation();optimizeLineWs(${idx})"
        title="Best workstation for this recipe: WS 3, charged core, the bot mix with the fewest machines in the whole chain"
        style="padding:2px 8px;background:var(--color-accent-inactive-bg);border:1px solid var(--color-border);color:var(--accent3);border-radius:6px;cursor:pointer;font-size:11px">⚡ Optimize</button>` : ""}
    </div>
    ${editorHtml}`;
}


// ── Workstation optimizer ─────────────────────────────────────
// WS 3 with a charged core. Bot effects add up, so only the speed/efficiency
// mix matters: every slot holds either the strongest speed bot or the
// strongest efficiency bot for the machine (4 mixes). The mix with the fewest
// machines in the whole chain wins; on a tie the one using less power.
// ponytail: all bots from the game data count, owned or not
function _wsBestBots(machineName, cat) {
  const fits = we => cat ? (we.applies_to || []).includes(cat)
    : wsBotFits(we, machineName);
  const bots = Object.entries(RECIPES).filter(([, r]) => r.category === "Robots" && r.workstation_effect && fits(r.workstation_effect));
  const best = key => bots
    .filter(([, r]) => r.workstation_effect[key] > 0)
    .sort(([, a], [, b]) => b.workstation_effect[key] - a.workstation_effect[key]
      || (a.workstation_effect.power_consumption || 0) - (b.workstation_effect.power_consumption || 0))[0]?.[0];
  return { speed: best("machine_speed"), eff: best("machine_efficiency") };
}

function _wsMixes(b) {
  const out = [];
  for (let s = 0; s <= 3; s++) {
    if ((s > 0 && !b.speed) || (s < 3 && !b.eff)) continue;
    out.push({ tier: 3, robots: [...Array(s).fill(b.speed), ...Array(3 - s).fill(b.eff)], chargedCore: true });
  }
  return out;
}

// Optimize goal (dialog): 'machines' | 'power' | 'raw' (solid raw materials /min)
let _wsGoal = 'machines';
// Balanced: share of machines in the score (0–1); the rest is raw materials.
// Both relative to a reference (the start without workstations), so 1 % fewer
// machines weighs as much as 1 % less raw material.
let _wsBalance = 0.5, _wsRefs = null;

// Weighted (expert): every building counts with a weight. Preset for a
// late game: few Lava-Smelters, few modular buildings (power plant excepted),
// few deposits to tap — Ore Vein Miners worse than Pumpjacks / Extractors.
// The user can change every weight in the Optimize dialog.
let _wsWeights = {};
function wsWeightPreset(machine) {
  const inGroup = key => Object.entries(APPLIES_TO_MACHINES).some(([cat, ms]) => cat.startsWith(key) && ms.includes(machine));
  // order matters: Xeno-Extractors are modular in the game data but count as deposits (2)
  if (typeof POWER_SOURCES !== 'undefined' && POWER_SOURCES.some(s => s.name === machine)) return 1;   // power plant
  if (inGroup('Pumpjacks') || inGroup('Extractors')) return 2;                                         // deposits, light
  if (machine === M.ORE_VEIN_MINER) return 4;                                                          // deposits, heavy
  if (/^Lava-Smelter/.test(machine)) return 5;
  if (typeof MODULAR_BUILDINGS !== 'undefined' && MODULAR_BUILDINGS[machine]) return 8;              // modular
  return 1;
}
const wsWeight = m => _wsWeights[m] ?? wsWeightPreset(m);

// Buildings of the chain with their counts (machines, power plant, station pads)
function _wsBuildingCounts(p) {
  const counts = {};
  const add = (m, n) => { if (n > 0) counts[m] = (counts[m] || 0) + n; };
  p.graph.nodes.forEach(n => { if (n.machineName && n.machineCount > 0) add(n.machineName, ceilMachines(n.machineCount)); });
  Object.entries(powerPlanResult?.buildings || {}).forEach(([b, n]) => add(b, n));
  if (typeof EXTERNAL_SOURCES !== 'undefined') Object.keys(EXTERNAL_SOURCES).forEach(item => {
    const amount = p.graph.nodes.filter(n => n.kind === 'raw' && (n.icon || n.label) === item).reduce((a, n) => a + n.rate, 0);
    const pad = amount > 0 && shippingPlan(item, amount, 'down', false);
    if (pad) add(pad.pad, pad.count);
  });
  return counts;
}

// [main, tie-break] of the whole chain for the current settings and goal
function _wsChainScore() {
  // "Calculate power": more power → more fuel chain and power plant, so both count
  if (powerPlan.on) syncPowerLine();
  const p = chainPowerKw();
  if (!p) return [Infinity, Infinity, Infinity, Infinity];
  // machines + power plant + shipping pads for station deliveries (Firmarlite
  // Bar: fewer needed upstream → fewer pads; pads going up have no WS effect)
  const counts = _wsBuildingCounts(p);
  const machines = Object.values(counts).reduce((a, n) => a + n, 0);
  const kw = p.machines + p.loaders;
  if (_wsGoal === 'weighted') {
    // tie on the weighted sum → the one with fewer HEAVY buildings wins
    // (Σ n·w² grows with the weight: 9 Ore Vein Miners (w 4) count more than 36 w-1 machines)
    const sum = pow => Object.entries(counts).reduce((a, [m, n]) => a + n * wsWeight(m) ** pow, 0);
    return [sum(1), sum(2), machines, kw];
  }
  // ponytail: fluids (water, crude) left out — litres would drown the ores
  const raw = p.graph.nodes.filter(n => n.kind === 'raw' && !FLUID_ITEMS.has(n.icon || n.label)).reduce((a, n) => a + n.rate, 0);
  // goal first, then the other two as tie-breaks (no "first tried wins" on a tie)
  if (_wsGoal === 'power') return [kw, machines, raw];
  if (_wsGoal === 'raw')   return [raw, machines, kw];
  if (_wsGoal === 'balanced') {
    if (!_wsRefs) _wsRefs = { machines: machines || 1, raw: raw || 1 };
    return [_wsBalance * machines / _wsRefs.machines + (1 - _wsBalance) * raw / _wsRefs.raw, machines, kw];
  }
  if (_wsGoal === 'materials') {
    // every item mined or made per minute in the chain (raw + intermediates + products)
    const all = p.graph.nodes.filter(n => ['raw', 'mid', 'final'].includes(n.kind) && !FLUID_ITEMS.has(n.icon || n.label)).reduce((a, n) => a + n.rate, 0);
    return [all, machines, kw];
  }
  return [machines, kw, raw];
}

// a better than b: first differing value (goal, then tie-breaks) is lower
const _wsBetter = (a, b) => { const i = a.findIndex((v, k) => Math.abs(v - b[k]) > 1e-6); return i >= 0 && a[i] < b[i]; };

// Tries each option (the first one wins full ties) and keeps the best;
// identical options are scored once
function _wsPick(apply, options) {
  let best, bestScore;
  const seen = new Set();
  options.forEach(o => {
    const key = JSON.stringify(o ?? null);
    if (seen.has(key)) return;
    seen.add(key);
    apply(o);
    const s = _wsChainScore();
    if (!bestScore || _wsBetter(s, bestScore)) { best = o; bestScore = s; }
  });
  apply(best);
}

const WS_NONE = () => ({ tier: 1, robots: [], chargedCore: false, disabled: true });

// Options for one machine: keep, no WS, then the speed/eff mixes (WS 3 + core)
const _wsOptionsFor = (machineName, keep) => {
  const mixes = _wsMixes(_wsBestBots(machineName));
  return mixes.length ? [keep, WS_NONE(), ...mixes] : [];
};

function _wsOptimizeLine(item) {
  // current setting first: only a real improvement replaces it
  const opts = _wsOptionsFor(item.machineName, item.wsOverride);
  if (opts.length) _wsPick(o => { item.wsOverride = o; }, opts);
}

function _wsAfterOptimize() {
  saveSettings();
  renderSelectedRecipes();
  calculateRecipes();
  if (typeof renderWorkstations === "function") renderWorkstations();
  if (typeof renderWorkstationBonusSummary === "function") renderWorkstationBonusSummary();
}

function optimizeLineWs(idx) {
  const item = selectedRecipeList[idx];
  if (!item) return;
  _wsRefs = null; // balanced: reference = current chain
  _wsOptimizeLine(item);
  _wsAfterOptimize();
}

// Every recipe of the chain gets its own Custom WS: selected lines (wsOverride)
// and the recipes deeper in the chain (wsRecipeConfigs). Each option is scored
// on the WHOLE chain (machines, then power), because a choice at A changes the
// demand at B, C, D. Top-down, in rounds until nothing changes.
// ponytail: coordinate search — very good, not guaranteed the global optimum
// (all combinations = 5^n); max `rounds` rounds (dialog).
// Overlay with a spinner and "X of Y" while Optimize runs (it yields to the browser)
function _wsProgress(text, sub = '') {
  let el = document.getElementById('wsProgress');
  if (text == null) { el?.remove(); return; }
  if (!el) {
    el = document.createElement('div');
    el.id = 'wsProgress';
    el.className = 'ws-progress';
    el.innerHTML = '<div class="ws-progress-box"><div class="ws-spinner"></div><div class="ws-progress-text"></div><div class="ws-progress-sub"></div><button class="calc-btn ws-progress-ok" style="display:none">OK</button></div>';
    document.body.appendChild(el);
  }
  el.querySelector('.ws-progress-text').textContent = text;
  el.querySelector('.ws-progress-sub').textContent = sub;
}
// Final message: spinner off, OK button; resolves when OK is pressed
function _wsProgressDone(text, sub) {
  _wsProgress(text, sub);
  const el = document.getElementById('wsProgress');
  el.classList.add('done');
  el.querySelector('.ws-spinner').style.display = 'none';
  const ok = el.querySelector('.ws-progress-ok');
  ok.style.display = '';
  ok.focus();
  return new Promise(r => { ok.onclick = r; });
}
let _wsOptimizing = false;

// Dialog before Optimize: rounds + goal (kept per browser)
function openWsOptimizeDialog() {
  let pref = { rounds: 4, goal: 'machines', balance: 50, weights: {} };
  try { pref = { ...pref, ...JSON.parse(localStorage.getItem('fc_wsopt') || '{}') }; } catch { /* defaults */ }
  let dlg = document.getElementById('wsOptDialog');
  if (!dlg) {
    dlg = document.createElement('dialog');
    dlg.id = 'wsOptDialog';
    dlg.className = 'ws-opt-dialog';
    document.body.appendChild(dlg);
  }
  const goals = [['machines', 'Fewest machines', 'then less power'],
                 ['power', 'Least power', 'machines + loaders; then fewer machines'],
                 ['raw', 'Fewest raw materials', 'ores and other solid raw items per min (fluids not counted); then fewer machines'],
                 ['balanced', 'Balanced', 'fewer machines AND less raw material — weight with the slider below; each judged in % against the chain without workstations'],
                 ['weighted', 'Weighted (expert)', 'fewest buildings, each counted with its weight below — preset: modular buildings 8, Lava-Smelter 5, Ore Vein Miner 4, Pumpjack / Extractor 2, power plant and the rest 1'],
                 ['materials', 'Fewest materials overall', 'every item mined or made per min in the whole chain — raw materials and all intermediates (fluids not counted); then fewer machines']];
  dlg.innerHTML = `<form method="dialog">
      <div class="ws-opt-title">⚡ Optimize workstations</div>
      <div class="ws-opt-label">Optimize for</div>
      ${goals.map(([v, l, d]) => `<label class="ws-opt-choice"><input type="radio" name="goal" value="${v}" ${pref.goal === v ? 'checked' : ''}>
        <span><b>${l}</b><br><small>${d}</small></span></label>`).join('')}
      <label class="ws-opt-label" id="wsBalanceRow" style="display:${pref.goal === 'balanced' ? 'flex' : 'none'};align-items:center;gap:8px;margin-top:8px">
        Machines <input type="range" name="balance" min="0" max="100" step="5" value="${pref.balance}" style="flex:1"
          oninput="this.nextElementSibling.textContent = this.value + ' / ' + (100 - this.value)"> <span style="min-width:52px;text-align:right">${pref.balance} / ${100 - pref.balance}</span> Raw</label>
      <div id="wsWeightsRow" style="display:${pref.goal === 'weighted' ? 'block' : 'none'};margin-top:8px">
        <div class="ws-opt-label" style="display:flex;align-items:center;gap:8px">Weights of the buildings in this chain <small style="color:var(--text-dim);font-weight:400">(higher = avoid more, 0 = don't care)</small>
          <button type="button" class="reset-btn" style="width:auto;margin:0 0 0 auto;padding:2px 8px;font-size:11px" onclick="this.closest('#wsWeightsRow').querySelectorAll('input').forEach(i => i.value = i.dataset.preset)">Preset</button></div>
        <div style="max-height:220px;overflow-y:auto;display:flex;flex-direction:column;gap:3px">${(() => {
          const p = chainPowerKw();
          const counts = p ? _wsBuildingCounts(p) : {};
          return Object.entries(counts).sort((a, b) => wsWeightPreset(b[0]) - wsWeightPreset(a[0]) || b[1] - a[1]).map(([m, n]) => {
            const preset = wsWeightPreset(m), w = pref.weights?.[m] ?? preset;
            return `<label style="display:flex;align-items:center;gap:6px;font-size:12px">${getIcon(m, 18)}<span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${m}">${m}</span>
              <span style="color:var(--text-dim);font-size:11px">×${n}</span>
              <input type="number" min="0" max="100" step="0.5" data-machine="${m}" data-preset="${preset}" value="${w}" style="width:56px"></label>`;
          }).join('') || '<div style="font-size:11px;color:var(--text-dim)">Calculate a chain first.</div>';
        })()}</div>
      </div>
      <label class="ws-opt-label" style="display:flex;align-items:center;gap:8px;margin-top:12px">Max. rounds
        <input type="number" name="rounds" min="1" max="20" step="1" value="${pref.rounds}" style="width:64px"></label>
      <div style="font-size:11px;color:var(--text-dim);margin-top:4px">Stops earlier once a round changes nothing.</div>
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:16px">
        <button value="cancel" class="reset-btn" style="width:auto;margin:0">Cancel</button>
        <button value="ok" class="calc-btn" style="width:auto;margin:0;padding:8px 18px">Start</button>
      </div>
    </form>`;
  dlg.onclose = () => {
    if (dlg.returnValue !== 'ok') return;
    const f = dlg.querySelector('form');
    // weights: keep only the ones that differ from the preset (plus earlier ones of other chains)
    const weights = { ...(pref.weights || {}) };
    dlg.querySelectorAll('#wsWeightsRow input[data-machine]').forEach(i => {
      const v = parseFloat(i.value), m = i.dataset.machine;
      if (isFinite(v) && v >= 0 && v !== +i.dataset.preset) weights[m] = v; else delete weights[m];
    });
    const opts = { goal: f.goal.value, rounds: Math.min(20, Math.max(1, parseInt(f.rounds.value) || 4)), balance: +f.balance.value, weights };
    try { localStorage.setItem('fc_wsopt', JSON.stringify(opts)); } catch { /* not kept */ }
    optimizeAllWs(opts);
  };
  dlg.querySelectorAll('input[name=goal]').forEach(r => r.onchange = () => {
    const g = dlg.querySelector('input[name=goal]:checked').value;
    dlg.querySelector('#wsBalanceRow').style.display = g === 'balanced' ? 'flex' : 'none';
    dlg.querySelector('#wsWeightsRow').style.display = g === 'weighted' ? 'block' : 'none';
  });
  dlg.returnValue = '';
  dlg.showModal();
}

async function optimizeAllWs({ rounds = 4, goal = 'machines', balance = 50, weights = {} } = {}) {
  if (!selectedRecipeList.length || _wsOptimizing) return;
  _wsOptimizing = true;
  _wsGoal = goal;
  _wsBalance = Math.min(1, Math.max(0, balance / 100));
  _wsWeights = { ...weights };
  _wsRefs = null;
  _wsEffCache = new WeakMap();
  let lastYield = 0; // first step paints the overlay right away
  const step = async (text, sub) => {
    _wsProgress(text, sub);
    if (performance.now() - lastYield > 100) { await new Promise(r => setTimeout(r, 0)); lastYield = performance.now(); }
  };
  try {
  await step('Preparing…');
  const lineRecipes = new Set(selectedRecipeList.map(l => l.recipeName));
  const lines = selectedRecipeList.filter(l => _wsOptionsFor(l.machineName).length);
  const chain = new Map(); // recipe → machine, every chain recipe a bot fits
  (buildSankeyGraph()?.nodes || []).filter(n => n.machineName && n.machineCount > 0).forEach(n => {
    const rn = resolveRecipeName(n.label);
    if (RECIPES[rn] && !lineRecipes.has(rn) && !chain.has(rn) && _wsOptionsFor(n.machineName).length) chain.set(rn, n.machineName);
  });
  // Three fixed starts (no WS / all speed / all eff), each searched to the end;
  // the best result wins → same result every time, independent of earlier WS
  const startCfg = { none: () => WS_NONE(), speed: m => _wsMixes(_wsBestBots(m)).at(-1), eff: m => _wsMixes(_wsBestBots(m))[0] };
  const starts = Object.keys(startCfg);
  let best = null;
  const usedRounds = [];
  for (const [si, start] of starts.entries()) {
    lines.forEach(l => { l.wsOverride = startCfg[start](l.machineName); });
    wsRecipeConfigs = {};
    chain.forEach((m, rn) => { wsRecipeConfigs[rn] = startCfg[start](m); });
    calculateRecipes(); // byproduct supply pool of the graph from this start
    if (si === 0) { _wsRefs = null; _wsChainScore(); } // balanced: reference = the chain without workstations
    let used = rounds, stable = false;
    for (let round = 0; round < rounds; round++) {
      const before = JSON.stringify([wsRecipeConfigs, lines.map(l => l.wsOverride)]);
      const total = lines.length + chain.size;
      let done = 0;
      const head = () => `Start ${si + 1} of ${starts.length} · Round ${round + 1} of max. ${rounds} · ${++done} of ${total}`;
      for (const l of lines) { await step(head(), l.itemName); _wsOptimizeLine(l); }
      for (const [rn, machineName] of chain) {
        await step(head(), rn);
        _wsPick(o => { wsRecipeConfigs[rn] = o; }, _wsOptionsFor(machineName, wsRecipeConfigs[rn]));
      }
      if (JSON.stringify([wsRecipeConfigs, lines.map(l => l.wsOverride)]) === before) { used = round + 1; stable = true; break; }
    }
    usedRounds.push(stable ? `${used}` : `${used}+`);
    calculateRecipes(); // score every start with its own up-to-date supply pool
    const score = _wsChainScore();
    if (!best || _wsBetter(score, best.score))
      best = { score, start, rc: structuredClone(wsRecipeConfigs), lo: lines.map(l => structuredClone(l.wsOverride)) };
  }
  wsRecipeConfigs = best.rc;
  lines.forEach((l, i) => { l.wsOverride = best.lo[i]; });
  _wsEffCache = null;
  wsOptimized = { goal, at: Date.now(), ...(goal === 'balanced' ? { balance } : {}) };
  _wsAfterOptimize();
  const limited = usedRounds.some(r => r.endsWith('+'));
  await _wsProgressDone(`Done · best of ${starts.length} starts: ${best.start === 'none' ? 'no WS' : 'all ' + best.start}`,
              `rounds per start: ${usedRounds.join(' / ')} of max. ${rounds}${limited ? ' (+ = hit the limit, more rounds may help)' : ''}`);
  } catch (e) {
    console.error(e);
    await _wsProgressDone('Optimize failed', String(e.message || e));
  } finally {
    _wsEffCache = null;
    _wsOptimizing = false;
    _wsProgress(null);
  }
}

// Remove the optimization: Custom WS of the chain recipes and of the lines
// (back to Global WS), marker gone
function resetRecipeWs() {
  if (!confirm("Remove the workstation optimization? All recipes go back to the global workstations.")) return;
  wsRecipeConfigs = {};
  selectedRecipeList.forEach(l => { l.wsOverride = null; });
  wsOptimized = null;
  _wsAfterOptimize();
}

const WS_GOAL_LABEL = { machines: "fewest machines", power: "least power", raw: "fewest raw materials", materials: "fewest materials overall", balanced: "balanced", weighted: "weighted buildings" };
function renderOptimizeButton() {
  const btn = document.getElementById("optimizeWsBtn"), clr = document.getElementById("optimizeWsClear");
  if (!btn) return;
  const any = wsOptimized || Object.keys(wsRecipeConfigs).length;
  btn.textContent = wsOptimized ? `⚡ Optimized ✓` : "⚡ Optimize WS";
  btn.title = wsOptimized
    ? `Optimized for ${WS_GOAL_LABEL[wsOptimized.goal] || wsOptimized.goal}${wsOptimized.balance != null ? ` (machines ${wsOptimized.balance} / raw ${100 - wsOptimized.balance})` : ''} on ${new Date(wsOptimized.at).toLocaleString([], { dateStyle: "short", timeStyle: "short" })} — click to optimize again`
    : "Custom WS for every recipe of the chain (WS 3 + core: speed/eff mix or none), scored on the whole chain (fewest machines, least power or fewest raw materials). Rounds until stable.";
  btn.style.color = wsOptimized ? "var(--accent3)" : "";
  btn.style.borderColor = wsOptimized ? "var(--color-success-border)" : "";
  clr.style.display = any ? "" : "none";
}

function updateItemWsMode2(idx, mode) {
  const item = selectedRecipeList[idx];
  if (mode === "custom") {
    const cat = globalWsCategory(item.machineName);
    const globalCfg = cat ? workstationConfigs[cat] : null;
    item.wsOverride = globalCfg
      ? { tier: globalCfg.tier, robots: [...globalCfg.robots], chargedCore: globalCfg.chargedCore }
      : { tier: 1, robots: [null], chargedCore: false };
  } else if (mode === "none") {
    item.wsOverride = { tier: 1, robots: [], chargedCore: false, disabled: true };
  } else {
    // "global" — default (null) follows the global switch; while it is off the
    // line keeps the global WS explicitly
    item.wsOverride = wsGlobalOn ? null : { useGlobal: true };
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
