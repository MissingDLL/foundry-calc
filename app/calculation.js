// ============================================================
// app/calculation.js
// ============================================================
// Core production math.  All public functions are plain globals
// (no module system) so they can be called from the HTML and
// from visualization.js without any import machinery.
//
// Dependency chain (must be loaded before this file):
//   data/game-data.js   → M, I, CAT
//   data/recipes.js     → RECIPES
//   data/icons.js       → getIcon()
//   app/state.js        → selectedRecipeList, resolveRecipeName,
//                          botEfficiencyOverrides, minerSettings,
//                          mining/pumpjackEfficiencyLevel, modular settings,
//                          getItemWsBonus, MINING_MACHINES, FLUID_MACHINES
//   app/ui-nav.js       → fmt()
// ============================================================

// ── Output helpers ────────────────────────────────────────────

// Returns the expected output amount per cycle, accounting for
// probabilistic outputs (e.g. a recipe that yields 2 items at 50%
// chance contributes an *average* of 1.0 per cycle).
//
// recipe.output can be:
//   { amount, chance? }          – single output
//   [{ item, amount, chance? }]  – multi-output (only index 0 is counted)
function getOutputAmount(recipe) {
  if (!recipe.output) return 0;
  // Recyclers: no main product; the rate is the input processed (in-game
  // "Items per minute: 160"), every output is a product with a chance.
  if (recipe.chanceOutputs) return recipe.ingredients[0]?.amount || 1;
  if (Array.isArray(recipe.output)) {
    const o = recipe.output[0];
    return o.amount * (o.chance != null ? o.chance : 1);
  }
  const o = recipe.output;
  return o.amount * (o.chance != null ? o.chance : 1);
}

// Returns a human-readable label for the output quantity.
// If the output has a non-100 % chance the label reads e.g. "3 (50%)".
function getOutputLabel(recipe) {
  if (!recipe.output) return "0";
  const o = Array.isArray(recipe.output) ? recipe.output[0] : recipe.output;
  if (o.chance != null && o.chance < 1) {
    return `${o.amount} (${Math.round(o.chance * 100)}%)`;
  }
  return String(o.amount);
}

// Output items/min of ONE machine, including every productivity bonus:
//   bot efficiency (override → parent-robot override → recipe base),
//   global mining/fluid productivity and workstation bonus.
// `item` needs { machineName, itemName? , wsOverride? } — a selectedRecipeList
// entry, or { itemName, machineName } for items deeper in the chain.
// Single source of truth: table, chain resolution, sidebar and Sankey all use it.
// Self-feeding recipes of excavated items (Greenhouse: 1 Biomass → 2): part of
// the output goes straight back in. The loop is closed: the rate is the NET
// output, the returned share is no demand per minute, only a one-time start
// fill gathered by excavation. recipe.selfLoop = { item, amount per cycle }.
(function _markSelfLoops() {
  if (typeof EXCAVATION === 'undefined' || typeof RECIPES === 'undefined') return;
  Object.entries(RECIPES).forEach(([key, r]) => {
    const product = Array.isArray(r.output) ? r.output[0]?.item : key;
    const ing = !r.chanceOutputs && EXCAVATION.items?.includes(product) && r.ingredients?.find(i => i.item === product);
    if (ing) r.selfLoop = { item: product, amount: ing.amount };
  });
})();
const isSelfLoopInput = (recipe, item) => recipe?.selfLoop?.item === item;
// Outputs besides the one wanted: byproducts. Recyclers have no main output —
// everything except the wanted product counts.
const sideOutputs = (recipe, product) => !Array.isArray(recipe?.output) ? []
  : recipe.chanceOutputs ? recipe.output.filter(o => o.item !== product) : recipe.output.slice(1);
// Output rate of a SELECTED line: the goal is the machine's gross output as the
// game shows it (Greenhouse 0.3/min Forest Seeds; 0.2 go back, +0.1 net).
// Demand inside the chain uses machineOpm (net), the loop must cover it.
function lineOpm(recipe, item) {
  return machineOpm(recipe, item) + (recipe.selfLoop ? (60 / wsCycleTime(recipe, item)) * recipe.selfLoop.amount : 0);
}

function machineOpm(recipe, item) {
  const ct = wsCycleTime(recipe, item);
  const parent = item.itemName?.match(/^(.+)\s+(?:Arm|Head|Leg|Torso)$/)?.[1];
  const eff = botEfficiencyOverrides[item.itemName] ?? botEfficiencyOverrides[parent] ?? recipe.efficiency ?? 0;
  const pumpjackBonus = typeof RESEARCH_BONUSES !== 'undefined' && RESEARCH_BONUSES.pumpjacks.includes(item.machineName)
    ? pumpjackEfficiencyLevel * researchBonus('Pumpjack Efficiency') : 0;
  // Recycler chosen to make one of its products (Scrap Recycler → Advanced
  // Machinery Parts): rate of that product = its chance per processed item.
  const wanted = recipe.chanceOutputs && recipe.output.find(o => o.item === (item.product || item.itemName));
  // All bonuses stack additively in the productivity bracket.
  const gross = (wanted ? wanted.amount : getOutputAmount(recipe)) * (1 + eff / 100) * (1 + pumpjackBonus + getItemWsEffect(item).eff);
  return (60 / ct) * (gross - (recipe.selfLoop?.amount || 0)); // net for self-feeding loops
}

// Effective cycle time incl. workstation SPEED: a faster machine needs fewer
// units but scales input and output alike, so every flow derived from the
// cycle time (ingredients, byproducts) must use this, never the raw value.
function wsCycleTime(recipe, item) {
  return recipe.machines[item.machineName].cycleTime / (1 + getItemWsEffect(item).speed);
}

// Byproduct supply pool of the last calculation (item → per min), read by the
// Sankey/Boxes graph so both views take byproducts from the same pool.
let _lastSupply = {};
let _lastStock  = {}; // existing stock (item → per min) for the graph
const STOCK_TOLERANCE = 0.01; // per min; smaller rests are covered by stock

// ceil() that ignores float noise (3.0000000001 machines → 3, not 4).
const ceilMachines = (x) => Math.ceil(x - 1e-9);

// Small "WS +x %" chip when a workstation bonus applies to this machine/item
// (global per machine group or the line's own override). Empty otherwise.
function wsBadge(item) {
  const cfg = getItemWsConfig(item);
  const custom = cfg && (cfg === item.wsOverride || cfg === wsRecipeConfigs[item.recipeName || item.itemName]);
  const e = calcWsEffectForMachine(item.machineName, cfg);
  const style = 'font-size:10px;border:1px solid var(--color-border);background:var(--color-bg-elevated);border-radius:3px;padding:0 4px;margin-left:6px;white-space:nowrap';
  if (e.speed + e.eff > 0)
    return `<span title="${custom ? 'Custom' : 'Global'} WS: ${wsConfigText(cfg)}" style="${style}">${custom ? 'WS★' : 'WS'} ${wsEffectHtml(e)}</span>`;
  return custom && cfg.disabled ? `<span title="Custom: no workstation here" style="${style};color:var(--text-dim)">no WS</span>` : '';
}

// ── Infrastructure helpers ─────────────────────────────────────

// Returns the power consumption of a machine in kW.
// Checks the machine's own recipe first; falls back to MACHINE_POWER_KW.
function getMachinePowerKw(machineName, itemName) {
  // Assembly Line: its stations draw power per task, so the average power is
  // the energy per robot over the cycle time (game data; ≈ 2.1 MW per line).
  if (machineName === M.ASSEMBLY_LINE && typeof ASSEMBLY_LINE_ENERGY_KJ !== 'undefined') {
    const kj = ASSEMBLY_LINE_ENERGY_KJ[itemName]
      ?? Math.max(0, ...Object.values(ASSEMBLY_LINE_ENERGY_KJ)); // no robot given: same for all robots today
    return kj / ASSEMBLY_LINE_COMPOSITION.cycle_time;
  }
  // Older data versions: sum of its sub-machines
  if (machineName === M.ASSEMBLY_LINE) {
    return getMachinePowerKw(ASSEMBLY_LINE_COMPOSITION.start.name)    * ASSEMBLY_LINE_COMPOSITION.start.count
         + getMachinePowerKw(ASSEMBLY_LINE_COMPOSITION.producer.name) * ASSEMBLY_LINE_COMPOSITION.producer.count
         + getMachinePowerKw(ASSEMBLY_LINE_COMPOSITION.painter.name)  * ASSEMBLY_LINE_COMPOSITION.painter.count;
  }
  const r = RECIPES[machineName];
  if (r && r.power_consumption != null) {
    return r.power_consumption_unit === 'MW'
      ? r.power_consumption * 1000
      : r.power_consumption;
  }
  return MACHINE_POWER_KW[machineName] || 0;
}

// Share of machinesPowerKw() that comes from the workstation bots (+power %)
function wsExtraKw(machine, count, item = { machineName: machine }) {
  const total = machinesPowerKw(machine, count, item);
  return total - total / (1 + getItemWsEffect(item).power);
}

// Power value with a "+x WS" chip and a hover breakdown
// parts: { ws, loaders, pumps } (kW) — machines (base) = total minus the rest
function powerCellHtml(totalKw, { ws = 0, loaders = 0, pumps = 0 } = {}, style = 'font-size:12px;color:var(--color-power)') {
  const f = kw => kw >= 1000 ? `${(kw / 1000).toLocaleString('de-DE', { maximumFractionDigits: 2 })} MW` : `${fmt(Math.round(kw))} kW`;
  const base = totalKw - ws - loaders - pumps;
  const tip = [`Machines (base): ${f(base)}`, ws > 0.5 && `Workstation bots: +${f(ws)}`, loaders > 0.5 && `Loaders: ${f(loaders)}`, pumps > 0.5 && `Pumps: ${f(pumps)}`, `Total: ${f(totalKw)}`].filter(Boolean).join('\n');
  const chip = ws > 0.5 ? ` <span style="font-size:10px;color:var(--warn);border:1px solid var(--color-border);border-radius:3px;padding:0 4px;white-space:nowrap">+${f(ws)} WS</span>` : '';
  return `<span title="${tip}" style="${style};cursor:help;white-space:nowrap">${f(totalKw)}${chip}</span>`;
}

// Power of `count` machines of one type.
// Modular buildings: power scales with module speed (in-game: Air Intake
// 1.4 MW base → 8.4 MW at 600 %). Adjacency bonus (if enabled) assumes all
// buildings of a type stand side by side in one row: the two ends have one
// neighbour, inner ones two; each neighbour cuts `adjacencyPowerDecrease`
// (in-game: Hot Air Stove 10 MW → 7.5 MW with one neighbour).
function machinesPowerKw(machine, count, item = { machineName: machine }) {
  const mb = _modular(machine);
  // Fracking Tower: power grows per optional module (+100 % each), not with speed
  const factor = mb?.powerPerModule != null ? 1 + (modularModules(machine) - mb.ignored) * mb.powerPerModule
                                            : modularSpeed(machine);
  const each = (getMachinePowerKw(machine, item.itemName) || mb?.basePowerKw || 0) * factor;
  const dec  = adjacencyBonus ? (mb?.adjacencyPowerDecrease || 0) : 0;
  const neighbourSlots = count > 1 ? 2 * (count - 1) : 0;
  // + workstation power consumption (e.g. +80 % with 3 Screen Bots + core)
  return Math.max(0, each * (1 + getItemWsEffect(item).power) * (count - dec * neighbourSlots));
}

// Fracking Towers for depleted veins: one tower feeds one vein, so at least
// one per depleted vein; more only if the liquid exceeds a tower's throughput.
function frackingTowerPlan(liquidPerMin) {
  const entry = liquidPerMin > 0 && typeof MODULAR_BUILDINGS !== 'undefined'
    && Object.entries(MODULAR_BUILDINGS).find(([, mb]) => mb.throughputPerModule);
  if (!entry) return null;
  const [machine, mb] = entry;
  const capacity = modularModules(machine) * mb.throughputPerModule;
  const count = Math.max(depletedVeins, ceilMachines(liquidPerMin / capacity));
  return { machine, count, capacity, powerKw: machinesPowerKw(machine, count) };
}

// Power of the whole production chain, independent of the depth view: the
// graph always expands the full chain (incl. hot air, disposal, reprocessing,
// stock). Rounded up per node like the Full Detail table. null = no graph.
function chainPowerKw() {
  if (typeof buildSankeyGraph !== 'function') return null; // unit test runner
  const g = buildSankeyGraph();
  if (!g) return null;
  let machines = 0, loaders = 0, wsKw = 0;
  const graph = g;
  g.nodes.forEach(n => {
    if (!n.machineName || !(n.machineCount > 0)) return;
    const count = ceilMachines(n.machineCount);
    const line  = selectedRecipeList.find(l => l.itemName === n.label);
    const item  = line || { itemName: resolveRecipeName(n.label), machineName: n.machineName };
    machines += machinesPowerKw(n.machineName, count, item); // its own WS (power)
    wsKw     += wsExtraKw(n.machineName, count, item);
    const rec = RECIPES[line?.recipeName || resolveRecipeName(n.label)];
    if (rec?.machines?.[n.machineName]) loaders += calcLoadersForMachine(n.machineName, countSolidConnections(rec, n.label)).powerKw * count;
  });
  return { machines, loaders, wsKw, graph };
}

// Pipes / pipelines and pumps per fluid, from the full-chain graph: each fluid
// edge links a producer's outlet to a consumer's inlet (FLUID_PORTS, game data).
// A common type → no pump (the Blast Furnace offers both outlets); otherwise a
// Pipe-to-Pipeline / Pipeline-to-Pipe Pump. Lines = flow / type throughput.
// ponytail: one pump moves at most a pipe's throughput (36,000 L/min); the
// pump's own rate is not in the game data.
function fluidPlan(graph) {
  if (typeof FLUID_PORTS === 'undefined' || !graph) return {};
  const P = FLUID_PORTS, plan = {};
  const nodes = Object.fromEntries(graph.nodes.map(n => [n.label, n]));
  const minTp = Math.min(...Object.values(P.pipes));
  graph.links.forEach(l => {
    const src = nodes[l.source], tgt = nodes[l.target];
    const item = src?.icon || src?.label;
    // edges into byproduct / loop-back nodes carry that byproduct, not `item`
    if (!src || !tgt || !FLUID_ITEMS.has(item) || tgt.kind === 'byproduct' || tgt.kind === 'sink' && tgt.icon === item) return;
    const outs = P.ports[src.machineName || fluidSourceFor(item)?.machine]?.out || [];
    const ins  = P.ports[tgt.machineName]?.in || [];
    const common = outs.filter(t => ins.includes(t));
    const type = common[0] || outs[0] || ins[0] || Object.keys(P.pipes)[0];
    const e = (plan[item] ||= { types: {}, pumps: {} });
    e.types[type] = (e.types[type] || 0) + l.value;
    if (outs.length && ins.length && !common.length) {
      const pump = P.pumps.find(p => p.from === outs[0] && p.to === ins[0]);
      if (pump) (e.pumps[pump.name] ||= { flow: 0, kw: pump.kw }).flow += l.value;
    }
  });
  Object.values(plan).forEach(e => {
    e.lines = Object.entries(e.types).map(([t, flow]) => ({ type: t, count: Math.ceil(flow / P.pipes[t] - 1e-9) }));
    e.pumpList = Object.entries(e.pumps).map(([name, p]) => ({ name, count: Math.ceil(p.flow / minTp - 1e-9), kw: p.kw }));
    e.pumpKw = e.pumpList.reduce((a, p) => a + p.count * p.kw, 0);
  });
  return plan;
}

