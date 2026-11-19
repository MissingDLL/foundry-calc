// ============================================================
// app/ui-nav.js
// ============================================================
// Navigation helpers: collapsible sections, tab switching,
// sidebar toggle, viz mode switching, and number formatting.
//
// All functions are globals; called directly from HTML onclick
// attributes and from other JS files.
// ============================================================

// Toggles a collapsible section open/closed.
// `header` is the .collapsible-header element; its next sibling
// must be the .collapsible-body element.
function toggleSection(header) {
  header.classList.toggle('collapsed');
  const body = header.nextElementSibling;
  body.classList.toggle('collapsed');
}

// Toggles the detail row of a recipe result table open/closed.
// `id` is the ID of the <tr class="recipe-detail-row"> element.
// Also toggles the expand arrow icon (▶ / ▼) next to the recipe name.
function toggleRecipeRow(id) {
  const row = document.getElementById(id);
  const arrow = document.getElementById('arr_' + id);
  if (!row) return;
  row.classList.toggle('collapsed');
  if (arrow) arrow.classList.toggle('open');
}

// ============================================================
// SIDEBAR
// ============================================================

// Collapses or expands the left sidebar by toggling the
// 'sidebar-collapsed' class on the .container element.
// State is persisted in localStorage so it survives page reloads.
function toggleSidebar() {
  const container = document.querySelector('.container');
  const isCollapsed = container.classList.toggle('sidebar-collapsed');
  localStorage.setItem('sidebarCollapsed', isCollapsed ? '1' : '0');
}

// Restore sidebar state on load.
// On mobile (≤ 640 px) the sidebar becomes an overlay drawer, so we default
// to collapsed if no explicit preference has been saved yet.
(function() {
  const saved      = localStorage.getItem('sidebarCollapsed');
  const isMobile   = window.matchMedia('(max-width: 640px)').matches;
  const container  = document.querySelector('.container');
  if (container && (saved === '1' || (saved === null && isMobile))) {
    container.classList.add('sidebar-collapsed');
  }
})();

// Switches the sidebar between the "Bots" list (#sidebar-bots) and the
// "Recipes" browser (#sidebar-recipes), and updates button highlight styles.
// Also activates the corresponding main tab via showTab().
function switchSidebarView(mode) {
  const isBots    = mode === 'bots';
  const isRecipes = mode === 'recipes';
  const isPower   = mode === 'power';
  const isSave    = mode === 'save';

  document.getElementById('sidebar-bots').style.display    = isBots    ? 'flex'  : 'none';
  document.getElementById('sidebar-recipes').style.display = isRecipes ? 'flex'  : 'none';
  document.getElementById('sidebar-power').style.display   = isPower   ? 'flex'  : 'none';
  document.getElementById('sidebar-save').style.display    = isSave    ? 'flex'  : 'none';

  [
    { id: 'toggleBotBtn',    active: isBots    },
    { id: 'toggleRecipeBtn', active: isRecipes },
    { id: 'togglePowerBtn',  active: isPower   },
    { id: 'toggleSaveBtn',   active: isSave    },
  ].forEach(function (item) {
    const el = document.getElementById(item.id);
    if (!el) return;
    el.classList.toggle('nav-btn--active',   item.active);
    el.classList.toggle('nav-btn--inactive', !item.active);
  });

  if (isPower || isSave) {
    switchMainTab(mode);
  } else {
    const tabName = isBots ? 'overview' : 'recipes';
    const tabEl = document.querySelector('.tab[onclick*="\'' + tabName + '\'"]');
    if (tabEl) showTab(tabName, tabEl);
    // Switch main back to recipes view if coming from power
    switchMainTab('recipes');
  }
}
// ── Number formatter ──────────────────────────────────────────
// Formats a number for display using German locale (period as
// thousands separator, comma as decimal separator).
// Returns "-" for zero so empty cells look clean rather than "0".
// Examples: 0 → "-", 1500 → "1.500", 3.14159 → "3,14"
function fmt(n) {
  if (n === 0) return "-";
  if (Number.isInteger(n)) return n.toLocaleString("de");
  return n.toLocaleString("de", { maximumFractionDigits: 2 });
}


