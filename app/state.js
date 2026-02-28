// ============================================================
// app/state.js
// ============================================================
// Global application state and derived configuration tables.
//
// This file owns:
//   • All mutable state variables (selectedRecipeList, overrides…)
//   • Read-only lookup tables built from data/game-data.js constants
//   • Helper functions for variant resolution, workstation bonuses,
//     and the bot sidebar list builder
//
// Dependency chain (must be loaded before this file):
//   data/game-data.js  → M, I, CAT
//   data/recipes.js    → RECIPES
//   data/icons.js      → getIcon()
// ============================================================

// ============================================================
// STARTUP VALIDATION
// ============================================================
// Runs once on load. Warns in the console about any unknown
// strings in RECIPES that are not covered by I, M, or CAT.
// This catches typos in recipe data without requiring a build step.
(function validateRecipes() {
  const knownItems    = new Set(Object.values(I));
  const knownMachines = new Set(Object.values(M));
  const knownCats     = new Set(Object.values(CAT));
  const errors = [];

  for (const [recipeName, r] of Object.entries(RECIPES)) {
    // Validate category
    if (!knownCats.has(r.category)) {
      errors.push(`[${recipeName}] unknown category: "${r.category}"`);
    }
    // Validate ingredient item names
    if (Array.isArray(r.ingredients)) {
      for (const ing of r.ingredients) {
        if (!knownItems.has(ing.item)) {
          errors.push(`[${recipeName}] unknown ingredient: "${ing.item}"`);
        }
      }
    }
    // Validate output item names (only for array-style multi-outputs)
    const outputs = Array.isArray(r.output) ? r.output : [];
    for (const out of outputs) {
      if (out.item && !knownItems.has(out.item)) {
        errors.push(`[${recipeName}] unknown output item: "${out.item}"`);
      }
    }
    // Validate machine names
    for (const machineName of Object.keys(r.machines || {})) {
      if (!knownMachines.has(machineName)) {
        errors.push(`[${recipeName}] unknown machine: "${machineName}"`);
      }
    }
  }

  if (errors.length === 0) {
    console.log('%c✓ RECIPES validation passed — all constants known', 'color:#4caf50;font-weight:bold');
  } else {
    console.warn(`%c✗ RECIPES validation: ${errors.length} problem(s) found`, 'color:#ff9800;font-weight:bold');
    errors.forEach(e => console.warn('  ', e));
  }
})();

// ============================================================
// RECIPE CALCULATOR STATE
// ============================================================
// The primary list of recipes the user has added to the calculator.
// Each entry is an object:
//   {
//     itemName:    string  – canonical display name (e.g. "Steel Beams")
//     recipeName:  string  – actual RECIPES key (may include tier suffix)
//     machineName: string  – currently selected machine
//     goal:        number  – target output per minute
//     wsOverride:  object|null – per-item workstation config override
//   }
let selectedRecipeList = [];

// ── Variant resolution ────────────────────────────────────────
//
// Some items can be produced via different recipe variants that share
// a canonical name (e.g. "Xenoferrite Plates" is actually
// "Xenoferrite Plates (Tier 1/2/3)" in RECIPES).
// variantSettings maps the canonical label to whichever variant the
// user has selected in the settings modal.

// Returns the actual RECIPES key for a canonical item name.
// If the name belongs to a variant group, returns the user's
// preferred variant (or the first variant as default).
function resolveRecipeName(canonicalName) {
  const group = VARIANT_GROUPS.find((g) => g.label === canonicalName);
  if (group) {
    return variantSettings[canonicalName] || group.variants[0];
  }
  return canonicalName;
}

// Returns all variant recipe keys for a canonical name, or a
// single-element array if the name is not in any group.
function getVariantsFor(canonicalName) {
  const group = VARIANT_GROUPS.find((g) => g.label === canonicalName);
  return group ? group.variants : [canonicalName];
}


