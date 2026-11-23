function animateModalOpen(overlayId, modalId) {
  const overlay = document.getElementById(overlayId);
  const modal   = document.getElementById(modalId);
  overlay.style.display = 'flex';
  overlay.style.animation = 'none';
  modal.style.animation   = 'none';
  overlay.offsetHeight; // reflow
  overlay.style.animation = 'overlayIn 0.3s ease both';
  modal.style.animation   = 'modalIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both';
}

function animateModalClose(overlayId, modalId, callback) {
  const overlay = document.getElementById(overlayId);
  const modal   = document.getElementById(modalId);
  overlay.style.animation = 'overlayOut 0.25s ease both';
  modal.style.animation   = 'modalOut 0.25s cubic-bezier(0.45,0,0.15,1) both';
  modal.addEventListener('animationend', function handler() {
    modal.removeEventListener('animationend', handler);
    overlay.style.display = 'none';
    overlay.style.animation = '';
    modal.style.animation   = '';
    if (callback) callback();
  }, { once: true });
}

function openRecipeSettings() {
  renderSettingsContent('settingsContent');
  animateModalOpen('recipeSettingsOverlay', 'recipeSettingsModal');
}

function closeRecipeSettings(e) {
  if (
    !e ||
    e.target === document.getElementById("recipeSettingsOverlay")
  ) {
    animateModalClose('recipeSettingsOverlay', 'recipeSettingsModal');
  }
}

function switchGameVersion(id) {
  if (id === GAME_VERSION_ID) return;
  localStorage.setItem('fc_game_version', id);
  try {
    const s = JSON.parse(localStorage.getItem('fc_settings') || '{}');
    s.selectedRecipeList = [];
    s.variantSettings = {};
    s.minerSettings = {};
    localStorage.setItem('fc_settings', JSON.stringify(s));
  } catch (e) {}
  sessionStorage.removeItem('fc_settings'); // tab copy would keep the old version's recipes
  location.reload();
}

