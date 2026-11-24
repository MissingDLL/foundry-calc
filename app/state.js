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
    const choice = variantSettings[canonicalName];
    return choice && RECIPES[choice] ? choice : group.variants[0]; // saved choice may not exist in this data version
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
  _allItemNames = null; // robots become items
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
      // Paint per robot from the game data (older data versions: 100 L)
      ingredients: [...ingredients, typeof ASSEMBLY_LINE_PAINT !== "undefined" && ASSEMBLY_LINE_PAINT[robotName]
        ? { item: ASSEMBLY_LINE_PAINT[robotName].item, amount: ASSEMBLY_LINE_PAINT[robotName].litres }
        : { item: paintName, amount: 100 }],
      output:      { amount: 1 },
      machines:    { [alMachineName]: { cycleTime: alCycleTime } },
      _synthetic:  true,
    };
  }
  _applyWorkstationEffects(); // complete robots exist only from here on
}

// Attach the robots' workstation bonuses (game data WORKSTATION_EFFECTS) to
// their recipes, where all workstation code reads them (r.workstation_effect).
function _applyWorkstationEffects() {
  if (typeof WORKSTATION_EFFECTS === 'undefined') return;
  Object.entries(WORKSTATION_EFFECTS).forEach(([name, we]) => {
    if (RECIPES[name]) RECIPES[name].workstation_effect = { ...we, power_consumption_unit: 'kW' };
  });
}
_applyWorkstationEffects();

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
// R&D Lab "Product Weight" per product (%, in-game e.g. Combat Drone 50 % → 90 kg
// becomes 45 kg). Only the shipping weight uses it.
const botWeightReductions = {}; // { productName → weight reduction (%) }
// Endless research levels (in-game "Mining Efficiency (11)" → 11).
// Mining Efficiency does NOT raise output per minute (free ore, vein lasts
// longer) — it only cuts fracking liquid per ore on depleted veins.
// Pumpjack Efficiency raises pumpjack output. Bonus per level from game data.
let miningEfficiencyLevel   = 0;
let pumpjackEfficiencyLevel = 0;
let depletedVeins           = 1; // depleted veins being mined → ≥ 1 Fracking Tower each
// Planet <-> space station shipping. The flight time (lift-off + landing per
// trip) is not in the game data; 20-26 s measured in-game (forum, 2 Jun 2025),
// 26 s = building on the surface (conservative default).
let shippingShip      = null; // ship name; null = biggest cargo ship
let shippingFlightSec = 26;
// Materials already produced in the existing factory (item → per min). The
// chain uses them after byproducts; only the missing rest is calculated.
let stockItems = {};
// Deluxe Edition content (game data entitlementIdentifier: Marble, office decor)
// is hidden unless owned.
let ownsDeluxe = false;
// Tool shown as source of excavated items (Dirt, Biomass, seeds …); null = game data default
let excavationTool = null;
// "Calculate power": the chain's own power plant (generator + fuel) is calculated too
let powerPlan = { on: false, gen: null, fuel: null };
// "Build cost (one-time)": Construction Material of the modular buildings + its raw materials
let buildCostOn = false;
// Global workstations (per machine group) on/off for the whole chain; a line's Custom WS stays
let wsGlobalOn = true;
// Custom WS of recipes deeper in the chain (recipe name → WS config); set by
// Optimize. Selected lines keep theirs in line.wsOverride.
let wsRecipeConfigs = {};
// Last whole-chain Optimize: { goal, at } (shown in the sidebar, removable)
let wsOptimized = null;
function sanitizeWsConfigs(o) {
  const out = {};
  Object.entries(o && typeof o === 'object' ? o : {}).forEach(([rn, c]) => {
    if (!RECIPES[rn] || !c || typeof c !== 'object') return;
    out[rn] = { tier: [1, 2, 3].includes(c.tier) ? c.tier : 1,
                robots: (Array.isArray(c.robots) ? c.robots : []).slice(0, 3).map(b => typeof b === 'string' && (WORKSTATION_EFFECTS[b] || RECIPES[b]) ? b : null), // bots: game WS data (robot recipes are added later)
                chargedCore: !!c.chargedCore, ...(c.disabled ? { disabled: true } : {}) };
  });
  return out;
}
// Build material: 'once' = total only; 'rate' = produced at rates[item] /min as chain lines
let buildPlan = { mode: 'once', rates: {} };
function sanitizeBuildPlan(b) {
  const rates = {};
  Object.entries(b?.rates || {}).forEach(([k, v]) => { if (typeof v === 'number' && isFinite(v) && v >= 0) rates[k] = Math.min(v, 999999); });
  return { mode: b?.mode === 'rate' ? 'rate' : 'once', rates };
}
// Chosen intake per raw fluid (Water: Liquid Intake on pipes or Liquid Intake
// (Pipeline) 180,000 L/min); null = game data default (the basic intake).
const fluidSourceChoice = {};
function fluidSourceFor(item) {
  const src = typeof FLUID_SOURCE_MACHINES !== 'undefined' ? FLUID_SOURCE_MACHINES[item] : null;
  if (!src) return null;
  return (src.alternatives || []).find(a => a.machine === fluidSourceChoice[item]) || src;
}
const excavationSource = () => (typeof EXCAVATION === 'undefined' ? null
  : (EXCAVATION.tools.includes(excavationTool) ? excavationTool : EXCAVATION.source));
