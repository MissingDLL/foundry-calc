// STARTUP VALIDATION
// ============================================================
// Runs once on load. Warns in the console about any unknown
// strings in RECIPES that are not covered by I, M, or CAT.
(function validateRecipes() {
  const knownItems = new Set(Object.values(I));
  const knownMachines = new Set(Object.values(M));
  const knownCats = new Set(Object.values(CAT));
  const errors = [];

  for (const [recipeName, r] of Object.entries(RECIPES)) {
    // Category
    if (!knownCats.has(r.category)) {
      errors.push(`[${recipeName}] unknown category: "${r.category}"`);
    }
    // Ingredients
    if (Array.isArray(r.ingredients)) {
      for (const ing of r.ingredients) {
        if (!knownItems.has(ing.item)) {
          errors.push(`[${recipeName}] unknown ingredient: "${ing.item}"`);
        }
      }
    }
    // Output (single or array)
    const outputs = Array.isArray(r.output) ? r.output : [];
    for (const out of outputs) {
      if (out.item && !knownItems.has(out.item)) {
        errors.push(`[${recipeName}] unknown output item: "${out.item}"`);
      }
    }
    // Machines
    for (const machineName of Object.keys(r.machines || {})) {
      if (!knownMachines.has(machineName)) {
        errors.push(`[${recipeName}] unknown machine: "${machineName}"`);
      }
    }
  }

  if (errors.length === 0) {
    console.log('%c✓ RECIPES validation passed — alle Konstanten bekannt', 'color:#4caf50;font-weight:bold');
  } else {
    console.warn(`%c✗ RECIPES validation: ${errors.length} Problem(e) gefunden`, 'color:#ff9800;font-weight:bold');
    errors.forEach(e => console.warn('  ', e));
  }
})();

// ============================================================
// RECIPE CALCULATOR STATE
// ============================================================
// Each item: { itemName (canonical), recipeName (actual RECIPES key), machineName, goal }
let selectedRecipeList = [];

function resolveRecipeName(canonicalName) {
  const group = VARIANT_GROUPS.find((g) => g.label === canonicalName);
  if (group) {
    return variantSettings[canonicalName] || group.variants[0];
  }
  return canonicalName;
}

function getVariantsFor(canonicalName) {
  const group = VARIANT_GROUPS.find((g) => g.label === canonicalName);
  return group ? group.variants : [canonicalName];
}


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
  if (btn) btn.textContent = newState ? "✗ Keine" : "✓ Alle";
  // Also update subgroup buttons
  Object.keys(
    entries.reduce((acc, [name]) => { const sg = getBotSubgroup(name); acc[sg] = 1; return acc; }, {})
  ).forEach(sg => {
    const b = document.getElementById("robotAllBtn_sg_" + sg.replace(/ /g, "_"));
    if (b) b.textContent = newState ? "✗ Keine" : "✓ Alle";
  });
}



// ── Bot subcategory detection ─────────────────────────────────────
function getBotSubgroup(name) {
  const n = name.toLowerCase();
  if (n.includes("drone")) return "Drones";
  if (n.includes(" bot")) return "Bots";
  if (n.startsWith("combat robot")) return "Combat Robot";
  if (n.startsWith("farmer robot")) return "Farmer Robot";
  if (n.startsWith("miner robot")) return "Miner Robot";
  if (n.startsWith("operator robot")) return "Operator Robot";
  if (n.startsWith("personal assistant robot")) return "Personal Assistant Robot";
  if (n.startsWith("science robot")) return "Science Robot";
  return "Robots (Sonstige)";
}

const BOT_SUBGROUP_ORDER = [
  "Bots", "Drones",
  "Personal Assistant Robot", "Operator Robot",
  "Miner Robot", "Farmer Robot", "Combat Robot", "Science Robot",
  "Robots (Sonstige)",
];

function buildRecipeCategoryList() {
  const list = document.getElementById("botList");
  list.innerHTML = "";

  // Group all Robot-category recipes by subgroup
  const groups = {};
  Object.entries(RECIPES)
    .filter(([, r]) => r.category === "Robots")
    .forEach(([name]) => {
      const sg = getBotSubgroup(name);
      if (!groups[sg]) groups[sg] = [];
      groups[sg].push(name);
    });

  // Render in defined order
  const orderedKeys = [
    ...BOT_SUBGROUP_ORDER.filter(k => groups[k]),
    ...Object.keys(groups).filter(k => !BOT_SUBGROUP_ORDER.includes(k)),
  ];

  orderedKeys.forEach((sg) => {
    const names = groups[sg];

    // Subgroup header
    const catDiv = document.createElement("div");
    catDiv.className = "bot-category";
    catDiv.style.cssText = "display:flex;align-items:center;justify-content:space-between;margin-top:6px";

    const catSpan = document.createElement("span");
    catSpan.textContent = sg;
    catDiv.appendChild(catSpan);

    const allBtn = document.createElement("button");
    allBtn.id = "robotAllBtn_sg_" + sg.replace(/ /g, "_");
    allBtn.textContent = "✓ Alle";
    allBtn.title = "Alle auswählen / abwählen";
    allBtn.style.cssText =
      "padding:1px 7px;font-size:10px;background:rgba(10,132,255,0.12);border:1px solid rgba(10,132,255,0.25);color:var(--accent);border-radius:5px;cursor:pointer;font-family:-apple-system,sans-serif";
    allBtn.onclick = function () {
      const allChecked = names.every(n => {
        const c = document.getElementById("chk_" + n); return c && c.checked;
      });
      const newState = !allChecked;
      names.forEach(n => {
        const c = document.getElementById("chk_" + n);
        if (c) c.checked = newState;
        toggleRecipeFromGrid(n, newState);
      });
      allBtn.textContent = newState ? "✗ Keine" : "✓ Alle";
    };
    catDiv.appendChild(allBtn);
    list.appendChild(catDiv);

    // Items
    names.sort().forEach((name) => {
      const r = RECIPES[name];
      const item = document.createElement("div");
      item.className = "bot-item";
      item.id = "botItem_" + name;

      // Strip known robot-type prefix for shorter label
      const prefixes = ["Combat Robot ", "Farmer Robot ", "Miner Robot ",
        "Operator Robot ", "Personal Assistant Robot ", "Science Robot "];
      const prefix = prefixes.find(p => name.startsWith(p));
      const shortName = prefix ? name.slice(prefix.length) : name;

      const eff = botEfficiencyOverrides[name] != null ? botEfficiencyOverrides[name] : r.efficiency;
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
    });
  });
}



