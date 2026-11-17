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
  const group = VARIANT_GROUPS.find((g) => g.label === canonicalName)
             || BURNABLE_GROUPS.find((g) => g.label === canonicalName);
  if (group) {
    return variantSettings[canonicalName] || group.variants[0];
  }
  if (RECIPES[canonicalName]) return canonicalName;
  return _producerOf(canonicalName) || canonicalName;
}

// Recipes keyed by a name other than their product ("Olumite Refining: Olumite
// Gas" makes Olumite Gas): product → recipe, from the primary output.
// ponytail: first recipe wins if several make the same product without a
// variant group; add a variant group when a choice is needed.
let _producerByOutput = null;
function _producerOf(item) {
  if (!_producerByOutput) {
    _producerByOutput = {};
    Object.entries(RECIPES).forEach(([key, r]) => {
      const out = Array.isArray(r.output) ? r.output[0]?.item : null;
      if (out && out !== key && !_producerByOutput[out]) _producerByOutput[out] = key;
    });
  }
  return _producerByOutput[item];
}

// Returns all variant recipe keys for a canonical name, or a
// single-element array if the name is not in any group.
function getVariantsFor(canonicalName) {
  const group = VARIANT_GROUPS.find((g) => g.label === canonicalName)
             || BURNABLE_GROUPS.find((g) => g.label === canonicalName);
  return group ? group.variants : [canonicalName];
}