// Toggles all Robot-category recipes on or off at once.
// Updates the checkboxes in the bot sidebar and the label of the
// "✓ Alle" / "✗ Keine" button.
function toggleRecipeCategoryAll() {
  const entries = Object.entries(RECIPES).filter(([, r]) => r.category === 'Robots');
  const allActive = entries.every(([name]) => {
    const chk = document.getElementById("chk_" + name);
    return chk && chk.checked;
  });
  const newState = !allActive;
  entries.forEach(([name]) => {
    const chk = document.getElementById("chk_" + name);
    if (chk) chk.checked = newState;
    toggleRecipeFromGrid(name, newState);
  });
  const btn = document.getElementById("robotAllBtn_General");
  if (btn) btn.textContent = newState ? "✗ None" : "✓ All";
  // Also update subgroup buttons so they stay in sync
  Object.keys(
    entries.reduce((acc, [name]) => { const sg = getBotSubgroup(name); acc[sg] = 1; return acc; }, {})
  ).forEach(sg => {
    const b = document.getElementById("robotAllBtn_sg_" + sg.replace(/ /g, "_"));
    if (b) b.textContent = newState ? "✗ None" : "✓ All";
  });
}



// ── Bot subcategory detection ─────────────────────────────────────
// Determines which sub-section of the bot sidebar a recipe belongs to,
// based on simple name pattern matching.
// The order of checks matters: more specific patterns come first.
// Complete robot names (exact match) → own top-level group
const COMPLETE_ROBOT_NAMES = new Set([
  "Combat Robot", "Farmer Robot", "Miner Robot",
  "Operator Robot", "Personal Assistant Robot", "Science Robot",
]);

function getBotSubgroup(name) {
  if (COMPLETE_ROBOT_NAMES.has(name)) return "Complete Robots";
  const n = name.toLowerCase();
  if (n.includes("drone")) return "Drones";
  if (n.includes(" bot")) return "Bots";
  if (n.startsWith("combat robot")) return "Combat Robot Parts";
  if (n.startsWith("farmer robot")) return "Farmer Robot Parts";
  if (n.startsWith("miner robot")) return "Miner Robot Parts";
  if (n.startsWith("operator robot")) return "Operator Robot Parts";
  if (n.startsWith("personal assistant robot")) return "Personal Assistant Robot Parts";
  if (n.startsWith("science robot")) return "Science Robot Parts";
  return "Robots (Other)";
}

// Defines the display order of bot subgroups in the sidebar.
// Parts subgroups are no longer top-level — they are rendered inline
// below their parent robot in the "Complete Robots" section.
const BOT_SUBGROUP_ORDER = [
  "Complete Robots",
  "Bots", "Drones",
  "Personal Assistant Robot Parts", "Operator Robot Parts",
  "Miner Robot Parts", "Farmer Robot Parts", "Combat Robot Parts", "Science Robot Parts",
  "Robots (Other)",
];

// Parts subgroups that are rendered inline below their parent robot.
// They are excluded from the top-level subgroup rendering.
const INLINE_PARTS_SUBGROUPS = new Set([
  "Combat Robot Parts", "Farmer Robot Parts", "Miner Robot Parts",
  "Operator Robot Parts", "Personal Assistant Robot Parts", "Science Robot Parts",
]);

// Maps each complete robot to the subgroup key holding its parts.
const ROBOT_TO_PARTS_SUBGROUP = {
  "Combat Robot":            "Combat Robot Parts",
  "Farmer Robot":            "Farmer Robot Parts",
  "Miner Robot":             "Miner Robot Parts",
  "Operator Robot":          "Operator Robot Parts",
  "Personal Assistant Robot":"Personal Assistant Robot Parts",
  "Science Robot":           "Science Robot Parts",
};