function renderSettingsContent(targetId) {
  const el = document.getElementById(targetId || "settingsContent");
  el.innerHTML = "";

  // ── Section: Spielversion ─────────────────────────────────
  const verTitle = document.createElement("div");
  verTitle.style.cssText =
    "font-size:11px;font-weight:600;color:var(--color-text-secondary);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:10px";
  verTitle.textContent = "Spielversion";
  el.appendChild(verTitle);

  const verRow = document.createElement("div");
  verRow.style.cssText = "display:flex;align-items:center;gap:8px;flex-wrap:wrap";

  GAME_VERSIONS.forEach(function (v) {
    const isActive = v.id === GAME_VERSION_ID;
    const btn = document.createElement("button");
    btn.style.cssText =
      "padding:6px 16px;border-radius:8px;cursor:pointer;font-family:-apple-system,sans-serif;font-size:13px;transition:all 0.18s;" +
      (isActive
        ? "background:var(--color-accent-active-bg);border:1px solid var(--color-border-focus);color:var(--color-text-primary);"
        : "background:var(--color-accent-inactive-bg);border:1px solid var(--color-border);color:var(--color-interactive);cursor:pointer;");
    btn.textContent = v.label;
    btn.onclick = function () { switchGameVersion(v.id); };
    verRow.appendChild(btn);
  });
  el.appendChild(verRow);

  const verSep = document.createElement("div");
  verSep.style.cssText = "border-top:1px solid var(--color-border);margin:18px 0";
  el.appendChild(verSep);

  // ── Section: Machine family defaults ─────────────────────
  const machTitle = document.createElement("div");
  machTitle.style.cssText =
    "font-size:11px;font-weight:600;color:var(--color-text-secondary);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:10px";
  machTitle.textContent = "Default Machines";
  el.appendChild(machTitle);

  const machGrid = document.createElement("div");
  machGrid.style.cssText = "display:flex;flex-direction:column;gap:10px";

  MACHINE_FAMILIES.forEach((fam) => {
    const row = document.createElement("div");
    row.style.cssText = "display:flex;align-items:center;gap:12px;flex-wrap:wrap";

    const lbl = document.createElement("div");
    lbl.style.cssText = "width:110px;font-size:13px;color:var(--text);flex-shrink:0";
    lbl.textContent = fam.label;
    row.appendChild(lbl);

    fam.machines.forEach((machine) => {
      const isActive = (fam.defaultChoice || fam.machines[0]) === machine;
      const btn = document.createElement("button");
      btn.style.cssText =
        "display:flex;align-items:center;gap:6px;padding:6px 12px;border-radius:8px;cursor:pointer;font-family:-apple-system,sans-serif;font-size:12px;transition:all 0.18s;white-space:nowrap;" +
        (isActive
          ? "background:var(--color-accent-active-bg);border:1px solid var(--color-border-focus);color:var(--color-text-primary);"
          : "background:var(--color-accent-inactive-bg);border:1px solid var(--color-border);color:var(--color-interactive);");
      btn.innerHTML =
        getIcon(machine, 20) +
        "<span>" +
        machine +
        "</span>";
      btn.dataset.family = fam.label;
      btn.dataset.machine = machine;
      btn.onclick = function () {
        fam.defaultChoice = machine;
        saveSettings();
        // Update visuals
        row.querySelectorAll("button").forEach((b) => {
          const active = b.dataset.machine === machine;
          b.style.background = active ? "var(--color-accent-active-bg)" : "var(--color-accent-inactive-bg)";
          b.style.border = active
            ? "1px solid var(--color-border-focus)"
            : "1px solid var(--color-border)";
          b.style.color = active ? "var(--color-text-primary)" : "var(--color-interactive)";
        });
      };
      row.appendChild(btn);
    });

    machGrid.appendChild(row);
  });
  el.appendChild(machGrid);

  // ── Section: Recipe variant defaults ─────────────────────
  const sep = document.createElement("div");
  sep.style.cssText = "border-top:1px solid var(--color-border);margin:18px 0";
  el.appendChild(sep);

  const varTitle = document.createElement("div");
  varTitle.style.cssText =
    "font-size:11px;font-weight:600;color:var(--color-text-secondary);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:10px";
  varTitle.textContent = "Recipe Variants (Default)";
  el.appendChild(varTitle);

  const varGrid = document.createElement("div");
  varGrid.style.cssText = "display:flex;flex-direction:column;gap:10px";

  VARIANT_GROUPS.forEach((group) => {
    const row = document.createElement("div");
    row.style.cssText =
      "display:flex;align-items:center;gap:12px;flex-wrap:wrap";

    const lbl = document.createElement("div");
    lbl.style.cssText = "width:110px;font-size:13px;color:var(--text)";
    lbl.textContent = group.label;
    row.appendChild(lbl);

    const currentChoice =
      variantSettings[group.label] || group.variants[0];

    group.variants.forEach((variant) => {
      const isActive = currentChoice === variant;
      const btn = document.createElement("button");
      const shortName =
        variant.replace(group.label, "").trim() || variant;
      btn.style.cssText =
        "display:flex;align-items:center;gap:6px;padding:6px 12px;border-radius:8px;cursor:pointer;font-family:-apple-system,sans-serif;font-size:12px;transition:all 0.18s;white-space:nowrap;" +
        (isActive
          ? "background:var(--color-accent-active-bg);border:1px solid var(--color-border-focus);color:var(--color-text-primary);"
          : "background:var(--color-accent-inactive-bg);border:1px solid var(--color-border);color:var(--color-interactive);");
      btn.innerHTML =
        getIcon(variant, 20) +
        "<span>" +
        (shortName || variant) +
        "</span>";
      btn.dataset.group = group.label;
      btn.dataset.variant = variant;
      btn.onclick = function () {
        variantSettings[group.label] = variant;
        saveSettings();
        row.querySelectorAll("button").forEach((b) => {
          const active = b.dataset.variant === variant;
          b.style.background = active ? "var(--color-accent-active-bg)" : "var(--color-accent-inactive-bg)";
          b.style.border = active
            ? "1px solid var(--color-border-focus)"
            : "1px solid var(--color-border)";
          b.style.color = active ? "var(--color-text-primary)" : "var(--color-interactive)";
        });
      };
      row.appendChild(btn);
    });

    varGrid.appendChild(row);
  });
  el.appendChild(varGrid);

  // ── Section: Burnable Items (Fuel choices) ────────────────
  const burnSep = document.createElement("div");
  burnSep.style.cssText = "border-top:1px solid var(--color-border);margin:18px 0";
  el.appendChild(burnSep);

  const burnTitle = document.createElement("div");
  burnTitle.style.cssText =
    "font-size:11px;font-weight:600;color:var(--color-text-secondary);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px";
  burnTitle.textContent = "Burnable Items (Fuel)";
  el.appendChild(burnTitle);

  const burnDesc = document.createElement("div");
  burnDesc.style.cssText = "font-size:11px;color:var(--color-text-secondary);margin-bottom:12px";
  burnDesc.textContent = "Fuel burned by the Boiler for Steam (items flagged burnable in the game data). The fuel is added to the material list.";
  el.appendChild(burnDesc);

  const burnGrid = document.createElement("div");
  burnGrid.style.cssText = "display:flex;flex-direction:column;gap:10px";

  BURNABLE_GROUPS.forEach((group) => {
    const row = document.createElement("div");
    row.style.cssText = "display:flex;align-items:center;gap:12px;flex-wrap:wrap";

    const lbl = document.createElement("div");
    lbl.style.cssText = "width:110px;font-size:13px;color:var(--text)";
    lbl.textContent = group.label;
    row.appendChild(lbl);

    const currentChoice = variantSettings[group.label] || group.variants[0];

    group.variants.forEach((variant) => {
      const isActive = currentChoice === variant;
      const shortName = variant.replace(group.label, "").replace(/^\s*\(|\)\s*$/g, "").trim() || "No fuel";
      const btn = document.createElement("button");
      btn.style.cssText =
        "display:flex;align-items:center;gap:6px;padding:6px 12px;border-radius:8px;cursor:pointer;font-family:-apple-system,sans-serif;font-size:12px;transition:all 0.18s;white-space:nowrap;" +
        (isActive
          ? "background:var(--color-accent-active-bg);border:1px solid var(--color-border-focus);color:var(--color-text-primary);"
          : "background:var(--color-accent-inactive-bg);border:1px solid var(--color-border);color:var(--color-interactive);");
      btn.innerHTML = getIcon(RECIPES[variant]?.fuel || variant, 20) + "<span>" + shortName + "</span>"; // fuel icon
      btn.dataset.group = group.label;
      btn.dataset.variant = variant;
      btn.onclick = function () {
        variantSettings[group.label] = variant;
        saveSettings();
        if (selectedRecipeList.length) calculateRecipes();
        row.querySelectorAll("button").forEach((b) => {
          const active = b.dataset.variant === variant;
          b.style.background = active ? "var(--color-accent-active-bg)" : "var(--color-accent-inactive-bg)";
          b.style.border = active ? "1px solid var(--color-border-focus)" : "1px solid var(--color-border)";
          b.style.color = active ? "var(--color-text-primary)" : "var(--color-interactive)";
        });
      };
      row.appendChild(btn);
    });

    burnGrid.appendChild(row);
  });
  el.appendChild(burnGrid);

  // ── Section: Miner preferences ───────────────────────────────
  const minerSep = document.createElement("div");
  minerSep.style.cssText = "border-top:1px solid var(--color-border);margin:18px 0";
  el.appendChild(minerSep);

  const minerTitle = document.createElement("div");
  minerTitle.style.cssText =
    "font-size:11px;font-weight:600;color:var(--color-text-secondary);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px";
  minerTitle.textContent = "Mining Machines (Raw Materials)";
  el.appendChild(minerTitle);

  const minerDesc = document.createElement("div");
  minerDesc.style.cssText = "font-size:11px;color:var(--color-text-secondary);margin-bottom:12px";
  minerDesc.textContent =
    "Which machine should be used for each raw material in the ingredient resolution?";
  el.appendChild(minerDesc);

  const minerGrid = document.createElement("div");
  minerGrid.style.cssText = "display:flex;flex-direction:column;gap:10px";

  MINER_GROUPS.forEach((group) => {
    if (group.miners.length < 2) return; // skip if only one option
    const row = document.createElement("div");
    row.style.cssText = "display:flex;align-items:center;gap:12px;flex-wrap:wrap";

    const lbl = document.createElement("div");
    lbl.style.cssText = "width:160px;font-size:13px;color:var(--text);flex-shrink:0";
    lbl.textContent = group.label;
    row.appendChild(lbl);

    const currentChoice = RECIPES[group.label]
      ? preferredMinerFor(group.label, RECIPES[group.label])
      : (minerSettings[group.label] || group.miners[0]);

    group.miners.forEach((miner) => {
      const isActive = currentChoice === miner;
      const btn = document.createElement("button");
      btn.style.cssText =
        "display:flex;align-items:center;gap:6px;padding:6px 12px;border-radius:8px;cursor:pointer;font-family:-apple-system,sans-serif;font-size:12px;transition:all 0.18s;white-space:nowrap;" +
        (isActive
          ? "background:var(--color-accent-active-bg);border:1px solid var(--color-border-focus);color:var(--color-text-primary);"
          : "background:var(--color-accent-inactive-bg);border:1px solid var(--color-border);color:var(--color-interactive);");
      btn.innerHTML = getIcon(miner, 20) + "<span>" + miner + "</span>";
      btn.dataset.ore = group.label;
      btn.dataset.miner = miner;
      btn.onclick = function () {
        minerSettings[group.label] = miner;
        saveSettings();
        row.querySelectorAll("button").forEach((b) => {
          const active = b.dataset.miner === miner;
          b.style.background = active ? "var(--color-accent-active-bg)" : "var(--color-accent-inactive-bg)";
          b.style.border = active ? "1px solid var(--color-border-focus)" : "1px solid var(--color-border)";
          b.style.color = active ? "var(--text)" : "var(--text-dim)";
        });
      };
      row.appendChild(btn);
    });

    minerGrid.appendChild(row);
  });
  el.appendChild(minerGrid);

  if (typeof VEIN_MINING_FLUIDS !== "undefined" && Object.keys(VEIN_MINING_FLUIDS).length) {
    const fluid = Object.values(VEIN_MINING_FLUIDS)[0];
    const dep = document.createElement("label");
    dep.style.cssText = "display:flex;align-items:center;gap:8px;font-size:13px;color:var(--text);margin-top:12px;cursor:pointer";
    const depCb = document.createElement("input");
    depCb.type = "checkbox";
    depCb.checked = veinsDepleted;
    depCb.onchange = () => { veinsDepleted = depCb.checked; saveSettings(); calculateRecipes(); };
    dep.appendChild(depCb);
    dep.appendChild(document.createTextNode(
      `Veins depleted (mined to the core): ${fluid.machines.join(", ")} need ${fluid.perMinerPerMin} L/min ${fluid.fluid} each (less with Mining Efficiency)`));
    el.appendChild(dep);

    const veins = document.createElement("label");
    veins.style.cssText = "display:flex;align-items:center;gap:8px;font-size:13px;color:var(--text);margin:6px 0 0 24px";
    const veinsInp = document.createElement("input");
    veinsInp.type = "number"; veinsInp.min = "1"; veinsInp.step = "1"; veinsInp.value = depletedVeins;
    veinsInp.style.cssText = "width:56px;padding:3px 6px;background:var(--color-surface-input);border:1px solid var(--color-border);color:var(--accent3);border-radius:8px;text-align:right";
    veinsInp.oninput = () => {
      const v = parseInt(veinsInp.value, 10);
      depletedVeins = isNaN(v) || v < 1 ? 1 : v;
      saveSettings(); calculateRecipes();
    };
    veins.appendChild(document.createTextNode("Depleted veins in use (1 Fracking Tower per vein):"));
    veins.appendChild(veinsInp);
    el.appendChild(veins);
  }

  // ── Section: Excavation source ──────────────────────────────────
  if (typeof EXCAVATION !== "undefined" && EXCAVATION.tools?.length) {
    const sep = document.createElement("div");
    sep.style.cssText = "border-top:1px solid var(--color-border);margin:18px 0";
    el.appendChild(sep);
    const row = document.createElement("label");
    row.style.cssText = "display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:13px;color:var(--text)";
    row.appendChild(document.createTextNode("Excavated items (Dirt, Sand, Biomass, seeds …) come from:"));
    const sel = document.createElement("select");
    EXCAVATION.tools.forEach(t => sel.appendChild(new Option(t, t, false, t === excavationSource())));
    sel.onchange = () => { excavationTool = sel.value; saveSettings(); if (selectedRecipeList.length) calculateRecipes(); };
    row.appendChild(sel);
    el.appendChild(row);
  }

  // ── Section: Raw fluid intakes (Water: pipe or pipeline intake) ─────
  if (typeof FLUID_SOURCE_MACHINES !== "undefined") {
    Object.entries(FLUID_SOURCE_MACHINES).filter(([, src]) => (src.alternatives || []).length > 1).forEach(([fluid, src]) => {
      const row = document.createElement("label");
      row.style.cssText = "display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:13px;color:var(--text);margin-top:10px";
      row.appendChild(document.createTextNode(`${fluid} comes from:`));
      const sel = document.createElement("select");
      src.alternatives.forEach(a => sel.appendChild(new Option(`${a.machine} — ${fmt(a.capacityPerMin)} L/min`, a.machine, false, a.machine === fluidSourceFor(fluid)?.machine)));
      sel.onchange = () => { fluidSourceChoice[fluid] = sel.value; saveSettings(); if (selectedRecipeList.length) calculateRecipes(); };
      row.appendChild(sel);
      el.appendChild(row);
    });
  }

  // ── Section: Deluxe Edition content ─────────────────────────────
  {
    const sep = document.createElement("div");
    sep.style.cssText = "border-top:1px solid var(--color-border);margin:18px 0";
    el.appendChild(sep);
    const lbl = document.createElement("label");
    lbl.style.cssText = "display:flex;align-items:center;gap:8px;font-size:13px;color:var(--text);cursor:pointer";
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = ownsDeluxe;
    cb.onchange = () => { ownsDeluxe = cb.checked; saveSettings(); renderRecipeBrowser(); };
    lbl.appendChild(cb);
    lbl.appendChild(document.createTextNode("I own the Deluxe Edition (Marble, office decor recipes)"));
    el.appendChild(lbl);
  }

  // ── Section: Space station shipping ────────────────────────────
  if (typeof SHIPPING !== "undefined" && SHIPPING.ships.length) {
    const shSep = document.createElement("div");
    shSep.style.cssText = "border-top:1px solid var(--color-border);margin:18px 0";
    el.appendChild(shSep);
    const shTitle = document.createElement("div");
    shTitle.style.cssText =
      "font-size:11px;font-weight:600;color:var(--color-text-secondary);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px";
    shTitle.textContent = "Space Station Shipping";
    el.appendChild(shTitle);
    const shDesc = document.createElement("div");
    shDesc.style.cssText = "font-size:11px;color:var(--color-text-secondary);margin-bottom:12px";
    shDesc.textContent =
      "Cargo ship used for planetary shipping and the flight time per trip (lift-off + landing; not in game data — measured 20 s on the top build layer, 26 s on the surface).";
    el.appendChild(shDesc);

    const row = document.createElement("div");
    row.style.cssText = "display:flex;align-items:center;gap:12px;flex-wrap:wrap;font-size:13px;color:var(--text)";
    const sel = document.createElement("select");
    const current = SHIPPING.ships.find(s => s.name === shippingShip) || SHIPPING.ships[SHIPPING.ships.length - 1];
    SHIPPING.ships.forEach(s => {
      const opt = new Option(`${s.name} — ${fmt(s.cargoKg)} kg, ${s.padSize} pad`, s.name);
      opt.selected = s === current;
      sel.appendChild(opt);
    });
    sel.onchange = () => { shippingShip = sel.value; saveSettings(); calculateRecipes(); };
    row.appendChild(sel);
    const fl = document.createElement("label");
    fl.style.cssText = "display:flex;align-items:center;gap:6px";
    fl.appendChild(document.createTextNode("Flight time per trip (s):"));
    const inp = document.createElement("input");
    inp.type = "number"; inp.min = "0"; inp.step = "1"; inp.value = shippingFlightSec;
    inp.style.cssText = "width:60px;padding:3px 6px;background:var(--color-surface-input);border:1px solid var(--color-border);color:var(--accent3);border-radius:8px;text-align:right";
    inp.oninput = () => {
      const v = parseFloat(inp.value);
      shippingFlightSec = isNaN(v) || v < 0 ? 26 : v;
      saveSettings(); calculateRecipes();
    };
    fl.appendChild(inp);
    row.appendChild(fl);
    el.appendChild(row);
  }

  // ── Section: Modular buildings (speed modules + adjacency) ────────
  if (typeof MODULAR_BUILDINGS !== "undefined" && Object.keys(MODULAR_BUILDINGS).length) {
    const modSep = document.createElement("div");
    modSep.style.cssText = "border-top:1px solid var(--color-border);margin:18px 0";
    el.appendChild(modSep);

    const modTitle = document.createElement("div");
    modTitle.style.cssText =
      "font-size:11px;font-weight:600;color:var(--color-text-secondary);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px";
    modTitle.textContent = "Modular Buildings";
    el.appendChild(modTitle);

    const modDesc = document.createElement("div");
    modDesc.style.cssText = "font-size:11px;color:var(--color-text-secondary);margin-bottom:12px";
    modDesc.textContent =
      "How many speed modules your buildings have. More modules = faster (and more power / hot air).";
    el.appendChild(modDesc);

    const modGrid = document.createElement("div");
    modGrid.style.cssText = "display:flex;flex-direction:column;gap:10px";
    const onChange = () => { _applyModularSpeeds(); saveSettings(); calculateRecipes(); };

    Object.entries(MODULAR_BUILDINGS).forEach(([machine, mb]) => {
      const row = document.createElement("label");
      row.style.cssText = "display:flex;align-items:center;gap:12px;flex-wrap:wrap;font-size:13px;color:var(--text)";
      const name = document.createElement("div");
      name.style.cssText = "width:160px;flex-shrink:0;display:flex;align-items:center;gap:6px";
      name.innerHTML = getIcon(machine, 20) + "<span>" + machine + "</span>";
      row.appendChild(name);

      const sel = document.createElement("select");
      for (let n = mb.min; n <= mb.max; n++) {
        const speed = Math.round((1 + (n - mb.ignored) * mb.speedPerModule) * 100);
        const opt = new Option(mb.throughputPerModule
          ? `${n} × ${mb.module} — ${fmt(n * mb.throughputPerModule)} L/min`
          : `${n} × ${mb.module} — ${speed}%`, n);
        opt.selected = n === modularModules(machine);
        sel.appendChild(opt);
      }
      sel.onchange = () => { modularSettings[machine] = Number(sel.value); onChange(); };
      row.appendChild(sel);
      modGrid.appendChild(row);
    });

    const adj = document.createElement("label");
    adj.style.cssText = "display:flex;align-items:center;gap:8px;font-size:13px;color:var(--text);margin-top:4px;cursor:pointer";
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = adjacencyBonus;
    cb.onchange = () => { adjacencyBonus = cb.checked; onChange(); };
    adj.appendChild(cb);
    adj.appendChild(document.createTextNode(
      "Adjacency power bonus (buildings of the same type placed side by side in a row)"));
    modGrid.appendChild(adj);

    el.appendChild(modGrid);
  }

  // ── Section: Bot efficiency overrides ────────────────────────
  // ── Section: Global Research Productivity ────────────────────
  const resSep = document.createElement("div");
  resSep.style.cssText = "border-top:1px solid var(--color-border);margin:18px 0";
  el.appendChild(resSep);

  const resTitle = document.createElement("div");
  resTitle.style.cssText =
    "font-size:11px;font-weight:600;color:var(--color-text-secondary);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px";
  resTitle.textContent = "Endless Research (level)";
  el.appendChild(resTitle);

  const resDesc = document.createElement("div");
  resDesc.style.cssText = "font-size:11px;color:var(--color-text-secondary);margin-bottom:12px";
  const pctOf = (name) => Math.round(researchBonus(name) * 100);
  resDesc.textContent =
    `Mining Efficiency: no extra output/min, only less fracking liquid on depleted veins (+${pctOf('Mining Efficiency')}% free ore per level) · ` +
    `Pumpjack Efficiency: +${pctOf('Pumpjack Efficiency')}% pumpjack output per level`;
  el.appendChild(resDesc);

  const resGrid = document.createElement("div");
  resGrid.style.cssText = "display:grid;grid-template-columns:1fr 1fr;gap:8px";

  [
    {
      label: "Mining Efficiency", icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2L2 14l8 8 12-12-8-8z"/><path d="M7 13l4 4"/><path d="M19 3l2 2"/></svg>`,
      key: "mining", getter: () => miningEfficiencyLevel,
      setter: (v) => { miningEfficiencyLevel = v; }
    },
    {
      label: "Pumpjack Efficiency", icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C6 8 4 12 4 15a8 8 0 0 0 16 0c0-3-2-7-8-13z"/></svg>`,
      key: "pumpjack", getter: () => pumpjackEfficiencyLevel,
      setter: (v) => { pumpjackEfficiencyLevel = v; }
    },
  ].forEach(({ label, icon, getter, setter }) => {
    const cell = document.createElement("div");
    cell.style.cssText =
      "display:flex;align-items:center;gap:8px;background:var(--color-bg-elevated);border:1px solid var(--color-border);border-radius:10px;padding:6px 10px";

    const iconEl = document.createElement("div");
    iconEl.style.cssText = "flex-shrink:0;color:var(--text-dim)";
    iconEl.innerHTML = icon;

    const lbl = document.createElement("div");
    lbl.style.cssText = "flex:1;font-size:12px;color:var(--text);min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap";
    lbl.textContent = label;

    const inputWrap = document.createElement("div");
    inputWrap.style.cssText = "display:flex;align-items:center;gap:3px;flex-shrink:0";

    const inp = document.createElement("input");
    inp.type = "number";
    inp.min = "0";
    inp.step = "1"; // endless research: no upper limit
    inp.value = getter();
    inp.style.cssText =
      "width:52px;padding:3px 6px;background:var(--color-surface-input);border:1px solid var(--color-border);color:var(--accent3);font-family:-apple-system,sans-serif;font-size:13px;border-radius:8px;text-align:right";
    inp.oninput = function () {
      const val = parseInt(this.value, 10);
      setter(isNaN(val) || val < 0 ? 0 : val);
      saveSettings();
      calculateRecipes();
    };

    const pct = document.createElement("span");
    pct.style.cssText = "font-size:11px;color:var(--text-dim)";
    pct.textContent = "lvl";

    const resetBtn = document.createElement("button");
    resetBtn.title = "Reset";
    resetBtn.style.cssText =
      "padding:2px 6px;background:var(--color-accent-inactive-bg);border:1px solid var(--color-border);color:var(--color-interactive);" +
      "border-radius:3px;cursor:pointer;font-size:11px;line-height:1;flex-shrink:0";
    resetBtn.textContent = "↺";
    resetBtn.onclick = function () {
      setter(0);
      inp.value = 0;
      saveSettings();
      calculateRecipes();
    };

    inputWrap.appendChild(inp);
    inputWrap.appendChild(pct);
    inputWrap.appendChild(resetBtn);
    cell.appendChild(iconEl);
    cell.appendChild(lbl);
    cell.appendChild(inputWrap);
    resGrid.appendChild(cell);
  });

  el.appendChild(resGrid);

  const effSep = document.createElement("div");
  effSep.style.cssText = "border-top:1px solid var(--color-border);margin:18px 0";
  el.appendChild(effSep);

  const effTitle = document.createElement("div");
  effTitle.style.cssText =
    "font-size:11px;font-weight:600;color:var(--color-text-secondary);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px";
  effTitle.textContent = "R&D Lab: Production Efficiency / Product Weight";
  el.appendChild(effTitle);

  const effDesc = document.createElement("div");
  effDesc.style.cssText = "font-size:11px;color:var(--color-text-secondary);margin-bottom:12px";
  effDesc.textContent = "Per product as shown in the R&D Lab: production efficiency (+% output) and weight reduction (−% shipping weight).";
  el.appendChild(effDesc);

  const effGrid = document.createElement("div");
  effGrid.style.cssText = "display:grid;grid-template-columns:1fr 1fr;gap:8px";

  // Show all Robots-category recipes that are not individual robot parts.
  // Parts are identified by their name ending in Arm / Head / Leg / Torso.
  // Complete assembly-line robots (Combat Robot etc.) have no efficiency field
  // in the data, so we fall back to 0 for display/default purposes.
  const _robotPartSuffix = /\s+(Arm|Head|Leg|Torso)$/;
  const botsWithEff = Object.entries(RECIPES)
    .filter(([name, recipe]) => recipe.category === CAT.ROBOTS && !_robotPartSuffix.test(name))
    .sort(([a], [b]) => a.localeCompare(b));

  botsWithEff.forEach(([name, recipe]) => {
    const baseEff = recipe.efficiency ?? 0;
    const current = botEfficiencyOverrides[name] != null
      ? botEfficiencyOverrides[name]
      : baseEff;

    const cell = document.createElement("div");
    cell.style.cssText =
      "display:flex;align-items:center;gap:8px;background:var(--color-bg-elevated);border:1px solid var(--color-border);border-radius:10px;padding:6px 10px";

    const icon = document.createElement("div");
    icon.style.cssText = "flex-shrink:0";
    icon.innerHTML = getIcon(name, 22, true);

    const lbl = document.createElement("div");
    lbl.style.cssText = "flex:1;font-size:12px;color:var(--text);min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap";
    lbl.textContent = name;

    const inputWrap = document.createElement("div");
    inputWrap.style.cssText = "display:flex;align-items:center;gap:3px;flex-shrink:0";

    const inp = document.createElement("input");
    inp.type = "number";
    inp.min = "0";
    inp.max = "999";
    inp.step = "1";
    inp.value = current;
    inp.style.cssText =
      "width:52px;padding:3px 6px;background:var(--color-surface-input);border:1px solid var(--color-border);color:var(--accent3);font-family:-apple-system,sans-serif;font-size:13px;border-radius:8px;text-align:right";
    inp.oninput = function () {
      const val = parseFloat(this.value);
      if (!isNaN(val) && val >= 0) {
        botEfficiencyOverrides[name] = val;
      } else {
        delete botEfficiencyOverrides[name];
      }
      // Live-update the bot list tag if visible
      buildRecipeCategoryList();
      saveSettings();
    };

    const pct = document.createElement("span");
    pct.style.cssText = "font-size:11px;color:var(--text-dim)";
    pct.textContent = "%";

    const resetBtn = document.createElement("button");
    resetBtn.title = "Reset to default";
    resetBtn.style.cssText =
      "padding:2px 6px;background:var(--color-accent-inactive-bg);border:1px solid var(--color-border);color:var(--color-interactive);" +
      "border-radius:3px;cursor:pointer;font-size:11px;line-height:1;flex-shrink:0";
    resetBtn.textContent = "↺";
    resetBtn.onclick = function () {
      delete botEfficiencyOverrides[name];
      delete botWeightReductions[name];
      inp.value = baseEff;
      wInp.value = 0;
      buildRecipeCategoryList();
      saveSettings();
    };

    // Weight reduction (R&D "Product Weight"), only for products with a real weight
    const wInp = document.createElement("input");
    wInp.type = "number"; wInp.min = "0"; wInp.max = "100"; wInp.step = "1";
    wInp.value = botWeightReductions[name] ?? 0;
    wInp.title = "Product weight reduction (%)";
    wInp.style.cssText = inp.style.cssText;
    wInp.oninput = function () {
      const val = parseFloat(this.value);
      if (!isNaN(val) && val > 0 && val <= 100) botWeightReductions[name] = val;
      else delete botWeightReductions[name];
      saveSettings();
      if (selectedRecipeList.length) calculateRecipes();
    };
    const effLbl = document.createElement("span");
    effLbl.style.cssText = "font-size:10px;color:var(--text-dim)";
    effLbl.textContent = "Eff";
    const wLbl = effLbl.cloneNode(); wLbl.textContent = "−kg";
    inputWrap.appendChild(effLbl);
    inputWrap.appendChild(inp);
    inputWrap.appendChild(pct);
    if (typeof ITEM_WEIGHTS_KG !== "undefined" && ITEM_WEIGHTS_KG[name] > 1) {
      inputWrap.appendChild(wLbl);
      inputWrap.appendChild(wInp);
      inputWrap.appendChild(pct.cloneNode(true));
    }
    inputWrap.appendChild(resetBtn);
    cell.appendChild(icon);
    cell.appendChild(lbl);
    cell.appendChild(inputWrap);
    effGrid.appendChild(cell);
  });

  el.appendChild(effGrid);

  // ── Section: Workstations ─────────────────────────────────────
  const wsSep = document.createElement("div");
  wsSep.style.cssText = "border-top:1px solid var(--color-border);margin:18px 0";
  el.appendChild(wsSep);

  const wsTitle = document.createElement("div");
  wsTitle.style.cssText = "font-size:11px;font-weight:600;color:var(--color-text-secondary);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px";
  wsTitle.textContent = "Workstations (Global)";
  el.appendChild(wsTitle);

  const wsDesc = document.createElement("div");
  wsDesc.style.cssText = "font-size:11px;color:var(--text-dim);margin-bottom:10px";
  wsDesc.textContent = "One workstation per machine category. WS1: 1 slot · WS2: 2 slots · WS3: 3 slots + Charged Reno Core (+33%). Overridable per item.";
  el.appendChild(wsDesc);

  const wsSummary = document.createElement("div");
  wsSummary.id = "wsBonusSummary";
  wsSummary.style.cssText = "margin-bottom:10px;padding:8px 10px;background:var(--color-bg-elevated);border:1px solid var(--color-border);border-radius:10px";
  el.appendChild(wsSummary);

  const wsContainer = document.createElement("div");
  wsContainer.id = "wsContainer";
  wsContainer.style.cssText = "display:grid;grid-template-columns:repeat(2,1fr);gap:10px";
  el.appendChild(wsContainer);

  renderWorkstations();
}