const recipeAvailable = (r) => !r?.dlc || ownsDeluxe;

// Every item name in the game data (ingredients + outputs), sorted.
let _allItemNames = null;
function allItemNames() {
  if (!_allItemNames) {
    const s = new Set();
    Object.entries(RECIPES).forEach(([key, r]) => {
      (r.ingredients || []).forEach(i => s.add(i.item));
      if (Array.isArray(r.output)) r.output.forEach(o => s.add(o.item));
      else s.add(key);
    });
    _allItemNames = [...s].sort();
  }
  return _allItemNames;
}

// Stock from storage / imported plans / share links: known items, amount > 0
// (item names end up in innerHTML, so unknown keys are dropped).
function sanitizeStock(raw) {
  const out = {};
  if (!raw || typeof raw !== 'object') return out;
  const known = new Set(allItemNames());
  Object.entries(raw).forEach(([item, v]) => {
    if (known.has(item) && typeof v === 'number' && isFinite(v) && v > 0) out[item] = v;
  });
  return out;
}
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
// Game data (WORKSTATION_CATEGORIES) wins; the hand-written list below is
// only the fallback for old data versions without it.
const APPLIES_TO_MACHINES = (typeof WORKSTATION_CATEGORIES !== 'undefined') ? { ...WORKSTATION_CATEGORIES } : {
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
// A machine can be in several groups (Xeno-Scrap-Extractor: Extractors and
// Miners). Its global WS: the most specific group that has one set up.
const MACHINE_TO_CATEGORIES = {};
Object.entries(APPLIES_TO_MACHINES).forEach(([cat, machines]) => machines.forEach(m => (MACHINE_TO_CATEGORIES[m] ||= []).push(cat)));
Object.values(MACHINE_TO_CATEGORIES).forEach(l => l.sort((a, b) => APPLIES_TO_MACHINES[a].length - APPLIES_TO_MACHINES[b].length));
function globalWsCategory(machine) {
  const l = MACHINE_TO_CATEGORIES[machine] || [];
  return l.find(c => workstationConfigs[c]) || l[0];
}

// Does a bot's workstation effect reach this machine? A matching applies_to
// group is required and no exempt group may match (game: excludedTags).
function wsBotFits(we, machineName) {
  const hit = cats => (cats || []).some(c => (APPLIES_TO_MACHINES[c] || []).includes(machineName));
  return hit(we.applies_to) && !hit(we.exempt);
}

// Computes the total workstation bonus (as a decimal fraction, e.g. 0.20
// for a 20 % bonus) for a specific machine given a wsConfig object.
//
// The bonus is the sum of machine_efficiency + machine_speed from all
// assigned bots whose applies_to category covers this machine,
// then multiplied by 1.33 if a Charged Core is installed.
// Workstation effect split by kind (fractions), verified in-game:
//   speed  — machine runs faster: input AND output scale (120→264 / 40→88 at +120 %)
//   eff    — free extra output from the same input (productivity)
//   power  — extra power consumption of the machine (+20 % per Screen Bot)
// A charged Xeno Power Core multiplies all three by 4/3 (+33.33 %).
// Cache config → machine → effect, only while Optimize runs (configs are
// replaced, never mutated, then). Outside of it configs are edited in place.
let _wsEffCache = null;
function calcWsEffectForMachine(machineName, wsConfig) {
  if (!_wsEffCache || !wsConfig) return _calcWsEffect(machineName, wsConfig);
  let m = _wsEffCache.get(wsConfig);
  if (!m) _wsEffCache.set(wsConfig, m = new Map());
  let e = m.get(machineName);
  if (!e) m.set(machineName, e = _calcWsEffect(machineName, wsConfig));
  return e;
}
function _calcWsEffect(machineName, wsConfig) {
  const none = { speed: 0, eff: 0, power: 0 };
  if (!wsConfig || wsConfig.disabled) return none;
  let eff = 0, speed = 0, power = 0;
  (wsConfig.robots || []).forEach(botName => {
    if (!botName) return;
    const r = RECIPES[botName];
    if (!r || !r.workstation_effect) return;
    const we = r.workstation_effect;
    if (wsBotFits(we, machineName)) {
      eff   += we.machine_efficiency || 0;
      speed += we.machine_speed      || 0;
      power += we.power_consumption  || 0;
    }
  });
  const k = (wsConfig.chargedCore ? 4 / 3 : 1) / 100; // % → fraction
  return { speed: speed * k, eff: eff * k, power: power * k };
}

// Total bonus (speed + efficiency) as one number — for sorting / "any bonus?".
function calcWsBonusForMachine(machineName, wsConfig) {
  const e = calcWsEffectForMachine(machineName, wsConfig);
  return e.speed + e.eff;
}

// Config that applies to a line or chain machine: the line's own setting
// (Custom / No WS) only for that line; everything else the global WS of its
// machine group, unless global workstations are switched off.
// { useGlobal: true } = the line picked Global WS explicitly: kept while global WS is off.
function getItemWsConfig(item) {
  if (item.wsOverride && !item.wsOverride.useGlobal) return item.wsOverride;
  const own = !item.wsOverride && wsRecipeConfigs[item.recipeName || item.itemName];
  if (own) return own;
  return wsGlobalOn || item.wsOverride?.useGlobal ? workstationConfigs[globalWsCategory(item.machineName)] : null;
}
function getItemWsEffect(item) { return calcWsEffectForMachine(item.machineName, getItemWsConfig(item)); }
function getItemWsBonus(item)  { const e = getItemWsEffect(item); return e.speed + e.eff; }

// Display: speed (blue) and efficiency (green) apart — they act differently.
function wsEffectHtml(e) {
  const pct = x => Math.round(x * 1000) / 10;
  return [e.speed && `<span style="color:var(--accent)">+${pct(e.speed)}% speed</span>`,
          e.eff   && `<span style="color:var(--accent3)">+${pct(e.eff)}% eff</span>`].filter(Boolean).join(' ');
}
// "WS 3 · 2× Light Bot · 1× Miner Robot · Xeno Power Core"
function wsConfigText(cfg) {
  if (!cfg || cfg.disabled) return 'no workstation';
  const n = {};
  (cfg.robots || []).filter(Boolean).forEach(b => { n[b] = (n[b] || 0) + 1; });
  return [`WS ${cfg.tier || 1}`, ...Object.entries(n).map(([b, c]) => `${c}× ${b}`), cfg.chargedCore && I.XENO_POWER_CORE]
    .filter(Boolean).join(' · ');
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
// Built from the game data: one Steam recipe per BURNABLE item. A Boiler burns
// energy_kj_per_sec of fuel (in-game: 216 MJ/min) for its steam output; the
// fuel's residual (Fuel Rod Casing, empty Barrel) leaves as byproduct.
const BURNABLE_GROUPS = [];
(function _injectBoilerFuelRecipes() {
  if (typeof POWER_SOURCES === 'undefined' || typeof POWER_FUEL_ITEMS === 'undefined') return;
  POWER_SOURCES.filter(src => src.type === 'steam_boiler' && src.energy_kj_per_sec > 0).forEach(boiler => {
    const [key, base] = Object.entries(RECIPES).find(([, r]) => r.machines?.[boiler.name]) || [];
    if (!base) return;
    const cycle = base.machines[boiler.name].cycleTime; // s
    const variants = [key];
    Object.entries(POWER_FUEL_ITEMS)
      .filter(([, f]) => f.type === 'solid' && f.burnable) // older data: no flag → no variants
      .sort((a, b) => a[1].mj - b[1].mj)
      .forEach(([fuel, f]) => {
        const perCycle = boiler.energy_kj_per_sec * cycle / (f.mj * 1000);
        const outAmount = Array.isArray(base.output) ? base.output[0].amount : base.output.amount;
        const name = `${key} (${fuel})`;
        RECIPES[name] = {
          ...base,
          ingredients: [...base.ingredients, { item: fuel, amount: perCycle }],
          output: f.residual
            ? [{ item: key, amount: outAmount }, { item: f.residual, amount: perCycle * f.residualCount }]
            : base.output,
          machines: { [boiler.name]: { ...base.machines[boiler.name] } },
          fuel,
        };
        variants.push(name);
      });
    if (variants.length > 1) BURNABLE_GROUPS.push({ label: key, variants });
  });
})();

// Recipe choices per item from the game data (RECIPE_VARIANT_GROUPS); the
// hand-written list below only serves data versions extracted before that.
// A group that is also a fuel group (Steam) joins it: one choice per item.
const _HAND_VARIANT_GROUPS = [
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
const VARIANT_GROUPS = (typeof RECIPE_VARIANT_GROUPS === 'undefined') ? _HAND_VARIANT_GROUPS
  : RECIPE_VARIANT_GROUPS
      .filter(g => g.variants.every(v => RECIPES[v]))
      .filter(g => {
        const fuel = BURNABLE_GROUPS.find(b => b.label === g.label);
        if (!fuel) return true;
        g.variants.forEach(v => { if (!fuel.variants.includes(v)) fuel.variants.push(v); });
        return false;
      })
      .map(g => ({ label: g.label, variants: [...g.variants] }));



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

// ONE list of what a plan's settings are: save (per tab), export, share,
// saved plans and import all go through settingsSnapshot / resetSettings /
// applySettings, so no setting can be lost on one of the ways.
function settingsSnapshot() {
  const famDefaults = {};
  MACHINE_FAMILIES.forEach(f => { if (f.defaultChoice) famDefaults[f.label] = f.defaultChoice; });
  return {
    variantSettings,
    minerSettings,
    botEfficiencyOverrides,
    botWeightReductions,
    miningEfficiencyLevel,
    pumpjackEfficiencyLevel,
    depletedVeins,
    calcDepthMode,
    modularSettings,
    adjacencyBonus,
    veinsDepleted,
    shippingShip,
    shippingFlightSec,
    stockItems,
    ownsDeluxe,
    excavationTool,
    powerPlan,
    buildCostOn,
    buildPlan,
    wsGlobalOn,
    wsRecipeConfigs,
    wsOptimized,
    fluidSourceChoice,
    workstationConfigs,
    machineFamilyDefaults: famDefaults,
  };
}

// Recipe list as stored: without UI-only state (wsExpanded, open) and without
// the automatic lines (power fuel, build material — re-created from their settings)
function savedRecipeList() {
  return selectedRecipeList.filter(item => !item.auto).map(item => ({
    itemName:    item.itemName,
    recipeName:  item.recipeName,
    machineName: item.machineName,
    goal:        item.goal,
    wsOverride:  item.wsOverride,
    forSale:     !!item.forSale,
  }));
}

// Every setting back to its default (import starts from here, so nothing of
// the current session leaks into an imported plan)
function resetSettings() {
  [variantSettings, minerSettings, botEfficiencyOverrides, botWeightReductions, workstationConfigs, modularSettings, fluidSourceChoice]
    .forEach(o => Object.keys(o).forEach(k => delete o[k]));
  miningEfficiencyLevel   = 0;
  pumpjackEfficiencyLevel = 0;
  depletedVeins           = 1;
  calcDepthMode           = 1;
  adjacencyBonus = true;
  veinsDepleted  = false;
  shippingShip = null;
  shippingFlightSec = 26;
  stockItems = {};
  ownsDeluxe = false;
  excavationTool = null;
  powerPlan = { on: false, gen: null, fuel: null };
  buildCostOn = false;
  buildPlan = { mode: 'once', rates: {} };
  wsGlobalOn = true;
  wsRecipeConfigs = {};
  wsOptimized = null;
  MACHINE_FAMILIES.forEach(f => { delete f.defaultChoice; });
}

function _flushSaveSettings() {
  _savePending = null;
  try {
    const blob = JSON.stringify({ gameVersion: GAME_VERSION_ID, ...settingsSnapshot(), selectedRecipeList: savedRecipeList() });
    // sessionStorage = this tab's own calculation (survives reload, not shared);
    // localStorage = starting point for new tabs.
    sessionStorage.setItem('fc_settings', blob);
    localStorage.setItem('fc_settings', blob);
    _recordHistory(JSON.parse(blob).selectedRecipeList);
    if (document.getElementById('historyPanel')?.open) renderHistory();
  } catch (e) {
    console.warn('foundry-calc: could not save settings:', e);
  }
}

// ── Recent calculations (localStorage 'fc_history', shared by all tabs) ──
// One entry per calculation, newest first. Adding recipes to the newest entry
// (new set ⊇ its set) updates it instead of creating a new one.
const HISTORY_MAX = 20;
function loadHistory() {
  try { return JSON.parse(localStorage.getItem('fc_history') || '[]'); } catch (e) { return []; }
}
function _recordHistory(list) {
  if (!list.length) return;
  const names = list.map(i => i.recipeName);
  const h = loadHistory().filter(e => e.version === GAME_VERSION_ID);
  const top = h[0];
  if (top && top.list.every(i => names.includes(i.recipeName))) h.shift();
  const key = [...names].sort().join('|');
  const rest = h.filter(e => e.list.map(i => i.recipeName).sort().join('|') !== key);
  rest.unshift({ version: GAME_VERSION_ID, at: Date.now(), list });
  localStorage.setItem('fc_history', JSON.stringify(rest.slice(0, HISTORY_MAX)));
}

// Validate a saved recipe list against the loaded game data.
function sanitizeRecipeList(list) {
  return (Array.isArray(list) ? list : [])
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
        forSale:    !!item.forSale,
        wsExpanded: false,
      };
    });
}