// Builds (or rebuilds) the entire bot sidebar list.
// Called once on startup and again whenever recipe selection changes.
// Groups Robot-category recipes by subgroup, renders subgroup headers
// with "✓ All" buttons, and individual bot rows with checkboxes.
// Parts for each complete robot are rendered inline directly below
// that robot rather than in a separate section at the bottom.
function buildRecipeCategoryList() {
  const list = document.getElementById("botList");
  list.innerHTML = "";

  // Collect all Robot-category recipes and group them by subgroup
  const groups = {};
  Object.entries(RECIPES)
    .filter(([, r]) => r.category === "Robots")
    .forEach(([name]) => {
      const sg = getBotSubgroup(name);
      if (!groups[sg]) groups[sg] = [];
      groups[sg].push(name);
    });

  // Top-level rendering skips parts subgroups — they appear inline below each robot
  const orderedKeys = [
    ...BOT_SUBGROUP_ORDER.filter(k => groups[k] && !INLINE_PARTS_SUBGROUPS.has(k)),
    ...Object.keys(groups).filter(k => !BOT_SUBGROUP_ORDER.includes(k) && !INLINE_PARTS_SUBGROUPS.has(k)),
  ];

  const prefixes = ["Combat Robot ", "Farmer Robot ", "Miner Robot ",
    "Operator Robot ", "Personal Assistant Robot ", "Science Robot "];

  // Helper: render a single bot-item row and append it to `list`
  function renderBotItem(name, { iconSize = 28, fontSize = 13, indent = false } = {}) {
    const r    = RECIPES[name];
    const item = document.createElement("div");
    item.className = "bot-item";
    item.id = "botItem_" + name;
    if (indent) {
      item.style.marginLeft = "10px";
      item.style.paddingTop = "4px";
      item.style.paddingBottom = "4px";
    }

    const prefix    = prefixes.find(p => name.startsWith(p));
    const shortName = prefix ? name.slice(prefix.length) : name;

    const eff = botEfficiencyOverrides[name] != null ? botEfficiencyOverrides[name] : (r && r.efficiency);
    const effTag = eff != null
      ? `<span style="font-size:10px;font-family:-apple-system,sans-serif;color:var(--accent3);white-space:nowrap;flex-shrink:0">+${eff}%</span>`
      : "";

    item.innerHTML = `
    <div class="bot-check">
      <input type="checkbox" id="chk_${name}" onchange="toggleRecipeFromGrid('${name}', this.checked)">
    </div>
    ${getIcon(name, iconSize, true)}
    <label for="chk_${name}" style="cursor:pointer;flex:1;display:flex;align-items:center;gap:6px;min-width:0;overflow:hidden">
      <span class="bot-name" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:${fontSize}px">${shortName}</span>
    </label>
    ${effTag}
  `;
    list.appendChild(item);
  }

  orderedKeys.forEach((sg) => {
    const names = groups[sg];

    // ── Subgroup header row ──────────────────────────────────
    const catDiv = document.createElement("div");
    catDiv.className = "bot-category";
    catDiv.style.cssText = "display:flex;align-items:center;justify-content:space-between;margin-top:6px";

    const catSpan = document.createElement("span");
    catSpan.textContent = sg;
    catDiv.appendChild(catSpan);

    // For "Complete Robots", the "✓ All" button toggles robots + all their parts
    const allNamesToToggle = sg === "Complete Robots"
      ? [...names, ...names.flatMap(n => groups[ROBOT_TO_PARTS_SUBGROUP[n]] || [])]
      : [...names];

    const allBtn = document.createElement("button");
    allBtn.id = "robotAllBtn_sg_" + sg.replace(/ /g, "_");
    allBtn.textContent = "✓ All";
    allBtn.title = "Select all / deselect all";
    allBtn.style.cssText =
      "padding:1px 7px;font-size:10px;background:rgba(10,132,255,0.12);border:1px solid rgba(10,132,255,0.25);color:var(--accent);border-radius:5px;cursor:pointer;font-family:-apple-system,sans-serif";
    allBtn.onclick = function () {
      const allChecked = allNamesToToggle.every(n => {
        const c = document.getElementById("chk_" + n); return c && c.checked;
      });
      const newState = !allChecked;
      allNamesToToggle.forEach(n => {
        const c = document.getElementById("chk_" + n);
        if (c) c.checked = newState;
        toggleRecipeFromGrid(n, newState);
      });
      allBtn.textContent = newState ? "✗ None" : "✓ All";
    };
    catDiv.appendChild(allBtn);
    list.appendChild(catDiv);

    // ── Bot item rows ────────────────────────────────────────
    names.sort().forEach((name) => {
      renderBotItem(name);

      // For complete robots, render their parts inline below
      if (sg === "Complete Robots") {
        const partsSg = ROBOT_TO_PARTS_SUBGROUP[name];
        const partsNames = (partsSg && groups[partsSg]) ? groups[partsSg].slice().sort() : [];
        if (partsNames.length) {
          // Subtle "Parts" divider
          const partsLabel = document.createElement("div");
          partsLabel.style.cssText =
            "font-size:9px;color:rgba(255,255,255,0.22);letter-spacing:0.06em;text-transform:uppercase;" +
            "padding:2px 4px 1px 16px;margin-top:1px";
          partsLabel.textContent = "Parts";
          list.appendChild(partsLabel);

          partsNames.forEach(partName => renderBotItem(partName, { iconSize: 22, fontSize: 12, indent: true }));

          // Small spacer between robot groups
          const spacer = document.createElement("div");
          spacer.style.cssText = "height:4px";
          list.appendChild(spacer);
        }
      }
    });
  });
}