// ============================================================
// MAIN TAB SWITCHING
// ============================================================

// Tracks which visualization sub-mode is active ('sankey' | 'boxes').
// Checked by switchMainTab() to know which renderer to call when
// the Visualize tab is opened.
let _currentVizMode = 'sankey';

// Switches between the Sankey and Box visualization sub-views.
// Updates the sub-tab button styles and triggers the appropriate renderer.
// If the tab is currently hidden, the dirty flag inside each renderer
// ensures it will redraw when made visible.
function switchVizMode(mode) {
  _currentVizMode = mode;
  const isSankey = mode === 'sankey';

  // Slide the blob indicator to the active button (mirrors theme pill behaviour)
  const activeBtn = document.getElementById(isSankey ? 'vizBtnSankey' : 'vizBtnBoxes');
  const blob      = document.getElementById('vizBlobIndicator');
  const pill      = document.getElementById('vizModePill');
  if (activeBtn && blob && pill) {
    const pR = pill.getBoundingClientRect();
    const bR = activeBtn.getBoundingClientRect();
    blob.style.transform = `translate(${bR.left - pR.left}px, ${bR.top - pR.top}px)`;
  }

  // Update active class (colours are CSS-driven via .active-viz svg)
  const btnSankey = document.getElementById('vizBtnSankey');
  const btnBoxes  = document.getElementById('vizBtnBoxes');
  btnSankey.classList.toggle('active-viz', isSankey);
  btnBoxes.classList.toggle('active-viz', !isSankey);

  const outgoing = document.getElementById(isSankey ? 'tab-boxes'  : 'tab-sankey');
  const incoming = document.getElementById(isSankey ? 'tab-sankey' : 'tab-boxes');
  const renderer = isSankey ? renderSankey : renderBoxes;

  // Fade out current view, then swap and fade in new one
  outgoing.style.transition = 'opacity 0.15s ease';
  outgoing.style.opacity    = '0';

  setTimeout(() => {
    outgoing.style.display    = 'none';
    outgoing.style.opacity    = '';
    outgoing.style.transition = '';

    incoming.style.opacity    = '0';
    incoming.style.display    = 'flex';
    incoming.style.transition = 'opacity 0.18s ease';

    requestAnimationFrame(() => {
      incoming.style.opacity = '1';
      requestAnimationFrame(() => requestAnimationFrame(renderer));
    });

    setTimeout(() => { incoming.style.transition = ''; }, 200);
  }, 160);
}

// Switches between the two main content tabs: 'recipes' and 'visualize'.
// Shows/hides the corresponding content panels, applies a slide-in animation,
// updates the tab button styles, and triggers a re-render of the active
// visualization if switching to the Visualize tab.
function switchMainTab(tab) {
  const isRecipes   = tab === 'recipes';
  const isVisualize = tab === 'visualize';
  const isPower     = tab === 'power';
  const isSave      = tab === 'save';

  const recipesEl = document.getElementById('tab-recipes');
  const vizEl     = document.getElementById('tab-visualize');
  const powerEl   = document.getElementById('tab-power');
  const saveEl    = document.getElementById('tab-save');

  recipesEl.style.display = isRecipes   ? 'block' : 'none';
  vizEl.style.display     = isVisualize ? 'flex'  : 'none';
  powerEl.style.display   = isPower     ? 'block' : 'none';
  saveEl.style.display    = isSave      ? 'block' : 'none';
  if (isSave) renderSavegame();

  const incoming = isRecipes ? recipesEl : isPower ? powerEl : isSave ? saveEl : vizEl;
  incoming.style.animation = 'none';
  incoming.offsetHeight;
  incoming.style.animation = 'tabContentIn 0.32s cubic-bezier(0.22,1,0.36,1) both';

  const btnR = document.getElementById('mainTabBtnRecipes');
  const btnS = document.getElementById('mainTabBtnVisualize');
  btnR.classList.toggle('main-tab-btn--active',   isRecipes);
  btnR.classList.toggle('main-tab-btn--inactive', !isRecipes);
  btnS.classList.toggle('main-tab-btn--active',   isVisualize);
  btnS.classList.toggle('main-tab-btn--inactive', !isVisualize);

  if (isVisualize) {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      _initVizBlob();
      if (_currentVizMode === 'sankey') renderSankey();
      else renderBoxes();
    }));
  }
}