// ── Workstation Settings UI ───────────────────────────────────
function renderWorkstations() {
  const container = document.getElementById("wsContainer");
  if (!container) return;
  container.innerHTML = "";

  // All categories (empty = no machines in this calculator, but show for info)
  const activeCategories = Object.keys(APPLIES_TO_MACHINES);

  // All bots with workstation effects — cached for reuse
  const allBotsWithEffect = Object.entries(RECIPES)
    .filter(([, r]) => r.category === "Robots" && r.workstation_effect)
    .map(([name, r]) => ({ name, we: r.workstation_effect }))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Returns only bots compatible with a given WS category
  function botsForCategory(cat) {
    return allBotsWithEffect.filter(({ we }) =>
      (we.applies_to || []).includes(cat)
    );
  }

  activeCategories.forEach(cat => {
    const ws = workstationConfigs[cat];
    const compatibleBots = botsForCategory(cat);
    const machineNames = APPLIES_TO_MACHINES[cat].length
      ? APPLIES_TO_MACHINES[cat].join(", ")
      : "(no effect in recipe calculator — e.g. Miner, Pumpjack)";

    // Grau ausblenden wenn keine kompatiblen Bots existieren
    const hasNoBots = compatibleBots.length === 0;
    const card = document.createElement("div");
    card.style.cssText = "background:" + (ws ? "var(--color-accent-active-bg)" : "var(--color-bg-elevated)") + ";border:1px solid " + (ws ? "var(--color-border-focus)" : "var(--color-border)") + ";border-radius:12px;padding:10px 12px" + (hasNoBots ? ";opacity:0.5" : "");

    // Header: category name + enable toggle
    const header = document.createElement("div");
    header.style.cssText = "display:flex;align-items:center;gap:8px;margin-bottom:8px";

    const catLabel = document.createElement("div");
    catLabel.style.cssText = "flex:1;font-size:13px;font-weight:700;color:var(--text)";
    catLabel.textContent = cat;
    const machLabel = document.createElement("div");
    machLabel.style.cssText = "font-size:10px;color:var(--text-dim)";
    machLabel.textContent = machineNames;

    const labelWrap = document.createElement("div");
    labelWrap.style.cssText = "flex:1;min-width:0";
    labelWrap.appendChild(catLabel);
    labelWrap.appendChild(machLabel);

    const enableChk = document.createElement("input");
    enableChk.type = "checkbox";
    enableChk.checked = !!ws;
    enableChk.style.cssText = "accent-color:var(--accent);width:16px;height:16px;cursor:pointer;flex-shrink:0";
    enableChk.onchange = function () {
      if (this.checked) {
        workstationConfigs[cat] = { tier: 1, robots: [null], chargedCore: false };
      } else {
        delete workstationConfigs[cat];
      }
      renderWorkstations();
      renderWorkstationBonusSummary();
      saveSettings();
    };

    header.appendChild(enableChk);
    header.appendChild(labelWrap);

    if (ws) {
      // Tier selector
      const tierRow = document.createElement("div");
      tierRow.style.cssText = "display:flex;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap";

      const tierLabel = document.createElement("span");
      tierLabel.style.cssText = "font-size:11px;color:var(--text-dim);text-transform:uppercase;letter-spacing:1px";
      tierLabel.textContent = "Tier:";
      tierRow.appendChild(tierLabel);

      [1, 2, 3].forEach(t => {
        const btn = document.createElement("button");
        btn.textContent = "WS " + t + " (" + t + " Slot" + (t > 1 ? "s" : "") + ")";
        btn.style.cssText = "padding:4px 10px;border-radius:4px;cursor:pointer;font-family:inherit;font-size:11px;transition:all 0.15s;" +
          (ws.tier === t
            ? "background:var(--color-accent-active-bg);border:1px solid var(--color-border-focus);color:var(--color-text-primary);"
            : "background:var(--color-accent-inactive-bg);border:1px solid var(--color-border);color:var(--color-interactive);");
        btn.onclick = function () {
          ws.tier = t;
          while (ws.robots.length < t) ws.robots.push(null);
          ws.robots = ws.robots.slice(0, t);
          if (t < 3) ws.chargedCore = false;
          renderWorkstations();
          renderWorkstationBonusSummary();
          saveSettings();
        };
        tierRow.appendChild(btn);
      });

      // Charged Core (tier 3 only)
      if (ws.tier === 3) {
        const coreLabel = document.createElement("label");
        coreLabel.style.cssText = "display:flex;align-items:center;gap:4px;font-size:11px;color:var(--accent3);cursor:pointer;margin-left:auto";
        const coreChk = document.createElement("input");
        coreChk.type = "checkbox";
        coreChk.checked = ws.chargedCore;
        coreChk.style.cssText = "accent-color:var(--accent3)";
        coreChk.onchange = function () {
          ws.chargedCore = this.checked;
          renderWorkstationBonusSummary();
          saveSettings();
        };
        coreLabel.appendChild(coreChk);
        coreLabel.appendChild(document.createTextNode("Charged Reno Core (+33%)"));
        tierRow.appendChild(coreLabel);
      }

      card.appendChild(header);
      card.appendChild(tierRow);

      // Bot slots
      ws.robots.forEach((botName, slotIdx) => {
        const slotRow = document.createElement("div");
        slotRow.style.cssText = "display:flex;align-items:center;gap:8px;margin-top:5px";

        const slotNum = document.createElement("span");
        slotNum.style.cssText = "font-size:10px;color:var(--text-dim);width:40px;text-transform:uppercase;flex-shrink:0";
        slotNum.textContent = "Slot " + (slotIdx + 1);

        const iconWrap = document.createElement("div");
        iconWrap.style.cssText = "width:22px;height:22px;flex-shrink:0;display:flex;align-items:center;justify-content:center";
        iconWrap.innerHTML = botName ? getIcon(botName, 20, true) : "<span style='color:var(--color-text-disabled);font-size:16px'>○</span>";

        const sel = document.createElement("select");
        sel.style.cssText = "flex:1;padding:5px 8px;background:var(--color-surface-input);border:1px solid var(--color-border);color:var(--text);border-radius:8px;font-family:-apple-system,sans-serif;font-size:11px;outline:none";
        const emptyOpt = document.createElement("option");
        emptyOpt.value = "";
        emptyOpt.textContent = "— no bot —";
        if (!botName) emptyOpt.selected = true;
        sel.appendChild(emptyOpt);

        // Only show bots compatible with this category
        compatibleBots.forEach(({ name, we }) => {
          const opt = document.createElement("option");
          opt.value = name;
          // Show bonus directly in the dropdown label
          const parts = [];
          if (we.machine_efficiency) parts.push("+" + we.machine_efficiency + "% Eff");
          if (we.machine_speed) parts.push("+" + we.machine_speed + "% Speed");
          opt.textContent = name + (parts.length ? "  [" + parts.join(" · ") + "]" : "");
          if (name === botName) opt.selected = true;
          sel.appendChild(opt);
        });

        sel.onchange = function () {
          ws.robots[slotIdx] = this.value || null;
          iconWrap.innerHTML = ws.robots[slotIdx]
            ? getIcon(ws.robots[slotIdx], 20, true)
            : "<span style='color:var(--color-text-disabled);font-size:16px'>○</span>";
          updateEffSpan(effSpan, ws.robots[slotIdx]);
          renderWorkstationBonusSummary();
          saveSettings();
        };

        // Effect badge — shows current bot's bonus, styled prominently
        const effSpan = document.createElement("span");
        effSpan.style.cssText = "font-size:11px;min-width:110px;flex-shrink:0;text-align:right";
        function updateEffSpan(el, name) {
          if (name && RECIPES[name] && RECIPES[name].workstation_effect) {
            const we = RECIPES[name].workstation_effect;
            const parts = [];
            // ponytail: fixed dark chip background regardless of theme (matches .badge
            // pattern in styles.css, also untokenized) — no token for stat-badge surfaces yet
            if (we.machine_efficiency) parts.push('<span style="background:var(--color-success-bg);border:1px solid var(--color-success-border);border-radius:3px;padding:1px 5px;color:var(--accent3)">+' + we.machine_efficiency + '% Eff</span>');
            if (we.machine_speed) parts.push('<span style="background:var(--color-accent-active-bg);border:1px solid var(--color-border);border-radius:3px;padding:1px 5px;color:var(--accent)">+' + we.machine_speed + '% Speed</span>');
            el.innerHTML = parts.join(" ");
          } else {
            el.innerHTML = compatibleBots.length === 0
              ? '<span style="color:var(--color-text-disabled)">keine Bots</span>'
              : '<span style="color:var(--color-text-disabled)">—</span>';
          }
        }
        updateEffSpan(effSpan, botName);

        slotRow.appendChild(slotNum);
        slotRow.appendChild(iconWrap);
        slotRow.appendChild(sel);
        slotRow.appendChild(effSpan);
        card.appendChild(slotRow);
      });
    } else {
      card.appendChild(header);
      const noWs = document.createElement("div");
      noWs.style.cssText = "font-size:11px;color:var(--text-dim);padding:4px 0";
      noWs.textContent = "No workstation configured. Enable the checkbox to set one up.";
      card.appendChild(noWs);
    }

    container.appendChild(card);
  });

  renderWorkstationBonusSummary();
}