// ── Recipe Settings ──────────────────────────────────────────
// Global defaults: { recipeName: preferredMachineName }
// and variant preferences: { 'Xenoferrite Plates': 'Xenoferrite Plates (Tier 1)' }
const recipeSettings = {}; // machineName overrides per recipe
const variantSettings = {}; // variant preference per item group
const minerSettings = {}; // ore rubble name → preferred miner machine name
const botEfficiencyOverrides = {}; // { botName: efficiencyValue } — user-set overrides
let globalMiningProductivity = 0;  // % bonus for Crusher recipes
let globalFluidProductivity = 0;  // % bonus for Fluid/Chemical recipes

// ── Workstation configuration ────────────────────────────────
// workstationConfigs: { category: { tier, robots: [...], chargedCore } }
// One workstation per machine category – this is the global default.
const workstationConfigs = {};

// Maps applies_to category → actual machine names in RECIPES
const APPLIES_TO_MACHINES = {
  "Assemblers": [M.ASSEMBLER_I, M.ASSEMBLER_II, M.ASSEMBLER_III, M.FLUID_ASSEMBLER_I],
  "Crushers": [M.CRUSHER_I, M.CRUSHER_II],
  "Smelters": [M.SMELTER_SMALL, M.ADVANCED_SMELTER, M.LAVA_SMELTER_I, M.LAVA_SMELTER_II, M.BLAST_FURNACE, M.ELECTRIC_ARC_FURNACE],
  "Casting Machines": [M.CASTING_MACHINE],
  "Chemical Buildings": [M.CHEMICAL_PROCESSOR, M.BARREL_FILLER_I],
  "Greenhouses": [M.GREENHOUSE],
  "Miners": [],
  "Pumpjacks": [],
  "Crystal Refiners": [],
  "Research Servers": [],
  "Incinerators": [],
  "Flare Stacks": [],
};

// Compute total % bonus per machine name from all workstations
// Reverse lookup: machine name → category string
const MACHINE_TO_CATEGORY = {};
Object.entries(APPLIES_TO_MACHINES).forEach(([cat, machines]) => {
  machines.forEach(m => { MACHINE_TO_CATEGORY[m] = cat; });
});

// Compute % bonus (efficiency + speed) for one machine given a wsConfig object
function calcWsBonusForMachine(machineName, wsConfig) {
  if (!wsConfig || wsConfig.disabled) return 0;
  let eff = 0, speed = 0;
  (wsConfig.robots || []).forEach(botName => {
    if (!botName) return;
    const r = RECIPES[botName];
    if (!r || !r.workstation_effect) return;
    const we = r.workstation_effect;
    if ((we.applies_to || []).some(cat =>
      (APPLIES_TO_MACHINES[cat] || []).includes(machineName)
    )) {
      eff += we.machine_efficiency || 0;
      speed += we.machine_speed || 0;
    }
  });
  const coreMult = wsConfig.chargedCore ? 1.33 : 1;
  return (eff + speed) * coreMult / 100;
}

// Get ws bonus for a recipe item: use wsOverride if set, else global config for category
function getItemWsBonus(item) {
  const config = item.wsOverride !== undefined && item.wsOverride !== null
    ? item.wsOverride
    : workstationConfigs[MACHINE_TO_CATEGORY[item.machineName]];
  return calcWsBonusForMachine(item.machineName, config);
}

const MINING_MACHINES = new Set([M.CRUSHER_I, M.CRUSHER_II]);
const FLUID_MACHINES = new Set([M.FLUID_ASSEMBLER_I, M.CHEMICAL_PROCESSOR, M.BARREL_FILLER_I, M.GREENHOUSE]);

// Machine families — for grouped display in settings
const MACHINE_FAMILIES = [
  { label: "Crusher", machines: ["Crusher I", "Crusher II"] },
  { label: "Smelter", machines: ["Smelter (Small)", "Advanced Smelter"] },
  {
    label: "Lava-Smelter",
    machines: ["Lava-Smelter I", "Lava-Smelter II"],
  },
  {
    label: "Assembler",
    machines: ["Assembler I", "Assembler II", "Assembler III"],
  },
  {
    label: "Förderband",
    machines: [
      "Conveyor I",
      "Conveyor II",
      "Conveyor III",
      "Conveyor IV",
    ],
  },
];

// Miner groups — which miner to use for each minable ore
const MINER_GROUPS = [
  { label: "Xenoferrite Ore Rubble", miners: ["Drone Miner I", "Drone Miner II", "Ore Vein Miner"] },
  { label: "Ignium Ore Rubble",      miners: ["Drone Miner I", "Drone Miner II", "Ore Vein Miner"] },
  { label: "Technum Ore Rubble",     miners: ["Drone Miner I", "Drone Miner II", "Ore Vein Miner"] },
  { label: "Telluxite Ore Rubble",   miners: ["Ore Vein Miner"] },
];

// Recipe variant groups
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


// ── Modal animation helpers ─────────────────────────────────