// ── Per-recipe settings ──────────────────────────────────────
// These objects are keyed by recipe/item name and store user
// preferences that override the default behaviour.

const variantSettings      = {}; // { canonicalLabel → preferred variant key }
const minerSettings        = {}; // { oreRubbleName → preferred miner machine }
const botEfficiencyOverrides = {}; // { botName → efficiencyValue (%) }
let globalMiningProductivity = 0;  // global % bonus applied to all Crusher recipes
let globalFluidProductivity  = 0;  // global % bonus applied to all Fluid/Chemical recipes

// ── Workstation configuration ────────────────────────────────
// workstationConfigs holds one entry per machine category:
//   { [category]: { tier, robots: [botName, ...], chargedCore: bool } }
// A "disabled" flag on a config entry disables that workstation entirely.
const workstationConfigs = {};

// ── Workstation effect lookup tables ─────────────────────────
//
// APPLIES_TO_MACHINES maps the `applies_to` strings from bot
// workstation_effect definitions to the concrete machine names
// they affect.  Empty arrays = category exists in-game but no
// machine currently in RECIPES is affected.
const APPLIES_TO_MACHINES = {
  "Assemblers":        [M.ASSEMBLER_I, M.ASSEMBLER_II, M.ASSEMBLER_III, M.FLUID_ASSEMBLER_I],
  "Crushers":          [M.CRUSHER_I, M.CRUSHER_II],
  "Smelters":          [M.SMELTER_SMALL, M.ADVANCED_SMELTER, M.LAVA_SMELTER_I, M.LAVA_SMELTER_II, M.BLAST_FURNACE, M.ELECTRIC_ARC_FURNACE],
  "Casting Machines":  [M.CASTING_MACHINE],
  "Chemical Buildings":[M.CHEMICAL_PROCESSOR, M.BARREL_FILLER_I],
  "Greenhouses":       [M.GREENHOUSE],
  "Miners":            [],
  "Pumpjacks":         [],
  "Crystal Refiners":  [],
  "Research Servers":  [],
  "Incinerators":      [],
  "Flare Stacks":      [],
  "Assembly Lines":    [M.ASSEMBLY_LINE],
};

// Reverse lookup: machine name → its APPLIES_TO_MACHINES category.
// Used to find which workstation config applies to a given recipe.
const MACHINE_TO_CATEGORY = {};
Object.entries(APPLIES_TO_MACHINES).forEach(([cat, machines]) => {
  machines.forEach(m => { MACHINE_TO_CATEGORY[m] = cat; });
});

// Computes the total workstation bonus (as a decimal fraction, e.g. 0.20
// for a 20 % bonus) for a specific machine given a wsConfig object.
//
// The bonus is the sum of machine_efficiency + machine_speed from all
// assigned bots whose applies_to category covers this machine,
// then multiplied by 1.33 if a Charged Core is installed.
function calcWsBonusForMachine(machineName, wsConfig) {
  if (!wsConfig || wsConfig.disabled) return 0;
  let eff = 0, speed = 0;
  (wsConfig.robots || []).forEach(botName => {
    if (!botName) return;
    const r = RECIPES[botName];
    if (!r || !r.workstation_effect) return;
    const we = r.workstation_effect;
    // Only apply if the bot's effect targets this machine's category
    if ((we.applies_to || []).some(cat =>
      (APPLIES_TO_MACHINES[cat] || []).includes(machineName)
    )) {
      eff   += we.machine_efficiency || 0;
      speed += we.machine_speed      || 0;
    }
  });
  const coreMult = wsConfig.chargedCore ? 1.33 : 1;
  return (eff + speed) * coreMult / 100; // convert % → decimal fraction
}