// ── Workstation bonus summary ─────────────────────────────────
function renderWorkstationBonusSummary() {
  const summaryEl = document.getElementById("wsBonusSummary");
  if (!summaryEl) return;
  const lines = [];
  Object.entries(workstationConfigs).forEach(([cat, ws]) => {
    (APPLIES_TO_MACHINES[cat] || []).forEach(machine => {
      const bonus = calcWsBonusForMachine(machine, ws);
      if (bonus > 0) lines.push({ machine, bonus });
    });
  });
  if (!lines.length) {
    summaryEl.innerHTML = '<div style="font-size:11px;color:var(--text-dim)">No active global bonuses.</div>';
    return;
  }
  summaryEl.innerHTML =
    '<div style="font-size:11px;color:var(--text-dim);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">Active global bonuses</div>' +
    '<div style="display:flex;flex-wrap:wrap;gap:5px">' +
    lines.map(({ machine, bonus }) =>
      `<span style="display:inline-flex;align-items:center;gap:4px;background:var(--color-success-bg);border:1px solid var(--color-success-border);border-radius:6px;padding:3px 8px;font-size:11px;font-family:-apple-system,sans-serif">` +
      `<span style="color:var(--text-dim)">${machine}</span>` +
      `<span style="color:var(--accent3)">+${Math.round(bonus * 1000) / 10}%</span></span>`
    ).join("") + "</div>";
}

