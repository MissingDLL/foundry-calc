// ============================================================
// app/ui-power.js
// Power Planner: enter target power, add generator types,
// pick fuel, get count + fuel consumption per minute.
// Uses POWER_SOURCES and POWER_FUEL_ITEMS from game-data.js.
// ============================================================

// Build the POWER_GENERATORS list dynamically from POWER_SOURCES and POWER_FUEL_ITEMS.
// Called once at startup (after game-data.js is loaded).
function _buildPowerGenerators() {
  const generators = [];

  // Derive steam kJ/L from POWER_FUEL_ITEMS
  const steamMj = (POWER_FUEL_ITEMS['Steam'] || {}).mj || 0.06;
  const steamKjPerL = steamMj * 1000;

  // Collect boilers and turbines for pairing
  const boilers = POWER_SOURCES.filter(s => s.type === 'steam_boiler');
  const turbines = POWER_SOURCES.filter(s => s.type === 'steam_turbine');

  // Get all practical solid fuels (exclude rubble, construction, drone, canister etc.)
  // "Practical" = items you'd realistically use in a generator
  const _PRACTICAL_FUEL_BLACKLIST = new Set([
    'Construction Material', 'High-Tech Construction Material',
    'Construction Site Rubble', 'High-Tech Construction Site Rubble',
    'Firmarlite Bar', 'Maintenance Drone', 'Space Ship Fuel Canister',
    'Telluxite Ore', 'Ignium Ore', 'Ignium Ore Rubble',
    'Technum Ore Rubble', 'Telluxite Ore Rubble', 'Xenoferrite Ore Rubble',
    'Ignium Powder',
  ]);
  // Current data marks burnable items (flags: BURNABLE); older data versions
  // have no flag and keep the hand-made blacklist.
  const hasFlag = Object.values(POWER_FUEL_ITEMS).some(f => 'burnable' in f);
  const allSolidFuels = Object.entries(POWER_FUEL_ITEMS)
    .filter(([name, f]) => f.type === 'solid' && (hasFlag ? f.burnable : !_PRACTICAL_FUEL_BLACKLIST.has(name)))
    .map(([name]) => name)
    .sort((a, b) => (POWER_FUEL_ITEMS[a].mj - POWER_FUEL_ITEMS[b].mj));

  // ── Solar panels ──────────────────────────────────────────────────────────
  for (const src of POWER_SOURCES) {
    if (src.type !== 'solar') continue;
    generators.push({
      id: src.id,
      name: src.name,
      powerKw: src.power_kw,
      requiresFuel: false,
      note: null,
    });
  }

  // ── Solid-fuel generators (LVG) ───────────────────────────────────────────
  for (const src of POWER_SOURCES) {
    if (src.type !== 'solid_fuel') continue;
    // Determine accepted fuels
    let fuels;
    if (src.locked_fuel) {
      // locked to a specific fuel (e.g. Biomass Burner → Biomass only)
      fuels = [src.locked_fuel];
    } else {
      fuels = allSolidFuels;
    }
    generators.push({
      id: src.id,
      name: src.name,
      powerKw: src.power_kw,
      efficiency: src.efficiency,
      requiresFuel: true,
      fuels,
      note: null,
    });
  }

  // ── Classic Boiler + Steam Turbine combinations ───────────────────────────
  if (turbines.length > 0 && boilers.length > 0) {
    const turbine = turbines[0]; // Classic Steam Turbine
    const turbineLitPerSec = steamKjPerL > 0 ? turbine.power_kw / steamKjPerL : 0;

    // Determine which solid fuels work in the classic boiler
    // (hasFuelManagerSolid, no lock → all burnable fuels)
    const boilerFuels = allSolidFuels; // Biomass works too (tested in-game)

    for (const boiler of boilers) {
      if (boiler.requires_vent) {
        // Geothermal: compute turbine count
        const turbineCount = turbineLitPerSec > 0
          ? Math.round(boiler.steam_lit_per_sec / turbineLitPerSec)
          : 6;
        const combinedKw = turbineCount * turbine.power_kw;
        generators.push({
          id: boiler.id + '_geothermal',
          name: `Geothermal + ${turbineCount}× Steam Turbine`,
          powerKw: combinedKw,
          requiresFuel: false,
          note: 'Requires Geothermal Vent',
        });
      } else {
        // Classic Boiler + Turbine (1:1 pairing)
        generators.push({
          id: boiler.id + '_turbine',
          name: 'Boiler + Steam Turbine',
          powerKw: turbine.power_kw,
          requiresFuel: true,
          isSteam: true,
          fuels: boilerFuels,
          note: '1 Boiler + 1 Turbine per unit',
        });
      }
    }
  }

  // ── NPP: pair Xeno Reactor + High-Pressure Turbine ────────────────────────
  const nppTurbine = POWER_SOURCES.find(s => s.type === 'npp_turbine');
  const nppReactor = POWER_SOURCES.find(s => s.type === 'npp_reactor');
  if (nppTurbine && nppReactor) {
    const fuelName = nppReactor.fuel_name;
    generators.push({
      id: nppTurbine.id + '_npp',
      name: `${nppTurbine.name} (NPP)`,
      powerKw: nppTurbine.power_kw,
      requiresFuel: true,
      isNpp: true,
      fuels: [fuelName],
      // Ratios derived from game data (extract_game_data.py): 10 turbines share
      // one reactor, 5 share one cooling tower.
      note: `Per ${nppReactor.turbines_per_reactor || '?'} turbines: 1 Xeno Reactor + 1 Steam Generator · ` +
            `1 Cooling Tower per ${nppTurbine.turbines_per_cooling_tower || '?'} turbines`,
    });
  }

  return generators;
}