// Product pills of a recycler (chanceOutputs): all outputs are equal products
// with a chance. `inputPerMin` = items processed per minute.
function chanceProductPills(recipe, inputPerMin, iconBox, size = 48) {
  const perInput = 1 / (recipe.ingredients[0]?.amount || 1);
  return recipe.output.map(o => `<span style="display:inline-flex;align-items:center;gap:5px;
      background:var(--color-success-bg);border:1px solid var(--color-success-border);
      border-radius:4px;padding:3px 8px;font-size:12px;white-space:nowrap">
      ${iconBox(o.item, size)}<span style="color:var(--text)">${o.item}</span>
      <span style="font-family:'Share Tech Mono',monospace;color:var(--accent3)">${fmt(inputPerMin * perInput * o.amount)}<span style="color:var(--text-dim);font-size:10px">/min</span></span>
      <span style="font-size:10px;color:var(--text-dim)">${Math.round(o.amount * 100)} %</span>
    </span>`).join('');
}

// "→ product" note when a recipe is named differently from what it makes
// (Scrap Recycler: Xeno-Scrap → Advanced Machinery Parts).
function productNote(recipeKey, shownName, size = 32) {
  const r = RECIPES[recipeKey];
  const out = Array.isArray(r?.output) && !r.chanceOutputs ? r.output[0]?.item : null;
  if (!out || out === recipeKey || out === shownName) return '';
  return `<span style="display:inline-flex;align-items:center;gap:4px;font-size:11px;color:var(--text-dim);margin-left:6px">→ ${getIcon(out, size)}${out}</span>`;
}

// Items/min of the conveyor tier chosen in settings (game data; I 160 … IV 1280).
function conveyorItemsPerMin() {
  const fam = MACHINE_FAMILIES.find(f => f.label === 'Conveyor Belt');
  const type = fam?.defaultChoice || fam?.machines[0] || 'Conveyor I';
  return (typeof SHIPPING !== 'undefined' && SHIPPING.conveyors[type]) || 160;
}

// Shipping pads planet <-> space station for ONE item in ONE direction (a pad
// is set to one item and one direction in-game, so pads are counted per item).
// Per pad: ship cycle = load/transfer rate + flight time (setting), capped by
// the pad's belts (inputs when shipping up, outputs when down) at the chosen
// conveyor tier. Assembly Line items going up use the Assembly Line pad
// (fed directly, no belts). One ship serves one pad.
function shippingPlan(item, perMin, direction, viaAssemblyLine) {
  if (typeof SHIPPING === 'undefined' || typeof ITEM_WEIGHTS_KG === 'undefined') return null;
  // R&D Lab "Product Weight" reduction (setting per product)
  const kgEach = ITEM_WEIGHTS_KG[item] * (1 - (botWeightReductions[item] || 0) / 100);
  const ship = SHIPPING.ships.find(sh => sh.name === shippingShip) || SHIPPING.ships[SHIPPING.ships.length - 1];
  if (!kgEach || !ship || !(perMin > 0)) return null;
  const fits = SHIPPING.pads.filter(p => p.padSize === ship.padSize && (direction === 'up' || p.downAllowed));
  const pad = (viaAssemblyLine && direction === 'up' && fits.find(p => !p.inputs)) ||
              fits.find(p => (direction === 'up' ? p.inputs : p.outputs) > 0);
  if (!pad) return null;
  const load = Math.min(ship.cargoKg, pad.capacityKg);
  const shipKgPerMin = load / (load / ship.transferKgPerS + shippingFlightSec) * 60;
  const belts = direction === 'up' ? pad.inputs : pad.outputs;
  const beltKgPerMin = belts ? belts * conveyorItemsPerMin() * kgEach : Infinity;
  const padKgPerMin = Math.min(shipKgPerMin, beltKgPerMin);
  const kgPerMin = perMin * kgEach;
  const count = ceilMachines(kgPerMin / padKgPerMin);
  // Belts needed in total (not rounded up per pad: 6,000/min on 2 pads with
  // Conveyor IV = 5 belts as 3 + 2, not 2 x 3), at least one per pad, at most
  // all connections. Assembly Line pad: none.
  const totalBelts = belts ? Math.min(count * belts, Math.max(count, ceilMachines(perMin / conveyorItemsPerMin()))) : 0;
  const beltsPerPad = belts ? Math.ceil(totalBelts / count) : 0;
  const padsX = (n, b) => `${n} pad${n > 1 ? 's' : ''} × ${b}`;
  const rest = belts ? totalBelts % count : 0;
  const beltSplit = rest ? `${padsX(rest, beltsPerPad)} + ${padsX(count - rest, beltsPerPad - 1)}` : '';
  // Alternative: fill pads one after another. A pad only uses as many belts as
  // its ship can carry away (heavy items: often 1 belt saturates the ship), so
  // "full" = min(connections, belts the ship cycle can absorb).
  let fillSplit = '', fillBelts = 0;
  if (belts) {
    const perBelt = conveyorItemsPerMin();
    const useful = Math.min(belts, Math.max(1, ceilMachines(shipKgPerMin / (perBelt * kgEach))));
    const padMax = Math.min(useful * perBelt, shipKgPerMin / kgEach); // items/min one full pad moves
    let full = Math.min(count, Math.floor(perMin / padMax + 1e-9));
    const left = perMin - full * padMax;
    let lastBelts = left > 1e-9 ? ceilMachines(left / perBelt) : 0;
    if (lastBelts === useful) { full++; lastBelts = 0; } // last pad is full too
    fillBelts = full * useful + lastBelts;
    fillSplit = [full ? padsX(full, useful) : '', lastBelts ? padsX(1, lastBelts) : ''].filter(Boolean).join(' + ');
    if (!lastBelts && full === count && useful === beltsPerPad && !rest) fillSplit = ''; // same as even
  }
  return { item, direction, perMin, kgEach, kgPerMin, pad: pad.name, ship: ship.name, count,
           padKgPerMin, limit: beltKgPerMin < shipKgPerMin ? 'belts' : 'ship',
           belts, beltsPerPad, totalBelts, beltSplit, fillSplit, fillBelts, hangar: count * ship.hangarSpace };
}

// Fluid each running machine needs regardless of utilisation, scaled by its
// modules — the Blast Furnace burns Hot Air to hold temperature (it cools down
// and slows without it), so this is per rounded-up machine, never proportional.
// `item` (what the machine produces) adds the vein mining fluid: Ore Vein
// Miners need fracking liquid once a vein is mined to its core (setting).
function fluidNeedsPerMachine(machine, item) {
  const base = (typeof MACHINE_FLUID_MINIMUMS !== 'undefined' && MACHINE_FLUID_MINIMUMS[machine]) || {};
  const mb = _modular(machine);
  const extraModules = mb ? modularModules(machine) - mb.ignored : 0;
  const out = {};
  Object.entries(base).forEach(([fluid, perMin]) => {
    out[fluid] = perMin * (1 + extraModules * (mb?.fluidPerModule?.[fluid] || 0));
  });
  const vein = veinsDepleted && typeof VEIN_MINING_FLUIDS !== 'undefined' && VEIN_MINING_FLUIDS[item];
  if (vein && vein.machines.includes(machine)) {
    // Mining Efficiency: X % more free ore per same fracking liquid (in-game: level 10 → 75 L/min)
    const perMiner = vein.perMinerPerMin / (1 + miningEfficiencyLevel * researchBonus('Mining Efficiency'));
    out[vein.fluid] = (out[vein.fluid] || 0) + perMiner;
  }
  return out;
}

// Returns the first non-Character machine name for a recipe.
// Returns null if only "Character" (hand-crafting) is available —
// Character is never a valid automated producer.
function firstMachineFor(recipe) {
  const entries = Object.entries(recipe.machines || {});
  const nonChar = entries.find(([name]) => name !== 'Character');
  return nonChar ? nonChar[0] : null;
}

// Like firstMachineFor but respects the user's machine family defaults
// and family ordering (lowest tier first when no preference is set).
function preferredMachineFor(recipe) {
  const available = Object.keys(recipe.machines || {});
  for (const family of MACHINE_FAMILIES) {
    // Check if this recipe is built by any machine in this family
    const familyMatch = family.machines.find(m => available.includes(m));
    if (!familyMatch) continue;
    // Use user's saved defaultChoice if it's available in this recipe,
    // otherwise use the lowest-tier family machine that is available.
    const preferred = family.defaultChoice || family.machines[0];
    return available.includes(preferred) ? preferred : familyMatch;
  }
  return firstMachineFor(recipe);
}

// Calculates the optimal loader setup for a machine given the number of
// solid (non-fluid) connections needed.
//
// Strategy:
//   Phase 1 – fill up to 2 slots per side across the first 2 sides
//             (avoids Third Lane, which costs more power).
//   Phase 2 – if more connections remain, upgrade existing sides to 3
//             (adds Third Lane where needed).
//   Phase 3 – overflow onto additional sides as last resort.
//
// Returns { powerKw, loaderCount, secondLaneCount, thirdLaneCount }
function calcLoadersForMachine(machineName, nSolidConnections) {
  const connInfo = MACHINE_CONNECTIONS[machineName];
  if (!connInfo || !connInfo.loader_needed || nSolidConnections === 0)
    return { powerKw: 0, loaderCount: 0, secondLaneCount: 0, thirdLaneCount: 0 };

  const sortedSides = [...connInfo.sides].filter(s => s > 0).sort((a, b) => b - a);
  if (!sortedSides.length) return { powerKw: 0, loaderCount: 0, secondLaneCount: 0, thirdLaneCount: 0 };

  const usedSides = new Array(sortedSides.length).fill(0);
  let remaining = nSolidConnections;

  // Phase 1: fill up to 2 per side on first 2 sides
  for (let i = 0; i < Math.min(2, sortedSides.length) && remaining > 0; i++) {
    const add = Math.min(remaining, Math.min(2, sortedSides[i]));
    usedSides[i] += add;
    remaining -= add;
  }
  // Phase 2: upgrade to 3 per side on already-used sides
  for (let i = 0; i < usedSides.length && remaining > 0; i++) {
    if (usedSides[i] === 0) continue;
    const add = Math.min(remaining, sortedSides[i] - usedSides[i]);
    usedSides[i] += add;
    remaining -= add;
  }
  // Phase 3: overflow onto further sides
  for (let i = 2; i < sortedSides.length && remaining > 0; i++) {
    const add = Math.min(remaining, sortedSides[i]);
    usedSides[i] += add;
    remaining -= add;
  }

  // Loader power per lane from the game data (current versions: 0 kW). Data
  // versions extracted before LOADER_POWER_KW existed keep the old 5/10/12 kW.
  const lkw = typeof LOADER_POWER_KW !== 'undefined' ? LOADER_POWER_KW : { 1: 5, 2: 10, 3: 12 };
  let loaderCount = 0, secondLaneCount = 0, thirdLaneCount = 0, powerKw = 0;
  usedSides.forEach(n => {
    if (n >= 1) { loaderCount++;     powerKw += lkw[1] || 0; }
    if (n >= 2) { secondLaneCount++; powerKw += lkw[2] || 0; }
    if (n >= 3) { thirdLaneCount++;  powerKw += lkw[3] || 0; }
  });

  return { powerKw, loaderCount, secondLaneCount, thirdLaneCount };
}

// Returns the number of solid (non-fluid) connections a recipe needs:
// solid ingredient inputs + solid outputs.
function countSolidConnections(recipe, itemName) {
  const solidInputs = (recipe.ingredients || [])
    .filter(ing => !FLUID_ITEMS.has(ing.item)).length;

  let solidOutputs = 0;
  if (Array.isArray(recipe.output)) {
    solidOutputs = recipe.output.filter(o => !FLUID_ITEMS.has(o.item)).length;
  } else if (recipe.output) {
    // Single output — the produced item is the recipe/item name
    solidOutputs = FLUID_ITEMS.has(itemName) ? 0 : 1;
  }
  return solidInputs + solidOutputs;
}

// Sets the calculation depth mode and re-runs the calculation.
// Called from the depth-mode toggle buttons in the results panel.
function setCalcDepthMode(mode) {
  calcDepthMode = mode;
  saveSettings();
  renderPlanOptions();
  calculateRecipes();
}

// ── Main calculation entry point ───────────────────────────────
//
// Called after every user interaction that changes recipes, goals,
// or settings.  Writes results directly into the DOM element
// #recipeResults and then triggers Sankey + Box diagram updates.
//
// High-level flow:
//   1. For each selected recipe → compute output-per-minute (opm)
//      and the number of machines needed to hit the goal.
//   2. Accumulate direct ingredient consumption into `totals`.
//   3. Recursively resolve `totals` down to raw/minable materials
//      using resolveIngredient() → stored in `resolvedTotals` (depth-aware).
//   4. Render three collapsible result tables into #recipeResults.
//   5. Trigger renderSankey() and renderBoxes().
// ── Power plant for the chain ("Calculate power") ────────────
// The fuel of the chosen generator becomes an automatic recipe line
// (auto: 'power'), so its chain, machines, workstations (Optimize) and
// buildings count like any other line. The fuel chain needs power itself →
// fixed point: fuel goal = fuel for (chain demand incl. the fuel chain).
let powerPlanResult = null; // { gen, fuel, kw, fuelPerMin, units, buildings }

function _chainDemandKw() {
  const p = chainPowerKw();
  if (!p) return 0;
  // Fracking Towers: same fixed-fluid rule as calculateRecipes (fixedFluids)
  const fluid = veinsDepleted && typeof VEIN_MINING_FLUIDS !== 'undefined' && Object.values(VEIN_MINING_FLUIDS)[0]?.fluid;
  const frackL = fluid ? p.graph.nodes.reduce((a, n) => n.machineName && n.machineCount > 0
    ? a + (fluidNeedsPerMachine(n.machineName, n.label)[fluid] || 0) * ceilMachines(n.machineCount) : a, 0) : 0;
  return p.machines + p.loaders + (frackingTowerPlan(frackL)?.powerKw || 0)
    + Object.values(fluidPlan(p.graph)).reduce((a, e) => a + e.pumpKw, 0);
}

// Buildings of `units` generators, ratios from the game data (POWER_SOURCES).
function _powerBuildings(gen, units) {
  const byType = t => POWER_SOURCES.find(s => s.type === t);
  const byId   = id => POWER_SOURCES.find(s => s.id === id);
  const up = x => Math.ceil(x - 1e-9);
  if (gen.isNpp) {
    const r = byType('npp_reactor'), t = byType('npp_turbine'), c = byType('npp_cooling_tower');
    const reactors = up(units / r.turbines_per_reactor);
    return { [t.name]: units, [r.name]: reactors, [M.STEAM_GENERATOR_BASE]: reactors,
             [c.name]: up(units / t.turbines_per_cooling_tower) };
  }
  const turbine = byType('steam_turbine');
  if (gen.id.endsWith('_turbine'))    return { [byId(gen.id.slice(0, -8)).name]: units, [turbine.name]: units };
  if (gen.id.endsWith('_geothermal')) return { [byId(gen.id.slice(0, -11)).name]: units,
                                               [turbine.name]: units * Math.round(gen.powerKw / turbine.power_kw) };
  return { [gen.name]: units };
}