// Returns the workstation bonus for a recipe line item.
// Uses the item's own wsOverride config if set, otherwise falls back
// to the global workstationConfigs entry for that machine category.
function getItemWsBonus(item) {
  const config = item.wsOverride !== undefined && item.wsOverride !== null
    ? item.wsOverride
    : workstationConfigs[MACHINE_TO_CATEGORY[item.machineName]];
  return calcWsBonusForMachine(item.machineName, config);
}

// ── Machine classification sets ───────────────────────────────
// Used in calculateRecipes() and buildSankeyGraph() to decide which
// global productivity bonus applies to a given recipe.
const MINING_MACHINES = new Set([M.CRUSHER_I, M.CRUSHER_II]);
const FLUID_MACHINES  = new Set([M.FLUID_ASSEMBLER_I, M.CHEMICAL_PROCESSOR, M.BARREL_FILLER_I, M.GREENHOUSE]);

// ── Machine families (for grouped settings UI) ────────────────
// Each family groups machines that share the same upgrade path so
// the settings panel can show them together in a sensible order.
const MACHINE_FAMILIES = [
  { label: "Crusher",     machines: ["Crusher I", "Crusher II"] },
  { label: "Smelter",     machines: ["Smelter (Small)", "Advanced Smelter"] },
  { label: "Lava-Smelter",machines: ["Lava-Smelter I", "Lava-Smelter II"] },
  { label: "Assembler",   machines: ["Assembler I", "Assembler II", "Assembler III"] },
  {
    label: "Conveyor Belt",
    machines: [
      "Conveyor I",
      "Conveyor II",
      "Conveyor III",
      "Conveyor IV",
    ],
  },
];

// ── Miner groups ──────────────────────────────────────────────
// Associates each minable ore rubble type with the list of machines
// that can extract it.  The user can pick their preferred miner in
// the settings panel; the chosen machine appears in the raw-materials
// table with a count estimate.
const MINER_GROUPS = [
  { label: "Xenoferrite Ore Rubble", miners: ["Drone Miner I", "Drone Miner II", "Ore Vein Miner"] },
  { label: "Ignium Ore Rubble",      miners: ["Drone Miner I", "Drone Miner II", "Ore Vein Miner"] },
  { label: "Technum Ore Rubble",     miners: ["Drone Miner I", "Drone Miner II", "Ore Vein Miner"] },
  { label: "Telluxite Ore Rubble",   miners: ["Ore Vein Miner"] },
];

// ── Recipe variant groups ─────────────────────────────────────
// Items that have multiple recipe tiers are grouped here.
// The `label` is the canonical display name shown everywhere in the UI;
// `variants` are the actual RECIPES keys the user can choose between.
const VARIANT_GROUPS = [
  {
    label: "Xenoferrite Plates",
    variants: [
      "Xenoferrite Plates (Tier 1)",
      "Xenoferrite Plates (Tier 2)",
      "Xenoferrite Plates (Tier 3)",
    ],
  },
  {
    label: "Technum Rods",
    variants: [
      "Technum Rods (Tier 1)",
      "Technum Rods (Tier 2)",
      "Technum Rods (Tier 3)",
    ],
  },
  {
    label: "Steel Beams",
    variants: ["Steel Beams (Tier 1)", "Steel Beams (Tier 2)"],
  },
  {
    label: "Technum Ore",
    variants: ["Technum Ore", "Technum Ore (Alternative)"],
  },
  {
    label: "Xenoferrite Ore",
    variants: ["Xenoferrite Ore", "Xenoferrite Ore (Alternative)"],
  },
];