// Positions the viz blob without animation on first show.
// Safe to call multiple times — noop after the first successful placement.
let _vizBlobReady = false;
function _initVizBlob() {
  if (_vizBlobReady) return;
  const blob = document.getElementById('vizBlobIndicator');
  const pill = document.getElementById('vizModePill');
  const btn  = document.getElementById(_currentVizMode === 'sankey' ? 'vizBtnSankey' : 'vizBtnBoxes');
  if (!blob || !pill || !btn) return;
  const pR = pill.getBoundingClientRect();
  const bR = btn.getBoundingClientRect();
  if (pR.width === 0) return; // still hidden, try again later
  blob.style.transition = 'none';
  blob.style.transform  = `translate(${bR.left - pR.left}px, ${bR.top - pR.top}px)`;
  requestAnimationFrame(() => { blob.style.transition = ''; });
  _vizBlobReady = true;
}

// ============================================================
// PLAN EXPORT / IMPORT
// ============================================================

// Serialises the current recipe list + all settings into a JSON file
// and triggers a browser download.
function exportPlan() {
  if (!selectedRecipeList.length) {
    alert('No recipes selected – please add recipes first.');
    return;
  }
  const famDefaults = {};
  MACHINE_FAMILIES.forEach(f => { if (f.defaultChoice) famDefaults[f.label] = f.defaultChoice; });

  const plan = {
    version: 1,
    selectedRecipeList: selectedRecipeList.map(item => ({
      itemName:    item.itemName,
      recipeName:  item.recipeName,
      machineName: item.machineName,
      goal:        item.goal,
      wsOverride:  item.wsOverride,
      forSale:     !!item.forSale,
    })),
    settings: {
      variantSettings,
      minerSettings,
      botEfficiencyOverrides,
      botWeightReductions,
      miningEfficiencyLevel,
      pumpjackEfficiencyLevel,
      depletedVeins,
      modularSettings,
      adjacencyBonus,
      veinsDepleted,
      shippingShip,
      shippingFlightSec,
      stockItems,
      workstationConfigs,
      machineFamilyDefaults: famDefaults,
    },
  };

  const blob = new Blob([JSON.stringify(plan, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = 'foundry-plan-' + new Date().toISOString().slice(0, 10) + '.json';
  a.click();
  URL.revokeObjectURL(url);
}

// Opens a file picker and loads a previously exported plan JSON.
function importPlan() {
  const input    = document.createElement('input');
  input.type     = 'file';
  input.accept   = '.json,application/json';
  input.onchange = function () {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        _applyImportedPlan(JSON.parse(e.target.result));
      } catch (err) {
        alert('Import error: Invalid JSON file.\n' + err.message);
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

// Applies a parsed plan object to the application state and re-renders.
function _applyImportedPlan(plan) {
  if (!plan || plan.version !== 1) {
    alert('Error: Unknown plan format (version not supported).');
    return;
  }

  // Restore recipe list — skip recipes no longer in RECIPES
  if (Array.isArray(plan.selectedRecipeList)) {
    selectedRecipeList = plan.selectedRecipeList
      .filter(item => item.recipeName && RECIPES[item.recipeName])
      .map(item => ({
        itemName:    item.itemName   || item.recipeName,
        recipeName:  item.recipeName,
        machineName: item.machineName,
        goal:        item.goal       || 60,
        wsOverride:  item.wsOverride || null,
        forSale:     !!item.forSale,
        wsExpanded:  false,
      }));
  }

  // Reset all settings to their defaults before applying imported values.
  // Without this, Object.assign() would only merge — leaving any keys that
  // exist in the current session but not in the imported plan in place,
  // causing different behaviour than opening a fresh share link.
  Object.keys(variantSettings).forEach(k => delete variantSettings[k]);
  Object.keys(minerSettings).forEach(k => delete minerSettings[k]);
  Object.keys(botEfficiencyOverrides).forEach(k => delete botEfficiencyOverrides[k]);
  Object.keys(botWeightReductions).forEach(k => delete botWeightReductions[k]);
  Object.keys(workstationConfigs).forEach(k => delete workstationConfigs[k]);
  miningEfficiencyLevel   = 0;
  pumpjackEfficiencyLevel = 0;
  depletedVeins           = 1;
  Object.keys(modularSettings).forEach(k => delete modularSettings[k]);
  adjacencyBonus = true;
  veinsDepleted  = false;
  shippingShip = null;
  shippingFlightSec = 26;
  stockItems = {};
  MACHINE_FAMILIES.forEach(f => { delete f.defaultChoice; });

  // Restore settings from the imported plan
  const s = plan.settings || {};
  if (s.variantSettings)        Object.assign(variantSettings,        s.variantSettings);
  if (s.minerSettings)          Object.assign(minerSettings,          s.minerSettings);
  if (s.botEfficiencyOverrides) Object.assign(botEfficiencyOverrides, s.botEfficiencyOverrides);
  if (s.botWeightReductions) Object.entries(s.botWeightReductions).forEach(([k, v]) => {
    if (typeof v === 'number' && isFinite(v) && v >= 0 && v <= 100) botWeightReductions[k] = v;
  });
  const lvl = (v, min = 0) => (typeof v === 'number' && isFinite(v)) ? Math.max(min, Math.floor(v)) : null;
  miningEfficiencyLevel   = lvl(s.miningEfficiencyLevel)   ?? 0;
  pumpjackEfficiencyLevel = lvl(s.pumpjackEfficiencyLevel) ?? 0;
  depletedVeins           = lvl(s.depletedVeins, 1)        ?? 1;
  if (s.workstationConfigs)     Object.assign(workstationConfigs,     s.workstationConfigs);
  if (s.modularSettings) Object.entries(s.modularSettings).forEach(([m, n]) => {
    if (typeof n === 'number' && isFinite(n)) modularSettings[m] = n; // clamped in modularModules()
  });
  if (typeof s.adjacencyBonus === 'boolean') adjacencyBonus = s.adjacencyBonus;
  if (typeof s.veinsDepleted === 'boolean') veinsDepleted = s.veinsDepleted;
  if (typeof s.shippingShip === 'string') shippingShip = s.shippingShip;
  if (typeof s.shippingFlightSec === 'number' && s.shippingFlightSec >= 0) shippingFlightSec = s.shippingFlightSec;
  stockItems = sanitizeStock(s.stockItems);
  _applyModularSpeeds();
  if (s.machineFamilyDefaults) {
    MACHINE_FAMILIES.forEach(f => {
      const saved = s.machineFamilyDefaults[f.label];
      if (saved && f.machines.includes(saved)) f.defaultChoice = saved;
    });
  }

  // Persist and re-render everything
  saveSettings();
  buildRecipeCategoryList();
  renderSelectedRecipes();
  if (selectedRecipeList.length > 0) calculateRecipes();
}

// ============================================================
// SHAREABLE URL
// ============================================================
// Encodes the current plan as a Base64 URL hash and copies the link
// to the clipboard.  The same plan format as export is used (version 1)
// so _applyImportedPlan() can restore it on the receiving end.
//
// URL shape:  https://…/foundry-calc/#plan=<base64>
//
// Notes:
//   • btoa/atob only handle Latin-1; encodeURIComponent + escape/unescape
//     bridges the gap for any Unicode characters in item names.
//   • After applying a shared plan the hash is cleared via history.replaceState
//     so that subsequent reloads start fresh rather than re-applying the URL.

function sharePlan() {
  if (!selectedRecipeList.length) {
    alert('No recipes selected – please add recipes first.');
    return;
  }

  const famDefaults = {};
  MACHINE_FAMILIES.forEach(f => { if (f.defaultChoice) famDefaults[f.label] = f.defaultChoice; });

  const plan = {
    version: 1,
    selectedRecipeList: selectedRecipeList.map(item => ({
      itemName:    item.itemName,
      recipeName:  item.recipeName,
      machineName: item.machineName,
      goal:        item.goal,
      wsOverride:  item.wsOverride,
      forSale:     !!item.forSale,
    })),
    settings: {
      variantSettings,
      minerSettings,
      botEfficiencyOverrides,
      botWeightReductions,
      miningEfficiencyLevel,
      pumpjackEfficiencyLevel,
      depletedVeins,
      modularSettings,
      adjacencyBonus,
      veinsDepleted,
      shippingShip,
      shippingFlightSec,
      stockItems,
      workstationConfigs,
      machineFamilyDefaults: famDefaults,
    },
  };

  const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(plan))));
  const url     = location.href.split('#')[0] + '#plan=' + encoded;

  const btn = document.getElementById('sharePlanBtn');

  function _flashBtn(text, color, borderColor) {
    if (!btn) return;
    const origHtml   = btn.innerHTML;
    const origColor  = btn.style.color;
    const origBorder = btn.style.borderColor;
    btn.textContent  = text;
    btn.style.color       = color;
    btn.style.borderColor = borderColor;
    setTimeout(() => {
      btn.innerHTML         = origHtml;
      btn.style.color       = origColor;
      btn.style.borderColor = origBorder;
    }, 2000);
  }

  navigator.clipboard.writeText(url)
    // ponytail: translucent success border has no token yet (only solid --accent3 exists)
    .then(() => _flashBtn('✓ Copied!', 'var(--accent3)', 'var(--color-success-border)'))
    .catch(() => {
      // Fallback for environments without clipboard API (e.g. plain file://)
      prompt('Link kopieren:', url);
    });
}

// Called once on startup (from the inline <script> in index.html).
// If the URL contains a #plan=… hash the encoded plan is decoded and
// applied, overriding any locally saved state.  The hash is then removed
// so that a subsequent reload starts with the user's own saved state.
function _loadPlanFromUrl() {
  const hash = location.hash;
  if (!hash.startsWith('#plan=')) return;
  try {
    const encoded = hash.slice('#plan='.length);
    const plan    = JSON.parse(decodeURIComponent(escape(atob(encoded))));
    _applyImportedPlan(plan);
    history.replaceState(null, '', location.pathname + location.search);
  } catch (e) {
    console.warn('foundry-calc: could not load plan from URL:', e);
  }
}

// ============================================================
// KEYBOARD SHORTCUTS
// ============================================================

// Close any open modal overlay when Escape is pressed.
document.addEventListener('keydown', function (e) {
  if (e.key !== 'Escape') return;
  const picker   = document.getElementById('recipePickerOverlay');
  const settings = document.getElementById('recipeSettingsOverlay');
  if (picker   && picker.style.display   === 'flex') { closeRecipePicker();   return; }
  if (settings && settings.style.display === 'flex') { closeRecipeSettings(); return; }
});

// ============================================================
// SANKEY — Datenaufbau
// ============================================================