function syncPowerLine() {
  const gen = powerPlan.on && typeof POWER_GENERATORS !== 'undefined'
    ? (POWER_GENERATORS.find(g => g.id === powerPlan.gen) || POWER_GENERATORS.find(g => g.isNpp) || POWER_GENERATORS[0]) : null;
  const fuel = gen?.requiresFuel ? (gen.fuels.includes(powerPlan.fuel) ? powerPlan.fuel : gen.fuels[0]) : null;
  const recipeName = fuel && resolveRecipeName(fuel);
  const craftable = !!RECIPES[recipeName]?.ingredients?.length;
  // keep the line object (Optimize holds references and its wsOverride)
  let line = selectedRecipeList.find(l => l.auto === 'power');
  const hasLines = selectedRecipeList.some(l => !l.auto);
  if (line && (!gen || !craftable || line.itemName !== fuel || !hasLines)) {
    selectedRecipeList = selectedRecipeList.filter(l => l !== line);
    line = null;
  }
  if (!gen || !hasLines) { powerPlanResult = null; return; }
  if (!line && craftable) {
    line = sanitizeRecipeList([{ itemName: fuel, recipeName, machineName: preferredMachineFor(RECIPES[recipeName]), goal: 1 }])[0];
    line.auto = 'power';
    selectedRecipeList.push(line);
  }
  const perGen = fuel ? _fuelPerUnitPerMin(gen, fuel) : 0;
  let kw = 0;
  for (let i = 0; i < 20; i++) {
    const next = _chainDemandKw();
    if (line) line.goal = Math.max(1e-6, perGen * next / gen.powerKw);
    const done = Math.abs(next - kw) < 0.5;
    kw = next;
    if (done || !line) break;
  }
  const units = Math.ceil(kw / gen.powerKw - 1e-9);
  powerPlanResult = { gen, fuel, kw, fuelPerMin: perGen * kw / gen.powerKw, units,
                      buildings: units ? _powerBuildings(gen, units) : {} };
}

// Plan options in the sidebar: power plant + one-time build cost
function renderPlanOptions() {
  const el = document.getElementById('planOptions');
  if (!el) return;
  const selStyle = "width:100%;padding:4px 8px;background:var(--color-surface-input);border:1px solid var(--color-border);color:var(--color-text-primary);border-radius:6px;font-size:12px;outline:none";
  const gens = typeof POWER_GENERATORS !== 'undefined' ? POWER_GENERATORS : [];
  const pg = powerPlanResult?.gen || gens.find(g => g.id === powerPlan.gen) || gens[0];
  const st = document.getElementById('planOptionsStatus');
  if (st) st.textContent = [!wsGlobalOn && 'no WS', powerPlan.on && '⚡', buildCostOn && (buildPlan.mode === 'rate' ? '🏗/min' : '🏗')].filter(Boolean).join(' ');
  el.innerHTML = `
    <label style="display:flex;align-items:center;gap:6px;cursor:pointer" title="Add the power plant for this chain: its fuel chain, machines and buildings">
      <input type="checkbox" ${powerPlan.on ? 'checked' : ''} onchange="setPowerPlan({ on: this.checked })">⚡ Calculate power</label>
    ${powerPlan.on && gens.length ? `
      <select style="${selStyle}" onchange="setPowerPlan({ gen: this.value, fuel: null })">
        ${gens.map(g => `<option value="${g.id}" ${g.id === pg?.id ? 'selected' : ''}>${g.name}</option>`).join('')}
      </select>
      ${pg?.requiresFuel && pg.fuels.length > 1 ? `<select style="${selStyle}" onchange="setPowerPlan({ fuel: this.value })">
        ${pg.fuels.map(f => `<option ${f === (powerPlanResult?.fuel || powerPlan.fuel) ? 'selected' : ''}>${f}</option>`).join('')}
      </select>` : ''}` : ''}
    <label style="display:flex;align-items:center;gap:6px;cursor:pointer" title="Global workstations (set per machine group) for the whole chain. A recipe's own Custom WS stays.">
      <input type="checkbox" ${wsGlobalOn ? 'checked' : ''} onchange="setWsGlobal(this.checked)">🔧 Global workstations</label>
    ${Object.keys(wsRecipeConfigs).length ? `<div style="display:flex;align-items:center;gap:6px;font-size:11px;color:var(--text-dim);margin-left:22px">
      ${Object.keys(wsRecipeConfigs).length} chain recipes with Custom WS (WS★)
      <button class="reset-btn" style="margin:0;padding:1px 7px;font-size:11px;width:auto" onclick="resetRecipeWs()">reset</button></div>` : ''}
    <label style="display:flex;align-items:center;gap:6px;cursor:pointer" title="Construction Material of the modular buildings and its raw materials, needed once (shown with Full Detail)">
      <input type="checkbox" ${buildCostOn ? 'checked' : ''} onchange="setBuildCost(this.checked)">🏗 Build cost (one-time)</label>
    ${buildCostOn ? `
      <select style="${selStyle}" onchange="setBuildPlan({ mode: this.value })">
        <option value="once" ${buildPlan.mode === 'once' ? 'selected' : ''}>One-time (total only)</option>
        <option value="rate" ${buildPlan.mode === 'rate' ? 'selected' : ''}>Produce per minute (in the chain)</option>
      </select>
      ${buildPlan.mode === 'rate' ? buildMaterials().map(i => `
        <label style="display:flex;align-items:center;gap:6px;font-size:11px">
          <span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${i}">${i}</span>
          <input type="number" min="0" max="999999" step="any" value="${buildRate(i)}" data-item="${i}" onchange="setBuildRate(this.dataset.item, this.value)"
            style="width:72px;text-align:right;padding:4px 6px;background:var(--color-surface-input);border:1px solid var(--color-border);color:var(--text);border-radius:6px;font-size:12px;outline:none;box-sizing:border-box">/min
        </label>`).join('') : ''}` : ''}
    ${buildCostOn && calcDepthMode !== 3 ? '<span style="color:var(--text-dim);font-size:11px">→ shown in Full Detail</span>' : ''}`;
}

function setPowerPlan(patch) {
  Object.assign(powerPlan, patch);
  saveSettings();
  calculateRecipes();
  renderSelectedRecipes();
}

// Build material lines: in 'rate' mode each material of the modular buildings
// (game data) is a normal chain line at its rate, so its machines, power and
// buildings count like any other line.
function buildMaterials() {
  const s = new Set();
  Object.values(typeof MODULAR_BUILD_COST !== 'undefined' ? MODULAR_BUILD_COST : {})
    .forEach(bc => [bc.fixed, bc.perModule].forEach(o => Object.keys(o || {}).forEach(i => s.add(i))));
  return [...s];
}
const BUILD_RATE_DEFAULT = 100;
const buildRate = item => buildPlan.rates[item] ?? BUILD_RATE_DEFAULT;

function syncBuildLines() {
  const keep = [];
  if (buildCostOn && buildPlan.mode === 'rate' && selectedRecipeList.some(l => !l.auto)) buildMaterials().forEach(item => {
    const rn = resolveRecipeName(item), rate = buildRate(item);
    if (!(rate > 0) || !RECIPES[rn]) return;
    let line = selectedRecipeList.find(l => l.auto === 'build' && l.itemName === item);
    if (!line) {
      line = sanitizeRecipeList([{ itemName: item, recipeName: rn, machineName: preferredMachineFor(RECIPES[rn]), goal: rate }])[0];
      line.auto = 'build';
      selectedRecipeList.push(line);
    }
    line.goal = rate;
    keep.push(line);
  });
  selectedRecipeList = selectedRecipeList.filter(l => l.auto !== 'build' || keep.includes(l));
}

function setBuildPlan(patch) {
  Object.assign(buildPlan, patch);
  saveSettings();
  renderPlanOptions();
  calculateRecipes();
  renderSelectedRecipes();
}

function setBuildRate(item, v) {
  buildPlan.rates[item] = Math.min(Math.max(parseFloat(v) || 0, 0), 999999);
  setBuildPlan({});
}

function setWsGlobal(on) {
  wsGlobalOn = on;
  saveSettings();
  renderSelectedRecipes();
  calculateRecipes();
}

function setBuildCost(on) {
  buildCostOn = on;
  saveSettings();
  renderPlanOptions();
  calculateRecipes();
  renderSelectedRecipes();
}

// One-time material need: the chain math is linear, so expanding an amount
// instead of a rate gives the total once (graph leaves = raw materials).
function oneTimeMaterials(amounts) {
  const saved = [selectedRecipeList, _lastSupply, _lastStock];
  try {
    const lines = Object.entries(amounts).map(([item, goal]) => {
      const rn = resolveRecipeName(item);
      return RECIPES[rn] ? { itemName: item, recipeName: rn, machineName: preferredMachineFor(RECIPES[rn]), goal } : null;
    }).filter(Boolean);
    selectedRecipeList = sanitizeRecipeList(lines).map((l, i) => ({ ...l, goal: lines[i].goal }));
    _lastSupply = {}; _lastStock = {};
    const g = buildSankeyGraph();
    const raw = {};
    (g?.nodes || []).filter(n => n.kind === 'raw').forEach(n => { raw[n.icon || n.label] = (raw[n.icon || n.label] || 0) + n.rate; });
    return raw;
  } finally {
    [selectedRecipeList, _lastSupply, _lastStock] = saved;
  }
}

// The power plant is sized from the byproduct pool of the last calculation
// (_lastSupply). If this run changed the pool, run once more so the result does
// not depend on what was calculated before (import, reload, first click).
let _calcRerun = false;
function calculateRecipes() {
  const before = JSON.stringify(_lastSupply);
  _calculateRecipesOnce();
  if (_calcRerun || !selectedRecipeList.some(l => l.auto) || JSON.stringify(_lastSupply) === before) return;
  _calcRerun = true;
  try { _calculateRecipesOnce(); } finally { _calcRerun = false; }
}