// ── Settings persistence (localStorage) ──────────────────────
// saveSettings()  – serialises all user-adjustable settings into one JSON
//                   blob stored under the key 'fc_settings'.
// loadSettings()  – restores them on startup; silently ignores missing or
//                   malformed data so a fresh install works without errors.

// Debounce handle — rapid UI interactions (typing in a number input)
// collapse into a single write after 250 ms of inactivity.
let _savePending = null;

function saveSettings() {
  clearTimeout(_savePending);
  _savePending = setTimeout(_flushSaveSettings, 250);
}

function _flushSaveSettings() {
  _savePending = null;
  const famDefaults = {};
  MACHINE_FAMILIES.forEach(f => { if (f.defaultChoice) famDefaults[f.label] = f.defaultChoice; });
  try {
    localStorage.setItem('fc_settings', JSON.stringify({
      variantSettings,
      minerSettings,
      botEfficiencyOverrides,
      globalMiningProductivity,
      globalFluidProductivity,
      workstationConfigs,
      machineFamilyDefaults: famDefaults,
      // Save recipe list without UI-only state (wsExpanded)
      selectedRecipeList: selectedRecipeList.map(item => ({
        itemName:    item.itemName,
        recipeName:  item.recipeName,
        machineName: item.machineName,
        goal:        item.goal,
        wsOverride:  item.wsOverride,
      })),
    }));
  } catch (e) {
    console.warn('foundry-calc: could not save settings:', e);
  }
}

function loadSettings() {
  try {
    const raw = localStorage.getItem('fc_settings');
    if (!raw) return;
    const s = JSON.parse(raw);
    if (s.variantSettings)    Object.assign(variantSettings,    s.variantSettings);
    if (s.minerSettings)      Object.assign(minerSettings,      s.minerSettings);
    if (s.workstationConfigs) Object.assign(workstationConfigs, s.workstationConfigs);

    // Clamp productivity values to the valid UI range [0, 100]
    if (typeof s.globalMiningProductivity === 'number')
      globalMiningProductivity = Math.max(0, Math.min(100, s.globalMiningProductivity));
    if (typeof s.globalFluidProductivity === 'number')
      globalFluidProductivity  = Math.max(0, Math.min(100, s.globalFluidProductivity));

    // Only keep bot efficiency overrides that are finite numbers in [0, 200]
    if (s.botEfficiencyOverrides) {
      Object.entries(s.botEfficiencyOverrides).forEach(([k, v]) => {
        if (typeof v === 'number' && isFinite(v) && v >= 0 && v <= 200)
          botEfficiencyOverrides[k] = v;
      });
    }

    if (s.machineFamilyDefaults) {
      MACHINE_FAMILIES.forEach(f => {
        const saved = s.machineFamilyDefaults[f.label];
        if (saved && f.machines.includes(saved)) f.defaultChoice = saved;
      });
    }
    // Restore recipe list; skip any entry whose recipe no longer exists.
    // Also validate the machine name — fall back to the recipe's first machine
    // if the saved name is no longer valid (e.g. after a game-data update).
    if (Array.isArray(s.selectedRecipeList)) {
      selectedRecipeList = s.selectedRecipeList
        .filter(item => item.recipeName && RECIPES[item.recipeName])
        .map(item => {
          const r = RECIPES[item.recipeName];
          const machineName = (item.machineName && r.machines[item.machineName])
            ? item.machineName
            : Object.keys(r.machines)[0];
          const goal = (typeof item.goal === 'number' && isFinite(item.goal) && item.goal > 0)
            ? Math.min(item.goal, 999999)
            : 60;
          return {
            itemName:   item.itemName || item.recipeName,
            recipeName: item.recipeName,
            machineName,
            goal,
            wsOverride: item.wsOverride || null,
            wsExpanded: false,
          };
        });
    }
  } catch (e) {
    console.warn('foundry-calc: could not load settings:', e);
  }
}

// Restore settings immediately – runs synchronously before DOMContentLoaded,
// so UI modules already see the correct values when they first render.
loadSettings();

// ── Modal animation helpers ─────────────────────────────────
