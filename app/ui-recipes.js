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
    del.style.cssText = "margin:0;padding:3px 7px;font-size:11px";
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
function renderSelectedRecipes() {
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
          ${getIcon(item.itemName, 28)}
          <div style="flex:1;min-width:0">
            <div style="font-size:13px;font-weight:700;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${item.itemName}</div>
            <div style="font-size:10px;color:var(--text-dim)">${hasVariants ? item.recipeName : r.category}${Array.isArray(r.output) && !r.chanceOutputs && r.output[0]?.item !== item.itemName && r.output[0]?.item !== item.recipeName ? ' → ' + r.output[0].item : ''}</div>
          </div>
          <div style="text-align:right;flex-shrink:0">
            <div style="font-family:'Share Tech Mono',monospace;font-size:18px;color:var(--accent);line-height:1">${machinesNeeded}</div>
            <div style="font-size:10px;color:var(--text-dim)">${fmt(actualOpm)}/min</div>
          </div>
          <button data-idx="${idx}" onclick="removeRecipeItem(this.dataset.idx)"
            style="padding:3px 7px;background:transparent;border:1px solid var(--color-danger-border);color:var(--color-danger);border-radius:4px;cursor:pointer;font-size:12px;flex-shrink:0">✕</button>
        </div>
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
            <input type="number" value="${item.goal}" min="0.01" max="999999" step="any" data-idx="${idx}"
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
      </div>
        <div style="margin-top:6px;padding-top:6px;border-top:1px solid var(--color-border)">
          ${buildItemWsRow(item, idx)}
        </div>
      </div>`;
    })
    .join("");
  saveSettings();
}

// ── Per-item workstation row ──────────────────────────────────
// Machine groups along the item's full chain that have a global workstation
// (same machine choice as the calculation).
function chainWsCategories(item) {
  const cats = new Set(), seen = new Set();
  const walk = (recipeName, machine) => {
    const c = MACHINE_TO_CATEGORY[machine];
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
  const modeLabel = useOverride ? "Custom WS" : (isDisabled ? "No WS" : "Global WS");

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
            Charged Core
          </label>`
      : "";

    return `<div style="margin-top:6px;background:var(--color-bg-elevated);border:1px solid var(--color-border);border-radius:10px;padding:8px">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <span style="font-size:10px;color:var(--text-dim);text-transform:uppercase;letter-spacing:1px">Mode:</span>
          ${["none", "global", "custom"].map(mode => {
      const isActive = mode === "custom" ? useOverride
        : mode === "none" ? isDisabled
          : (!hasOverride && !isDisabled);
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
        : globalConfig && !useOverride
          ? `<div style="font-size:11px;color:var(--text-dim);margin-top:5px">Using global WS for: <span style="color:var(--accent)">${chainWsCategories(item).join(", ") || "—"}</span></div>`
          : `<div style="font-size:11px;color:var(--color-text-disabled);margin-top:5px">No WS bonus active.</div>`
      }
      </div>`;
  })();

  return `<div style="display:flex;align-items:center;gap:6px">
      <span style="font-size:10px;color:var(--text-dim);text-transform:uppercase;letter-spacing:1px">Workstation:</span>
      <button data-action="wstoggle" data-idx="${idx}"
        style="padding:2px 8px;background:${item.wsExpanded ? "var(--color-accent-active-bg)" : "var(--color-accent-inactive-bg)"};border:1px solid ${item.wsExpanded ? "var(--color-border-focus)" : "var(--color-border)"};color:var(--color-interactive);border-radius:6px;cursor:pointer;font-size:11px;display:flex;align-items:center;gap:5px">
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