// Build the generator list once on load
const POWER_GENERATORS = _buildPowerGenerators();

// ── State ────────────────────────────────────────────────────
let _powerRows    = [];
let _rowCounter   = 0;

// ── Helpers ──────────────────────────────────────────────────
function _getTargetKw() {
  const val  = parseFloat(document.getElementById('powerTargetValue')?.value || '0');
  const unit = document.getElementById('powerTargetUnit')?.value || 'kw';
  if (!isFinite(val) || val < 0) return 0;
  return unit === 'mw' ? val * 1000 : val;
}

// Fuel consumed per generator per minute.
function _fuelPerUnitPerMin(gen, fuelName) {
  if (!gen.requiresFuel || !fuelName) return 0;
  const fuel = POWER_FUEL_ITEMS[fuelName];
  if (!fuel) return 0;
  // NPP turbines too: Reactor Fuel Mix MJ/L is derived from the whole chain
  // (reactor → steam generator → turbines), so 36 MW ↔ 4,320 L/min per turbine.
  // power_kw * 60s / (efficiency * fuel_value_mj * 1000 kJ/MJ)
  const eff = gen.isSteam ? 1.0 : (gen.efficiency || 1.0);
  return (gen.powerKw * 60) / (eff * fuel.mj * 1000);
}

function _fmtPower(kw) {
  if (kw === 0) return '–';
  if (kw >= 1000) {
    const mw = kw / 1000;
    return (Number.isInteger(mw) ? mw : mw.toFixed(mw < 10 ? 3 : 2).replace(/\.?0+$/, '')) + ' MW';
  }
  return kw + ' kW';
}