// Apply current settings to all already-selected recipes
function applySettingsToSelected() {
  selectedRecipeList.forEach((item) => {
    // Update recipe variant from settings
    const newRecipe = resolveRecipeName(item.itemName || item.name);
    item.recipeName = newRecipe;
    const r = RECIPES[newRecipe];
    if (!r) return;
    const machines = Object.keys(r.machines);
    // Try to find preferred machine from family defaults
    let matched = false;
    for (const fam of MACHINE_FAMILIES) {
      if (fam.defaultChoice && machines.includes(fam.defaultChoice)) {
        item.machineName = fam.defaultChoice;
        matched = true;
        break;
      }
    }
    // If current machineName is no longer valid for the new recipe, fall back to first available
    if (!matched && !machines.includes(item.machineName)) {
      item.machineName = preferredMachineFor(r) || machines[0];
    }
  });
  renderSelectedRecipes();
  calculateRecipes();
}

// Use settings when adding a new recipe — same rule as the chain resolution
// (preferredMachineFor), so the settings panel's highlighted default is what
// new lines actually get.
function getPreferredMachine(recipeName) {
  const r = RECIPES[recipeName];
  return r ? preferredMachineFor(r) : null;
}

// ── Recipe Browser (Modal) ───────────────────────────────────
const RECIPE_CATEGORIES = [
  "Alle",
  "Structures",
  "Components",
  "Robots",
  "Metallurgy",
  "Decor",
  "Handhelds",
  "Buildings",
];
let activeBrowserCat = "Alle";
const _collapsedSubgroups = new Set(); // keys: "Category|Subgroup label"
