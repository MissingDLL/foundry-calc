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

// Restore sidebar state on load
(function() {
  if (localStorage.getItem('sidebarCollapsed') === '1') {
    document.querySelector('.container').classList.add('sidebar-collapsed');
  }
})();

// Switches the sidebar between the "Bots" list (#sidebar-bots) and the
// "Recipes" browser (#sidebar-recipes), and updates button highlight styles.
// Also activates the corresponding main tab via showTab().
function switchSidebarView(mode) {
  const isBots = mode === 'bots';
  const isRecipes = mode === 'recipes';

  document.getElementById('sidebar-bots').style.display = isBots ? 'flex' : 'none';
  document.getElementById('sidebar-recipes').style.display = isRecipes ? 'flex' : 'none';

  const activeStyle = { bg: 'rgba(10,132,255,0.18)', color: '#0a84ff' };
  const inactiveStyle = { bg: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.40)' };

  [
    { id: 'toggleBotBtn', active: isBots },
    { id: 'toggleRecipeBtn', active: isRecipes },
  ].forEach(function (item) {
    const el = document.getElementById(item.id);
    el.style.background = item.active ? activeStyle.bg : inactiveStyle.bg;
    el.style.color = item.active ? activeStyle.color : inactiveStyle.color;
  });

  const tabName = isBots ? 'overview' : 'recipes';
  const tabEl = document.querySelector('.tab[onclick*="\'' + tabName + '\'"]');
  if (tabEl) showTab(tabName, tabEl);
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

  document.getElementById('tab-sankey').style.display = isSankey ? 'flex' : 'none';
  document.getElementById('tab-boxes').style.display  = isSankey ? 'none'  : 'flex';

  const activeStyle   = { background: 'rgba(255,255,255,0.18)', boxShadow: '0 2px 8px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.25)', color: 'rgba(255,255,255,0.92)' };
  const inactiveStyle = { background: 'transparent', boxShadow: 'none', color: 'rgba(255,255,255,0.40)' };
  Object.assign(document.getElementById('vizBtnSankey').style, isSankey  ? activeStyle : inactiveStyle);
  Object.assign(document.getElementById('vizBtnBoxes').style,  !isSankey ? activeStyle : inactiveStyle);

  if (isSankey) {
    requestAnimationFrame(() => requestAnimationFrame(renderSankey));
  } else {
    requestAnimationFrame(() => requestAnimationFrame(renderBoxes));
  }
}

// Switches between the two main content tabs: 'recipes' and 'visualize'.
// Shows/hides the corresponding content panels, applies a slide-in animation,
// updates the tab button styles, and triggers a re-render of the active
// visualization if switching to the Visualize tab.
function switchMainTab(tab) {
  const isRecipes   = tab === 'recipes';
  const isVisualize = tab === 'visualize';

  const recipesEl   = document.getElementById('tab-recipes');
  const vizEl       = document.getElementById('tab-visualize');

  recipesEl.style.display = isRecipes   ? 'block' : 'none';
  vizEl.style.display     = isVisualize ? 'flex'  : 'none';

  const incoming = isRecipes ? recipesEl : vizEl;
  incoming.style.animation = 'none';
  incoming.offsetHeight;
  incoming.style.animation = 'tabContentIn 0.32s cubic-bezier(0.22,1,0.36,1) both';

  const isLight = document.documentElement.style.getPropertyValue('--text').trim() === '#1d1d1f';
  const inactiveColor = isLight ? '#6e6e73' : 'rgba(255,255,255,0.40)';
  const ab = { borderBottomColor: 'var(--accent)', color: 'var(--accent)'  };
  const ib = { borderBottomColor: 'transparent',   color: inactiveColor    };
  Object.assign(document.getElementById('mainTabBtnRecipes').style,   isRecipes   ? ab : ib);
  Object.assign(document.getElementById('mainTabBtnVisualize').style, isVisualize ? ab : ib);

  if (isVisualize) {
    // Render whichever sub-view is active
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (_currentVizMode === 'sankey') renderSankey();
      else renderBoxes();
    }));
  }
}

// ============================================================
// PLAN EXPORT / IMPORT
// ============================================================

// Serialises the current recipe list + all settings into a JSON file
// and triggers a browser download.
function exportPlan() {
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
    })),
    settings: {
      variantSettings,
      minerSettings,
      botEfficiencyOverrides,
      globalMiningProductivity,
      globalFluidProductivity,
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
        alert('Fehler beim Importieren: Ungültige JSON-Datei.\n' + err.message);
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

// Applies a parsed plan object to the application state and re-renders.
function _applyImportedPlan(plan) {
  if (!plan || plan.version !== 1) {
    alert('Fehler: Unbekanntes Plan-Format (Version nicht unterstützt).');
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
        wsExpanded:  false,
      }));
  }

  // Restore settings
  const s = plan.settings || {};
  if (s.variantSettings)        Object.assign(variantSettings,        s.variantSettings);
  if (s.minerSettings)          Object.assign(minerSettings,          s.minerSettings);
  if (s.botEfficiencyOverrides) Object.assign(botEfficiencyOverrides, s.botEfficiencyOverrides);
  if (typeof s.globalMiningProductivity === 'number') globalMiningProductivity = s.globalMiningProductivity;
  if (typeof s.globalFluidProductivity  === 'number') globalFluidProductivity  = s.globalFluidProductivity;
  if (s.workstationConfigs)     Object.assign(workstationConfigs,     s.workstationConfigs);
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
// SANKEY — Datenaufbau
// ============================================================