// ── Render ───────────────────────────────────────────────────
function _renderRows() {
  const targetKw = _getTargetKw();
  const el = document.getElementById('powerRowsContainer');
  if (!el) return;

  if (_powerRows.length === 0) {
    el.innerHTML = `<div style="color:var(--color-text-disabled); text-align:center; padding:40px 24px; font-size:13px;">
      Use the buttons below to add a power source
    </div>`;
    return;
  }

  el.innerHTML = _powerRows.map(row => {
    const gen = POWER_GENERATORS.find(g => g.id === row.genId);
    if (!gen) return '';

    const count        = targetKw > 0 ? Math.ceil(targetKw / gen.powerKw) : 0;
    const totalKw      = count * gen.powerKw;
    const surplus      = totalKw - targetKw;
    const fuelRateUnit = gen.requiresFuel ? _fuelPerUnitPerMin(gen, row.fuelName) : 0;
    const fuelRateTotal= fuelRateUnit * count;

    const fuelSelect = gen.requiresFuel
      ? `<select onchange="onPowerFuelChange(${row.rowId}, this.value)" style="
           background:var(--color-bg-elevated); border:1px solid var(--color-border);
           color:var(--text); border-radius:6px; padding:5px 10px; font-size:12px; cursor:pointer; outline:none">
           ${gen.fuels.map(f =>
             `<option value="${f}"${f === row.fuelName ? ' selected' : ''}>${f}</option>`
           ).join('')}
         </select>`
      : `<span style="font-size:12px; color:var(--color-text-disabled); font-style:italic;">No fuel required</span>`;

    const fuelLine = gen.requiresFuel && count > 0
      ? `<div style="font-size:12px; color:var(--color-text-secondary); margin-top:6px; padding-top:6px; border-top:1px solid var(--color-border);">
           Fuel consumption: <strong style="color:var(--text)">${fmt(Math.round(fuelRateTotal * 1000) / 1000)}</strong>
           <span style="color:var(--color-interactive)"> ${row.fuelName}/min</span>
           <span style="color:var(--color-text-disabled); margin-left:8px;">(${fmt(Math.round(fuelRateUnit * 1000) / 1000)} per unit)</span>
           ${RECIPES[resolveRecipeName(row.fuelName)]?.ingredients?.length ? `<button class="reset-btn" style="margin:0 0 0 8px; padding:3px 9px; font-size:11px"
             title="Open the recipe calculation for exactly this amount"
             data-item="${row.fuelName}" data-rate="${fuelRateTotal}"
             onclick="calcFuelInRecipes(this.dataset.item, +this.dataset.rate)">Calculate →</button>` : ''}
         </div>`
      : '';

    // All buildings of these units (NPP: turbines + reactors + steam generators + cooling towers)
    const blds = count > 0 && typeof _powerBuildings === 'function' ? Object.entries(_powerBuildings(gen, count)) : [];
    const buildingsLine = blds.length > 1
      ? `<div style="display:flex; flex-wrap:wrap; gap:5px; align-items:center; font-size:12px; color:var(--color-text-secondary);">
           Buildings:
           ${blds.map(([b, n]) => `<span style="display:inline-flex; align-items:center; gap:4px; background:var(--color-bg-elevated); border:1px solid var(--color-border); border-radius:5px; padding:2px 7px 2px 3px; white-space:nowrap">
             ${getIcon(b, 20)}<span>${b}</span><strong style="color:var(--accent3)">×${n}</strong></span>`).join('')}
           <span style="color:var(--color-text-disabled)">· ${blds.reduce((a, [, n]) => a + n, 0)} total</span>
         </div>`
      : '';

    const surplusLine = count > 0 && surplus > 0
      ? `<span style="font-size:11px; color:var(--color-text-disabled); margin-left:6px;">+${_fmtPower(surplus)} surplus</span>`
      : '';

    return `
    <div style="
      background:var(--color-bg-elevated); border:1px solid var(--color-border);
      border-radius:10px; padding:14px 16px; display:flex; flex-direction:column; gap:10px;">

      <!-- Header row -->
      <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:10px; flex-wrap:wrap">
        <div style="display:flex; flex-direction:column; gap:5px">
          <span style="font-weight:600; font-size:14px; color:var(--text)">${gen.name}</span>
          <div style="display:flex; gap:6px; flex-wrap:wrap; align-items:center">
            <span style="font-size:11px; color:var(--color-text-secondary);">${_fmtPower(gen.powerKw)} each</span>
            <!-- ponytail: translucent warning/danger badge tints have no token yet (only solid --color-warning/--color-danger exist), same class of exception as ui-settings.js stat badges -->
            ${gen.note ? `<span style="font-size:11px; color:var(--color-warning-text); background:var(--color-warning-bg);
              border:1px solid var(--color-warning-border); border-radius:4px; padding:1px 6px;">${gen.note}</span>` : ''}
          </div>
        </div>
        <button onclick="removePowerRow(${row.rowId})" style="
          background:var(--color-danger-bg); border:1px solid var(--color-danger-border);
          color:var(--color-danger); border-radius:6px; padding:4px 10px;
          font-size:11px; cursor:pointer; flex-shrink:0; transition:all 0.15s"
          onmouseover="this.style.background='var(--color-danger-border)'"
          onmouseout="this.style.background='var(--color-danger-bg)'">&#x2715; Remove</button>
      </div>

      <!-- Fuel + count row -->
      <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px">
        <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap">
          <span style="font-size:12px; color:var(--color-interactive);">Fuel:</span>
          ${fuelSelect}
        </div>
        <div style="display:flex; align-items:baseline; gap:6px;">
          <span style="font-size:12px; color:var(--color-interactive);">Need:</span>
          <span style="font-size:26px; font-weight:700; color:var(--accent); font-variant-numeric:tabular-nums; line-height:1">
            ${count > 0 ? count : '–'}
          </span>
          ${count > 0 ? `
            <span style="font-size:12px; color:var(--color-text-secondary);">${count === 1 ? 'unit' : 'units'}</span>
            <span style="font-size:12px; color:var(--color-text-disabled);">&#x2192; ${_fmtPower(totalKw)}</span>
            ${surplusLine}
          ` : ''}
        </div>
      </div>

      ${buildingsLine}
      ${fuelLine}
    </div>`;
  }).join('');
}

function _renderSummary() {
  const el = document.getElementById('powerSummary');
  if (!el) return;
  const targetKw = _getTargetKw();
  if (targetKw === 0 || _powerRows.length === 0) { el.innerHTML = ''; return; }
  el.innerHTML = `
    <div style="
      background:var(--color-bg-elevated); border:1px solid var(--color-border);
      border-radius:10px; padding:14px 16px; margin-top:4px;
      display:flex; align-items:center; gap:16px; flex-wrap:wrap;">
      <div>
        <div style="font-size:11px; color:var(--color-interactive); font-weight:600; letter-spacing:0.05em; margin-bottom:3px;">TARGET</div>
        <div style="font-size:20px; font-weight:700; color:var(--text);">${_fmtPower(targetKw)}</div>
      </div>
      <div style="font-size:12px; color:var(--color-text-disabled);">
        Each row is sized independently to cover the full target — compare options and pick your mix.
      </div>
    </div>`;
}

// ── Public API ───────────────────────────────────────────────
// "Calculate →" on a fuel: sets that fuel as recipe line with exactly the
// needed amount (adds it or updates the existing line) and opens the results.
function calcFuelInRecipes(item, rate) {
  if (!selectedRecipeList.some(l => l.itemName === item)) addRecipeItem(item);
  const line = selectedRecipeList.find(l => l.itemName === item);
  if (!line) return;
  line.goal = Math.round(rate * 1000) / 1000;
  switchSidebarView('recipes'); // also switches the main tab
  renderSelectedRecipes();
  saveSettings();
  calculateRecipes();
}

function initPowerPlanner() {
  _renderRows();
  _renderSummary();
}

function onPowerTargetChange() {
  _renderRows();
  _renderSummary();
}

function addPowerRow(genId) {
  const gen = POWER_GENERATORS.find(g => g.id === genId);
  if (!gen) return;
  _powerRows.push({
    rowId:   ++_rowCounter,
    genId:   genId,
    fuelName: gen.requiresFuel ? gen.fuels[0] : null,
  });
  _renderRows();
  _renderSummary();
}

function removePowerRow(rowId) {
  _powerRows = _powerRows.filter(r => r.rowId !== rowId);
  _renderRows();
  _renderSummary();
}

function onPowerFuelChange(rowId, fuelName) {
  const row = _powerRows.find(r => r.rowId === rowId);
  if (row) row.fuelName = fuelName;
  _renderRows();
  _renderSummary();
}