// Apply saved/imported settings (validated); missing keys keep their value
function applySettings(s) {
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
  if (typeof s.shippingShip === 'string') shippingShip = s.shippingShip;
  if (typeof s.shippingFlightSec === 'number' && s.shippingFlightSec >= 0) shippingFlightSec = s.shippingFlightSec;
  stockItems = sanitizeStock(s.stockItems);
  if (typeof s.ownsDeluxe === 'boolean') ownsDeluxe = s.ownsDeluxe;
  if (typeof s.excavationTool === 'string') excavationTool = s.excavationTool;
  if (s.powerPlan && typeof s.powerPlan === 'object')
    powerPlan = { on: !!s.powerPlan.on, gen: s.powerPlan.gen ?? null, fuel: s.powerPlan.fuel ?? null };
  if (typeof s.buildCostOn === 'boolean') buildCostOn = s.buildCostOn;
  buildPlan = sanitizeBuildPlan(s.buildPlan);
  wsGlobalOn = s.wsGlobalOn !== false;
  wsRecipeConfigs = sanitizeWsConfigs(s.wsRecipeConfigs);
  wsOptimized = s.wsOptimized && typeof s.wsOptimized.goal === 'string'
    ? { goal: s.wsOptimized.goal, at: +s.wsOptimized.at || 0, ...(typeof s.wsOptimized.balance === 'number' ? { balance: s.wsOptimized.balance } : {}) } : null;
  if (s.fluidSourceChoice && typeof s.fluidSourceChoice === 'object')
    Object.entries(s.fluidSourceChoice).forEach(([k, v]) => { if (typeof v === 'string') fluidSourceChoice[k] = v; });
  if (typeof s.calcDepthMode === 'number' && [0, 1, 2, 3].includes(s.calcDepthMode))
    calcDepthMode = s.calcDepthMode;

  if (s.botWeightReductions) {
    Object.entries(s.botWeightReductions).forEach(([k, v]) => {
      if (typeof v === 'number' && isFinite(v) && v >= 0 && v <= 100) botWeightReductions[k] = v;
    });
  }
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
}

function loadSettings() {
  try {
    const raw = sessionStorage.getItem('fc_settings') || localStorage.getItem('fc_settings');
    if (!raw) return;
    const s = JSON.parse(raw);
    applySettings(s);

    // Restore recipe list; skip any entry whose recipe no longer exists.
    // Also validate the machine name — fall back to the recipe's first machine
    // if the saved name is no longer valid (e.g. after a game-data update).
    // Wenn die gespeicherte Version nicht zur geladenen passt, Rezeptauswahl leeren
    if (s.gameVersion !== GAME_VERSION_ID) {
      s.selectedRecipeList = [];
    }

    if (Array.isArray(s.selectedRecipeList)) selectedRecipeList = sanitizeRecipeList(s.selectedRecipeList);
  } catch (e) {
    console.warn('foundry-calc: could not load settings:', e);
  }
}

// Restore settings immediately – runs synchronously before DOMContentLoaded,
// so UI modules already see the correct values when they first render.
loadSettings();
_applyModularSpeeds();

// ── Modal animation helpers ─────────────────────────────────
