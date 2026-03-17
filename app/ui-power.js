// ============================================================
// app/ui-power.js
// Power Planner: enter target power, add generator types,
// pick fuel, get count + fuel consumption per minute.
// ============================================================

const POWER_FUELS = {
  'Biomass':         { valueMj: 5   },
  'Portable Fuel':   { valueMj: 16  },
  'Jetpack Fuel':    { valueMj: 25  },
  'Coked Ignium':    { valueMj: 400 },
  'Ignium Fuel Rod': { valueMj: 400 },
};

const POWER_GENERATORS = [
  {
    id: 'solar_small',
    name: 'Solar Panel (Small)',
    powerKw: 300,
    requiresFuel: false,
    grid: 'High Voltage',
    note: null,
  },
  {
    id: 'solar_large',
    name: 'Solar Panel (Large)',
    powerKw: 650,
    requiresFuel: false,
    grid: 'High Voltage',
    note: null,
  },
  {
    id: 'biomass_burner',
    name: 'Biomass Burner',
    powerKw: 600,
    efficiency: 0.7,
    requiresFuel: true,
    fuels: ['Biomass'],
    grid: 'Low Voltage',
    note: null,
  },
  {
    id: 'burner_generator',
    name: 'Burner Generator',
    powerKw: 1800,
    efficiency: 0.8,
    requiresFuel: true,
    fuels: ['Biomass', 'Portable Fuel', 'Jetpack Fuel', 'Coked Ignium', 'Ignium Fuel Rod'],
    grid: 'Low Voltage',
    note: null,
  },
  {
    id: 'boiler_turbine',
    name: 'Boiler + Steam Turbine',
    powerKw: 3600,
    requiresFuel: true,
    isSteam: true,
    fuels: ['Portable Fuel', 'Jetpack Fuel', 'Coked Ignium', 'Ignium Fuel Rod'],
    grid: 'High Voltage',
    note: '1 Boiler + 1 Turbine per unit',
  },
  {
    id: 'geothermal',
    name: 'Geothermal + 2× Steam Turbine',
    powerKw: 7200,
    requiresFuel: false,
    grid: 'High Voltage',
    note: 'Requires Geothermal Vent',
  },
];

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
  const fuel = POWER_FUELS[fuelName];
  if (!fuel) return 0;
  // power_kw * 60s / (efficiency * fuel_value_mj * 1000 kJ/MJ)
  const eff = gen.isSteam ? 1.0 : (gen.efficiency || 1.0);
  return (gen.powerKw * 60) / (eff * fuel.valueMj * 1000);
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
    el.innerHTML = `<div style="color:rgba(255,255,255,0.25); text-align:center; padding:40px 24px; font-size:13px;">
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

    const gridColor = gen.grid === 'High Voltage'
      ? 'rgba(96,165,250,0.7)'   // blue
      : 'rgba(251,191,36,0.7)';  // yellow

    const fuelSelect = gen.requiresFuel
      ? `<select onchange="onPowerFuelChange(${row.rowId}, this.value)" style="
           background:rgba(255,255,255,0.07); border:1px solid rgba(255,255,255,0.12);
           color:var(--text); border-radius:6px; padding:5px 10px; font-size:12px; cursor:pointer; outline:none">
           ${gen.fuels.map(f =>
             `<option value="${f}"${f === row.fuelName ? ' selected' : ''}>${f}</option>`
           ).join('')}
         </select>`
      : `<span style="font-size:12px; color:rgba(255,255,255,0.25); font-style:italic;">No fuel required</span>`;

    const fuelLine = gen.requiresFuel && count > 0
      ? `<div style="font-size:12px; color:rgba(255,255,255,0.5); margin-top:6px; padding-top:6px; border-top:1px solid rgba(255,255,255,0.06);">
           Fuel consumption: <strong style="color:var(--text)">${fmt(Math.round(fuelRateTotal * 1000) / 1000)}</strong>
           <span style="color:rgba(255,255,255,0.4)"> ${row.fuelName}/min</span>
           <span style="color:rgba(255,255,255,0.25); margin-left:8px;">(${fmt(Math.round(fuelRateUnit * 1000) / 1000)} per unit)</span>
         </div>`
      : '';

    const surplusLine = count > 0 && surplus > 0
      ? `<span style="font-size:11px; color:rgba(255,255,255,0.3); margin-left:6px;">+${_fmtPower(surplus)} surplus</span>`
      : '';

    return `
    <div style="
      background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08);
      border-radius:10px; padding:14px 16px; display:flex; flex-direction:column; gap:10px;">

      <!-- Header row -->
      <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:10px; flex-wrap:wrap">
        <div style="display:flex; flex-direction:column; gap:5px">
          <span style="font-weight:600; font-size:14px; color:var(--text)">${gen.name}</span>
          <div style="display:flex; gap:6px; flex-wrap:wrap; align-items:center">
            <span style="font-size:11px; color:rgba(255,255,255,0.35);">${_fmtPower(gen.powerKw)} each</span>
            <span style="font-size:11px; color:${gridColor}; background:rgba(255,255,255,0.05);
              border:1px solid rgba(255,255,255,0.08); border-radius:4px; padding:1px 6px;">${gen.grid} Grid</span>
            ${gen.note ? `<span style="font-size:11px; color:rgba(251,191,36,0.8); background:rgba(251,191,36,0.08);
              border:1px solid rgba(251,191,36,0.2); border-radius:4px; padding:1px 6px;">${gen.note}</span>` : ''}
          </div>
        </div>
        <button onclick="removePowerRow(${row.rowId})" style="
          background:rgba(255,60,60,0.08); border:1px solid rgba(255,60,60,0.18);
          color:rgba(255,100,100,0.7); border-radius:6px; padding:4px 10px;
          font-size:11px; cursor:pointer; flex-shrink:0; transition:all 0.15s"
          onmouseover="this.style.background='rgba(255,60,60,0.18)'"
          onmouseout="this.style.background='rgba(255,60,60,0.08)'">✕ Remove</button>
      </div>

      <!-- Fuel + count row -->
      <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px">
        <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap">
          <span style="font-size:12px; color:rgba(255,255,255,0.4);">Fuel:</span>
          ${fuelSelect}
        </div>
        <div style="display:flex; align-items:baseline; gap:6px;">
          <span style="font-size:12px; color:rgba(255,255,255,0.4);">Need:</span>
          <span style="font-size:26px; font-weight:700; color:var(--accent); font-variant-numeric:tabular-nums; line-height:1">
            ${count > 0 ? count : '–'}
          </span>
          ${count > 0 ? `
            <span style="font-size:12px; color:rgba(255,255,255,0.35);">${count === 1 ? 'unit' : 'units'}</span>
            <span style="font-size:12px; color:rgba(255,255,255,0.25);">→ ${_fmtPower(totalKw)}</span>
            ${surplusLine}
          ` : ''}
        </div>
      </div>

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
      background:rgba(255,255,255,0.025); border:1px solid rgba(255,255,255,0.07);
      border-radius:10px; padding:14px 16px; margin-top:4px;
      display:flex; align-items:center; gap:16px; flex-wrap:wrap;">
      <div>
        <div style="font-size:11px; color:rgba(255,255,255,0.4); font-weight:600; letter-spacing:0.05em; margin-bottom:3px;">TARGET</div>
        <div style="font-size:20px; font-weight:700; color:var(--text);">${_fmtPower(targetKw)}</div>
      </div>
      <div style="font-size:12px; color:rgba(255,255,255,0.3);">
        Each row is sized independently to cover the full target — compare options and pick your mix.
      </div>
    </div>`;
}

// ── Public API ───────────────────────────────────────────────
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
