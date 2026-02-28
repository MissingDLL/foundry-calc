// ============================================================
// tests/unit.test.js
// ============================================================
// Self-contained test suite for the pure/stateful logic of
// foundry-calc.  Open tests/runner.html in a browser to run.
//
// Covers:
//   • fmt()               – number formatting
//   • getOutputAmount()   – recipe output math
//   • getOutputLabel()    – output display strings
//   • saveSettings() / loadSettings() – persistence round-trips
//   • _applyImportedPlan()             – plan import logic
// ============================================================

// ── Minimal test framework ────────────────────────────────────

const _T = (() => {
  const suites = [];
  let cur = null;

  function describe(name, fn) {
    cur = { name, tests: [] };
    suites.push(cur);
    fn();
    cur = null;
  }

  function it(name, fn) {
    if (!cur) throw new Error('it() called outside describe()');
    cur.tests.push({ name, fn });
  }

  function expect(val) {
    return {
      toBe(expected) {
        if (!Object.is(val, expected))
          throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(val)}`);
      },
      toEqual(expected) {
        const a = JSON.stringify(val), b = JSON.stringify(expected);
        if (a !== b) throw new Error(`Expected ${b},\n     got ${a}`);
      },
      toBeCloseTo(expected, digits = 4) {
        if (Math.abs(val - expected) >= Math.pow(10, -digits))
          throw new Error(`Expected ≈${expected}, got ${val}`);
      },
      toBeGreaterThan(n)  { if (!(val > n))  throw new Error(`Expected ${val} > ${n}`); },
      toBeTruthy()        { if (!val)         throw new Error(`Expected truthy, got ${JSON.stringify(val)}`); },
      toBeFalsy()         { if (val)          throw new Error(`Expected falsy, got ${JSON.stringify(val)}`); },
      toBeNull()          { if (val !== null) throw new Error(`Expected null, got ${JSON.stringify(val)}`); },
      toContain(item)     {
        if (!Array.isArray(val) || !val.includes(item))
          throw new Error(`Expected array to contain ${JSON.stringify(item)}`);
      },
    };
  }

  async function run() {
    let passed = 0, failed = 0;
    const suiteResults = [];

    for (const suite of suites) {
      const sr = { name: suite.name, tests: [] };
      suiteResults.push(sr);
      for (const test of suite.tests) {
        _resetState();
        try {
          await test.fn();
          passed++;
          sr.tests.push({ name: test.name, status: 'pass' });
        } catch (e) {
          failed++;
          sr.tests.push({ name: test.name, status: 'fail', error: e.message });
        }
      }
    }
    return { passed, failed, suites: suiteResults };
  }

  return { describe, it, expect, run };
})();

const { describe, it, expect } = _T;

// ── State reset helper (called before each test) ──────────────

function _resetState() {
  localStorage.clear();
  Object.keys(variantSettings).forEach(k => delete variantSettings[k]);
  Object.keys(minerSettings).forEach(k => delete minerSettings[k]);
  Object.keys(botEfficiencyOverrides).forEach(k => delete botEfficiencyOverrides[k]);
  Object.keys(workstationConfigs).forEach(k => delete workstationConfigs[k]);
  globalMiningProductivity = 0;
  globalFluidProductivity  = 0;
  selectedRecipeList       = [];
  MACHINE_FAMILIES.forEach(f => { delete f.defaultChoice; });
}

// ── Stubs for DOM-writing functions called by _applyImportedPlan ──
// Override at this scope so the originals are never invoked during tests.
function buildRecipeCategoryList() {}
function renderSelectedRecipes()   {}
function calculateRecipes()        {}
function renderSankey()            {}
function renderBoxes()             {}


// ════════════════════════════════════════════════════════════
// 1. fmt()
// ════════════════════════════════════════════════════════════
describe('fmt()', () => {
  it('returns "-" for zero', () => {
    expect(fmt(0)).toBe('-');
  });

  it('returns "1" for 1 (no separator needed)', () => {
    expect(fmt(1)).toBe('1');
  });

  it('formats 1 500 with German thousands dot', () => {
    expect(fmt(1500)).toBe('1.500');
  });

  it('formats 1 000 000 with two dots', () => {
    expect(fmt(1000000)).toBe('1.000.000');
  });

  it('formats a decimal with German comma', () => {
    // 3.14159 → "3,14" (max 2 fraction digits)
    expect(fmt(3.14159)).toBe('3,14');
  });

  it('formats 0.5 correctly', () => {
    expect(fmt(0.5)).toBe('0,5');
  });

  it('treats integers as integers (no decimal part)', () => {
    expect(fmt(42)).toBe('42');
  });
});


// ════════════════════════════════════════════════════════════
// 2. getOutputAmount()
// ════════════════════════════════════════════════════════════
describe('getOutputAmount()', () => {
  it('returns amount for a plain single output', () => {
    expect(getOutputAmount({ output: { amount: 2 } })).toBe(2);
  });

  it('applies chance to a single output (2 × 50 % = 1)', () => {
    expect(getOutputAmount({ output: { amount: 2, chance: 0.5 } })).toBe(1);
  });

  it('ignores chance=1 (full probability)', () => {
    expect(getOutputAmount({ output: { amount: 3, chance: 1 } })).toBe(3);
  });

  it('uses index 0 from an array output', () => {
    expect(getOutputAmount({ output: [{ item: 'X', amount: 5 }] })).toBe(5);
  });

  it('applies chance to array output (4 × 0.25 = 1)', () => {
    expect(getOutputAmount({ output: [{ item: 'X', amount: 4, chance: 0.25 }] })).toBe(1);
  });

  it('returns 0 when output is missing', () => {
    expect(getOutputAmount({})).toBe(0);
  });

  it('returns 0 when output is null', () => {
    expect(getOutputAmount({ output: null })).toBe(0);
  });
});


// ════════════════════════════════════════════════════════════
// 3. getOutputLabel()
// ════════════════════════════════════════════════════════════
describe('getOutputLabel()', () => {
  it('returns plain amount string for deterministic output', () => {
    expect(getOutputLabel({ output: { amount: 3 } })).toBe('3');
  });

  it('appends chance badge for probabilistic output', () => {
    expect(getOutputLabel({ output: { amount: 2, chance: 0.5 } })).toBe('2 (50%)');
  });

  it('does not add badge when chance equals 1', () => {
    expect(getOutputLabel({ output: { amount: 4, chance: 1 } })).toBe('4');
  });

  it('returns "0" when output is absent', () => {
    expect(getOutputLabel({})).toBe('0');
  });
});


// ════════════════════════════════════════════════════════════
// 4. saveSettings() / loadSettings() – persistence round-trips
// ════════════════════════════════════════════════════════════
describe('saveSettings() / loadSettings() round-trip', () => {
  it('persists and restores globalMiningProductivity', () => {
    globalMiningProductivity = 35;
    _flushSaveSettings();
    globalMiningProductivity = 0;
    loadSettings();
    expect(globalMiningProductivity).toBe(35);
  });

  it('persists and restores globalFluidProductivity', () => {
    globalFluidProductivity = 20;
    _flushSaveSettings();
    globalFluidProductivity = 0;
    loadSettings();
    expect(globalFluidProductivity).toBe(20);
  });

  it('clamps globalMiningProductivity > 100 on load', () => {
    localStorage.setItem('fc_settings', JSON.stringify({
      globalMiningProductivity: 150,
    }));
    loadSettings();
    expect(globalMiningProductivity).toBe(100);
  });

  it('clamps globalMiningProductivity < 0 on load', () => {
    localStorage.setItem('fc_settings', JSON.stringify({
      globalMiningProductivity: -5,
    }));
    loadSettings();
    expect(globalMiningProductivity).toBe(0);
  });

  it('persists and restores variantSettings', () => {
    variantSettings['Xenoferrite Plates'] = 'Tier 2';
    _flushSaveSettings();
    delete variantSettings['Xenoferrite Plates'];
    loadSettings();
    expect(variantSettings['Xenoferrite Plates']).toBe('Tier 2');
  });

  it('filters out invalid bot efficiency overrides on load', () => {
    localStorage.setItem('fc_settings', JSON.stringify({
      botEfficiencyOverrides: {
        'Welder Bot': 50,
        'Bad Bot': -10,        // negative → filtered
        'Evil Bot': 9999,      // > 200 → filtered
        'NaN Bot': NaN,        // NaN → filtered
        'Str Bot': 'high',     // non-number → filtered
      },
    }));
    loadSettings();
    expect(botEfficiencyOverrides['Welder Bot']).toBe(50);
    expect(botEfficiencyOverrides['Bad Bot']).toBeFalsy();
    expect(botEfficiencyOverrides['Evil Bot']).toBeFalsy();
  });

  it('falls back to first machine when saved machine is invalid', () => {
    // "Firmarlite Sheet" has two machines: Lava Smelter I and Lava Smelter II
    localStorage.setItem('fc_settings', JSON.stringify({
      selectedRecipeList: [{
        itemName:    'Firmarlite Sheet',
        recipeName:  'Firmarlite Sheet',
        machineName: 'NONEXISTENT_MACHINE',
        goal:        60,
      }],
    }));
    loadSettings();
    const item = selectedRecipeList[0];
    const validMachines = Object.keys(RECIPES['Firmarlite Sheet'].machines);
    expect(validMachines.includes(item.machineName)).toBeTruthy();
  });

  it('clamps goal values to the valid range on load', () => {
    localStorage.setItem('fc_settings', JSON.stringify({
      selectedRecipeList: [{
        itemName:    'Firmarlite Sheet',
        recipeName:  'Firmarlite Sheet',
        machineName: Object.keys(RECIPES['Firmarlite Sheet'].machines)[0],
        goal:        -999,   // negative → should fall back to 60
      }],
    }));
    loadSettings();
    expect(selectedRecipeList[0].goal).toBe(60);
  });

  it('silently ignores corrupt JSON in localStorage', () => {
    localStorage.setItem('fc_settings', '{NOT VALID JSON!!!');
    // should not throw
    loadSettings();
    expect(globalMiningProductivity).toBe(0);
  });

  it('skips recipes that no longer exist in RECIPES', () => {
    localStorage.setItem('fc_settings', JSON.stringify({
      selectedRecipeList: [
        { itemName: 'Ghost Item', recipeName: 'RECIPE_THAT_DOES_NOT_EXIST', goal: 60 },
        { itemName: 'Firmarlite Sheet', recipeName: 'Firmarlite Sheet',
          machineName: Object.keys(RECIPES['Firmarlite Sheet'].machines)[0], goal: 30 },
      ],
    }));
    loadSettings();
    expect(selectedRecipeList.length).toBe(1);
    expect(selectedRecipeList[0].recipeName).toBe('Firmarlite Sheet');
  });
});


// ════════════════════════════════════════════════════════════
// 5. _applyImportedPlan()
// ════════════════════════════════════════════════════════════
describe('_applyImportedPlan()', () => {
  it('rejects a plan with an unsupported version', () => {
    let alerted = false;
    const origAlert = window.alert;
    window.alert = () => { alerted = true; };
    _applyImportedPlan({ version: 99, selectedRecipeList: [], settings: {} });
    window.alert = origAlert;
    expect(alerted).toBeTruthy();
    expect(selectedRecipeList.length).toBe(0);
  });

  it('rejects null/undefined plan gracefully', () => {
    let alerted = false;
    const origAlert = window.alert;
    window.alert = () => { alerted = true; };
    _applyImportedPlan(null);
    window.alert = origAlert;
    expect(alerted).toBeTruthy();
  });

  it('restores recipe list from a valid plan', () => {
    const machineName = Object.keys(RECIPES['Firmarlite Sheet'].machines)[0];
    _applyImportedPlan({
      version: 1,
      selectedRecipeList: [
        { itemName: 'Firmarlite Sheet', recipeName: 'Firmarlite Sheet', machineName, goal: 120 },
      ],
      settings: {},
    });
    expect(selectedRecipeList.length).toBe(1);
    expect(selectedRecipeList[0].goal).toBe(120);
  });

  it('clears existing state before applying imported values', () => {
    // Pre-load some settings that should be wiped on import
    variantSettings['SomeVariant'] = 'Old Value';
    globalMiningProductivity = 50;

    _applyImportedPlan({
      version: 1,
      selectedRecipeList: [],
      settings: { globalMiningProductivity: 10 },
    });

    // Old variant must be gone; new productivity must be 10
    expect(variantSettings['SomeVariant']).toBeFalsy();
    expect(globalMiningProductivity).toBe(10);
  });

  it('restores settings from a valid plan', () => {
    _applyImportedPlan({
      version: 1,
      selectedRecipeList: [],
      settings: {
        globalMiningProductivity: 42,
        globalFluidProductivity:  17,
        variantSettings: { 'Plates': 'Tier 3' },
      },
    });
    expect(globalMiningProductivity).toBe(42);
    expect(globalFluidProductivity).toBe(17);
    expect(variantSettings['Plates']).toBe('Tier 3');
  });

  it('skips recipes not in RECIPES during import', () => {
    _applyImportedPlan({
      version: 1,
      selectedRecipeList: [
        { itemName: 'Ghost', recipeName: 'DOES_NOT_EXIST', goal: 60 },
        { itemName: 'Firmarlite Sheet', recipeName: 'Firmarlite Sheet',
          machineName: Object.keys(RECIPES['Firmarlite Sheet'].machines)[0], goal: 60 },
      ],
      settings: {},
    });
    expect(selectedRecipeList.length).toBe(1);
    expect(selectedRecipeList[0].recipeName).toBe('Firmarlite Sheet');
  });
});


// ════════════════════════════════════════════════════════════
// Runner – executes all suites and renders results
// ════════════════════════════════════════════════════════════

_T.run().then(({ passed, failed, suites }) => {
  const statsEl   = document.getElementById('stats');
  const resultsEl = document.getElementById('results');

  statsEl.innerHTML = `
    <div class="stat total-stat"><span class="lbl">Total</span>${passed + failed}</div>
    <div class="stat pass-stat"><span class="lbl">Passed</span>${passed}</div>
    <div class="stat fail-stat"><span class="lbl">Failed</span>${failed}</div>
  `;

  resultsEl.innerHTML = suites.map(suite => {
    const allPass = suite.tests.every(t => t.status === 'pass');
    const badge   = allPass
      ? `<span class="suite-badge all-pass">all pass</span>`
      : `<span class="suite-badge has-fail">${suite.tests.filter(t => t.status === 'fail').length} failed</span>`;

    const tests = suite.tests.map(t => `
      <div class="test ${t.status}">
        <span class="icon">${t.status === 'pass' ? '✓' : '✗'}</span>
        <div>
          <div class="test-name">${t.name}</div>
          ${t.error ? `<div class="err-msg">${t.error}</div>` : ''}
        </div>
      </div>`).join('');

    return `
      <div class="suite">
        <div class="suite-header">${suite.name} ${badge}</div>
        ${tests}
      </div>`;
  }).join('');

  // Also log to console for quick CI-style inspection
  console.log(`\nTest results: ${passed} passed, ${failed} failed`);
  suites.forEach(s => {
    s.tests.filter(t => t.status === 'fail').forEach(t =>
      console.error(`  FAIL: [${s.name}] ${t.name}\n       ${t.error}`)
    );
  });
});