function _calculateRecipesOnce() {
  const hadPowerLine = selectedRecipeList.some(l => l.auto);
  syncBuildLines(); // before the power plant: their chain needs power too
  syncPowerLine();
  // the sidebar shows the power line and its goal, both set just now
  if ((hadPowerLine || selectedRecipeList.some(l => l.auto)) && typeof renderSelectedRecipes === 'function') renderSelectedRecipes();
  if (!selectedRecipeList.length) return;

  // totals[itemName] = total items/min consumed across all selected recipes
  const totals = {};
  // A line's own excavated product as its input (Greenhouse: Biomass → Biomass)
  // comes from excavation directly, not from the line itself.
  const selfExcavated = {};

  // ── Per-recipe line calculation ────────────────────────────
  const lines = selectedRecipeList
    .map((item) => {
      const r = RECIPES[item.recipeName || item.name]; // support both old and new format
      if (!r) return null;

      if (!r.machines[item.machineName]) return null;

      const ct = wsCycleTime(r, item); // seconds per cycle (incl. workstation speed)

      const opm = lineOpm(r, item); // gross for self-feeding loops (goal = machine output)

      // Machines needed: always round up (you can't run half a machine)
      const machines   = ceilMachines(item.goal / opm);
      const actualOpm  = machines * opm;       // actual output with rounded-up machines
      const over       = actualOpm - item.goal; // overproduction due to rounding
      // Machine-equivalents actually needed for the goal (fractional).
      // Material demand follows the goal, not the rounded-up machine count —
      // the extra machine capacity just idles, it doesn't eat ingredients.
      const runs       = item.goal / opm;

      // Accumulate ingredient usage for the direct-materials table
      r.ingredients.forEach((ing) => {
        // ipm = ingredient items consumed per minute
        const ipm = (60 / ct) * ing.amount * runs;
        if (isSelfLoopInput(r, ing.item)) {
          selfExcavated[ing.item] = (selfExcavated[ing.item] || 0) + ipm;
          return;
        }
        totals[ing.item] = (totals[ing.item] || 0) + ipm;
      });

      return {
        ...item,
        displayName: item.itemName || item.name,
        machines,
        runs,
        actualOpm,
        over,
      };
    })
    .filter(Boolean); // drop any recipes that couldn't be resolved

  // ── Fixed fluid supply per machine (Blast Furnace → Hot Air) ──
  const fixedFluids = {}; // fluid → L/min added by fixed per-machine needs (sizes fracking towers)
  lines.forEach(line => {
    Object.entries(fluidNeedsPerMachine(line.machineName, line.recipeName)).forEach(([fluid, perMachine]) => {
      totals[fluid] = (totals[fluid] || 0) + perMachine * line.machines;
      fixedFluids[fluid] = (fixedFluids[fluid] || 0) + perMachine * line.machines;
    });
  });
  // Same rule deeper in the chain: per item, rounded-up machines × fixed fluid.
  const chainFluidDemand = (runsByItem) => {
    const out = {};
    Object.entries(runsByItem).forEach(([item, { machine, runs }]) =>
      Object.entries(fluidNeedsPerMachine(machine, item)).forEach(([fluid, per]) => {
        out[fluid] = (out[fluid] || 0) + per * ceilMachines(runs);
        fixedFluids[fluid] = (fixedFluids[fluid] || 0) + per * ceilMachines(runs);
      }));
    return out;
  };

  // ── Byproducts from selected recipes ────────────────────────
  // Computed from lines directly — independent of depth mode.
  const byproductTotals = {}; // itemName → { amount, machine }
  const chanceProducts  = {}; // recycler line products: usable by the chain, nothing to dispose of
  lines.forEach(line => {
    const r = RECIPES[line.recipeName || line.name];
    // Recycler selected as itself: every output is a product. Chosen as the
    // recipe of one product (variant): that product is the goal, the rest are
    // byproducts like for any recipe.
    if (r?.chanceOutputs && !r.output.some(o => o.item === line.itemName)) {
      const ct = wsCycleTime(r, line);
      r.output.filter(o => !r.ingredients.some(i => i.item === o.item) && o.item !== line.itemName).forEach(o => {
        chanceProducts[o.item] = (chanceProducts[o.item] || 0) + line.runs * (60 / ct) * o.amount;
      });
      return;
    }
    if (!Array.isArray(r?.output) || r.output.length < 2) return;
    const ct = wsCycleTime(r, line);
    for (const sec of sideOutputs(r, line.itemName)) {
      const apm = line.runs * (60 / ct) * sec.amount * (sec.chance ?? 1);
      if (!byproductTotals[sec.item]) byproductTotals[sec.item] = { amount: 0, machine: null };
      byproductTotals[sec.item].amount += apm;
      const disposal = typeof BYPRODUCT_DISPOSAL !== 'undefined' ? BYPRODUCT_DISPOSAL[sec.item] : null;
      if (disposal) byproductTotals[sec.item].machine = disposal.machine;
    }
  });

  // ── Byproducts from full ingredient chain ───────────────────
  // Collect byproducts from intermediate recipes (e.g. Blast Furnace Slag)
  // that are not direct top-level recipes but appear in the ingredient tree.
  // Byproducts per 1 unit/min of an item, memoised: byproducts scale linearly
  // with the amount, so each item's subtree is walked once. (The old per-path
  // walk was exponential on deep chains — Assault Robot took ~5.5 s.)
  // ponytail: the memo keeps the first cycle-truncated result for an item; fine
  // for the rare loops (barrels, reactor), exact for acyclic chains.
  const bpMemo = new Map();
  function byproductsPerUnit(itemName, visitedPath) {
    const resolved = resolveRecipeName(itemName);
    if (visitedPath.has(resolved) || visitedPath.size > 50) return {};
    const memoKey = RECIPES[resolved]?.chanceOutputs ? `${resolved}|${itemName}` : resolved;
    if (bpMemo.has(memoKey)) return bpMemo.get(memoKey);
    const out = {};
    bpMemo.set(memoKey, out);
    const recipe = RECIPES[resolved];
    const machine = recipe?.ingredients?.length && Object.keys(recipe.machines || {}).length
      ? preferredMachineFor(recipe) : null;
    const md = machine && recipe.machines[machine];
    if (!md) return out;
    const chainItem = { itemName: resolved, machineName: machine, product: itemName };
    const runsPerUnit = (60 / wsCycleTime(recipe, chainItem)) / machineOpm(recipe, chainItem);
    {
      sideOutputs(recipe, itemName).forEach(sec => {
        out[sec.item] = (out[sec.item] || 0) + runsPerUnit * sec.amount * (sec.chance ?? 1);
      });
    }
    const nextPath = new Set(visitedPath).add(resolved);
    recipe.ingredients.forEach(ing => {
      const sub = byproductsPerUnit(ing.item, nextPath), f = runsPerUnit * ing.amount;
      Object.entries(sub).forEach(([b, v]) => { out[b] = (out[b] || 0) + v * f; });
    });
    return out;
  }
  const addByproduct = (b, amt) => {
    if (!byproductTotals[b]) {
      const disposal = typeof BYPRODUCT_DISPOSAL !== 'undefined' ? BYPRODUCT_DISPOSAL[b] : null;
      byproductTotals[b] = { amount: 0, machine: disposal ? disposal.machine : null };
    }
    byproductTotals[b].amount += amt;
  };
  // Existing stock replaces production, so it makes no byproducts either
  // (Conveyor II from stock → no slag / waste gas from its steel chain).
  // Subtrees without a stock item use the memo; paths with one go level by level.
  const bpStock = { ...stockItems };
  const stockMemo = new Map();
  function subtreeHasStock(itemName, path) {
    const resolved = resolveRecipeName(itemName);
    if (stockItems[itemName] > 0 || stockItems[resolved] > 0) return true;
    if (path.has(resolved) || path.size > 50) return false;
    if (stockMemo.has(resolved)) return stockMemo.get(resolved);
    stockMemo.set(resolved, false);
    const next = new Set(path).add(resolved);
    const has = (RECIPES[resolved]?.ingredients || []).some(i => subtreeHasStock(i.item, next));
    stockMemo.set(resolved, has);
    return has;
  }
  function chainByproducts(itemName, amount, path) {
    const t = Math.min(bpStock[itemName] || 0, amount);
    if (t > 0) { bpStock[itemName] -= t; amount -= t; }
    if (amount < STOCK_TOLERANCE) return;
    const resolved = resolveRecipeName(itemName);
    if (!subtreeHasStock(itemName, new Set())) {
      Object.entries(byproductsPerUnit(itemName, path)).forEach(([b, perUnit]) => addByproduct(b, perUnit * amount));
      return;
    }
    if (path.has(resolved) || path.size > 50) return;
    const recipe = RECIPES[resolved];
    const machine = recipe?.ingredients?.length && Object.keys(recipe.machines || {}).length
      ? preferredMachineFor(recipe) : null;
    if (!machine || !recipe.machines[machine]) return;
    const chainItem = { itemName: resolved, machineName: machine, product: itemName };
    const runs = amount * (60 / wsCycleTime(recipe, chainItem)) / machineOpm(recipe, chainItem);
    sideOutputs(recipe, itemName).forEach(sec => addByproduct(sec.item, runs * sec.amount * (sec.chance ?? 1)));
    const next = new Set(path).add(resolved);
    recipe.ingredients.forEach(ing => chainByproducts(ing.item, runs * ing.amount, next));
  }
  Object.entries(totals).forEach(([name, val]) => chainByproducts(name, val, new Set()));

  // ── Byproduct supply pool ────────────────────────────────────
  // Byproducts are real output: wherever the chain needs that item again it is
  // taken from here first (e.g. Crude Olumite from emptying barrels). For a
  // byproduct with a reprocessing recipe the pool holds what it COULD become
  // (Slag → Cement): Concrete anywhere in the chain uses slag cement before
  // cement from raw materials, and only that share is reprocessed. The rest of
  // the byproduct is disposed of directly (liquid slag → Flare Stack).
  // ponytail: byproduct amounts come from the full chain before pool savings;
  // a pooled item whose own chain makes byproducts is slightly over-counted.
  const supply = {};
  Object.entries(byproductTotals).forEach(([name, info]) => {
    const rp = typeof BYPRODUCT_DISPOSAL !== 'undefined' ? BYPRODUCT_DISPOSAL[name]?.reprocess : null;
    const repRecipe  = rp && RECIPES[rp.recipe];
    const repMachine = repRecipe && preferredMachineFor(repRecipe);
    if (!repMachine) { supply[name] = (supply[name] || 0) + info.amount; return; }
    const inPerMachine  = (60 / wsCycleTime(repRecipe, { itemName: rp.recipe, machineName: repMachine, product: rp.produces })) * repRecipe.ingredients[0].amount;
    const outPerMachine = machineOpm(repRecipe, { itemName: rp.recipe, machineName: repMachine, product: rp.produces });
    const potential = (info.amount / inPerMachine) * outPerMachine;
    supply[rp.produces] = (supply[rp.produces] || 0) + potential;
    info.reprocessed = { machine: repMachine, recipe: rp.recipe, produces: rp.produces, potential, inPerMachine, outPerMachine };
  });
  Object.entries(chanceProducts).forEach(([item, amt]) => { supply[item] = (supply[item] || 0) + amt; });
  _lastSupply = { ...supply }; // for the Sankey/Boxes graph
  // Takes up to `amount` of `item` from `pool`; returns what still has to be made.
  const takeFrom = (pool, item, amount) => {
    const t = Math.min(pool[item] || 0, amount);
    if (t > 0) pool[item] -= t;
    return amount - t;
  };
  // Existing stock (sidebar) is used after byproducts; only the rest is made.
  // A rest below 0.01/min (display precision; 3.33 entered for 3.333…) counts
  // as covered — otherwise it spawns a whole chain of 1-machine rows at "0/min".
  const takeStock = (pool, item, amount) => {
    const left = takeFrom(pool, item, amount);
    return left < amount && left < STOCK_TOLERANCE ? 0 : left;
  };
  const stockPool = { ...stockItems };
  _lastStock = { ...stockItems };

  // ── Infrastructure: loaders + power per line ────────────────
  const infraByMachine = {}; // aggregated by machineName
  lines.forEach(line => {
    const recipe = RECIPES[line.recipeName || line.name];
    const nSolid  = countSolidConnections(recipe, line.itemName);
    const loaders = calcLoadersForMachine(line.machineName, nSolid);
    const machPwr = machinesPowerKw(line.machineName, 1, line); // per machine, incl. the line's own WS

    const key = line.machineName;
    if (!infraByMachine[key]) {
      infraByMachine[key] = {
        machineName: key, count: 0, line, // first line of this machine type (its WS for power)
        machPwrKw: machPwr,
        totalMachPwrKw: 0,
        loaderCount: 0, secondLaneCount: 0, thirdLaneCount: 0,
        totalLoaderPwrKw: 0,
      };
    }
    const e = infraByMachine[key];
    e.count           += line.machines;
    e.loaderCount     += loaders.loaderCount     * line.machines;
    e.secondLaneCount += loaders.secondLaneCount * line.machines;
    e.thirdLaneCount  += loaders.thirdLaneCount  * line.machines;
    e.totalLoaderPwrKw += loaders.powerKw        * line.machines;
  });

  // Adjacency needs the whole count per type, so total power is set per type
  Object.values(infraByMachine).forEach(e => { e.totalMachPwrKw = machinesPowerKw(e.machineName, e.count, e.line); e.totalWsKw = wsExtraKw(e.machineName, e.count, e.line); });
  const totalMachPwrKw  = Object.values(infraByMachine).reduce((s, e) => s + e.totalMachPwrKw,   0);
  const totalLoaderPwrKw = Object.values(infraByMachine).reduce((s, e) => s + e.totalLoaderPwrKw, 0);
  const totalPwrKw       = totalMachPwrKw + totalLoaderPwrKw;

  // ── Summary stats ────────────────────────────────────────
  const totalMachines   = lines.reduce((s, r) => s + r.machines, 0);
  // Closed loops (Greenhouse) count their net output: 0.3 made, 0.2 back in → 0.1
  const netGoal = (l) => {
    const rec = RECIPES[l.recipeName || l.name];
    return rec?.selfLoop ? l.goal * machineOpm(rec, l) / lineOpm(rec, l) : l.goal;
  };
  const totalGoal       = lines.reduce((s, r) => s + netGoal(r), 0);
  const uniqueMachines  = new Set(lines.map((r) => r.machineName)).size;
  const totalOver       = lines.reduce((s, r) => s + r.over, 0);

  const fmtPwr = (kw) => kw >= 1000
    ? `${(kw / 1000).toLocaleString('de-DE', {maximumFractionDigits: 2})} MW`
    : `${fmt(Math.round(kw))} kW`;

  const depthLabels = ['Direct', 'Intermediate', 'Raw Materials', 'Full Detail'];
  const depthDesc   = ['immediate ingredients only', 'down to plates / rods / steel etc.', 'all the way to raw materials', 'complete production chain with conveyor'];
  const modeSelector = `
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:20px;flex-wrap:wrap">
      <span style="font-size:12px;color:var(--text-dim);flex-shrink:0">Material depth:</span>
      ${depthLabels.map((lbl, i) => `
        <button onclick="setCalcDepthMode(${i})" title="${depthDesc[i]}"
          style="padding:5px 14px;border-radius:6px;border:1px solid ${i === calcDepthMode ? 'var(--accent)' : 'var(--color-border)'};
                 background:${i === calcDepthMode ? 'var(--color-accent-active-bg)' : 'transparent'};
                 color:${i === calcDepthMode ? 'var(--accent)' : 'var(--color-text-secondary)'};
                 cursor:pointer;font-size:12px;font-family:-apple-system,sans-serif;transition:all 0.15s">
          ${lbl}
        </button>`).join('')}
    </div>`;

  // Summary boxes: whole chain (lines alone miss e.g. the Hot Air Stoves that
  // power a Blast Furnace). The Infrastructure section stays per selected line.
  // Built at the end (function): the Fracking Tower plan is known only after
  // the chain was resolved; its towers are not graph nodes.
  const chainPwr = chainPowerKw();
  const fluids   = fluidPlan(chainPwr?.graph);
  const pumpKw   = Object.values(fluids).reduce((a, e) => a + e.pumpKw, 0);
  const summaryHtml = () => {
  const frackKw      = chainPwr && frackPlan ? frackPlan.powerKw : 0;
  const sumMachPwrKw = chainPwr ? chainPwr.machines + frackKw : totalMachPwrKw;
  const sumPwrKw     = chainPwr ? sumMachPwrKw + chainPwr.loaders + pumpKw : totalPwrKw;
  return modeSelector + `
    <div class="summary-grid" style="margin-bottom:28px">
      <div class="summary-box">
        <div class="summary-label">Recipes</div>
        <div class="summary-value">${lines.length}</div>
        <div class="summary-unit">selected</div>
      </div>
      <div class="summary-box orange">
        <div class="summary-label">Total machines</div>
        <div class="summary-value">${fmt(totalMachines)}</div>
        <div class="summary-unit">${uniqueMachines} Machine types</div>
      </div>
      <div class="summary-box green">
        <div class="summary-label">Total production</div>
        <div class="summary-value">${fmt(totalGoal)}</div>
        <div class="summary-unit">Units / Min (sum of goals)</div>
      </div>
      <div class="summary-box">
        <div class="summary-label">Spare capacity</div>
        <div class="summary-value">${fmt(totalOver)}</div>
        <div class="summary-unit">Units / Min (idle, rounded-up machines)</div>
      </div>
      <div class="summary-box orange">
        <div class="summary-label">Machine power</div>
        <div class="summary-value">${chainPwr ? powerCellHtml(sumMachPwrKw, { ws: chainPwr.wsKw }, '') : fmtPwr(sumMachPwrKw)}</div>
        <div class="summary-unit">whole chain, excl. loaders and pumps</div>
      </div>
      <div class="summary-box" style="border-color:var(--color-power-border);background:var(--color-power-bg)">
        <div class="summary-label" style="color:var(--color-power)">Total power</div>
        <div class="summary-value" style="color:var(--color-power)">${chainPwr ? powerCellHtml(sumPwrKw, { ws: chainPwr.wsKw, loaders: chainPwr.loaders, pumps: pumpKw }, '') : fmtPwr(sumPwrKw)}</div>
        <div class="summary-unit">whole chain, machines + loaders + pumps</div>
      </div>
      ${powerPlanResult ? `
      <div class="summary-box" style="border-color:var(--color-power-border);background:var(--color-power-bg)">
        <div class="summary-label" style="color:var(--color-power)">Power plant</div>
        <div class="summary-value" style="color:var(--color-power)">${powerPlanResult.units}× </div>
        <div class="summary-unit">${powerPlanResult.gen.name} · ${fmtPwr(powerPlanResult.kw)} incl. fuel chain${powerPlanResult.fuel ? ` · ${fmt(powerPlanResult.fuelPerMin)} ${powerPlanResult.fuel}/min` : ''}</div>
      </div>` : ''}
    </div>`;
  };

  // ── Icon box helper (full-bleed image with rounded container) ─
  const iconBox = (name, size) =>
    `<div style="width:${size}px;height:${size}px;border-radius:${Math.round(size / 5)}px;overflow:hidden;flex-shrink:0;background:var(--color-bg-elevated);display:flex;align-items:center;justify-content:center;">${getIcon(name, size)}</div>`;

  // ── Production overview table rows ───────────────────────
  let rowIdx = 0;
  const overviewRows = lines
    .map((r) => {
      const recipe = RECIPES[r.recipeName || r.name];
      const ct  = wsCycleTime(recipe, r);
      const rid = 'rrow_' + (rowIdx++); // unique ID for collapsible detail row

      // Build ingredient pills for this recipe's detail row
      let ingPills = recipe.ingredients.map((ing) => {
        const ipm  = (60 / ct) * ing.amount * r.runs;
        const warn = ipm > 100; // highlight high-throughput ingredients
        return `<span style="display:inline-flex;align-items:center;gap:5px;
            background:${warn ? 'var(--color-warning-bg)' : 'var(--color-success-bg)'};
            border:1px solid ${warn ? 'var(--color-warning-border)' : 'var(--color-success-border)'};
            border-radius:4px;padding:3px 8px;font-size:12px;white-space:nowrap">
            ${iconBox(ing.item, 64)}
            <span style="color:var(--text-dim)">${ing.item}</span>
            <span style="font-family:'Share Tech Mono',monospace;color:${warn ? 'var(--warn)' : 'var(--accent3)'}">
              ${fmt(ipm)}<span style="color:var(--text-dim);font-size:10px">/min</span>
            </span>${isSelfLoopInput(recipe, ing.item) ? '<span style="font-size:10px;color:var(--accent3)" title="Fed back from the machine\'s own output">↻ from own output</span>' : ''}
          </span>`;
      }).join('');

      if (recipe.chanceOutputs) {
        ingPills += chanceProductPills(recipe, r.runs * (60 / ct) * (recipe.ingredients[0]?.amount || 1), iconBox, 64);
      } else
      // Add byproduct pills if the recipe has secondary outputs
      if (Array.isArray(recipe.output) && recipe.output.length > 1) {
        const byproductPills = recipe.output.slice(1).map(sec => {
          const apm = (60 / ct) * sec.amount * (sec.chance ?? 1) * r.runs;
          return `<span style="display:inline-flex;align-items:center;gap:5px;
              background:var(--color-byproduct-bg);border:1px solid var(--color-byproduct-border);
              border-radius:4px;padding:3px 8px;font-size:12px;white-space:nowrap">
              ${iconBox(sec.item, 64)}
              <span style="color:var(--color-byproduct)">${sec.item}</span>
              <span style="font-family:'Share Tech Mono',monospace;color:var(--color-byproduct)">
                ${fmt(apm)}<span style="color:var(--text-dim);font-size:10px">/min</span>
              </span>
              <span style="font-size:10px;color:var(--color-byproduct);background:var(--color-byproduct-bg);border:1px solid var(--color-byproduct-border);border-radius:3px;padding:1px 4px">Nebenprodukt</span>
            </span>`;
        }).join('');
        ingPills += byproductPills;
      }

      // Show a badge when output is probabilistic (e.g. Crystal Refiner outputs)
      const hasChance = !Array.isArray(recipe.output) && recipe.output && recipe.output.chance != null && recipe.output.chance < 1;
      const chanceBadge = hasChance
        ? `<span title="${recipe.output.amount} per cycle at ${Math.round(recipe.output.chance * 100)}% chance (avg ${(recipe.output.amount * recipe.output.chance).toFixed(1)}/cycle)" style="display:inline-flex;align-items:center;gap:3px;background:var(--color-byproduct-bg);border:1px solid var(--color-warning-border);border-radius:3px;padding:1px 5px;font-size:10px;color:var(--color-warning-text);cursor:help;flex-shrink:0">⚡ ${Math.round(recipe.output.chance * 100)}%</span>`
        : '';

      return `
    <tr class="recipe-main-row" onclick="toggleRecipeRow('${rid}')">
      <td style="padding:7px 12px"><div style="display:flex;align-items:center;gap:6px">
        <span class="row-expand-arrow" id="arr_${rid}">▶</span>
        ${iconBox(r.displayName, 64)}<span class="label">${r.displayName}</span>${productNote(r.recipeName, r.displayName)}${recipe.selfLoop ? `<span style="font-size:11px;color:var(--accent3);margin-left:6px" title="${fmt(r.goal - r.goal * machineOpm(recipe, r) / lineOpm(recipe, r))}/min go back into the loop">net +${fmt(r.goal * machineOpm(recipe, r) / lineOpm(recipe, r))}/min</span>` : ''}
        ${r.recipeName !== r.itemName && r.itemName ? '<span style="font-size:10px;color:var(--text-dim);margin-left:4px">' + (r.recipeName || "") + "</span>" : ""}
      </div></td>
      <td style="padding:7px 12px">
        <div style="display:flex;align-items:center;gap:8px">${iconBox(r.machineName, 64)}<span style="color:var(--text-dim);font-size:13px">${r.machineName}</span>${wsBadge(r)}</div>
        ${r.machineName === M.ASSEMBLY_LINE ? `<div style="font-size:10px;color:var(--color-text-disabled);margin-top:3px;padding-left:2px;line-height:1.7">
          └&nbsp;${r.machines * ASSEMBLY_LINE_COMPOSITION.start.count}×&nbsp;${ASSEMBLY_LINE_COMPOSITION.start.name}
          &nbsp;·&nbsp;${r.machines * ASSEMBLY_LINE_COMPOSITION.producer.count}×&nbsp;${ASSEMBLY_LINE_COMPOSITION.producer.name}
          &nbsp;·&nbsp;${r.machines * ASSEMBLY_LINE_COMPOSITION.painter.count}×&nbsp;${ASSEMBLY_LINE_COMPOSITION.painter.name}
        </div>` : ''}
      </td>
      <td class="num">${r.machines}</td>
      <td class="num" style="white-space:nowrap">${fmt(r.goal)}${chanceBadge ? ' ' + chanceBadge : ''}</td>
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


  // ── Material resolution (depth-aware) ───────────────────────
  //
  // resolvedTotals holds the final per-item demand shown in the
  // materials table. What it contains depends on calcDepthMode:
  //   0 = Direct      → just `totals` (no recursion)
  //   1 = Intermediate → recurse, but stop at INTERMEDIATE_ITEMS
  //   2 = Full         → recurse all the way to raw materials
  //
  // resolvedTotals[name] = { amount: Number, machine: String|null }
  const resolvedTotals  = {};
  // Fractional machine count per resolved item (modes 1+2). The same item can be
  // reached via several paths — sum first, round up once per item at the end.
  const resolvedMachineRuns = {}; // resolvedItem → { machine, runs }
  const addMachineRuns = (item, machine, runs) => {
    const e = (resolvedMachineRuns[item] ||= { machine, runs: 0 });
    e.runs += runs;
  };
  const cycleWarnings   = new Set();

  // Build a map: fluid key (lowercase_underscore) → producer machine name
  // Populated from modular building recipes (e.g. "hot_air" → "Hot Air Stove Base")
  // and from FLUID_SOURCE_MACHINES (e.g. "water" → "Pipe Intake").
  const fluidProducerMap = {};
  Object.entries(RECIPES).forEach(([name, r]) => {
    const out = r.modular_building_details?.output;
    if (out && out !== 'none') fluidProducerMap[out] = name;
  });
  if (typeof FLUID_SOURCE_MACHINES !== 'undefined') {
    Object.entries(FLUID_SOURCE_MACHINES).forEach(([key, info]) => {
      // keyed by item name ("Water"); lookups below use the normalised key
      fluidProducerMap[key.toLowerCase().replace(/\s+/g, '_')] = fluidSourceFor(key)?.machine || info.machine;
    });
  }

  // Source shown for a raw item without a producing machine: fluid intake or
  // an external delivery (Firmarlite Bar ← Space Station).
  const rawSource = (item) => fluidProducerMap[item.toLowerCase().replace(/\s+/g, '_')]
    || (typeof EXTERNAL_SOURCES !== 'undefined' && EXTERNAL_SOURCES[item])
    || (typeof EXCAVATION !== 'undefined' && EXCAVATION.items?.includes(item) && excavationSource()) || null;

  // Self-feeding recipes (Greenhouse: 1 Biomass → 2) of excavated items: the
  // input that closes the loop comes from excavation — own row, like Water.
  const isExcavated = (item) => typeof EXCAVATION !== 'undefined' && EXCAVATION.items?.includes(item);
  const excavationKey = (item) => `${item} (Excavation)`;
  const addExcavationInput = (item, amount) => {
    const key = excavationKey(item);
    if (!resolvedTotals[key]) resolvedTotals[key] = { amount: 0, machine: excavationSource(), icon: item, excavated: true, initial: true };
    resolvedTotals[key].amount += amount;
  };

  // Always compute direct-level materials (mode-0 view) — used for Direct Materials
  // section in modes 0 and 1.
  const directTotals = {};
  const directPool   = { ...supply };
  const directStock  = { ...stockItems };
  Object.entries(totals).forEach(([name, val]) => {
    val = takeStock(directStock, name, takeFrom(directPool, name, val));
    if (val <= 1e-9) return;
    const resolved = resolveRecipeName(name);
    const recipe   = RECIPES[resolved];
    // Raw (no ingredients) → miner choice; crafted → machine family default
    const machine  = !recipe ? null
      : recipe.ingredients?.length ? preferredMachineFor(recipe) : preferredMinerFor(resolved, recipe);
    directTotals[name] = { amount: val, machine: machine || rawSource(resolved), recipeName: resolved };
  });
  Object.entries(selfExcavated).forEach(([item, amt]) => {
    directTotals[excavationKey(item)] = { amount: amt, machine: excavationSource(), icon: item, excavated: true, initial: true };
  });
  const addSelfExcavated = () => Object.entries(selfExcavated).forEach(([item, amt]) => addExcavationInput(item, amt));

  if (calcDepthMode === 0) {
    Object.assign(resolvedTotals, directTotals);
  } else if (calcDepthMode === 3) {
    // Full Detail: collect every item at every level of the production chain
    function resolveAllLevels(itemName, amountPerMin, visitedPath) {
      const resolved = resolveRecipeName(itemName);
      if (visitedPath.has(resolved)) { cycleWarnings.add(resolved); return; }
      if (visitedPath.size > 50) return;
      amountPerMin = takeStock(stockPool, itemName, takeFrom(supply, itemName, amountPerMin)); // byproducts, then stock
      if (amountPerMin <= 1e-9) return;

      const recipe = RECIPES[resolved];
      const addItem = (machine) => {
        if (!resolvedTotals[itemName]) resolvedTotals[itemName] = { amount: 0, machine, recipeName: resolved };
        resolvedTotals[itemName].amount += amountPerMin;
      };

      if (!recipe || !recipe.machines || Object.keys(recipe.machines).length === 0 || getOutputAmount(recipe) === 0) {
        addItem(rawSource(resolved));
        return;
      }
      if (!recipe.ingredients || recipe.ingredients.length === 0) {
        addItem(preferredMinerFor(resolved, recipe));
        return;
      }
      // Crafted item: add it, then recurse into ingredients
      const machine = preferredMachineFor(recipe);
      const machData = recipe.machines[machine];
      const ct  = wsCycleTime(recipe, { itemName: resolved, machineName: machine });
      const opm = machineOpm(recipe, { itemName: resolved, machineName: machine, product: itemName });
      addItem(machine);

      // Byproducts are NOT tracked here: they come from byproductTotals (same
      // source as the Byproducts panel, incl. the supply pool) — see below.
      // Tracking them here mixed them with the same item used as an ingredient
      // (Xeno-Crystal: 2/min byproduct + 238/min demand shown as "Incinerator").

      const nextPath = new Set(visitedPath);
      nextPath.add(resolved);
      recipe.ingredients.forEach(ing => {
        if (isSelfLoopInput(recipe, ing.item)) { addExcavationInput(ing.item, (amountPerMin / opm) * ing.amount * (60 / ct)); return; }
        resolveAllLevels(ing.item, (amountPerMin / opm) * ing.amount * (60 / ct), nextPath);
      });
    }
    // Start from direct ingredients AND include the produced items themselves
    lines.forEach(line => {
      const recipe = RECIPES[line.recipeName || line.name];
      if (!recipe || !recipe.machines[line.machineName]) return;
      const key = line.displayName || line.itemName;
      if (!resolvedTotals[key]) resolvedTotals[key] = { amount: 0, machine: line.machineName, recipeName: line.recipeName || line.name };
      resolvedTotals[key].amount += line.goal;
    });
    addSelfExcavated();
    Object.entries(totals).forEach(([name, val]) => resolveAllLevels(name, val, new Set()));
    {
      const lineKeys = new Set(lines.map(l => l.displayName || l.itemName)); // already in totals
      const runsByItem = {};
      Object.entries(resolvedTotals).forEach(([name, info]) => {
        const rec = RECIPES[info.recipeName];
        if (info.byproduct || lineKeys.has(name) || !rec?.machines?.[info.machine]) return;
        if (!Object.keys(fluidNeedsPerMachine(info.machine, info.recipeName)).length) return;
        runsByItem[info.recipeName] = { machine: info.machine, runs: info.amount / machineOpm(rec, { itemName: info.recipeName, machineName: info.machine, product: name }) };
      });
      Object.entries(chainFluidDemand(runsByItem)).forEach(([f, amt]) => resolveAllLevels(f, amt, new Set()));
    }

    // Max-depth ordering: each item gets the DEEPEST level at which it appears.
    // This ensures raw materials (used by multiple levels) always appear at the bottom.
    {
      const depthMap = {};
      function computeMaxDepth(itemName, depth, visitedPath) {
        if (visitedPath.has(itemName)) return;
        depthMap[itemName] = Math.max(depthMap[itemName] ?? 0, depth);
        const info = resolvedTotals[itemName];
        if (!info) return;
        const rec = RECIPES[info.recipeName || itemName];
        if (rec && rec.ingredients) {
          const next = new Set(visitedPath);
          next.add(itemName);
          rec.ingredients.forEach(ing => computeMaxDepth(ing.item, depth + 1, next));
        }
      }
      lines.forEach(line => computeMaxDepth(line.displayName || line.itemName, 0, new Set()));
      Object.entries(resolvedTotals).forEach(([name, info]) => {
        // Byproducts always appear at the bottom, after all regular items
        if (info.byproduct) { info.order = 1000000; return; }
        info.order = depthMap[name] ?? 999999;
      });
    }
  } else {
    // Modes 1 + 2: recursive resolution
    function resolveIngredient(itemName, amountPerMin, visitedPath) {
      const resolved = resolveRecipeName(itemName);

      if (visitedPath.has(resolved)) {
        cycleWarnings.add(resolved);
        console.warn('foundry-calc: ingredient cycle detected at:', resolved, '← path:', [...visitedPath]);
        return;
      }
      if (visitedPath.size > 50) return;
      amountPerMin = takeStock(stockPool, itemName, takeFrom(supply, itemName, amountPerMin)); // byproducts, then stock
      if (amountPerMin <= 1e-9) return;

      const recipe = RECIPES[resolved];

      // Helper: add item to resolvedTotals using canonical itemName as display key
      const addToTotals = (machine) => {
        if (!resolvedTotals[itemName]) resolvedTotals[itemName] = { amount: 0, machine, recipeName: resolved };
        resolvedTotals[itemName].amount += amountPerMin;
      };

      // No recipe or no output → raw material (or fluid from modular building)
      if (!recipe || !recipe.machines || Object.keys(recipe.machines).length === 0 ||
          getOutputAmount(recipe) === 0) {
        // Mode 1: skip raw materials — only crafted intermediates are shown
        if (calcDepthMode === 1) return;
        addToTotals(rawSource(resolved));
        return;
      }

      // Minable ore (has machines but no ingredients)
      if (!recipe.ingredients || recipe.ingredients.length === 0) {
        // Mode 1: skip raw/mined items
        if (calcDepthMode === 1) return;
        const machine = preferredMinerFor(resolved, recipe);
        addToTotals(machine);
        // Track miner machine count
        if (recipe.machines[machine]) addMachineRuns(resolved, machine, amountPerMin / machineOpm(recipe, { itemName: resolved, machineName: machine }));
        return;
      }

      // Mode 1 stop: intermediate item → treat as a leaf
      if (calcDepthMode === 1 && INTERMEDIATE_ITEMS.has(resolved)) {
        addToTotals(preferredMachineFor(recipe));
        return;
      }

      // Recurse into sub-ingredients, tracking the machine used at this level
      const machineName = preferredMachineFor(recipe);
      const machData    = recipe.machines[machineName];
      const ct  = wsCycleTime(recipe, { itemName: resolved, machineName });
      const opm = machineOpm(recipe, { itemName: resolved, machineName, product: itemName });
      const runsPerMin = amountPerMin / opm;

      // Track this machine
      addMachineRuns(resolved, machineName, runsPerMin);

      const nextPath = new Set(visitedPath);
      nextPath.add(resolved);

      recipe.ingredients.forEach(ing => {
        const ingPerMin = runsPerMin * ing.amount * (60 / ct);
        if (isSelfLoopInput(recipe, ing.item)) { if (calcDepthMode !== 1) addExcavationInput(ing.item, ingPerMin); return; }
        resolveIngredient(ing.item, ingPerMin, nextPath);
      });
    }

    if (calcDepthMode !== 1) addSelfExcavated(); // mode 1 lists no raw materials
    Object.entries(totals).forEach(([name, val]) => {
      resolveIngredient(name, val, new Set());
    });
    Object.entries(chainFluidDemand(resolvedMachineRuns)).forEach(([f, amt]) => resolveIngredient(f, amt, new Set()));
  }

  // What the chain did not use of each byproduct (or its reprocessed product)
  // still has to be disposed of.
  Object.entries(byproductTotals).forEach(([name, info]) => {
    const rp = info.reprocessed;
    if (!rp) { info.leftover = supply[name] ?? info.amount; return; }
    rp.producedPerMin = Math.max(0, rp.potential - (supply[rp.produces] || 0)); // used by the chain
    const usedInput   = rp.producedPerMin / rp.outPerMachine * rp.inPerMachine;
    rp.count          = ceilMachines(usedInput / rp.inPerMachine);
    info.leftover     = Math.max(0, info.amount - usedInput);
  });
  // Full Detail: one row per byproduct that really leaves the chain — the
  // unused rest (→ disposal) or the reprocessed share (→ e.g. Chemical Processor).
  if (calcDepthMode === 3) {
    Object.entries(byproductTotals).forEach(([name, info]) => {
      const amount = info.reprocessed?.count > 0 ? info.amount : info.leftover;
      if (!(amount > 0.01) || resolvedTotals[name]) return;
      const disposal = typeof BYPRODUCT_DISPOSAL !== 'undefined' ? BYPRODUCT_DISPOSAL[name] : null;
      resolvedTotals[name] = { amount, machine: disposal ? disposal.machine : null,
                               recipeName: name, byproduct: true, order: 1000000 };
    });
  }
  // ── Space station shipping: lines marked "for sale" go up, items delivered
  // by the station (EXTERNAL_SOURCES, e.g. Firmarlite Bar) come down.
  const usedPool = calcDepthMode === 0 ? directStock : stockPool;
  const stockRows = Object.entries(stockItems).map(([item, have]) => ({
    item, have, used: Math.round((have - (usedPool[item] || 0)) * 1000) / 1000,
  }));
  const shipping = [];
  lines.filter(l => l.forSale).forEach(l => {
    const p = shippingPlan(l.itemName, l.goal, 'up', l.machineName === M.ASSEMBLY_LINE);
    if (p) shipping.push(p);
  });
  if (typeof EXTERNAL_SOURCES !== 'undefined') {
    Object.keys(EXTERNAL_SOURCES).forEach(item => {
      const amount = resolvedTotals[item]?.amount ?? directTotals[item]?.amount ?? 0;
      const p = shippingPlan(item, amount, 'down', false);
      if (p) shipping.push(p);
    });
  }
  const frackPlan = frackingTowerPlan(
    typeof VEIN_MINING_FLUIDS !== 'undefined' && veinsDepleted
      ? fixedFluids[Object.values(VEIN_MINING_FLUIDS)[0]?.fluid] || 0 : 0);

  // Machine runs of a results row: the selected line's share at its gross rate
  // (lineOpm), any further chain demand at the net rate (self-feeding loops).
  function rowRunsOf(rec, item, name, val) {
    item = { ...item, product: name };
    if (!rec.selfLoop) return val / machineOpm(rec, item);
    const lineGoal = Math.min(val, lines.filter(l => (l.displayName || l.itemName) === name).reduce((a, l) => a + l.goal, 0));
    return lineGoal / lineOpm(rec, item) + (val - lineGoal) / machineOpm(rec, item);
  }

  // ── Material table builder (shared by Direct + resolved sections) ───────────
  function buildMaterialRows(totalsMap) {
    let totMachPwr = 0, totLoaderPwr = 0;
    let totLoader = 0, totSecond = 0, totThird = 0;

    const rows = Object.entries(totalsMap)
      .sort((a, b) => b[1].amount - a[1].amount)
      .map(([name, info]) => {
        const val     = info.amount;
        const machine = info.machine;
        const cls = val > 100 ? "num-warn" : "num";

        let machineTd = '<td colspan="5"></td>';
        if (machine) {
          const rec = RECIPES[info.recipeName || name];
          const md  = rec && rec.machines[machine];
          if (md) {
            const opm         = machineOpm(rec, { itemName: info.recipeName || name, machineName: machine, product: name });
            const count       = ceilMachines(val / opm);
            const machPwrKw   = machinesPowerKw(machine, count, { itemName: info.recipeName || name, machineName: machine });
            const machWsKw    = wsExtraKw(machine, count, { itemName: info.recipeName || name, machineName: machine });
            const nSolid      = countSolidConnections(rec, name);
            const loaders     = calcLoadersForMachine(machine, nSolid);
            const loaderPwrKw = loaders.powerKw * count;
            const loaderDesc  = [
              loaders.loaderCount     ? `${loaders.loaderCount     * count}× Loader` : '',
              loaders.secondLaneCount ? `${loaders.secondLaneCount * count}× 2nd`    : '',
              loaders.thirdLaneCount  ? `${loaders.thirdLaneCount  * count}× 3rd`    : '',
            ].filter(Boolean).join(' · ') || '—';

            totMachPwr  += machPwrKw;
            totLoaderPwr += loaderPwrKw;
            totLoader   += loaders.loaderCount     * count;
            totSecond   += loaders.secondLaneCount * count;
            totThird    += loaders.thirdLaneCount  * count;

            machineTd = `
              <td style="padding:6px 12px"><div style="display:flex;align-items:center;gap:8px">${iconBox(machine, 64)}<span class="label">${machine}</span>${wsBadge({ itemName: info.recipeName || name, machineName: machine })}</div></td>
              <td class="num">${count}</td>
              <td class="num">${powerCellHtml(machPwrKw, { ws: machWsKw }, '')}</td>
              <td style="padding:6px 12px;font-size:12px;color:var(--text-dim)">${loaderDesc}</td>
              <td class="num" style="color:var(--color-power)">${powerCellHtml(machPwrKw + loaderPwrKw, { ws: machWsKw, loaders: loaderPwrKw }, '')}</td>`;
          } else {
            // Check for capacity-based machines (fluid sources with throughput_l_per_min)
            const machineRec = RECIPES[machine];
            const fluidKey = name.toLowerCase().replace(/\s+/g, '_');
            const fluidSrc = typeof FLUID_SOURCE_MACHINES !== 'undefined' ? (FLUID_SOURCE_MACHINES[name] || FLUID_SOURCE_MACHINES[fluidKey]) : null;
            const capacityLpm = fluidSrc?.capacityPerMin ?? machineRec?.throughput_l_per_min ?? null;
            if (capacityLpm) {
              const count = Math.ceil(val / capacityLpm);
              const machPwrKw = machinesPowerKw(machine, count, { itemName: resolveRecipeName(name), machineName: machine });
              totMachPwr += machPwrKw;
              machineTd = `
                <td style="padding:6px 12px"><div style="display:flex;align-items:center;gap:8px">${iconBox(machine, 64)}<span class="label">${machine}</span></div></td>
                <td class="num">${count}</td>
                <td class="num">${fmtPwr(machPwrKw)}</td>
                <td style="padding:6px 12px;font-size:12px;color:var(--text-dim)">—</td>
                <td class="num" style="color:var(--color-power)">${fmtPwr(machPwrKw)}</td>`;
            } else {
              machineTd = `<td style="padding:6px 12px"><div style="display:flex;align-items:center;gap:8px">${iconBox(machine, 64)}<span class="label">${machine}</span></div></td><td class="num">—</td><td class="num">—</td><td></td><td class="num">—</td>`;
            }
          }
        }
        return `
      <tr>
        <td style="padding:6px 12px"><div style="display:flex;align-items:center;gap:10px">${iconBox(info.icon || name, 64)}<span class="label">${name}</span></div></td>
        <td class="${cls}">${info.initial ? `${fmt(val)} <span style="font-size:10px;color:var(--text-dim)" title="One-time start fill; afterwards the loop feeds itself">once</span>` : fmt(val)}</td>
        <td class="num">${info.initial ? '—' : `${fmt(val / 60)}/s`}</td>
        ${machineTd}
      </tr>`;
      }).join('');

    const loaderDesc = [
      totLoader ? `${totLoader}× Loader` : '',
      totSecond ? `${totSecond}× 2nd`    : '',
      totThird  ? `${totThird}× 3rd`     : '',
    ].filter(Boolean).join(' · ') || '—';

    const footer = `
      <tr style="border-top:1px solid var(--color-border);font-weight:600">
        <td style="padding:6px 12px;color:var(--text-dim)" colspan="3">Total</td>
        <td colspan="2"></td>
        <td class="num">${fmtPwr(totMachPwr)}</td>
        <td style="padding:6px 12px;font-size:12px;color:var(--text-dim)">${loaderDesc}</td>
        <td class="num" style="color:var(--color-power)">${fmtPwr(totMachPwr + totLoaderPwr)}</td>
      </tr>`;

    return { rows, footer, count: Object.keys(totalsMap).length };
  }

  const depthTitles = ['Direct Materials', 'Intermediate Materials', 'Raw Materials', 'Full Detail'];

  // ── Conveyor throughput (for Full Detail mode) ───────────────
  const conveyorFamily  = MACHINE_FAMILIES.find(f => f.label === 'Conveyor Belt');
  const conveyorType    = conveyorFamily?.defaultChoice || conveyorFamily?.machines[0] || 'Conveyor I';
  const conveyorThroughput = conveyorItemsPerMin(); // was a missing data field → always 160

  // ── Full Detail: compact Factorio-calc-style rows ─────────────
  function buildFullDetailRows(totalsMap) {
    let totMachPwr = 0, totLoaderPwr = 0;
    let fdIdx = 0;
    // Buildings of the whole chain, summed per type (conveyors/pipes are
    // throughput shares, not piece counts, so they are not included)
    const buildings = {};
    const tally = (b, n) => {
      if (!b || !(n > 0)) return;
      // An Assembly Line is several buildings (start, producers, painter);
      // its rails have no fixed length, like conveyors
      if (b === M.ASSEMBLY_LINE && typeof ASSEMBLY_LINE_COMPOSITION !== 'undefined') {
        ['start', 'producer', 'painter'].forEach(k => tally(ASSEMBLY_LINE_COMPOSITION[k].name, ASSEMBLY_LINE_COMPOSITION[k].count * n));
        return;
      }
      buildings[b] = (buildings[b] || 0) + n;
    };

    const rows = Object.entries(totalsMap)
      .sort((a, b) => {
        const oA = a[1].order ?? 999999, oB = b[1].order ?? 999999;
        if (oA !== oB) return oA - oB;
        // Within same depth: crafted items (have ingredients) before raw/mined
        const recA = RECIPES[a[1].recipeName || a[0]];
        const recB = RECIPES[b[1].recipeName || b[0]];
        const rawA = (!recA || !recA.ingredients || recA.ingredients.length === 0) ? 1 : 0;
        const rawB = (!recB || !recB.ingredients || recB.ingredients.length === 0) ? 1 : 0;
        return rawA - rawB;
      })
      .map(([name, info]) => {
        const val     = info.amount;
        const machine = info.machine;
        // A selected line with its own workstation (Custom / No WS) counts with
        // that WS, like its demand does; chain-only rows use the global WS.
        // ponytail: extra chain demand of the same item shares the line's WS
        const ownLine = lines.find(l => (l.displayName || l.itemName) === name && l.machineName === machine);
        const rowItem = { itemName: info.recipeName || name, machineName: machine,
                          ...(ownLine && ownLine.wsOverride !== undefined ? { wsOverride: ownLine.wsOverride } : {}) };
        const isFluid = FLUID_ITEMS.has(name);
        const rid     = 'fd_' + (fdIdx++);

        let machineCell  = '<span style="color:var(--text-dim);font-size:12px">—</span>';
        let loaderCell   = '';
        let pwrCell      = '<span style="color:var(--text-dim)">—</span>';
        let ingPills     = '';

        // Conveyor (solids) or Pipe (fluids)
        const pipeThroughput = RECIPES['Pipe']?.throughput_l_per_min || 36000;
        let rowKw = 0; // machine (+ loader) power of this row; pumps added below
        let rowWsKw = 0, rowLoaderKw = 0; // for the hover breakdown
        const fp = isFluid ? fluids[name] : null;
        if (fp) totMachPwr += fp.pumpKw;
        if (fp) fp.pumpList.forEach(p => tally(p.name, p.count));
        const conveyorCell = fp
          ? `<div style="display:flex;flex-direction:column;gap:3px">${fp.lines.map(l => `<div style="display:flex;align-items:center;gap:4px">${iconBox(l.type, 48)}<span style="font-size:12px;color:var(--text-dim)">${l.type}</span><span style="font-family:'Share Tech Mono',monospace;font-size:13px;color:var(--accent3)">×${l.count}</span></div>`).join('')}${fp.pumpList.map(p => `<div style="display:flex;align-items:center;gap:4px" title="Pipe and pipeline do not connect directly">${iconBox(p.name, 32)}<span style="font-size:11px;color:var(--text-dim)">${p.name}</span><span style="font-family:'Share Tech Mono',monospace;font-size:12px;color:var(--accent3)">×${p.count}</span><span style="font-size:11px;color:var(--color-power)">${fmtPwr(p.count * p.kw)}</span></div>`).join('')}</div>`
          : isFluid
          ? `<div style="display:flex;align-items:center;gap:4px">${iconBox('Pipe', 48)}<span style="font-family:'Share Tech Mono',monospace;font-size:13px;color:var(--accent3)">${(val / pipeThroughput).toFixed(2)}</span></div>`
          : `<div style="display:flex;align-items:center;gap:4px">${iconBox(conveyorType, 48)}<span style="font-family:'Share Tech Mono',monospace;font-size:13px;color:var(--accent3)">${(val / conveyorThroughput).toFixed(2)}</span></div>`;

        // Byproduct disposal machines (e.g. Flare Stack for Waste Gas) don't have
        // a cycleTime-based recipe — handle them with their capacity directly.
        // If a reprocessing option exists and was triggered, show that instead.
        const disposal = (typeof BYPRODUCT_DISPOSAL !== 'undefined') ? BYPRODUCT_DISPOSAL[name] : null;
        if (disposal && info.byproduct) {
          const rp = byproductTotals[name]?.reprocessed;
          if (rp?.count > 0) {
            // Reprocessing: e.g. Chemical Processor for Blast Furnace Slag → Cement
            const machPwrKw = machinesPowerKw(rp.machine, rp.count, { itemName: rp.recipe, machineName: rp.machine });
            totMachPwr += machPwrKw;
            tally(rp.machine, rp.count);
            machineCell = `<div style="display:flex;align-items:center;gap:5px">${iconBox(rp.machine, 48)}<span style="font-size:12px;color:var(--text-dim)">${rp.machine}</span><span style="font-family:'Share Tech Mono',monospace;font-size:13px;color:var(--accent3)">×${rp.count}</span><span style="font-size:10px;color:var(--color-success-text);margin-left:4px">→ ${fmt(rp.producedPerMin)}/min ${rp.produces}</span></div>`;
            // Unused rest goes straight to disposal (e.g. 200/min slag → Flare Stack)
            const rest = byproductTotals[name]?.leftover || 0;
            const restCount = rest > 0.01 ? ceilMachines(rest / disposal.capacityPerMin) : 0;
            const restPwrKw = machinesPowerKw(disposal.machine, restCount, { itemName: resolveRecipeName(disposal.machine), machineName: disposal.machine }); // Flare Stack / Incinerator draw power too
            totMachPwr += restPwrKw;
            tally(disposal.machine, restCount);
            if (restCount) machineCell += `<div style="display:flex;align-items:center;gap:5px;margin-top:3px">${iconBox(disposal.machine, 48)}<span style="font-size:12px;color:var(--text-dim)">${disposal.machine}</span><span style="font-family:'Share Tech Mono',monospace;font-size:13px;color:var(--accent3)">×${restCount}</span><span style="font-size:10px;color:var(--text-dim);margin-left:4px">rest ${fmt(rest)}/min</span></div>`;
            rowKw = machPwrKw + restPwrKw;
          } else {
            const count     = Math.ceil(val / disposal.capacityPerMin);
            const machPwrKw = machinesPowerKw(disposal.machine, count, { itemName: resolveRecipeName(disposal.machine), machineName: disposal.machine });
            totMachPwr += machPwrKw;
            tally(disposal.machine, count);
            machineCell = `<div style="display:flex;align-items:center;gap:5px">${iconBox(disposal.machine, 48)}<span style="font-size:12px;color:var(--text-dim)">${disposal.machine}</span><span style="font-family:'Share Tech Mono',monospace;font-size:13px;color:var(--accent3)">×${count}</span></div>`;
            rowKw = machPwrKw;
          }
        } else if (machine) {
          const rec = RECIPES[info.recipeName || name];
          const md  = rec && rec.machines[machine];
          // Fluid source machines from fluidProducerMap (no cycleTime-based recipe for this item)
          const machineRec = RECIPES[machine];
          const fluidKey   = name.toLowerCase().replace(/\s+/g, '_');
          const fluidSrc   = fluidSourceFor(name);
          const capacityLpm = fluidSrc?.capacityPerMin ?? machineRec?.throughput_l_per_min ?? null;
          if (!md && capacityLpm) {
            // Capacity-based count (e.g. Pipe Intake → ceil(waterRate / 30000))
            const count     = Math.ceil(val / capacityLpm);
            const machPwrKw = machinesPowerKw(machine, count, { itemName: resolveRecipeName(name), machineName: machine });
            totMachPwr += machPwrKw;
            tally(machine, count);
            machineCell = `<div style="display:flex;align-items:center;gap:5px">${iconBox(machine, 48)}<span style="font-size:12px;color:var(--text-dim)">${machine}</span><span style="font-family:'Share Tech Mono',monospace;font-size:13px;color:var(--accent3)">×${count}</span></div>`;
            rowKw = machPwrKw;
          } else if (!md) {
            // No capacity data — show machine name only (e.g. Air Intake Base).
            // Excavated items (Dirt, Sand, Stone …): list every way to gather them.
            const excavation = typeof EXCAVATION !== 'undefined' && EXCAVATION.tools.includes(machine)
              ? `<span style="font-size:10px;color:var(--text-dim);margin-left:4px" title="Gathered from the world">excavation: ${EXCAVATION.tools.join(' / ')}</span>` : '';
            machineCell = `<div style="display:flex;align-items:center;gap:5px">${iconBox(machine, 48)}<span style="font-size:12px;color:var(--text-dim)">${machine}</span>${excavation}</div>`;
          } else if (md) {
            const opm         = machineOpm(rec, { ...rowItem, product: name });
            const rowRuns     = rowRunsOf(rec, rowItem, name, val);
            const count       = ceilMachines(rowRuns);
            const machPwrKw   = machinesPowerKw(machine, count, rowItem);
            const nSolid      = countSolidConnections(rec, name);
            const loaders     = calcLoadersForMachine(machine, nSolid);
            const loaderPwrKw = loaders.powerKw * count;
            rowWsKw = wsExtraKw(machine, count, rowItem); rowLoaderKw = loaderPwrKw;

            totMachPwr   += machPwrKw;
            totLoaderPwr += loaderPwrKw;

            machineCell = `<div style="display:flex;align-items:center;gap:5px">${iconBox(machine, 48)}<span style="font-size:12px;color:var(--text-dim)">${machine}</span><span style="font-family:'Share Tech Mono',monospace;font-size:13px;color:var(--accent3)">×${count}</span>${wsBadge(rowItem)}</div>`;

            const totalLoaders = loaders.loaderCount * count;
            const totalSecond  = loaders.secondLaneCount * count;
            const totalThird   = loaders.thirdLaneCount  * count;
            tally(machine, count);
            tally('Loader', totalLoaders);
            tally('Loader (2nd Lane)', totalSecond);
            tally('Loader (3rd Lane)', totalThird);
            if (totalLoaders || totalSecond || totalThird) {
              const parts = [
                totalLoaders ? `${totalLoaders}×L1` : '',
                totalSecond  ? `${totalSecond}×L2`  : '',
                totalThird   ? `${totalThird}×L3`   : '',
              ].filter(Boolean).join(' ');
              loaderCell = `<span style="font-size:11px;color:var(--text-dim)">${parts}</span>`;
            }

            rowKw = machPwrKw + loaderPwrKw;

            // Build ingredient pills for expanded detail row
            if (rec.ingredients && rec.ingredients.length) {
              ingPills = rec.ingredients.map((ing) => {
                // Use demand-proportional rate (val = needed output/min), not machine-capacity × count.
                // This avoids showing a higher number than the row above due to Math.ceil rounding.
                const ipm  = rowRuns * (60 / wsCycleTime(rec, rowItem)) * ing.amount;
                const warn = ipm > 100;
                return `<span style="display:inline-flex;align-items:center;gap:5px;
                    background:${warn ? 'var(--color-warning-bg)' : 'var(--color-success-bg)'};
                    border:1px solid ${warn ? 'var(--color-warning-border)' : 'var(--color-success-border)'};
                    border-radius:4px;padding:3px 8px;font-size:12px;white-space:nowrap">
                    ${iconBox(ing.item, 48)}
                    <span style="color:var(--text-dim)">${ing.item}</span>
                    <span style="font-family:'Share Tech Mono',monospace;color:${warn ? 'var(--warn)' : 'var(--accent3)'}">
                      ${fmt(ipm)}<span style="color:var(--text-dim);font-size:10px">/min</span>
                    </span>${isSelfLoopInput(rec, ing.item) ? '<span style="font-size:10px;color:var(--accent3)" title="Fed back from the machine\'s own output">↻ from own output</span>' : ''}
                  </span>`;
              }).join('');
            }

            if (rec.chanceOutputs) {
              ingPills += chanceProductPills(rec, rowRuns * (60 / wsCycleTime(rec, rowItem)) * (rec.ingredients[0]?.amount || 1), iconBox, 48);
            } else
            // Add byproduct pills for secondary outputs of this recipe
            if (Array.isArray(rec.output) && rec.output.length > 1) {
              ingPills += rec.output.slice(1).map(sec => {
                const bpm = rowRuns * (60 / wsCycleTime(rec, rowItem)) * sec.amount * (sec.chance ?? 1);
                return `<span style="display:inline-flex;align-items:center;gap:5px;
                    background:var(--color-byproduct-bg);border:1px solid var(--color-byproduct-border);
                    border-radius:4px;padding:3px 8px;font-size:12px;white-space:nowrap">
                    ${iconBox(sec.item, 48)}
                    <span style="color:var(--color-byproduct)">${sec.item}</span>
                    <span style="font-family:'Share Tech Mono',monospace;color:var(--color-byproduct)">
                      ${fmt(bpm)}<span style="color:var(--text-dim);font-size:10px">/min</span>
                    </span>
                    <span style="font-size:10px;color:var(--color-byproduct);background:var(--color-byproduct-bg);border:1px solid var(--color-byproduct-border);border-radius:3px;padding:1px 4px">↗</span>
                  </span>`;
              }).join('');
            }
          }
        }

        rowKw += fp?.pumpKw || 0; // Pipe-to-Pipeline / Pipeline-to-Pipe pumps of this fluid
        if (rowKw > 0) pwrCell = powerCellHtml(rowKw, { ws: rowWsKw, loaders: rowLoaderKw, pumps: fp?.pumpKw || 0 });
        const cls = val > 100 ? 'num-warn' : 'num';
        const hasDetail = ingPills.length > 0;
        const isByproduct = !!info.byproduct;
        const rowBg = isByproduct ? 'background:var(--color-byproduct-bg);' : '';
        const byproductBadge = isByproduct
          ? `<span style="font-size:10px;color:var(--color-byproduct);background:var(--color-byproduct-bg);border:1px solid var(--color-byproduct-border);border-radius:3px;padding:1px 5px;margin-left:4px">Nebenprodukt</span>`
          : '';
        return `
      <tr class="recipe-main-row" onclick="${hasDetail ? `toggleRecipeRow('${rid}')` : ''}" style="border-bottom:1px solid var(--color-border);${hasDetail ? 'cursor:pointer' : ''}${rowBg}">
        <td style="padding:5px 12px"><div style="display:flex;align-items:center;gap:6px">
          ${hasDetail ? `<span class="row-expand-arrow" id="arr_${rid}">▶</span>` : '<span style="display:inline-block;width:14px"></span>'}
          ${iconBox(info.icon || name, 48)}<span class="label" style="font-size:13px">${name}</span>${info.byproduct || info.excavated ? '' : productNote(info.recipeName || name, name, 24)}${(() => {
            // Closed loop (Greenhouse): show what goes back in and the net output
            const rr = RECIPES[info.recipeName || name];
            if (!rr?.selfLoop || !info.machine || !rr.machines[info.machine]) return '';
            const it = { itemName: info.recipeName || name, machineName: info.machine };
            const runs = rowRunsOf(rr, it, name, val);
            const back = runs * (60 / wsCycleTime(rr, it)) * rr.selfLoop.amount;
            const net  = runs * lineOpm(rr, it) - back;
            return `<span style="font-size:11px;color:var(--text-dim);margin-left:6px">↻ ${fmt(back)}/min back · <span style="color:var(--accent3)">net +${fmt(net)}/min</span></span>`;
          })()}${byproductBadge}
        </div></td>
        <td class="${cls}" style="font-size:13px">${info.initial ? `${fmt(val)} <span style="font-size:10px;color:var(--text-dim)" title="One-time start fill; afterwards the loop feeds itself">once</span>` : `${fmt(val)}/min`}</td>
        <td style="padding:5px 12px">${machineCell}</td>
        <td style="padding:5px 12px">${conveyorCell}</td>
        <td style="padding:5px 12px">${loaderCell}</td>
        <td style="padding:5px 12px;text-align:right">${pwrCell}</td>
      </tr>
      ${hasDetail ? `<tr class="recipe-detail-row collapsed" id="${rid}">
        <td colspan="6" style="padding:4px 12px 10px 52px">
          <div style="display:flex;flex-wrap:wrap;gap:5px">${ingPills}</div>
        </td>
      </tr>` : ''}`;
      }).join('');

    const footer = `
      <tr style="border-top:1px solid var(--color-border);font-weight:600">
        <td colspan="2" style="padding:6px 12px;color:var(--text-dim)">Total</td>
        <td colspan="3"></td>
        <td style="padding:6px 12px;text-align:right;color:var(--color-power)">${fmtPwr(totMachPwr + totLoaderPwr)}</td>
      </tr>`;

    // Shipping pads for items sold (up) and delivered by the station (down)
    shipping.forEach(p => tally(p.pad, p.count));
    Object.entries(powerPlanResult?.buildings || {}).forEach(([b, n]) => tally(b, n));
    const isLoader = b => b.startsWith('Loader');
    const list = Object.entries(buildings).sort((a, b) => (isLoader(a[0]) - isLoader(b[0])) || b[1] - a[1]);
    const buildingsHtml = list.length ? `
      <div style="padding:10px 12px 12px;border-bottom:1px solid var(--color-border)">
        <div style="font-size:11px;color:var(--text-dim);margin-bottom:6px">Buildings needed · ${fmt(list.reduce((n, [, c]) => n + c, 0))} total (without conveyors, pipes and Assembly Line rails)</div>
        <div style="display:flex;flex-wrap:wrap;gap:5px">${list.map(([b, c]) => `
          <span style="display:inline-flex;align-items:center;gap:4px;background:var(--color-bg-elevated);border:1px solid var(--color-border);border-radius:5px;padding:2px 7px 2px 3px;font-size:12px;white-space:nowrap">
            ${iconBox(b, 32)}<span style="color:var(--text-dim)">${b}</span>
            <span style="font-family:'Share Tech Mono',monospace;color:var(--accent3)">×${fmt(c)}</span>
          </span>`).join('')}</div>
      </div>` : '';

    // One-time build cost of the modular buildings (Construction Material …)
    let buildCostHtml = '';
    if (buildCostOn && typeof MODULAR_BUILD_COST !== 'undefined') {
      const perBuilding = [], need = {};
      list.forEach(([b, n]) => {
        const bc = MODULAR_BUILD_COST[b];
        if (!bc) return;
        const extra = bc.perModule && MODULAR_BUILDINGS[b] ? Math.max(0, modularModules(b) - MODULAR_BUILDINGS[b].min) : 0;
        const cost = { ...bc.fixed };
        Object.entries(bc.perModule || {}).forEach(([i, a]) => { cost[i] = (cost[i] || 0) + a * extra; });
        Object.entries(cost).forEach(([i, a]) => { need[i] = (need[i] || 0) + a * n; });
        perBuilding.push([b, n, cost]);
      });
      const raw = Object.entries(oneTimeMaterials(need)).sort((a, b) => b[1] - a[1]);
      const chip = (name, amount) => `
        <span style="display:inline-flex;align-items:center;gap:4px;background:var(--color-bg-elevated);border:1px solid var(--color-border);border-radius:5px;padding:2px 7px 2px 3px;font-size:12px;white-space:nowrap">
          ${iconBox(name, 32)}<span style="color:var(--text-dim)">${name}</span>
          <span style="font-family:'Share Tech Mono',monospace;color:var(--accent3)">${fmt(Math.ceil(amount - 1e-9))}</span>
        </span>`;
      buildCostHtml = perBuilding.length ? `
      <div class="collapsible-section">
        <div class="collapsible-header" onclick="toggleSection(this)">
          <span class="ch-title">Build cost (one-time)</span>
          <span style="display:flex;align-items:center;gap:12px">
            <span class="ch-meta">${Object.entries(need).map(([i, a]) => `${fmt(a)} ${i}`).join(' · ')}</span>
            <span class="ch-arrow">▼</span>
          </span>
        </div>
        <div class="collapsible-body" style="padding:10px 12px 12px">
          <table class="results-table" style="margin-bottom:12px">
            <thead><tr><th>Building</th><th style="text-align:right">Count</th><th>Per building</th><th>Total</th></tr></thead>
            <tbody>${perBuilding.map(([b, n, cost]) => `
              <tr>
                <td style="padding:5px 12px"><div style="display:flex;align-items:center;gap:8px">${iconBox(b, 32)}<span class="label">${b}</span>${MODULAR_BUILDINGS[b] && MODULAR_BUILD_COST[b].perModule ? `<span style="font-size:11px;color:var(--text-dim)">${modularModules(b)} ${MODULAR_BUILDINGS[b].module}</span>` : ''}</div></td>
                <td class="num">${n}</td>
                <td style="padding:5px 12px;font-size:12px;color:var(--text-dim)">${Object.entries(cost).map(([i, a]) => `${fmt(a)} ${i}`).join(' · ')}</td>
                <td style="padding:5px 12px;font-size:12px">${Object.entries(cost).map(([i, a]) => `${fmt(a * n)} ${i}`).join(' · ')}</td>
              </tr>`).join('')}
            </tbody>
          </table>
          ${buildPlan.mode === 'rate' ? (() => {
            const dur = m => m >= 60 ? `${Math.floor(m / 60)} h ${Math.round(m % 60)} min` : `${+m.toFixed(1)} min`;
            const t = Object.entries(need).map(([i, a]) => [i, a, buildRate(i), buildRate(i) > 0 ? a / buildRate(i) : Infinity]);
            const all = Math.max(...t.map(x => x[3]));
            return `<div style="font-size:11px;color:var(--text-dim);margin-bottom:6px">Production time at the set rates (lines in the chain)</div>
            <table class="results-table" style="margin-bottom:12px">
              <thead><tr><th>Material</th><th style="text-align:right">Needed</th><th style="text-align:right">Rate</th><th style="text-align:right">Time</th></tr></thead>
              <tbody>${t.map(([i, a, r, m]) => `<tr><td style="padding:5px 12px"><div style="display:flex;align-items:center;gap:8px">${iconBox(i, 32)}<span class="label">${i}</span></div></td>
                <td class="num">${fmt(a)}</td><td class="num">${fmt(r)}/min</td><td class="num">${isFinite(m) ? dur(m) : '–'}</td></tr>`).join('')}
                <tr style="font-weight:600"><td colspan="3" style="padding:5px 12px;color:var(--text-dim)">All done after</td><td class="num">${isFinite(all) ? dur(all) : '– (rate 0)'}</td></tr>
              </tbody>
            </table>`;
          })() : ''}
          <div style="font-size:11px;color:var(--text-dim);margin-bottom:6px">Raw materials, once (not per minute) · attachments counted at their minimum</div>
          <div style="display:flex;flex-wrap:wrap;gap:5px">${raw.map(([i, a]) => chip(i, a)).join('')}</div>
        </div>
      </div>` : '';
    }

    return { rows, footer, buildingsHtml, buildCostHtml, count: Object.keys(totalsMap).length };
  }

  const direct   = buildMaterialRows(directTotals);
  const resolved = buildMaterialRows(resolvedTotals);
  const fullDetail = calcDepthMode === 3 ? buildFullDetailRows(resolvedTotals) : null;

  // ── Infrastructure table rows ─────────────────────────────
  const infraRows = Object.values(infraByMachine)
    .sort((a, b) => b.totalMachPwrKw - a.totalMachPwrKw)
    .map(e => {
      const loaderDesc = [
        e.loaderCount     ? `${e.loaderCount}× Loader`            : '',
        e.secondLaneCount ? `${e.secondLaneCount}× 2nd Lane`       : '',
        e.thirdLaneCount  ? `${e.thirdLaneCount}× 3rd Lane`        : '',
      ].filter(Boolean).join(' · ') || '—';
      return `
    <tr>
      <td style="padding:6px 12px"><div style="display:flex;align-items:center;gap:8px">${iconBox(e.machineName, 64)}<span class="label">${e.machineName}</span></div></td>
      <td class="num">${e.count}</td>
      <td class="num">${fmtPwr(e.machPwrKw)}</td>
      <td class="num">${powerCellHtml(e.totalMachPwrKw, { ws: e.totalWsKw }, '')}</td>
      <td style="padding:6px 12px;font-size:12px;color:var(--text-dim)">${loaderDesc}</td>
      <td class="num">${e.totalLoaderPwrKw ? fmtPwr(e.totalLoaderPwrKw) : '—'}</td>
      <td class="num" style="color:var(--color-power)">${powerCellHtml(e.totalMachPwrKw + e.totalLoaderPwrKw, { ws: e.totalWsKw, loaders: e.totalLoaderPwrKw }, '')}</td>
    </tr>`;
    }).join('');

  const infraFooter = `
    <tr style="border-top:1px solid var(--color-border);font-weight:600">
      <td style="padding:6px 12px;color:var(--text-dim)">Total</td>
      <td class="num">${fmt(totalMachines)}</td>
      <td class="num">—</td>
      <td class="num">${fmtPwr(totalMachPwrKw)}</td>
      <td></td>
      <td class="num">${fmtPwr(totalLoaderPwrKw)}</td>
      <td class="num" style="color:var(--color-power)">${fmtPwr(totalPwrKw)}</td>
    </tr>`;

  // ── Machine totals (aggregated by machine type) ──────────
  const machineTotals = {};
  lines.forEach((r) => {
    machineTotals[r.machineName] = (machineTotals[r.machineName] || 0) + r.machines;
  });
  // Add machines from ingredient resolution chain
  Object.values(resolvedMachineRuns).forEach(({ machine, runs }) => {
    machineTotals[machine] = (machineTotals[machine] || 0) + ceilMachines(runs);
  });
  if (frackPlan) machineTotals[frackPlan.machine] = (machineTotals[frackPlan.machine] || 0) + frackPlan.count;
  const machineRows = Object.entries(machineTotals)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => {
      const alBreakdown = name === M.ASSEMBLY_LINE
        ? `<div style="font-size:10px;color:var(--color-text-disabled);margin-top:3px;padding-left:2px;line-height:1.7">
            └&nbsp;${count * ASSEMBLY_LINE_COMPOSITION.start.count}×&nbsp;${ASSEMBLY_LINE_COMPOSITION.start.name}
            &nbsp;·&nbsp;${count * ASSEMBLY_LINE_COMPOSITION.producer.count}×&nbsp;${ASSEMBLY_LINE_COMPOSITION.producer.name}
            &nbsp;·&nbsp;${count * ASSEMBLY_LINE_COMPOSITION.painter.count}×&nbsp;${ASSEMBLY_LINE_COMPOSITION.painter.name}
          </div>`
        : name === frackPlan?.machine
        ? `<div style="font-size:10px;color:var(--color-text-disabled);margin-top:3px">
            ${depletedVeins} depleted vein(s) · ${fmt(frackPlan.capacity)} L/min each · ${fmtPwr(frackPlan.powerKw)}
          </div>`
        : '';
      return `
    <tr>
      <td style="padding:6px 12px">
        <div style="display:flex;align-items:center;gap:10px">${iconBox(name, 64)}<div><span class="label">${name}</span>${alBreakdown}</div></div>
      </td>
      <td class="num">${fmt(count)}</td>
    </tr>`;
    })
    .join("");

  // ── Inject HTML into results panel ───────────────────────
  document.getElementById("recipeResults").innerHTML =
    summaryHtml() +
    `
    ${calcDepthMode !== 3 ? `
    <div class="collapsible-section">
      <div class="collapsible-header" onclick="toggleSection(this)">
        <span class="ch-title">Production Overview</span>
        <span style="display:flex;align-items:center;gap:12px">
          <span class="ch-meta">${lines.length} Recipes · ${fmt(totalMachines)} Machines · ${fmt(totalGoal)} /min</span>
          <span class="ch-arrow">▼</span>
        </span>
      </div>
      <div class="collapsible-body">
        <table class="results-table">
          <thead>
            <tr>
              <th>Recipe</th><th>Machine</th>
              <th style="text-align:right">Machines</th>
              <th style="text-align:right">Output/Min</th>
              <th style="text-align:right" title="Idle capacity of the rounded-up machines">Spare capacity</th>
            </tr>
          </thead>
          <tbody>${overviewRows}</tbody>
        </table>
      </div>
    </div>

    <div class="collapsible-section">
      <div class="collapsible-header" onclick="toggleSection(this)">
        <span class="ch-title">Infrastructure &amp; Power</span>
        <span style="display:flex;align-items:center;gap:12px">
          <span class="ch-meta">${fmtPwr(totalMachPwrKw)} machines · ${fmtPwr(totalLoaderPwrKw)} loaders · ${fmtPwr(totalPwrKw)} total</span>
          <span class="ch-arrow">▼</span>
        </span>
      </div>
      <div class="collapsible-body">
        <table class="results-table">
          <thead><tr>
            <th>Machine</th>
            <th style="text-align:right">Count</th>
            <th style="text-align:right">kW each</th>
            <th style="text-align:right">Machine total</th>
            <th>Loaders</th>
            <th style="text-align:right">Loader power</th>
            <th style="text-align:right">Combined</th>
          </tr></thead>
          <tbody>${infraRows}${infraFooter}</tbody>
        </table>
      </div>
    </div>` : ''}

    ${Object.keys(byproductTotals).length > 0 ? `
    <div class="collapsible-section">
      <div class="collapsible-header" onclick="toggleSection(this)">
        <span class="ch-title" style="color:var(--color-byproduct)">Byproducts</span>
        <span style="display:flex;align-items:center;gap:12px">
          <span class="ch-meta">${Object.keys(byproductTotals).length} item type(s) — must be handled</span>
          <span class="ch-arrow">▼</span>
        </span>
      </div>
      <div class="collapsible-body">
        <div style="display:flex;flex-wrap:wrap;gap:8px;padding:10px 12px">
          ${Object.entries(byproductTotals).map(([name, info]) => {
            const disposal = typeof BYPRODUCT_DISPOSAL !== 'undefined' ? BYPRODUCT_DISPOSAL[name] : null;
            let machineHtml = '';
            const machineLine = (m, n) => `<span style="display:flex;align-items:center;gap:4px;margin-top:3px">${iconBox(m, 48)}<span style="font-size:10px;color:var(--text-dim)">${m} ×${n}</span></span>`;
            const note = (txt) => `<span style="font-size:10px;color:var(--color-success-text);margin-top:2px">${txt}</span>`;
            const rp = info.reprocessed;
            if (rp?.producedPerMin > 0.01) {
              machineHtml = machineLine(rp.machine, rp.count)
                + note(`→ ${fmt(rp.producedPerMin)}/min ${rp.produces} for the chain`);
              if (info.leftover > 0.01 && disposal) {
                machineHtml += note(`rest ${fmt(info.leftover)}/min →`)
                  + machineLine(disposal.machine, ceilMachines(info.leftover / disposal.capacityPerMin));
              }
            } else if (info.leftover <= 0.01) {
              machineHtml = note('fully used in the chain');
            } else if (disposal) {
              const used = info.amount - info.leftover;
              if (used > 0.01) machineHtml = note(`${fmt(used)}/min used in chain`);
              machineHtml += machineLine(disposal.machine, ceilMachines(info.leftover / disposal.capacityPerMin));
            }
            return `<span style="display:inline-flex;flex-direction:column;gap:2px;
                background:var(--color-byproduct-bg);border:1px solid var(--color-byproduct-border);
                border-radius:6px;padding:6px 10px;font-size:12px">
              <span style="display:flex;align-items:center;gap:5px">
                ${iconBox(name, 48)}
                <span style="color:var(--color-byproduct);font-weight:600">${name}</span>
                <span style="font-family:'Share Tech Mono',monospace;color:var(--accent3)">${fmt(info.amount)}<span style="color:var(--text-dim);font-size:10px">/min</span></span>
              </span>
              ${machineHtml}
            </span>`;
          }).join('')}
        </div>
      </div>
    </div>` : ''}

    ${stockRows.length ? `
    <div class="collapsible-section">
      <div class="collapsible-header" onclick="toggleSection(this)">
        <span class="ch-title">Existing Stock</span>
        <span style="display:flex;align-items:center;gap:12px">
          <span class="ch-meta">${stockRows.length} item${stockRows.length > 1 ? 's' : ''} · only the missing rest is produced</span>
          <span class="ch-arrow">▼</span>
        </span>
      </div>
      <div class="collapsible-body">
        <table class="results-table">
          <thead><tr><th>Item</th><th style="text-align:right">Available /min</th><th style="text-align:right">Used /min</th><th style="text-align:right">Unused /min</th></tr></thead>
          <tbody>${stockRows.map(r => `
            <tr>
              <td style="padding:6px 12px"><div style="display:flex;align-items:center;gap:8px">${iconBox(r.item, 48)}<span class="label">${r.item}</span></div></td>
              <td class="num">${fmt(r.have)}</td>
              <td class="num">${fmt(r.used)}</td>
              <td class="num">${fmt(r.have - r.used)}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>` : ''}

    ${shipping.length ? `
    <div class="collapsible-section">
      <div class="collapsible-header" onclick="toggleSection(this)">
        <span class="ch-title">Space Station Shipping</span>
        <span style="display:flex;align-items:center;gap:12px">
          <span class="ch-meta">${shipping.reduce((a, p) => a + p.count, 0)} pads · ${shipping.reduce((a, p) => a + p.count, 0)} ships (${shipping[0].ship}) · hangar ${shipping.reduce((a, p) => a + p.hangar, 0)} · flight ${shippingFlightSec}s</span>
          <span class="ch-arrow">▼</span>
        </span>
      </div>
      <div class="collapsible-body">
        <table class="results-table">
          <thead><tr><th>Item</th><th>Direction</th><th style="text-align:right">/min</th><th style="text-align:right">kg/item</th><th style="text-align:right">kg/min</th><th>Pad</th><th style="text-align:right">Pads</th><th>Belts</th><th>Limited by</th></tr></thead>
          <tbody>${shipping.map(p => `
            <tr>
              <td style="padding:6px 12px"><div style="display:flex;align-items:center;gap:8px">${iconBox(p.item, 48)}<span class="label">${p.item}</span></div></td>
              <td style="padding:6px 12px">${p.direction === 'up' ? '↑ to station (sale)' : '↓ from station'}</td>
              <td class="num">${fmt(p.perMin)}</td>
              <td class="num">${fmt(p.kgEach)}</td>
              <td class="num">${fmt(Math.round(p.kgPerMin))}</td>
              <td style="padding:6px 12px"><div style="display:flex;align-items:center;gap:8px">${iconBox(p.pad, 48)}<span class="label">${p.pad}</span></div></td>
              <td class="num">${p.count}</td>
              <td style="padding:6px 12px">${p.belts
                ? `<div style="display:flex;align-items:center;gap:6px">${iconBox(conveyorType, 32)}<span>${p.totalBelts} × ${conveyorType}</span><span style="font-size:11px;color:var(--text-dim)" title="Belts per pad / conveyor connections of a pad">(${p.beltSplit || p.beltsPerPad + ' per pad'} · max ${p.belts} ${p.direction === 'up' ? 'inputs' : 'outputs'})</span></div>${p.fillSplit && p.fillSplit !== p.beltSplit
                  ? `<div style="font-size:11px;color:var(--text-dim);margin-top:3px" title="Fill one pad completely before using the next">or fill pads first: ${p.fillBelts} × ${conveyorType} (${p.fillSplit})</div>` : ''}`
                : '<span style="font-size:12px;color:var(--text-dim)">fed by Assembly Line</span>'}</td>
              <td style="padding:6px 12px;font-size:12px;color:var(--text-dim)">${p.limit === 'belts' ? 'conveyor belts' : 'ship cycle'} · ${fmt(Math.round(p.padKgPerMin))} kg/min per pad</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>` : ''}

    ${cycleWarnings.size > 0 ? `
    <div style="background:var(--color-danger-bg);border:1px solid var(--color-danger-border);border-radius:6px;padding:10px 14px;margin-bottom:16px;display:flex;align-items:flex-start;gap:10px;font-size:13px;color:var(--color-danger)">
      <span style="font-size:16px;flex-shrink:0">⚠</span>
      <span><strong>Circular dependency detected:</strong> ${[...cycleWarnings].join(', ')} — these ingredient(s) appear in their own ingredient tree. Affected branches were not fully resolved.</span>
    </div>` : ''}

    ${calcDepthMode === 1 ? `
    <div class="collapsible-section">
      <div class="collapsible-header" onclick="toggleSection(this)">
        <span class="ch-title">Direct Materials</span>
        <span style="display:flex;align-items:center;gap:12px">
          <span class="ch-meta">${direct.count} item types · ${depthDesc[0]}</span>
          <span class="ch-arrow">▼</span>
        </span>
      </div>
      <div class="collapsible-body">
        <table class="results-table">
          <thead><tr><th>Material</th><th style="text-align:right">/ Minute</th><th style="text-align:right">/ Second</th><th>Producer</th><th style="text-align:right">Count</th><th style="text-align:right">Machine Power</th><th>Loaders</th><th style="text-align:right">Combined</th></tr></thead>
          <tbody>${direct.rows}${direct.footer}</tbody>
        </table>
      </div>
    </div>` : ''}

    ${calcDepthMode === 3 ? `
    <div class="collapsible-section">
      <div class="collapsible-header" onclick="toggleSection(this)">
        <span class="ch-title">Full Detail</span>
        <span style="display:flex;align-items:center;gap:12px">
          <span class="ch-meta">${fullDetail.count} items · ${conveyorType}</span>
          <span class="ch-arrow">▼</span>
        </span>
      </div>
      <div class="collapsible-body">
        ${fullDetail.buildingsHtml}
        <table class="results-table">
          <thead><tr><th>Item</th><th style="text-align:right">/ Minute</th><th>Producer</th><th>Conveyor</th><th>Loader</th><th style="text-align:right">Power</th></tr></thead>
          <tbody>${fullDetail.rows}${fullDetail.footer}</tbody>
        </table>
      </div>
    </div>
    ${fullDetail.buildCostHtml}` : `
    <div class="collapsible-section">
      <div class="collapsible-header" onclick="toggleSection(this)">
        <span class="ch-title">${depthTitles[calcDepthMode]}</span>
        <span style="display:flex;align-items:center;gap:12px">
          <span class="ch-meta">${resolved.count} item types · ${depthDesc[calcDepthMode]}</span>
          <span class="ch-arrow">▼</span>
        </span>
      </div>
      <div class="collapsible-body">
        <table class="results-table">
          <thead><tr><th>Material</th><th style="text-align:right">/ Minute</th><th style="text-align:right">/ Second</th><th>Producer</th><th style="text-align:right">Count</th><th style="text-align:right">Machine Power</th><th>Loaders</th><th style="text-align:right">Combined</th></tr></thead>
          <tbody>${resolved.rows}${resolved.footer}</tbody>
        </table>
      </div>
    </div>`}

  `;

  // Sankey and box diagrams subscribe to recipe data changes via
  // their own dirty-flag mechanism; calling render here ensures
  // the visualize tab stays in sync even if it is currently hidden.
  renderSankey();
  renderBoxes();
  if (typeof markLayoutDirty === 'function') markLayoutDirty();
}

// ── Collapsible section toggle ──────────────────────────