// Toggles all Robot-category recipes on or off at once.
// Updates the checkboxes in the bot sidebar and the label of the
// "✓ Alle" / "✗ Keine" button.
function toggleRecipeCategoryAll() {
  // Only act on entries that have a visible checkbox (parts are display-only)
  const entries = Object.entries(RECIPES)
    .filter(([, r]) => r.category === 'Robots')
    .filter(([name]) => !!document.getElementById("chk_" + name));
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
// Derived entirely from RECIPE_SUBGROUPS["Robots"] — no hardcoded names.

// Builds a map: recipe name → subgroup label, and a list of non-Bots labels
// (robot types), in the order they appear in RECIPE_SUBGROUPS.
let _robotSubgroupMap  = null;  // { "Assault Robot Arm" → "Assault Robot", ... }
let _robotTypeLabels   = null;  // ["Assault Robot", "Hazard Robot", ...]

function _ensureRobotData() {
  if (_robotSubgroupMap) return;
  _robotSubgroupMap = {};
  _robotTypeLabels  = [];
  const robotGroups = (typeof RECIPE_SUBGROUPS !== "undefined" && RECIPE_SUBGROUPS["Robots"]) || [];
  for (const group of robotGroups) {
    const label = group.label;
    if (label !== "Bots") _robotTypeLabels.push(label);
    // Map the label itself (complete robot) and all listed parts
    _robotSubgroupMap[label] = label;
    for (const row of (group.rows || [])) {
      for (const recipeName of row) {
        _robotSubgroupMap[recipeName] = label;
      }
    }
  }
}

function getBotSubgroup(name) {
  _ensureRobotData();
  return _robotSubgroupMap[name] || "Robots (Other)";
}

function _getBotSubgroupOrder() {
  _ensureRobotData();
  // "Bots" first, then robot types in game-data order, then catch-all
  return ["Bots", "Drones", ..._robotTypeLabels, "Robots (Other)"];
}

// Returns the robot-type prefix string for display shortening
// e.g. "Assault Robot Arm" → "Assault Robot ", "Miner Robot Arm" → "Miner Robot "
function _getRobotPrefix(name) {
  _ensureRobotData();
  // Try known subgroup labels first
  for (const rt of _robotTypeLabels) {
    if (name.startsWith(rt + " ")) return rt + " ";
  }
  // Fallback: strip known part-type suffix to derive the robot prefix
  for (const suf of [" Arm", " Leg", " Head", " Torso"]) {
    if (name.endsWith(suf)) return name.slice(0, -suf.length) + " ";
  }
  return null;
}

// Inject synthetic "complete robot" recipes for each robot type found in
// RECIPE_SUBGROUPS["Robots"]. In the current game, complete robots are assembled
// on the Assembly Line — no crafting recipe exists. We synthesize one so the
// calc engine can expand "Assault Robot" → its 4 parts.
let _syntheticRobotsInjected = false;
function _injectSyntheticRobotRecipes() {
  if (_syntheticRobotsInjected) return;
  _syntheticRobotsInjected = true;
  _ensureRobotData();  // also initialises _robotSubgroupMap

  const robotGroups = (typeof RECIPE_SUBGROUPS !== "undefined" && RECIPE_SUBGROUPS["Robots"]) || [];
  const alParts = (typeof ASSEMBLY_LINE_ROBOT_PARTS !== "undefined") ? ASSEMBLY_LINE_ROBOT_PARTS : {};

  const _partTypeSuffixes = [" Torso", " Head", " Arm", " Leg"];

  for (const group of robotGroups) {
    const label = group.label;
    if (label === "Bots") continue;
    const partNames = (group.rows || []).flat();
    if (!partNames.length) continue;

    // Derive the actual robot name from the parts, because RECIPE_SUBGROUPS labels
    // can differ from the robot's own name (e.g. label "Mining Robot" but parts
    // are "Miner Robot Arm" → actual robot name = "Miner Robot").
    let robotName = label;
    for (const pn of partNames) {
      for (const suf of _partTypeSuffixes) {
        if (pn.endsWith(suf)) { robotName = pn.slice(0, -suf.length); break; }
      }
      if (robotName !== label) break;
    }

    if (RECIPES[robotName]) continue;             // already exists (older game version)

    // Register the derived robot name in the subgroup map (group = label)
    _robotSubgroupMap[robotName] = label;

    // Build ingredients: look up ASSEMBLY_LINE_ROBOT_PARTS by derived robot name.
    const partCounts = alParts[robotName] || {};  // { "Arm": 2, "Leg": 2, "Head": 1, "Torso": 1 }
    const ingredients = partNames.map(partRecipeName => {
      let suffix = partRecipeName;
      for (const suf of _partTypeSuffixes) {
        if (partRecipeName.endsWith(suf)) { suffix = suf.trim(); break; }
      }
      const amount = partCounts[suffix] ?? 1;
      return { item: partRecipeName, amount };
    });

    const alCycleTime    = (typeof ASSEMBLY_LINE_COMPOSITION !== "undefined" && ASSEMBLY_LINE_COMPOSITION.cycle_time) ? ASSEMBLY_LINE_COMPOSITION.cycle_time : 1.875;
    const alMachineName  = (typeof M !== "undefined") ? M.ASSEMBLY_LINE : "Assembly Line";
    const paintName      = (typeof I !== "undefined") ? I.PAINT : "Paint";

    RECIPES[robotName] = {
      category:    "Robots",
      ingredients: [...ingredients, { item: paintName, amount: 100 }],
      output:      { amount: 1 },
      machines:    { [alMachineName]: { cycleTime: alCycleTime } },
      _synthetic:  true,
    };
  }
}

// Builds (or rebuilds) the entire bot sidebar list.
function buildRecipeCategoryList() {
  _injectSyntheticRobotRecipes();

  const list = document.getElementById("botList");
  list.innerHTML = "";

  // Group all Robot-category recipes by robot type.
  // Parts (e.g. "Assault Robot Arm") go into the same group as the synthetic
  // complete robot ("Assault Robot"), but are rendered read-only below it.
  const groups = {};
  Object.entries(RECIPES)
    .filter(([, r]) => r.category === "Robots")
    .forEach(([name]) => {
      const sg = getBotSubgroup(name);
      if (!groups[sg]) groups[sg] = [];
      groups[sg].push(name);
    });

  const subgroupOrder = _getBotSubgroupOrder();
  const orderedKeys = [
    ...subgroupOrder.filter(k => groups[k]),
    ...Object.keys(groups).filter(k => !subgroupOrder.includes(k)),
  ];

  // Render a selectable complete-robot or bot/drone row (checkbox).
  function renderBotItem(name) {
    const r    = RECIPES[name];
    const item = document.createElement("div");
    item.className = "bot-item";
    item.id = "botItem_" + name;

    const prefix    = _getRobotPrefix(name);
    const shortName = prefix ? name.slice(prefix.length) : name;

    const eff = botEfficiencyOverrides[name] != null ? botEfficiencyOverrides[name] : (r && r.efficiency);
    const effTag = eff != null
      ? `<span style="font-size:10px;font-family:-apple-system,sans-serif;color:var(--accent3);white-space:nowrap;flex-shrink:0">+${eff}%</span>`
      : "";

    item.innerHTML = `
    <div class="bot-check">
      <input type="checkbox" id="chk_${name}" onchange="toggleRecipeFromGrid('${name}', this.checked)">
    </div>
    ${getIcon(name, 28, true)}
    <label for="chk_${name}" style="cursor:pointer;flex:1;display:flex;align-items:center;gap:6px;min-width:0;overflow:hidden">
      <span class="bot-name" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:13px">${shortName}</span>
    </label>
    ${effTag}
  `;
    list.appendChild(item);
  }

  // Render a read-only part row below the complete robot (no checkbox).
  function renderPartItem(partName, qty) {
    const item = document.createElement("div");
    item.className = "bot-item";
    item.style.cssText = "margin-left:10px;padding:4px 8px;cursor:default;pointer-events:none;opacity:0.72";

    const prefix    = _getRobotPrefix(partName);
    const shortName = prefix ? partName.slice(prefix.length) : partName;

    item.innerHTML = `
    ${getIcon(partName, 22, true)}
    <span style="flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:12px;color:var(--color-text-secondary)">${shortName}</span>
    <span style="font-size:11px;font-family:'Rajdhani',sans-serif;font-weight:700;color:var(--color-text-disabled);white-space:nowrap;flex-shrink:0;min-width:18px;text-align:right">${qty}×</span>
  `;
    list.appendChild(item);
  }

  orderedKeys.forEach((sg) => {
    const names = groups[sg];

    // Split: the complete robot (synthetic recipe) vs parts (real recipes)
    const completeRobot = names.find(n => RECIPES[n] && RECIPES[n]._synthetic);
    const parts = names.filter(n => n !== completeRobot).sort();

    // Only names with checkboxes count for "✓ All" toggle
    const toggleNames = completeRobot ? [completeRobot] : names.filter(n => !parts.includes(n));

    const catDiv = document.createElement("div");
    catDiv.className = "bot-category";
    catDiv.style.cssText = "display:flex;align-items:center;justify-content:space-between;margin-top:6px";

    const catSpan = document.createElement("span");
    catSpan.textContent = sg;
    catDiv.appendChild(catSpan);

    const allBtn = document.createElement("button");
    allBtn.id = "robotAllBtn_sg_" + sg.replace(/ /g, "_");
    allBtn.textContent = "✓ All";
    allBtn.title = "Select all / deselect all";
    allBtn.style.cssText =
      "padding:1px 7px;font-size:10px;background:var(--color-accent-active-bg);border:1px solid var(--color-border-focus);color:var(--accent);border-radius:5px;cursor:pointer;font-family:-apple-system,sans-serif";
    allBtn.onclick = function () {
      const allChecked = toggleNames.every(n => {
        const c = document.getElementById("chk_" + n); return c && c.checked;
      });
      const newState = !allChecked;
      toggleNames.forEach(n => {
        const c = document.getElementById("chk_" + n);
        if (c) c.checked = newState;
        toggleRecipeFromGrid(n, newState);
      });
      allBtn.textContent = newState ? "✗ None" : "✓ All";
    };
    catDiv.appendChild(allBtn);
    list.appendChild(catDiv);

    if (completeRobot) {
      // Show complete robot (selectable) then parts (read-only) below
      renderBotItem(completeRobot);
      if (parts.length) {
        // Build qty map from the synthetic recipe's ingredients
        const qtyMap = {};
        (RECIPES[completeRobot]?.ingredients || []).forEach(ing => {
          qtyMap[ing.item] = ing.amount;
        });
        const partsLabel = document.createElement("div");
        partsLabel.style.cssText =
          "font-size:9px;color:var(--color-text-disabled);letter-spacing:0.06em;text-transform:uppercase;" +
          "padding:2px 4px 1px 16px;margin-top:1px";
        partsLabel.textContent = "Parts";
        list.appendChild(partsLabel);
        parts.forEach(p => renderPartItem(p, qtyMap[p] ?? 1));
        const spacer = document.createElement("div");
        spacer.style.cssText = "height:4px";
        list.appendChild(spacer);
      }
    } else {
      // No complete robot (Bots, Drones, Robots (Other)) — show all as selectable
      names.sort().forEach(renderBotItem);
    }
  });
}



// ── Per-recipe settings ──────────────────────────────────────
// These objects are keyed by recipe/item name and store user
// preferences that override the default behaviour.

const variantSettings      = {}; // { canonicalLabel → preferred variant key }
const minerSettings        = {}; // { oreRubbleName → preferred miner machine }
const botEfficiencyOverrides = {}; // { botName → efficiencyValue (%) }
// Endless research levels (in-game "Mining Efficiency (11)" → 11).
// Mining Efficiency does NOT raise output per minute (free ore, vein lasts
// longer) — it only cuts fracking liquid per ore on depleted veins.
// Pumpjack Efficiency raises pumpjack output. Bonus per level from game data.
let miningEfficiencyLevel   = 0;
let pumpjackEfficiencyLevel = 0;
let depletedVeins           = 1; // depleted veins being mined → ≥ 1 Fracking Tower each
const researchBonus = (name) =>
  (typeof RESEARCH_BONUSES !== 'undefined' && RESEARCH_BONUSES.perLevel[name]) || 0;
const modularSettings      = {}; // { machineName → number of speed modules (Tower/Vent) }
let adjacencyBonus         = true; // same-type buildings assumed side by side in one row
let veinsDepleted          = false; // veins mined to the core → Ore Vein Miners need fracking liquid

// ── Modular buildings (Blast Furnace, Hot Air Stove, Air Intake …) ──
// Each optional speed module (above `ignored`) adds `speedPerModule`.
// Default = fully built, the usual end-game setup.
const _modular = (machine) =>
  (typeof MODULAR_BUILDINGS !== 'undefined' && MODULAR_BUILDINGS[machine]) || null;

function modularModules(machine) {
  const mb = _modular(machine);
  if (!mb) return 0;
  const n = modularSettings[machine];
  // default: fully built — except where game data says otherwise (power cores: 0)
  return typeof n === 'number' ? Math.max(mb.min, Math.min(mb.max, n)) : (mb.default ?? mb.max);
}

function modularSpeed(machine) {
  const mb = _modular(machine);
  return mb ? 1 + (modularModules(machine) - mb.ignored) * mb.speedPerModule : 1;
}

// Speed is a throughput multiplier, not productivity: inputs scale with outputs.
// So it goes into the effective cycleTime of every recipe on that machine —
// every reader of `.cycleTime` (tables, chain, Sankey, sidebar) picks it up.
// The game-data value is kept in `baseCycleTime`; call again after a change.
function _applyModularSpeeds() {
  Object.values(RECIPES).forEach(r => {
    Object.entries(r.machines || {}).forEach(([m, md]) => {
      if (!_modular(m)) return;
      if (md.baseCycleTime == null) md.baseCycleTime = md.cycleTime;
      md.cycleTime = md.baseCycleTime / modularSpeed(m);
    });
  });
}

// ── Calculation depth mode ────────────────────────────────────
// 0 = Direct   – show only the immediate ingredients of selected recipes
// 1 = Intermediate – resolve until hitting INTERMEDIATE_ITEMS, stop there
// 2 = Full     – resolve all the way down to raw/minable materials
let calcDepthMode = 1;

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
// Derived from the recipes (was a hand-written list that missed Mineral Rocks
// and listed Telluxite with one miner only): every raw item (no ingredients)
// with 2+ extraction machines. Slowest first → the default (miners[0]) stays
// the basic Drone Miner I.
const MINER_GROUPS = Object.entries(RECIPES)
  .filter(([, r]) => !(r.ingredients || []).length)
  .map(([label, r]) => ({
    label,
    miners: Object.keys(r.machines || {})
      .filter(m => m !== 'Character')
      .sort((a, b) => r.machines[b].cycleTime - r.machines[a].cycleTime),
  }))
  .filter(g => g.miners.length > 1)
  .sort((a, b) => a.label.localeCompare(b.label));

// Extraction machine for a raw item: saved user choice → settings-UI default
// (first entry in MINER_GROUPS) → first non-Character machine of the recipe.
// Calculation, Sankey and the settings panel must all agree on this —
// otherwise the panel highlights "Drone Miner I" while the math uses
// whatever machine happens to be listed first in the recipe.
function preferredMinerFor(itemName, recipe) {
  const available = Object.keys(recipe.machines || {}).filter(n => n !== 'Character');
  const group = MINER_GROUPS.find(g => g.label === itemName);
  return [minerSettings[itemName], ...(group ? group.miners : [])]
    .find(m => m && available.includes(m)) || available[0] || null;
}

// ── Recipe variant groups ─────────────────────────────────────
// Items that have multiple recipe tiers are grouped here.
// The `label` is the canonical display name shown everywhere in the UI;
// `variants` are the actual RECIPES keys the user can choose between.
// ── Burnable item / fuel variant groups ───────────────────────
// Items that can be produced with different fuel choices.
// Uses the same variantSettings dict as VARIANT_GROUPS.
const BURNABLE_GROUPS = [
  {
    label: "Steam",
    variants: [
      "Steam",
      "Steam (Portable Fuel)",
      "Steam (Jetpack Fuel)",
      "Steam (Coked Ignium)",
      "Steam (Ignium Fuel Rod)",
    ],
  },
];

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
      gameVersion: GAME_VERSION_ID,
      variantSettings,
      minerSettings,
      botEfficiencyOverrides,
      miningEfficiencyLevel,
      pumpjackEfficiencyLevel,
      depletedVeins,
      calcDepthMode,
      modularSettings,
      adjacencyBonus,
      veinsDepleted,
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
    // Old %-based keys (globalMining/FluidProductivity) had wrong semantics → ignored
    const lvl = (v, min = 0) => (typeof v === 'number' && isFinite(v)) ? Math.max(min, Math.floor(v)) : null;
    miningEfficiencyLevel   = lvl(s.miningEfficiencyLevel)   ?? miningEfficiencyLevel;
    pumpjackEfficiencyLevel = lvl(s.pumpjackEfficiencyLevel) ?? pumpjackEfficiencyLevel;
    depletedVeins           = lvl(s.depletedVeins, 1)        ?? depletedVeins;
    if (s.modularSettings) Object.entries(s.modularSettings).forEach(([m, n]) => {
      if (typeof n === 'number' && isFinite(n)) modularSettings[m] = n; // clamped in modularModules()
    });
    if (typeof s.adjacencyBonus === 'boolean') adjacencyBonus = s.adjacencyBonus;
    if (typeof s.veinsDepleted === 'boolean') veinsDepleted = s.veinsDepleted;
    if (typeof s.calcDepthMode === 'number' && [0, 1, 2, 3].includes(s.calcDepthMode))
      calcDepthMode = s.calcDepthMode;

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
    // Wenn die gespeicherte Version nicht zur geladenen passt, Rezeptauswahl leeren
    if (s.gameVersion !== GAME_VERSION_ID) {
      s.selectedRecipeList = [];
    }

    if (Array.isArray(s.selectedRecipeList)) {
      selectedRecipeList = s.selectedRecipeList
        .filter(item => item.recipeName && RECIPES[item.recipeName])
        .map(item => {
          const r = RECIPES[item.recipeName];
          const machineName = (item.machineName && r.machines[item.machineName])
            ? item.machineName
            : (Object.keys(r.machines).find(m => m !== 'Character') || Object.keys(r.machines)[0]);
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
_applyModularSpeeds();

// ── Modal animation helpers ─────────────────────────────────
