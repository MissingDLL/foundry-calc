#!/usr/bin/env python3
"""
Foundry game data extractor.
Reads recipe YAMLs and BuildableObjectTemplate data from game assets and outputs:
  - data/versions/v<version>/game-data.json  — comprehensive JSON
  - data/versions/v<version>/game-data.js    — M, I, CAT constants + all structures
  - data/versions/v<version>/recipes.js      — RECIPES object
  - data/versions/v<version>/icons.js        — icon path maps (if icons extracted)
  - icons/v<version>/                        — PNG icons (512x512 by default)

Usage:
  python3 extract_game_data.py [--game-path PATH] [--icons-only] [--no-icons] [--no-js]
  python3 extract_game_data.py --icon-size 48   # smaller icons
"""

import argparse
import json
import re
import sys
from pathlib import Path

GAME_PATH_DEFAULT = "/run/media/system/Games/SteamLibrary/steamapps/common/FOUNDRY"
SCRIPT_DIR = Path(__file__).parent

# ── Time units (verified in-game, v0.6.0.26518) ───────────────────────────────
# The old TICKS_PER_MIN=360 was "calibrated" against a fully upgraded Air Intake
# (7 vents = 600 % speed) and was wrong for everything else.
#   ResourceConverter amount_str is PER SECOND at base speed:
#     Air Intake 450/s = 27,000 L/min base; ×6 (7 vents) = 162,000 ✓
#     Hot Air Stove 900/s = 54,000 L/min base; ×2 (6 towers) = 108,000 ✓
#   *PerTick fields use 60 ticks/s:
#     Blast Furnace baseHotAirConsumptionPerTick 60 → 216,000 L/min base;
#     ×1.5 (5 towers) = 324,000 ✓
SECONDS_PER_MIN = 60
TICKS_PER_MIN = 60 * 60

# ── Blast Furnace cycle time ──────────────────────────────────────────────────
# BlastFurnaceModeTemplate amounts are per MINUTE at base speed
# (Xenoferrite: 640 ore → 5,760 L molten/min; ×2 with 5 towers = 11,520 ✓).
BLAST_FURNACE_CYCLE_TIME = 60

# ── BuildableObjectTemplate `type` values ────────────────────────────────────
# Production machine types — these resolve to recipe machines
PROD_TYPES = {"Producer", "AutoProducer", "ModularEntityProducer"}
# Resource converter types — generate synthetic fluid conversion recipes
# NPP_CoolingTower is not a producer: its resourceConverter_* data (water ->
# Low Density Olumite) is unused in-game; its cooling is handled in POWER_SOURCES.
RC_TYPES = {"ResourceConverter"}


# ─────────────────────────────────────────────────────────────────────────────
# YAML helpers
# ─────────────────────────────────────────────────────────────────────────────

def load_yaml_templates(templates_dir: Path, template_type: str) -> dict:
    """Load all YAML files from a template subdirectory → dict keyed by identifier."""
    import yaml
    result = {}
    type_dir = templates_dir / template_type
    if not type_dir.exists():
        return result
    for yaml_file in sorted(type_dir.glob("*.yaml")):
        with open(yaml_file, encoding="utf-8") as f:
            data = yaml.safe_load(f)
        if not data or template_type not in data:
            continue
        for identifier, fields in data[template_type].items():
            result[identifier] = fields
    return result


# ─────────────────────────────────────────────────────────────────────────────
# Build combined identifier → display name map
# ─────────────────────────────────────────────────────────────────────────────

def build_id_to_name(templates_dir: Path) -> dict:
    """
    Returns identifier → human-readable name.
    Sources: ItemTemplate, ElementTemplate, LiquidTemplate.
    Also maps buildableObjectIdentifer → name so BOT identifiers resolve correctly
    (e.g. _base_air_intake_1 → 'Air Intake Base' via ItemTemplate._base_air_intake_base).
    """
    id_to_name = {}

    # Pass 1: ElementTemplate and LiquidTemplate (fluids/gases)
    for ttype in ["ElementTemplate", "LiquidTemplate"]:
        for ident, v in load_yaml_templates(templates_dir, ttype).items():
            name = v.get("name", "")
            if name and ident not in id_to_name:
                id_to_name[ident] = name

    # Pass 2: ItemTemplate — map both the item identifier AND the BOT identifier
    for ident, v in load_yaml_templates(templates_dir, "ItemTemplate").items():
        name = v.get("name", "")
        if not name:
            continue
        # The item identifier itself
        if ident not in id_to_name:
            id_to_name[ident] = name
        # The BOT identifier (may differ, e.g. _base_air_intake_base → _base_air_intake_1)
        bot_id = v.get("buildableObjectIdentifer", "")
        if bot_id and bot_id not in id_to_name:
            id_to_name[bot_id] = name

    # Pass 3: AssemblyLineObjectTemplate — complete robot names (e.g. "Miner Robot")
    for ident, v in load_yaml_templates(templates_dir, "AssemblyLineObjectTemplate").items():
        name = v.get("name", "")
        if name and ident not in id_to_name:
            id_to_name[ident] = name

    return id_to_name


def build_id_to_icon(templates_dir: Path) -> dict:
    """Returns identifier → icon_identifier from ItemTemplate, ElementTemplate, LiquidTemplate,
    and AssemblyLineObjectTemplate (for complete robot icons)."""
    result = {}
    for ttype in ["ItemTemplate", "ElementTemplate", "LiquidTemplate"]:
        for ident, v in load_yaml_templates(templates_dir, ttype).items():
            icon = v.get("icon_identifier", "")
            if icon and ident not in result:
                result[ident] = icon
    # Assembly Line robots have their own icons
    for ident, v in load_yaml_templates(templates_dir, "AssemblyLineObjectTemplate").items():
        icon = v.get("icon_identifier", "")
        if icon and ident not in result:
            result[ident] = icon
    return result


# ─────────────────────────────────────────────────────────────────────────────
# Power data extraction — generators and fuels
# ─────────────────────────────────────────────────────────────────────────────

def extract_power_data(templates_dir: Path, id_to_name: dict) -> dict:
    """
    Extract POWER_SOURCES and POWER_FUEL_ITEMS from BuildableObjectTemplate,
    ItemTemplate, and ElementTemplate.

    Returns:
      {
        "sources": [ {...}, ... ],
        "fuel_items": { name: {mj, type}, ... }
      }
    """
    bots_raw = load_yaml_templates(templates_dir, "BuildableObjectTemplate")
    item_ids = _build_item_bot_ids(templates_dir)

    # ── Collect fuel items ────────────────────────────────────────────────────

    fuel_items: dict[str, dict] = {}

    # Solid fuels from ItemTemplate (burnable_fuelValueKJ_str > 0)
    for ident, v in load_yaml_templates(templates_dir, "ItemTemplate").items():
        kj_raw = v.get("burnable_fuelValueKJ_str", "")
        if not kj_raw or str(kj_raw) == "":
            continue
        try:
            kj = float(kj_raw)
        except (ValueError, TypeError):
            continue
        if kj <= 0:
            continue
        name = v.get("name", "")
        if not name:
            continue
        # Only items flagged BURNABLE go into boilers / burners; the others carry
        # a fuel value but cannot be burned (Xenoferrite Ore Rubble, Firmarlite Bar …).
        # JET_PACK_FUEL = "Only usable for jetpack" (in-game tooltip), so excluded.
        flags = str(v.get("flags") or "").split("|")
        residual = id_to_name.get(v.get("burnable_residualItemTemplate_str") or "", "")
        fuel_items[name] = {"mj": round(kj / 1000, 6), "type": "solid",
                            "burnable": "BURNABLE" in flags and "JET_PACK_FUEL" not in flags,
                            "residual": residual,
                            "residualCount": int(float(v.get("burnable_residualItemTemplate_count") or 0)) if residual else 0}

    # Elemental (liquid) fuels from ElementTemplate (fuel_fuelValueKJPerL_str)
    for ident, v in load_yaml_templates(templates_dir, "ElementTemplate").items():
        kj_raw = v.get("fuel_fuelValueKJPerL_str", "")
        if not kj_raw or str(kj_raw) == "":
            continue
        try:
            kj = float(kj_raw)
        except (ValueError, TypeError):
            continue
        if kj <= 0:
            continue
        name = v.get("name", "")
        if not name:
            continue
        fuel_items[name] = {"mj": round(kj / 1000, 6), "type": "elemental"}

    # Reactor Fuel Mix has no fuel_kj — derive from NPP turbine power / reactor consumption
    # nppSteamTurbine_powerGenerationRate = 36000 kW
    # nppReactor_maxInputPerTick = 12 L/tick × 360 ticks/min = 4320 L/min = 72 L/s
    # energy_density = power_kW / consumption_L_per_s = 36000 / 72 = 500 kJ/L = 0.5 MJ/L
    # This is added below when we parse the NPP turbine entry.

    # ── Collect generator sources ──────────────────────────────────────────────

    sources: list[dict] = []

    for ident, v in bots_raw.items():
        bot_type = v.get("type", "")
        name = id_to_name.get(ident, "")
        # For NPP_Reactor, use nameOverride
        if not name and v.get("hasNameOverride"):
            name = v.get("nameOverride", "")
        # Also check if the BOT is player-visible (item_ids)
        if not name or ident not in item_ids:
            # Allow named BOTs even if not in item_ids for NPP types
            if not name:
                name_override = v.get("nameOverride", "")
                if name_override:
                    name = name_override
                else:
                    continue
            # For NPP reactor and turbine, they may use nameOverride
            if ident not in item_ids and bot_type not in ("NPP_Reactor", "NPP_SteamTurbine",
                                                           "LvgGenerator", "SolarPanel",
                                                           "Boiler", "BurnerGenerator"):
                continue

        # ── Solar panels ──────────────────────────────────────────────────────
        if bot_type == "SolarPanel":
            out_max_raw = v.get("solarPanel_outputMax_str", "")
            out_min_raw = v.get("solarPanel_outputMin_str", "")
            if not out_max_raw or str(out_max_raw) == "":
                continue
            try:
                power_kw = float(out_max_raw)
                power_kw_min = float(out_min_raw) if out_min_raw and str(out_min_raw) != "" else 0.0
            except (ValueError, TypeError):
                continue
            sources.append({
                "id": ident,
                "name": name,
                "type": "solar",
                "power_kw": power_kw,
                "power_kw_min": power_kw_min,
            })

        # ── LVG Generators (Biomass Burner, Burner Generator) ─────────────────
        elif bot_type == "LvgGenerator":
            rate_raw = v.get("lvgGenerator_transmissionRate_kjPerS_str", "")
            eff_raw = v.get("lvgGenerator_efficiency_str", "")
            locked = v.get("lvgGenerator_lockedItemTemplate_identifier", "") or ""
            if not rate_raw or str(rate_raw) == "":
                continue
            try:
                power_kw = float(rate_raw)
            except (ValueError, TypeError):
                continue
            try:
                efficiency = float(eff_raw) if eff_raw and str(eff_raw) != "" else 1.0
            except (ValueError, TypeError):
                efficiency = 1.0
            # Determine which solid fuels this accepts
            locked_name = id_to_name.get(locked, "") if locked else ""
            sources.append({
                "id": ident,
                "name": name,
                "type": "solid_fuel",
                "power_kw": power_kw,
                "efficiency": efficiency,
                "locked_fuel": locked_name,  # empty string = all solid fuels
            })

        # ── Classic Steam Turbine (BurnerGenerator with elemental fuel = steam) ─
        elif bot_type == "BurnerGenerator" and v.get("hasFuelManagerElemental"):
            rate_raw = v.get("burnerGenerator_powerGenertaionRate_kjPerS_str", "")
            if not rate_raw or str(rate_raw) == "":
                continue
            try:
                power_kw = float(rate_raw)
            except (ValueError, TypeError):
                continue
            sources.append({
                "id": ident,
                "name": name,
                "type": "steam_turbine",
                "power_kw": power_kw,
            })

        # ── Boiler (and Geothermal which is type=Producer but has boiler fields) ─
        elif bot_type in ("Boiler", "Producer") and v.get("boiler_outputPerSecond_str"):
            out_raw = v.get("boiler_outputPerSecond_str", "")
            energy_raw = v.get("boiler_energyConsumption_kjPerS_str", "")
            req_vent = v.get("requiredResourceNodeIdentifier", "") or ""
            if not out_raw or str(out_raw) == "":
                continue
            try:
                steam_l_per_sec = float(out_raw)
            except (ValueError, TypeError):
                continue
            try:
                energy_kj_per_sec = float(energy_raw) if energy_raw and str(energy_raw) != "" else 0.0
            except (ValueError, TypeError):
                energy_kj_per_sec = 0.0
            requires_vent = bool(req_vent and req_vent != "")
            sources.append({
                "id": ident,
                "name": name,
                "type": "steam_boiler",
                "steam_lit_per_sec": steam_l_per_sec,
                "energy_kj_per_sec": energy_kj_per_sec if not requires_vent else 0.0,
                "requires_vent": requires_vent,
            })

        # ── NPP Steam Turbine ──────────────────────────────────────────────────
        elif bot_type == "NPP_SteamTurbine":
            rate_raw = v.get("nppSteamTurbine_powerGenerationRate_kjPerSec_str", "")
            eff_raw = v.get("nppSteamTurbine_efficiency_str", "")
            if not rate_raw or str(rate_raw) == "":
                continue
            try:
                power_kw = float(rate_raw)
            except (ValueError, TypeError):
                continue
            try:
                efficiency = float(eff_raw) if eff_raw and str(eff_raw) != "" else 1.0
            except (ValueError, TypeError):
                efficiency = 1.0
            sources.append({
                "id": ident,
                "name": name,
                "type": "npp_turbine",
                "power_kw": power_kw,
                "efficiency": efficiency,
            })

        # ── NPP Reactor ────────────────────────────────────────────────────────
        elif bot_type == "NPP_Reactor":
            input_id = v.get("nppReactor_input_elementalTemplate_identifier", "") or ""
            max_input_raw = v.get("nppReactor_maxInputPerTick_str", "")
            if not input_id or not max_input_raw or str(max_input_raw) == "":
                continue
            try:
                max_input_per_tick = float(max_input_raw)
            except (ValueError, TypeError):
                continue
            fuel_name = id_to_name.get(input_id, input_id)
            fuel_lit_per_min = max_input_per_tick * TICKS_PER_MIN
            try:
                out_per_min = float(v.get("nppReactor_maxOutputPerTick_str") or 0) * TICKS_PER_MIN
            except (ValueError, TypeError):
                out_per_min = 0.0
            sources.append({
                "id": ident,
                "name": name,
                "type": "npp_reactor",
                "fuel_id": input_id,
                "fuel_name": fuel_name,
                "fuel_lit_per_min": fuel_lit_per_min,
                "output_id": v.get("nppReactor_output_elementalTemplate_identifier", "") or "",
                "output_lit_per_min": out_per_min,
            })

        # ── NPP Cooling Tower (disperses the turbines' exhaust steam) ──────────
        elif bot_type == "NPP_CoolingTower":
            try:
                cap = float(v.get("nppCoolingTower_inputTurbine_maxInputPerTick_str") or 0) * TICKS_PER_MIN
            except (ValueError, TypeError):
                cap = 0.0
            if cap > 0:
                sources.append({"id": ident, "name": name, "type": "npp_cooling_tower",
                                "input_id": v.get("nppCoolingTower_inputTurbine_identifier", "") or "",
                                "capacity_lit_per_min": cap})

    # Post-process the Xeno Power Plant chain (verified in-game, v0.6.0.26518):
    #   Reactor: 43,200 L/min Fuel Mix → 180,000 Energized Reactor Compound
    #   Steam Generator (ResourceConverter consuming the reactor output):
    #     180,000 Energized → 360,000 High-Pressure Steam
    #   Turbine: 36 MW from HP Steam (60 kJ/L) → 36,000 L/min, residual 1 L/L Exhaust
    #   Cooling Tower: disperses 180,000 L/min Exhaust Steam
    # → 10 turbines per reactor, 5 per cooling tower, Fuel Mix = 0.5 MJ/L.
    # (The old rule "1 turbine power / 1 reactor fuel" assumed 1 turbine per reactor.)
    npp_turbine = next((s for s in sources if s["type"] == "npp_turbine"), None)
    npp_reactor = next((s for s in sources if s["type"] == "npp_reactor"), None)
    npp_tower   = next((s for s in sources if s["type"] == "npp_cooling_tower"), None)
    elements = load_yaml_templates(templates_dir, "ElementTemplate")
    if npp_turbine and npp_reactor and npp_reactor["fuel_lit_per_min"] > 0:
        sg = next((v for i, v in bots_raw.items() if i in item_ids and any(
            x.get("identifier") == npp_reactor["output_id"]
            for x in (v.get("resourceConverter_input_elemental") or []))), None)
        steam_id, steam_ratio = "", 0.0
        for o in (sg or {}).get("resourceConverter_output_elemental") or []:
            el = elements.get(o.get("identifier", ""), {})
            if el.get("fuel_fuelValueKJPerL_str"):  # the turbine fuel (High-Pressure Steam)
                ins = sg["resourceConverter_input_elemental"]
                inp = next(x for x in ins if x.get("identifier") == npp_reactor["output_id"])
                steam_id = o["identifier"]
                steam_ratio = float(o.get("amount_str") or 0) / float(inp.get("amount_str") or 1)
                break
        steam_el = elements.get(steam_id, {})
        steam_kj = float(steam_el.get("fuel_fuelValueKJPerL_str") or 0)
        if steam_kj > 0 and steam_ratio > 0:
            steam_per_min = npp_reactor["output_lit_per_min"] * steam_ratio
            reactor_kw = steam_per_min * steam_kj / 60
            npp_reactor["turbines_per_reactor"] = round(reactor_kw / npp_turbine["power_kw"], 4)
            turbine_steam = npp_turbine["power_kw"] * 60 / steam_kj
            exhaust = turbine_steam * float(steam_el.get("fuel_residualAmountPerL_str") or 0)
            npp_turbine["steam_lit_per_min"] = turbine_steam
            if npp_tower and exhaust > 0:
                npp_turbine["turbines_per_cooling_tower"] = round(npp_tower["capacity_lit_per_min"] / exhaust, 4)
            rfm_name = npp_reactor["fuel_name"]
            if rfm_name:
                fuel_items[rfm_name] = {"mj": round(reactor_kw * 60 / npp_reactor["fuel_lit_per_min"] / 1000, 6),
                                        "type": "elemental"}

    return {"sources": sources, "fuel_items": fuel_items}


# ─────────────────────────────────────────────────────────────────────────────
# Power helper
# ─────────────────────────────────────────────────────────────────────────────

def get_power_kw(v: dict) -> float:
    """
    Return the effective power draw (kW) for a BOT.
    Returns 0 for lava-heated, fuel-based, or hot-air-based machines.
    """
    if v.get("hasToBeOnLava"):
        return 0.0
    if v.get("hasFuelManagerSolid"):
        return 0.0
    if v.get("blastFurnace_hotAirTemplateIdentifier"):
        return 0.0
    kw = v.get("energyConsumptionKW_str") or v.get("resourceConverter_powerConsumption_kjPerSec", 0)
    try:
        kw = float(kw or 0)
        if not kw and v.get("type") == "OreVeinMiner":
            # base + mining (in-game: 500 kW while mining, 100 kW when the belt is full)
            kw = float(v.get("oreVeinMiner_powerConsumptionBase_kjPerSec") or 0) \
               + float(v.get("oreVeinMiner_powerConsumptionMining_kjPerSec") or 0)
        return kw
    except (ValueError, TypeError):
        return 0.0


# ─────────────────────────────────────────────────────────────────────────────
# Build BOT data (power, loader sides)
# ─────────────────────────────────────────────────────────────────────────────

def compute_loader_sides(v: dict) -> list[int]:
    """
    Compute [south, east, north, west] loader counts for a BOT.
    Face ordering: 0=South(z=-1), 1=East(x=size_x), 2=North(z=size_z), 3=West(x=-1).
    """
    if v.get("disableLoaders", False):
        return [0, 0, 0, 0]

    size = v.get("size") or {}
    size_x = int(size.get("x", 1))
    size_z = int(size.get("z", 1))

    blocked_raw = v.get("blockedLoaderPositions") or []
    blocked_set = set()
    for b in blocked_raw:
        if isinstance(b, dict):
            blocked_set.add((int(b.get("x", 0)), int(b.get("z", 0))))

    south = sum(1 for x in range(size_x) if (x, -1) not in blocked_set)
    east  = sum(1 for z in range(size_z) if (size_x, z) not in blocked_set)
    north = sum(1 for x in range(size_x) if (x, size_z) not in blocked_set)
    west  = sum(1 for z in range(size_z) if (-1, z) not in blocked_set)
    return [south, east, north, west]


def build_bot_data(templates_dir: Path, id_to_name: dict) -> dict:
    """
    Returns ident → {name, power_kw, loader_sides, loader_needed, ...} for all
    player-relevant BOTs (those that have a display name in id_to_name).
    Uses type-agnostic name lookup — if a BOT has a name, it's included.
    """
    bots_raw = load_yaml_templates(templates_dir, "BuildableObjectTemplate")
    bot_data = {}

    for ident, v in bots_raw.items():
        # Get display name: must be in id_to_name (via ItemTemplate or buildableObjectIdentifer)
        name = id_to_name.get(ident, "")
        if not name:
            # Fallback to BOT's own nameOverride if present
            if v.get("hasNameOverride"):
                name = v.get("nameOverride", "")
        if not name:
            continue  # not player-visible

        power_kw = get_power_kw(v)
        loader_sides = compute_loader_sides(v)
        loader_needed = not v.get("disableLoaders", False)

        bot_data[ident] = {
            "name": name,
            "power_kw": power_kw,
            "loader_sides": loader_sides,
            "loader_needed": loader_needed,
        }

    return bot_data


# ─────────────────────────────────────────────────────────────────────────────
# Build tag → machines map from BuildableObjectTemplate
# ─────────────────────────────────────────────────────────────────────────────

def build_tag_to_machines(templates_dir: Path, id_to_name: dict) -> dict:
    """
    Returns tag → [(machine_display_name, effective_modifier)].

    Handles all production machine types detected from the `type` field:
    - PROD_TYPES: Producer, AutoProducer, ModularEntityProducer
    - Also handles producer_recipeType_fixed by loading the recipe's tags.

    Priority rule:
      1. If any machine has the tag as its autoProducer_recipeType_tag → use ONLY those.
      2. If NO auto match → use machines from producer_recipeType_tags +
         modularProducer_recipeType_tags + modularProducer_fixedCraftingRecipeIdentifier.
    """
    # Load all recipes to support producer_recipeType_fixed → tag lookup
    recipes_raw = load_yaml_templates(templates_dir, "CraftingRecipe")
    recipe_id_to_tags: dict[str, list[str]] = {
        rid: (rdata.get("tags") or [])
        for rid, rdata in recipes_raw.items()
    }

    auto_map: dict[str, dict[str, float]] = {}   # tag → {machine_name: modifier}
    prod_map: dict[str, dict[str, float]] = {}   # tag → {machine_name: modifier}

    bots = load_yaml_templates(templates_dir, "BuildableObjectTemplate")
    for ident, v in bots.items():
        bot_type = v.get("type", "")
        if bot_type not in PROD_TYPES:
            continue

        machine_name = id_to_name.get(ident, "")
        if not machine_name:
            continue

        auto_tag = v.get("autoProducer_recipeType_tag") or ""
        auto_mod_raw = v.get("autoProducer_recipeTimeModifier_str")
        prod_tags = v.get("producer_recipeType_tags") or []
        prod_mod_raw = v.get("producer_recipeTimeModifier_str")
        mod_tags = v.get("modularProducer_recipeType_tags") or []
        mod_mod_raw = v.get("modularProducer_recipeTimeModifier_str")
        mod_fixed_recipe = v.get("modularProducer_fixedCraftingRecipeIdentifier") or ""
        fixed_recipe = v.get("producer_recipeType_fixed") or ""

        try:
            auto_mod = float(auto_mod_raw) if auto_mod_raw else 1.0
        except (ValueError, TypeError):
            auto_mod = 1.0

        try:
            prod_mod = float(prod_mod_raw) if prod_mod_raw else 1.0
        except (ValueError, TypeError):
            prod_mod = 1.0

        try:
            mod_mod = float(mod_mod_raw) if mod_mod_raw else 1.0
        except (ValueError, TypeError):
            mod_mod = 1.0

        # autoProducer tag → highest priority
        if auto_tag:
            auto_map.setdefault(auto_tag, {})[machine_name] = auto_mod

        # producer_recipeType_tags → fallback
        for tag in prod_tags:
            prod_map.setdefault(tag, {})[machine_name] = prod_mod

        # modularProducer_recipeType_tags → fallback
        for tag in mod_tags:
            prod_map.setdefault(tag, {})[machine_name] = mod_mod

        # modularProducer_fixedCraftingRecipeIdentifier → also add to each tag of that recipe
        if mod_fixed_recipe and mod_fixed_recipe in recipe_id_to_tags:
            for tag in recipe_id_to_tags[mod_fixed_recipe]:
                prod_map.setdefault(tag, {})[machine_name] = mod_mod

        # producer_recipeType_fixed → look up recipe tags
        if fixed_recipe and fixed_recipe in recipe_id_to_tags:
            for tag in recipe_id_to_tags[fixed_recipe]:
                prod_map.setdefault(tag, {})[machine_name] = prod_mod

    # Apply priority rule: auto wins over prod for each tag
    tag_machines: dict[str, dict[str, float]] = {}
    all_tags = set(auto_map) | set(prod_map)
    for tag in all_tags:
        if tag in auto_map:
            tag_machines[tag] = auto_map[tag]
        else:
            tag_machines[tag] = prod_map[tag]

    return {tag: sorted(machines.items()) for tag, machines in tag_machines.items()}


# ─────────────────────────────────────────────────────────────────────────────
# Build category map from CraftingRecipeCategory
# ─────────────────────────────────────────────────────────────────────────────

def build_category_map(templates_dir: Path) -> dict:
    """Returns category_identifier → display_name."""
    result = {}
    for ident, v in load_yaml_templates(templates_dir, "CraftingRecipeCategory").items():
        result[ident] = v.get("name", ident)
    return result


# ─────────────────────────────────────────────────────────────────────────────
# Build subgroup map from CraftingRecipeRowGroup
# ─────────────────────────────────────────────────────────────────────────────

def build_subgroup_map(templates_dir: Path) -> dict:
    """
    Returns subgroup_identifier → {title, category_id, sortingOrder}.
    """
    result = {}
    for ident, v in load_yaml_templates(templates_dir, "CraftingRecipeRowGroup").items():
        result[ident] = {
            "title": v.get("title", ident),
            "category_id": v.get("identifier_category", ""),
            "sortingOrder": int(v.get("sortingOrder", 0)),
        }
    return result


# ─────────────────────────────────────────────────────────────────────────────
# Build intermediate items set from ItemCategoryTemplate
# ─────────────────────────────────────────────────────────────────────────────

def build_intermediate_items(templates_dir: Path, id_to_name: dict) -> set[str]:
    """
    Items in _base_raw_materials ItemCategoryTemplate are intermediate items.
    """
    result = set()
    for ident, v in load_yaml_templates(templates_dir, "ItemTemplate").items():
        cat = v.get("itemCategoryIdentifier", "")
        if cat == "_base_raw_materials":
            name = id_to_name.get(ident, "")
            if name:
                result.add(name)
    return result


# ─────────────────────────────────────────────────────────────────────────────
# Ore mining map — dynamic from OreVeinTemplate + TerrainBlockType
# ─────────────────────────────────────────────────────────────────────────────

def detect_research_bonuses(templates_dir: Path, bots_raw: dict, id_to_name: dict) -> dict:
    """
    Endless researches (flags ENDLESS_RESEARCH) → {name: bonusPerLevel}.
    The game data has no numeric field for the bonus — only the description
    ("…by 10% per level", "Produces 10% additional…"), so it is parsed from
    there. Also lists the Pumpjack machines (Pumpjack Efficiency target).
    """
    out: dict = {"perLevel": {}, "pumpjacks": []}
    for v in load_yaml_templates(templates_dir, "ResearchTemplate").values():
        if "ENDLESS_RESEARCH" not in str(v.get("flags", "")).split("|"):
            continue
        m = re.search(r"(\d+(?:\.\d+)?)\s*%", str(v.get("description", "")))
        if not m:
            print(f"  WARNING: no % bonus found in description of research '{v.get('name')}'", file=sys.stderr)
            continue
        out["perLevel"][v.get("name", "")] = float(m.group(1)) / 100
    item_ids = _build_item_bot_ids(templates_dir)
    out["pumpjacks"] = sorted(id_to_name[i] for i, v in bots_raw.items()
                              if v.get("type") == "Pumpjack" and i in item_ids and id_to_name.get(i))
    return out


def detect_shipping_data(templates_dir: Path, id_to_name: dict) -> dict:
    """
    Planet <-> space station shipping (verified against a Steam forum measurement,
    2 Jun 2025, and in-game panels):
      ships:  cargo kg, required pad size, load/unload kg/s, hangar space
      pads:   pad size, cargo kg, conveyor inputs/outputs, down-shipping allowed
              (the Medium Assembly Line pad has no belts and only ships up)
      conveyors: items/min per belt = slotsPerTick x 80 (I 160 ... IV 1280/min;
              4 x IV on a medium pad = 5120/min as measured)
      weights: item name -> kg (_baseWeightInGrams)
    The flight time between pad and station is NOT in the game data (app setting).
    """
    bots = load_yaml_templates(templates_dir, "BuildableObjectTemplate")
    item_ids = _build_item_bot_ids(templates_dir)
    num = lambda v: float(v) if str(v or "").strip() not in ("", "None") else 0.0
    ships = []
    for v in load_yaml_templates(templates_dir, "SpaceShipTemplate").values():
        if v.get("spaceShipType") != "TransportShip":
            continue
        ships.append({"name": v.get("name", ""), "cargoKg": num(v.get("transportShip_cargoSpaceInKg")),
                      "padSize": v.get("transportShip_requiredShippingPadSize", ""),
                      "transferKgPerS": num(v.get("transportShip_itemTransferRate_kgPerS_str")),
                      "hangarSpace": num(v.get("requiredHangarSpace"))})
    pads, conveyors, loader_kw = [], {}, {}
    lane_of = {"Loader": 1, "Loader (2nd Lane)": 2, "Loader (3rd Lane)": 3}
    for ident, v in bots.items():
        name = id_to_name.get(ident, "")
        if not name or ident not in item_ids:
            continue
        if v.get("type") == "Loader" and name in lane_of and str(v.get("loader_isFilter")) != "True":
            # Power while running (tooltip "Max Power Consumption"); 0 in current versions
            loader_kw[lane_of[name]] = num(v.get("energyConsumptionKW_str"))
        elif v.get("type") == "ShippingPad":
            conns = v.get("ccm_connectionData") or []
            pads.append({"name": name, "padSize": v.get("shippingPad_padSize", ""),
                         "capacityKg": num(v.get("shippingPad_cargoCapacity_weightInKg_str")),
                         "inputs": sum(1 for c in conns if c.get("isInput")),
                         "outputs": sum(1 for c in conns if not c.get("isInput")),
                         "downAllowed": str(v.get("shippingPad_spp_preventDownShipping")) != "True"})
        elif v.get("type") == "Conveyor" and not v.get("conveyor_isSlope") and num(v.get("conveyor_speed_slotsPerTick")):
            conveyors[name] = num(v.get("conveyor_speed_slotsPerTick")) * 80
    weights = {}
    for v in load_yaml_templates(templates_dir, "ItemTemplate").values():
        g = num(v.get("_baseWeightInGrams"))
        if g > 0 and v.get("name"):
            weights[v["name"]] = g / 1000
    return {"ships": sorted(ships, key=lambda x: x["cargoKg"]), "pads": sorted(pads, key=lambda x: x["capacityKg"]),
            "conveyors": conveyors, "weights": weights, "loaderKw": loader_kw}


def detect_workstation_data(templates_dir: Path, id_to_name: dict) -> dict:
    """
    Workstation bonuses from game data (the old hand-written APPLIES_TO_MACHINES
    list and the robots' workstation_effect were never extracted):
      categories: tag displayName → machines carrying that workstationEffectTag
      effects:    robot name → {machine_speed | machine_efficiency (%),
                  power_consumption (data02 / 100), applies_to: [category]}
    data01 / data02 are stored ×100 (Light Bot 3000/2000 → +30 % speed, 20).
    """
    tags = {k: v.get("displayName") or k
            for k, v in load_yaml_templates(templates_dir, "WorkstationEffectTagTemplate").items()}
    tag_of = lambda raw: tags.get(str(raw).split("|")[0], "")
    item_ids = _build_item_bot_ids(templates_dir)
    categories: dict[str, set] = {}
    for ident, v in load_yaml_templates(templates_dir, "BuildableObjectTemplate").items():
        name = id_to_name.get(ident, "")
        if not name or ident not in item_ids:
            continue
        for t in v.get("workstationEffectTags") or []:
            if tag_of(t):
                categories.setdefault(tag_of(t), set()).add(name)
    kind = {"SPEED_BOOST": "machine_speed", "EFFICIENCY_BOOST": "machine_efficiency"}
    effects: dict[str, dict] = {}
    for v in load_yaml_templates(templates_dir, "ItemTemplate").values():
        key = kind.get(v.get("workstationItem_effect", ""))
        try:
            d1 = float(v.get("workstationItem_data01") or 0)
            d2 = float(v.get("workstationItem_data02") or 0)
        except (ValueError, TypeError):
            continue
        applies = [tag_of(t) for t in v.get("workstationItem_requiredTags") or [] if tag_of(t)]
        if key and d1 > 0 and applies and v.get("name"):
            effects[v["name"]] = {key: d1 / 100, "power_consumption": d2 / 100, "applies_to": applies}
    return {"categories": {c: sorted(m) for c, m in sorted(categories.items())}, "effects": effects}


def detect_external_sources(templates_dir: Path, recipes: list[dict],
                             fluid_sources: dict, id_to_name: dict) -> dict:
    """
    Ingredients no recipe/miner/fluid source produces, but flagged SALES_CURRENCY
    in ItemTemplate, are sent down from the orbital station (e.g. Firmarlite Bar).
    Returns {item_name: "Space Station"}.
    """
    produced = set(id_to_name.get(k, k) for k in fluid_sources)
    for r in recipes:
        produced.add(r["name"])
        produced.update(o["item"] for o in r.get("outputs", []))
    flags = {v.get("name", ""): str(v.get("flags", ""))
             for v in load_yaml_templates(templates_dir, "ItemTemplate").values()}
    # Shown source = the buildable "Space Station Terminal" (has an icon)
    stations = sorted((n for n, f in flags.items()
                       if "Space Station" in n and "BUILDABLE_OBJECT" in f.split("|")),
                      key=lambda n: "Terminal" not in n)  # the terminal first
    source = stations[0] if stations else "Space Station"
    out: dict[str, str] = {}
    for r in recipes:
        for i in r.get("ingredients", []):
            if i["item"] not in produced and "SALES_CURRENCY" in flags.get(i["item"], "").split("|"):
                out[i["item"]] = source
    return out


def detect_excavation(templates_dir: Path, bots_raw: dict, id_to_name: dict) -> dict:
    """
    Items gathered from the world instead of produced: digging terrain
    (TerrainBlockType yieldItemOnDig: Dirt, Sand, Stone …) and mining world
    objects (worldDecor_miningYield: Biomass, Xeno-Scrap …; worldDecor_specialDrops:
    seeds with a chance). Tools: handhelds MINING_TOOL / MINING_DRONE_CONTROLLER
    the Quarry (digs terrain) and the Construction Ship Port (mines what the
    drone controller marked).
    Returns {"source": <port>, "tools": [...], "items": [...]}.
    """
    items = set()
    for v in load_yaml_templates(templates_dir, "TerrainBlockType").values():
        n = id_to_name.get(v.get("yieldItemOnDig") or "", "")
        if n:
            items.add(n)
    for v in bots_raw.values():
        if v.get("type") != "WorldDecorMineAble":
            continue
        for entry in (v.get("worldDecor_miningYield") or []) + (v.get("worldDecor_specialDrops") or []):
            n = id_to_name.get(entry.get("it_identifier") or "", "")
            if n:
                items.add(n)
    tools, port = [], ""
    for v in load_yaml_templates(templates_dir, "ItemTemplate").values():
        if v.get("handheldSubType") in ("MINING_TOOL", "MINING_DRONE_CONTROLLER") and not v.get("isHiddenItem") \
                and "PREVIEW" not in (v.get("name") or ""):
            tools.append(v.get("name"))
    item_ids = _build_item_bot_ids(templates_dir)
    buildings = []
    for ident, v in bots_raw.items():
        if ident not in item_ids or not id_to_name.get(ident):
            continue
        if v.get("type") == "ConstructionDronePort":
            port = id_to_name[ident]
        elif v.get("type") == "QuarryBuilding":  # digs terrain automatically (Dirt, Stone …)
            buildings.append(id_to_name[ident])
    return {"source": port, "tools": sorted(tools) + sorted(buildings) + ([port] if port else []), "items": sorted(items)}


def detect_vein_mining_fluids(templates_dir: Path, bots_raw: dict, id_to_name: dict) -> dict:
    """
    Returns {ore_item_name: {fluid, perMinerPerMin, machines}} — fluid an Ore Vein
    Miner needs once the vein is mined down to its core (OreVeinTemplate
    miningFluid_identifier / requiredMiningFluid_literPerMinutePerMiner_str).
    Only needed for depleted veins → the app applies it behind a setting.
    """
    terrain_raw = load_yaml_templates(templates_dir, "TerrainBlockType")
    item_ids = _build_item_bot_ids(templates_dir)
    vein_miners = sorted(id_to_name[i] for i, v in bots_raw.items()
                         if v.get("type") == "OreVeinMiner" and i in item_ids and id_to_name.get(i))
    out: dict[str, dict] = {}
    for ov in load_yaml_templates(templates_dir, "OreVeinTemplate").values():
        tbt = terrain_raw.get(ov.get("mineableBlockType_identifier", "")) or {}
        ore = id_to_name.get(tbt.get("oreVeinMineable_yieldItem_identifier", ""), "")
        fluid = id_to_name.get(ov.get("miningFluid_identifier", ""), "")
        try:
            per_min = float(ov.get("requiredMiningFluid_literPerMinutePerMiner_str") or 0)
        except (TypeError, ValueError):
            per_min = 0.0
        if ore and fluid and per_min > 0 and vein_miners:
            out[ore] = {"fluid": fluid, "perMinerPerMin": per_min, "machines": vein_miners}
    return out


def build_ore_mining_map(templates_dir: Path) -> dict:
    """
    Returns {yield_item_identifier: ore_vein_identifier} for all mineable ore veins.
    Chain: OreVeinTemplate → mineableBlockType_identifier → TerrainBlockType
           → oreVeinMineable_yieldItem_identifier
    """
    ore_vein_raw = load_yaml_templates(templates_dir, "OreVeinTemplate")
    terrain_raw = load_yaml_templates(templates_dir, "TerrainBlockType")

    mineable_items: dict[str, str] = {}  # yield_item_id → ore_vein_id
    for ov_id, ov in ore_vein_raw.items():
        tbt_id = ov.get("mineableBlockType_identifier", "")
        if not tbt_id or tbt_id not in terrain_raw:
            continue
        tbt = terrain_raw[tbt_id]
        yield_id = tbt.get("oreVeinMineable_yieldItem_identifier", "")
        if yield_id:
            mineable_items[yield_id] = ov_id
    return mineable_items


# ─────────────────────────────────────────────────────────────────────────────
# Assembly line composition — dynamic from templates
# ─────────────────────────────────────────────────────────────────────────────

def build_assembly_line_robots(templates_dir: Path, id_to_name: dict) -> dict:
    """
    Derives per-robot part quantities from AssemblyLineObjectTemplate and
    AssemblyLineProducerActionTemplate.

    Returns: { robot_name: { canonical_part_title: count }, ... }
    e.g. { "Assault Robot": { "Torso": 1, "Arm": 2, "Leg": 2, "Head": 1 } }
    """
    al_objects = load_yaml_templates(templates_dir, "AssemblyLineObjectTemplate")
    al_actions = load_yaml_templates(templates_dir, "AssemblyLineProducerActionTemplate")

    # Build map: item_identifier → count of attach-actions across all robots
    # (Left+Right separate actions each = 1 item needed each → 2 total)
    # We count per robot by finding which item_ids belong to which robot.

    # First: collect all item_identifiers used in attach actions
    # Then: for each robot's objectParts, count how many times each canonical title appears
    # (titles like "Arm (Right)" and "Arm (Left)" → canonical "Arm" → count = 2)

    import re
    def canonical(title: str) -> str:
        """Strip (Right)/(Left)/trailing parenthetical from part title."""
        return re.sub(r'\s*\([^)]*\)\s*$', '', title).strip()

    result: dict[str, dict[str, int]] = {}
    for robot_id, robot in al_objects.items():
        name = robot.get("name", "") or id_to_name.get(robot_id, robot_id)
        if not name:
            continue
        parts = robot.get("objectParts") or []
        counts: dict[str, int] = {}
        for part in parts:
            canon = canonical(part.get("title", ""))
            if canon:
                counts[canon] = counts.get(canon, 0) + 1
        if counts:
            result[name] = counts

    return result


def build_assembly_line_energy(templates_dir: Path) -> dict:
    """
    Energy (kJ) the Assembly Line spends per finished robot. The stations draw
    power per task, not continuously (in-game they charge a buffer and drop
    back to 0), so average power = energy per robot / cycle time.
      Start:    alStart_requiredPowerPerAction_kj_str (once per robot)
      Producer: per non-initial part one attach + one weld action
                (AssemblyLineProducerActionTemplate powerCost_kj_str)
      Painter:  requiredPowerForPainting_kj_str of every part
                (in-game: Personal Assistant Robot 50 + 5 x 75 = 425 kJ)
    Returns { robot_name: kJ }.
    """
    bots_raw = load_yaml_templates(templates_dir, "BuildableObjectTemplate")
    al_objects = load_yaml_templates(templates_dir, "AssemblyLineObjectTemplate")
    actions = load_yaml_templates(templates_dir, "AssemblyLineProducerActionTemplate")
    num = lambda x: float(x) if str(x or "").strip() not in ("", "None") else 0.0
    start_kj = max((num(v.get("alStart_requiredPowerPerAction_kj_str")) for v in bots_raw.values()
                    if v.get("type") == "AL_Start"), default=0.0)
    # Which action belongs to which robot lives in a Unity .asset (not YAML), so
    # use the attach (needs an item) / weld (no item) cost. Same for all robots
    # in current data. ponytail: max per kind; per-robot costs need the .asset.
    attach_kj = max((num(a.get("powerCost_kj_str")) for a in actions.values() if a.get("requiredItems")), default=0.0)
    weld_kj = max((num(a.get("powerCost_kj_str")) for a in actions.values() if not a.get("requiredItems")), default=0.0)
    out = {}
    for robot in al_objects.values():
        parts = robot.get("objectParts") or []
        name = robot.get("name", "")
        if not name or not parts:
            continue
        added = sum(1 for p in parts if not p.get("isInitialPart", False))
        paint = sum(num(p.get("requiredPowerForPainting_kj_str")) for p in parts)
        out[name] = start_kj + added * (attach_kj + weld_kj) + paint
    return out


def build_assembly_line_paint(templates_dir: Path, id_to_name: dict) -> dict:
    """
    Paint per robot: every part must be painted (a colour is always chosen;
    unpainted robots cannot be shipped for sale). Per part the colour variants
    name the liquid and litres; the default variant has none, the colours share
    one amount (Personal Assistant Robot: torso 30 + 4 x 15 arms/legs + head 10
    = 100 L, in-game). Returns { robot_name: { item, litres } }.
    """
    al_objects = load_yaml_templates(templates_dir, "AssemblyLineObjectTemplate")
    out = {}
    for robot in al_objects.values():
        name, litres, liquid = robot.get("name", ""), 0.0, ""
        for part in robot.get("objectParts") or []:
            amounts = [(float(c.get("amountLiquidRequired_l_str")), c.get("paintElementTemplate_identifier", ""))
                       for c in part.get("colorVariants") or []
                       if str(c.get("amountLiquidRequired_l_str") or "").strip() not in ("", "None")]
            if amounts:
                amt, ident = max(amounts)
                litres += amt
                liquid = liquid or id_to_name.get(ident, ident)
        if name and litres:
            out[name] = {"item": liquid, "litres": litres}
    return out


def build_assembly_line_composition(templates_dir: Path) -> dict:
    """
    Derives Assembly Line sub-machine composition from AssemblyLineObjectTemplate.
    Each robot type has 1 initial part (torso → AL Start) and N non-initial parts.
    Each non-initial part needs attach + weld = 2 producer stations.
    Returns: {start, producer, painter} counts + cycle_time_sec for complete robot.

    Cycle time derivation:
      al_producer_speedInSlotsPerTick: N (from _base_al_producer_i.yaml)
      Calibration: speed=10 → 1.875 s/robot (validated against v0.6.0.24342 recipe data)
      Formula: cycle_time = 1.875 × 10 / speed
    """
    al_objects = load_yaml_templates(templates_dir, "AssemblyLineObjectTemplate")
    bots_raw = load_yaml_templates(templates_dir, "BuildableObjectTemplate")

    max_non_initial = 0
    for obj_id, obj in al_objects.items():
        parts = obj.get("objectParts") or []
        non_initial = sum(1 for p in parts if not p.get("isInitialPart", False))
        if non_initial > max_non_initial:
            max_non_initial = non_initial

    producer_count = max_non_initial * 2  # attach + weld per part

    # Derive cycle time from AL producer speed
    al_speed = 10  # default, calibrated value
    al_producer = bots_raw.get("_base_al_producer_i", {})
    speed_raw = al_producer.get("al_producer_speedInSlotsPerTick")
    if speed_raw:
        try:
            al_speed = float(speed_raw)
        except (ValueError, TypeError):
            pass
    cycle_time_sec = round(1.875 * 10 / al_speed, 6) if al_speed else 1.875

    return {
        "start":      {"count": 1,              "name": "Assembly Line Start"},
        "producer":   {"count": producer_count, "name": "Assembly Line Producer"},
        "painter":    {"count": 1,              "name": "Assembly Line Painter"},
        "cycle_time": cycle_time_sec,
    }


# ─────────────────────────────────────────────────────────────────────────────
# Byproduct disposal — dynamic from recipes + Flare Stack template
# ─────────────────────────────────────────────────────────────────────────────

def detect_byproducts_and_disposal(templates_dir: Path, recipes: list[dict],
                                   id_to_name: dict) -> dict:
    """
    Returns {item_name: {machine, capacityPerMin, ?reprocess}} for byproduct items.
    Byproduct = any secondary output (outputs[1:]) of a recipe, e.g. Blast Furnace
    Slag, Waste Gas. (The old rule "elemental output never used as input" missed
    Slag — it IS an input of Cement (Slag Reprocessing) — and made the reprocess
    lookup below dead code.)
    Disposal machines come from Dissolver BOTs: elemental → Flare Stack,
    solid → Incinerator. reprocess = recipe consuming the byproduct; its surplus
    product needs disposal too (Slag → Cement → Incinerator).
    """
    bots_raw = load_yaml_templates(templates_dir, "BuildableObjectTemplate")
    item_ids = _build_item_bot_ids(templates_dir)

    # Dissolvers: biggest capacity per kind (elemental / solid)
    dissolver: dict[bool, dict] = {}
    for ident, v in bots_raw.items():
        if ident not in item_ids or v.get("type") != "Dissolver" or not id_to_name.get(ident):
            continue
        elemental = str(v.get("dissolver_isElemental")) == "True"
        field = "dissolver_elementalConsumptionPerSecond_str" if elemental else "dissolver_solidsPerSecond_str"
        try:
            cap = float(v.get(field) or 0) * 60
        except (ValueError, TypeError):
            cap = 0.0
        if cap > dissolver.get(elemental, {}).get("capacityPerMin", 0):
            dissolver[elemental] = {"machine": id_to_name[ident], "capacityPerMin": cap}

    is_elemental: dict[str, bool] = {}
    for r in recipes:
        for o in r.get("outputs", []) + r.get("ingredients", []):
            is_elemental.setdefault(o["item"], bool(o.get("is_elemental")))

    byproduct_names = {o["item"] for r in recipes for o in r.get("outputs", [])[1:]}

    disposal: dict[str, dict] = {}
    for bp in sorted(byproduct_names):
        sink = dissolver.get(is_elemental.get(bp, False))
        if not sink:
            continue
        entry: dict = dict(sink)
        # Reprocessing = the ONLY recipe consuming the byproduct, and a pure
        # conversion (byproduct = sole ingredient): Slag → Cement. The app then
        # always reprocesses it. Byproducts with several consumers (Crude Olumite)
        # just go into the app's supply pool; only the unused rest is disposed of.
        consumers = [r for r in recipes
                     if r.get("outputs") and any(i["item"] == bp for i in r.get("ingredients", []))]
        rp = consumers[0] if len(consumers) == 1 and len(consumers[0]["ingredients"]) == 1 else None
        if rp:
            produces = rp["outputs"][0]["item"]
            entry["reprocess"] = {"recipe": rp["name"], "produces": produces}
            surplus = dissolver.get(is_elemental.get(produces, False))
            if surplus:
                entry["reprocess"]["surplus"] = dict(surplus)
        disposal[bp] = entry
    return disposal


def _build_item_bot_ids(templates_dir: Path) -> set:
    """Return all identifiers reachable via ItemTemplate (direct ID + buildableObjectIdentifer)."""
    item_ids = set()
    for ident, v in load_yaml_templates(templates_dir, "ItemTemplate").items():
        item_ids.add(ident)
        bot_id = v.get("buildableObjectIdentifer", "")
        if bot_id:
            item_ids.add(bot_id)
    return item_ids


# ─────────────────────────────────────────────────────────────────────────────
# Fluid sources — dynamic from PipeIntake BOTs
# ─────────────────────────────────────────────────────────────────────────────

def detect_fluid_sources(templates_dir: Path, bots_raw: dict, id_to_name: dict) -> dict:
    """
    Returns {element_identifier: {machine, capacityPerMin}} for fluid sources.
    Detects PipeIntake-type BOTs → they produce water (or the fixed element if specified).
    """
    # Build name→id map for elements so we can find water dynamically
    element_name_to_id: dict[str, str] = {}
    for ident, v in load_yaml_templates(templates_dir, "ElementTemplate").items():
        name = v.get("name", "")
        if name:
            element_name_to_id[name] = ident
    for ident, v in load_yaml_templates(templates_dir, "LiquidTemplate").items():
        name = v.get("name", "")
        if name:
            element_name_to_id[name] = ident

    item_ids = _build_item_bot_ids(templates_dir)
    sources: dict[str, dict] = {}

    for ident, v in bots_raw.items():
        bot_type = v.get("type", "")
        if bot_type != "PipeIntake":
            continue
        if ident not in item_ids:
            continue

        machine_name = id_to_name.get(ident, "")
        if not machine_name:
            continue

        fbm = v.get("fbm_ioFluidBoxes") or []
        for box in fbm:
            rate = box.get("transferRatePerSecond_liter", 0) or 0
            try:
                rate = float(rate)
            except (ValueError, TypeError):
                rate = 0.0
            if rate <= 0:
                continue
            is_input = box.get("isInput", True)
            if is_input:
                continue

            # Determine which fluid this intake provides
            fixed_id = box.get("fixedElementTemplateIdentifier", "") or ""
            if fixed_id:
                fluid_id = fixed_id
            else:
                # PipeIntake with no fixed element → provides world water
                fluid_id = element_name_to_id.get("Water", "")

            if not fluid_id:
                continue

            capacity_per_min = rate * 60
            alt = {"machine": machine_name, "capacityPerMin": capacity_per_min}
            # Default = lowest capacity (basic intake); all intakes are alternatives
            # (Liquid Intake on pipes, Liquid Intake (Pipeline) 180,000 L/min).
            prev = sources.get(fluid_id)
            alts = (prev or {}).get("alternatives", []) + [alt]
            if prev is None or capacity_per_min < prev["capacityPerMin"]:
                sources[fluid_id] = dict(alt)
            sources[fluid_id]["alternatives"] = sorted(alts, key=lambda a: a["capacityPerMin"])

    return sources


# ─────────────────────────────────────────────────────────────────────────────
# Modular buildings — speed bonus per optional module (in-game "Tower", "Vent")
# ─────────────────────────────────────────────────────────────────────────────

def detect_fluid_ports(templates_dir: Path, bots_raw: dict, id_to_name: dict) -> dict:
    """
    Pipes vs pipelines (PipeTypeTemplate throughputPerMinute_l_str: Pipe 36,000,
    Pipeline 360,000 L/min) and which one each building connects to: its own
    fbm_ioFluidBoxes plus those of the modules it can attach
    (modularBuildingLimits, e.g. Hot Air Stove "Pipe Attachment (Input)" =
    pipeline). Pumps convert between the types (Pipe-to-Pipeline Pump, 1 MW).
    Returns {"pipes": {name: L/min}, "ports": {machine: {"in": [...], "out": [...]}},
             "pumps": [{name, from, to, kw}]}.
    """
    pipe_ids = {}
    pipes = {}
    for ident, v in load_yaml_templates(templates_dir, "PipeTypeTemplate").items():
        name = id_to_name.get(ident, ident)
        try:
            pipes[name] = float(v.get("throughputPerMinute_l_str") or 0)
        except (ValueError, TypeError):
            continue
        pipe_ids[ident] = name
    item_ids = _build_item_bot_ids(templates_dir)

    def boxes(v):
        for fb in v.get("fbm_ioFluidBoxes") or []:
            t = pipe_ids.get(fb.get("pipeTypeIdentifier") or "")
            if t:
                yield ("in" if str(fb.get("isInput")) == "True" else "out"), t

    ports, pumps = {}, []
    for ident, v in bots_raw.items():
        name = id_to_name.get(ident, "")
        if not name or ident not in item_ids:
            continue
        found = {"in": set(), "out": set()}
        for d, t in boxes(v):
            found[d].add(t)
        for lim in v.get("modularBuildingLimits") or []:
            for d, t in boxes(bots_raw.get(lim.get("bot_identifier") or "", {})):
                found[d].add(t)
        if v.get("type") == "Pump" and found["in"] and found["out"] and found["in"] != found["out"]:
            pumps.append({"name": name, "from": sorted(found["in"])[0], "to": sorted(found["out"])[0],
                          "kw": float(v.get("energyConsumptionKW_str") or 0)})
            continue
        if found["in"] or found["out"]:
            ports[name] = {"in": sorted(found["in"]), "out": sorted(found["out"])}
    return {"pipes": pipes, "ports": ports, "pumps": pumps}


def detect_modular_buildings(bots_raw: dict, id_to_name: dict, item_ids: set) -> dict:
    """
    Returns {machine_name: {module, min, max, ignored, speedPerModule,
             fluidPerModule, adjacencyPowerDecrease}}.
    speed = 1 + (modules - ignored) × speedPerModule. Sources:
      ResourceConverter: resourceConverter_speedBonusModules (+ adjacency power bonus)
      BlastFurnace:      blastFurnace_towerModule_* (+ hot air increase per tower)
    min/max come from modularBuildingLimits of the base building.
    """
    def module_info(base: dict, module_id: str):
        lim = next((l for l in (base.get("modularBuildingLimits") or [])
                    if l.get("bot_identifier") == module_id), None)
        mod = bots_raw.get(module_id) or {}
        name = mod.get("modularBuildingModule_descriptionName") or id_to_name.get(module_id, module_id)
        return name, int((lim or {}).get("minAmount", 0) or 0), int((lim or {}).get("maxAmount", 0) or 0)

    def num(v, default=0.0):
        try:
            return float(v)
        except (TypeError, ValueError):
            return default

    result: dict[str, dict] = {}
    for ident, v in bots_raw.items():
        machine = id_to_name.get(ident, "")
        if not machine or ident not in item_ids:  # skip debug/unbuildable templates
            continue
        entry = None
        bonus = (v.get("resourceConverter_speedBonusModules") or [None])[0]
        # type check: other modular templates carry a copied (inert) speed-bonus field
        if bonus and bonus.get("bot_identifier") and v.get("type") in RC_TYPES:
            name, mn, mx = module_info(v, bonus["bot_identifier"])
            entry = {"module": name, "min": mn, "max": mx,
                     "ignored": int(num(bonus.get("numberOfIgnoredModules"), mn)),
                     "speedPerModule": num(bonus.get("speedBonus"))}
        elif v.get("type") == "EndlessMiner" and v.get("endlessMiner_powerCoreSlots"):
            # Xeno-Crystal / Xeno-Scrap Extractor: power cores in slots add speed,
            # no extra power is listed per core (powerPerModule 0 → base power).
            # Default 0: power cores are optional items (in-game base: 10/min crystals).
            entry = {"module": "Power Core", "min": 0, "max": int(num(v.get("endlessMiner_powerCoreSlots"))),
                     "ignored": 0, "speedPerModule": num(v.get("endlessMiner_speedIncreasePerPowerCore_str")),
                     "powerPerModule": 0.0, "default": 0}
        elif v.get("type") == "FrackingTower" and v.get("frackingTower_towerModuleBOT_identifier"):
            # No speed: every tower module adds fluid throughput, every optional one power
            name, mn, mx = module_info(v, v["frackingTower_towerModuleBOT_identifier"])
            entry = {"module": name, "min": mn, "max": mx, "ignored": mn, "speedPerModule": 0.0,
                     "throughputPerModule": num(v.get("frackingTower_fluidThroughputPerTowerPerSecond_str")) * SECONDS_PER_MIN,
                     "powerPerModule": num(v.get("frackingTower_powerConsumptionPercentagePerOptionalTowerModule")) / 100,
                     "basePowerKw": get_power_kw(v)}  # not in MACHINE_POWER_KW (no recipe)
        elif v.get("blastFurnace_towerModuleBotIdentifier"):
            name, mn, mx = module_info(v, v["blastFurnace_towerModuleBotIdentifier"])
            hot_air = id_to_name.get(v.get("blastFurnace_hotAirTemplateIdentifier", ""), "")
            entry = {"module": name, "min": mn, "max": mx, "ignored": mn,
                     "speedPerModule": num(v.get("blastFurnace_towerModule_speedIncrease"))}
            inc = num(v.get("blastFurnace_towerModule_hotAirConsumptionPercentIncrease"))
            if hot_air and inc:
                entry["fluidPerModule"] = {hot_air: inc}
        if not entry or entry["max"] <= entry["ignored"] or not (
                entry["speedPerModule"] or entry.get("throughputPerModule")):
            continue
        if str(v.get("resourceConverter_hasAdjacencyBonus")) == "True":
            entry["adjacencyPowerDecrease"] = num(v.get("resourceConverter_powerDecreasePerAdjacentResourceConverter"))
        result[machine] = entry
    return result


# ─────────────────────────────────────────────────────────────────────────────
# Machine fluid minimums — dynamic from BlastFurnace fields
# ─────────────────────────────────────────────────────────────────────────────

def detect_machine_fluid_minimums(bots_raw: dict, id_to_name: dict) -> dict:
    """
    Returns {machine_name: {fluid_name: amount_per_min}} for machines with mandatory fluid supply.
    Currently detects Blast Furnace hot air requirement via blastFurnace_hotAirTemplateIdentifier.
    """
    minimums: dict[str, dict] = {}
    for ident, v in bots_raw.items():
        hot_air_id = v.get("blastFurnace_hotAirTemplateIdentifier", "") or ""
        consumption = v.get("blastFurnace_baseHotAirConsumptionPerTick")
        if not hot_air_id or consumption is None:
            continue
        machine_name = id_to_name.get(ident, "")
        fluid_name = id_to_name.get(hot_air_id, hot_air_id)
        if machine_name and fluid_name:
            try:
                amount_per_min = float(consumption) * TICKS_PER_MIN
            except (ValueError, TypeError):
                continue
            minimums.setdefault(machine_name, {})[fluid_name] = amount_per_min
    return minimums


# ─────────────────────────────────────────────────────────────────────────────
# Parse recipes
# ─────────────────────────────────────────────────────────────────────────────

def parse_recipes(templates_dir: Path, id_to_name: dict,
                  tag_to_machines: dict, category_map: dict,
                  subgroup_map: dict) -> list[dict]:
    """
    Parse all CraftingRecipe YAMLs into structured recipe dicts.
    Logs WARNING for recipe tags that have no matching machine.
    """
    raw = load_yaml_templates(templates_dir, "CraftingRecipe")

    recipes = []
    for identifier, r in raw.items():
        name = r.get("name", "")
        if not name:
            continue

        time_ms = float(r.get("timeMs", 0) or 0)
        tags = r.get("tags") or []
        category_id = r.get("category_identifier", "")
        rowgroup_id = r.get("rowGroup_identifier", "")
        sorting_in_rowgroup = int(r.get("sortingOrderWithinRowGroup", 0) or 0)

        # Resolve machines for this recipe
        machines = {}
        has_unresolved_tags = []
        for tag in tags:
            if tag == "character":
                machines["Character"] = round(time_ms / 1000, 6)
                continue
            tag_mach = tag_to_machines.get(tag, [])
            if not tag_mach:
                has_unresolved_tags.append(tag)
                print(f"  WARNING: recipe '{name}' tag '{tag}' has no matching machine",
                      file=sys.stderr)
                continue
            for mname, mod in tag_mach:
                if mname not in machines:
                    cycle_time = time_ms / 1000 / max(mod, 0.001)
                    machines[mname] = round(cycle_time, 6)

        # No machine at all → nothing can produce it in the calculator. E.g. the
        # hidden "primitive" Xenoferrite Plates / Technum Rods (tag base_station,
        # which no buildable carries) would otherwise appear as category "Unknown".
        if not machines:
            continue

        # Resolve input items (solid + elemental)
        ingredients = []
        for inp in r.get("input_data") or []:
            iid = inp.get("identifier", "")
            iamt = inp.get("amount", 1)
            iname = id_to_name.get(iid, iid)
            if iname:
                ingredients.append({"item": iname, "amount": iamt, "is_elemental": False})

        for inp in r.get("inputElemental_data") or []:
            iid = inp.get("identifier", "")
            iamt = inp.get("amount") or inp.get("amount_str", 0)
            iname = id_to_name.get(iid, iid)
            if iname and iid:
                ingredients.append({"item": iname, "amount": float(iamt) if iamt else 0,
                                    "is_elemental": True})

        # Resolve output items (solid + elemental)
        outputs = []
        for out in r.get("output_data") or []:
            oid = out.get("identifier", "")
            oamt = out.get("amount", 1)
            opct = float(out.get("percentage_str", 1) or 1)
            oname = id_to_name.get(oid, oid)
            if oname:
                outputs.append({"item": oname, "amount": oamt,
                                 "chance": opct if opct < 1.0 else None,
                                 "is_elemental": False})

        for out in r.get("outputElemental_data") or []:
            oid = out.get("identifier", "")
            oamt = out.get("amount") or out.get("amount_str", 0)
            oname = id_to_name.get(oid, oid)
            if oname and oid:
                outputs.append({"item": oname, "amount": float(oamt) if oamt else 0,
                                 "chance": None, "is_elemental": True})

        recipes.append({
            "identifier": identifier,
            "name": name,
            "icon_identifier": r.get("icon_identifier", ""),
            "category_id": category_id,
            "category_name": category_map.get(category_id, category_id),
            "rowgroup_id": rowgroup_id,
            "rowgroup_title": subgroup_map.get(rowgroup_id, {}).get("title", ""),
            "rowgroup_sort": subgroup_map.get(rowgroup_id, {}).get("sortingOrder", 0),
            "sorting_in_rowgroup": sorting_in_rowgroup,
            "machines": machines,
            "ingredients": ingredients,
            "outputs": outputs,
            "unresolved_tags": has_unresolved_tags,
            "dlc": r.get("entitlementIdentifier", "") or "",  # e.g. _deluxe_edition
        })

    return recipes


def parse_blast_furnace_recipes(templates_dir: Path, id_to_name: dict,
                                category_map: dict) -> list[dict]:
    """
    Parse BlastFurnaceModeTemplate into recipe dicts for the Blast Furnace.
    Detects the Blast Furnace machine dynamically (type='BlastFurnace').
    Uses cycleTime=1 (per-second tick convention).
    Hot Air is handled via MACHINE_FLUID_MINIMUMS, not as recipe ingredient.
    """
    raw = load_yaml_templates(templates_dir, "BlastFurnaceModeTemplate")
    bots_raw = load_yaml_templates(templates_dir, "BuildableObjectTemplate")
    cat_name = category_map.get("_base_metallurgy", "Metallurgy")

    # Detect Blast Furnace machine names dynamically
    item_ids = _build_item_bot_ids(templates_dir)
    bf_machines: dict[str, float] = {}
    for ident, v in bots_raw.items():
        if v.get("type") == "BlastFurnace" and ident in item_ids:
            name = id_to_name.get(ident, "")
            if name:
                bf_machines[name] = BLAST_FURNACE_CYCLE_TIME

    if not bf_machines:
        bf_machines = {"Blast Furnace": BLAST_FURNACE_CYCLE_TIME}

    recipes = []
    for identifier, r in raw.items():
        outputs_raw = r.get("output_data_elemental") or []
        if not outputs_raw:
            continue

        primary_out = outputs_raw[0]
        primary_id = primary_out.get("identifier", "")
        primary_name = id_to_name.get(primary_id, primary_id)
        recipe_name = primary_name

        ingredients = []
        for inp in r.get("input_data") or []:
            iid = inp.get("identifier", "")
            iamt = inp.get("amount", 1)
            iname = id_to_name.get(iid, iid)
            if iname:
                ingredients.append({"item": iname, "amount": iamt, "is_elemental": False})

        outputs = []
        for out in outputs_raw:
            oid = out.get("identifier", "")
            oamt = float(out.get("amount_str", out.get("amount", 0)) or 0)
            oname = id_to_name.get(oid, oid)
            if oname:
                outputs.append({"item": oname, "amount": oamt, "chance": None,
                                 "is_elemental": True})

        # waste_gas_data is intentionally NOT an output: the Blast Furnace burns
        # it in its mandatory built-in "Flare Stack" module (gas_exhaust_1,
        # min/max 1). The alternative "Waste Gas Drain" module is a hidden
        # "[do not use]" item, so no waste gas ever leaves the furnace.
        # (Real waste gas producers list it in outputElemental_data instead.)

        recipes.append({
            "identifier": identifier,
            "name": recipe_name,
            "category_id": "_base_metallurgy",
            "category_name": cat_name,
            "rowgroup_id": "",
            "rowgroup_title": "",
            "rowgroup_sort": 0,
            "sorting_in_rowgroup": 0,
            "machines": dict(bf_machines),
            "ingredients": ingredients,
            "outputs": outputs,
            "unresolved_tags": [],
        })

    return recipes


def parse_mining_recipes(templates_dir: Path, id_to_name: dict,
                         category_map: dict) -> list[dict]:
    """
    Generate synthetic mining recipes from OreVeinTemplate data.
    Rubble items come from OreVeinTemplate → TerrainBlockType (fully dynamic).
    Mining machines detected by type field: DroneMiner and OreVeinMiner.

    cycleTime formula:
      - DroneMiner: cycleTime = droneMiner_miningSpeed_str / 60.0
      - OreVeinMiner: cycleTime = oreVeinMiner_ticksPerOre_str / 60.0
    """
    bots_raw = load_yaml_templates(templates_dir, "BuildableObjectTemplate")
    cat_name = category_map.get("_base_metallurgy", "Metallurgy")
    item_ids = _build_item_bot_ids(templates_dir)

    # Collect mining machines by type
    mining_machines: dict[str, dict] = {}  # ident → {name, cycle_time}
    for ident, v in bots_raw.items():
        if ident not in item_ids:
            continue
        name = id_to_name.get(ident, "")
        if not name:
            continue

        bot_type = v.get("type", "")
        if bot_type == "DroneMiner":
            speed_raw = v.get("droneMiner_miningSpeed_str")
            try:
                speed = float(speed_raw) if speed_raw else None
            except (ValueError, TypeError):
                speed = None
            if speed:
                mining_machines[ident] = {
                    "name": name,
                    "cycle_time": round(speed / 60.0, 6),
                    "drone": True,
                }
        elif bot_type == "OreVeinMiner":
            ticks_raw = v.get("oreVeinMiner_ticksPerOre_str")
            try:
                ticks = float(ticks_raw) if ticks_raw else None
            except (ValueError, TypeError):
                ticks = None
            if ticks:
                mining_machines[ident] = {
                    "name": name,
                    "cycle_time": round(ticks / 60.0, 6),
                }

    if not mining_machines:
        return []

    vein_machines  = {m["name"]: m["cycle_time"] for m in mining_machines.values() if not m.get("drone")}
    drone_machines = {m["name"]: m["cycle_time"] for m in mining_machines.values() if m.get("drone")}

    # Get mineable items from OreVeinTemplate → TerrainBlockType
    ore_mining_map = build_ore_mining_map(templates_dir)
    # Drone Miners only dig regular ore blocks (TerrainBlockType flags "Ore",
    # item in ore_yield_id). Telluxite exists only as a vein → Ore Vein Miner only.
    drone_items = {t.get("ore_yield_id") for t in load_yaml_templates(templates_dir, "TerrainBlockType").values()
                   if "Ore" in str(t.get("flags", "")).split("|") and t.get("ore_yield_id")}
    recipes = []

    # Every ore that exists as a vein OR as a ground ore block
    for rubble_id in sorted(set(ore_mining_map) | drone_items):
        rubble_name = id_to_name.get(rubble_id, rubble_id)
        if not rubble_name:
            continue
        machines = dict(vein_machines) if rubble_id in ore_mining_map else {}
        if rubble_id in drone_items:
            machines.update(drone_machines)
        if not machines:
            continue

        recipes.append({
            "identifier": f"synthetic_mining_{rubble_id}",
            "name": rubble_name,
            "category_id": "_base_metallurgy",
            "category_name": cat_name,
            "rowgroup_id": "",
            "rowgroup_title": "",
            "rowgroup_sort": 0,
            "sorting_in_rowgroup": 0,
            "machines": dict(machines),
            "ingredients": [],
            "outputs": [{"item": rubble_name, "amount": 1, "chance": None,
                          "is_elemental": False}],
            "unresolved_tags": [],
        })

    return recipes


def parse_boiler_recipe(templates_dir: Path, id_to_name: dict,
                        category_map: dict) -> list[dict]:
    """
    Generate Boiler (Steam) recipe from BOT boiler_* fields.
    Detects all Boiler-type BOTs dynamically.
    cycleTime=1: water=consumptionPerSecond, steam=outputPerSecond (in-game
    Boiler panel: 1,200 L/min water -> 3,600 L/min steam).
    """
    bots_raw = load_yaml_templates(templates_dir, "BuildableObjectTemplate")
    cat_name = category_map.get("_base_components", "Components")
    item_ids = _build_item_bot_ids(templates_dir)

    for ident, v in bots_raw.items():
        if v.get("type") != "Boiler":
            continue
        if ident not in item_ids:
            continue

        water_id = v.get("boiler_elementTemplateIdentifier_source", "")
        steam_id = v.get("boiler_elementTemplateIdentifier_output", "")
        consumption_raw = v.get("boiler_consumptionPerSecond_str")
        output_raw = v.get("boiler_outputPerSecond_str")

        if not (water_id and steam_id and consumption_raw and output_raw):
            continue

        name = id_to_name.get(ident, "")
        if not name:
            continue

        try:
            water_amt = float(consumption_raw)
            steam_amt = float(output_raw)
        except (ValueError, TypeError):
            continue

        water_name = id_to_name.get(water_id, water_id)
        steam_name = id_to_name.get(steam_id, steam_id)

        return [{
            "identifier": "synthetic_boiler_steam",
            "name": steam_name,
            "category_id": "_base_components",
            "category_name": cat_name,
            "rowgroup_id": "",
            "rowgroup_title": "",
            "rowgroup_sort": 0,
            "sorting_in_rowgroup": 0,
            "machines": {name: 1},
            "ingredients": [{"item": water_name, "amount": water_amt, "is_elemental": True}],
            "outputs": [{"item": steam_name, "amount": steam_amt, "chance": None,
                          "is_elemental": True}],
            "unresolved_tags": [],
        }]

    return []


def parse_resource_converter_recipes(templates_dir: Path, id_to_name: dict,
                                     category_map: dict) -> list[dict]:
    """
    Generate synthetic resource converter recipes for all ResourceConverter and
    NPP_CoolingTower type BOTs that are player-craftable (in ItemTemplate).
    throughput_per_min = amount_str × SECONDS_PER_MIN (base speed, no modules)
    """
    bots_raw = load_yaml_templates(templates_dir, "BuildableObjectTemplate")
    cat_name = category_map.get("_base_buildings", "Buildings")
    item_ids = _build_item_bot_ids(templates_dir)
    recipes = []

    for ident, v in bots_raw.items():
        bot_type = v.get("type", "")
        if bot_type not in RC_TYPES:
            continue
        if ident not in item_ids:
            continue

        machine_name = id_to_name.get(ident, "")
        if not machine_name:
            continue

        inputs_raw = v.get("resourceConverter_input_elemental") or []
        outputs_raw = v.get("resourceConverter_output_elemental") or []

        if not outputs_raw:
            continue

        ingredients = []
        for inp in inputs_raw:
            inp_id = inp.get("identifier", "")
            amt_raw = inp.get("amount_str", inp.get("amount", 0))
            inp_name = id_to_name.get(inp_id, inp_id)
            if inp_name and inp_id:
                try:
                    amt = float(amt_raw) * SECONDS_PER_MIN
                except (ValueError, TypeError):
                    amt = 0.0
                ingredients.append({"item": inp_name, "amount": amt, "is_elemental": True})

        output_list = []
        for out in outputs_raw:
            out_id = out.get("identifier", "")
            amt_raw = out.get("amount_str", out.get("amount", 0))
            out_name = id_to_name.get(out_id, out_id)
            if out_name and out_id:
                try:
                    amt = float(amt_raw) * SECONDS_PER_MIN
                except (ValueError, TypeError):
                    amt = 0.0
                output_list.append({"item": out_name, "amount": amt, "chance": None,
                                     "is_elemental": True})

        if not output_list:
            continue

        recipe_name = output_list[0]["item"]

        recipes.append({
            "identifier": f"synthetic_resource_converter_{ident}",
            "name": recipe_name,
            "category_id": "_base_buildings",
            "category_name": cat_name,
            "rowgroup_id": "",
            "rowgroup_title": "",
            "rowgroup_sort": 0,
            "sorting_in_rowgroup": 0,
            "machines": {machine_name: 60},
            "ingredients": ingredients,
            "outputs": output_list,
            "unresolved_tags": [],
            "throughput_per_min": output_list[0]["amount"],
        })

    return recipes


def parse_endless_miner_recipes(templates_dir: Path, id_to_name: dict,
                                category_map: dict) -> list[dict]:
    """
    Endless miners (type EndlessMiner: Xeno-Crystal / Xeno-Scrap Extractor)
    as raw-material recipes: 1 item every endlessMiner_ticksPerItem ticks
    (60 ticks/s) at base speed; power cores are handled as speed modules.
    """
    bots_raw = load_yaml_templates(templates_dir, "BuildableObjectTemplate")
    item_ids = _build_item_bot_ids(templates_dir)
    cat_name = category_map.get("_base_metallurgy", "Metallurgy")
    recipes = []
    for ident, v in bots_raw.items():
        if v.get("type") != "EndlessMiner" or ident not in item_ids or not id_to_name.get(ident):
            continue
        out_name = id_to_name.get(v.get("endlessMiner_outputTemplateIdentifier", ""), "")
        try:
            seconds = float(v.get("endlessMiner_ticksPerItem") or 0) / (TICKS_PER_MIN / 60)
        except (ValueError, TypeError):
            seconds = 0.0
        if not out_name or seconds <= 0:
            continue
        recipes.append({
            "identifier": f"synthetic_endless_miner_{ident}",
            "name": out_name,
            "category_id": "_base_metallurgy",
            "category_name": cat_name,
            "rowgroup_id": "",
            "rowgroup_title": "",
            "rowgroup_sort": 0,
            "sorting_in_rowgroup": 0,
            "machines": {id_to_name[ident]: round(seconds, 6)},
            "ingredients": [],
            "outputs": [{"item": out_name, "amount": 1, "chance": None, "is_elemental": False}],
            "unresolved_tags": [],
        })
    return recipes


def parse_recycler_recipes(templates_dir: Path, id_to_name: dict,
                           category_map: dict) -> list[dict]:
    """
    Recyclers (type Recycler: Scrap Recycler, Resource Separator) take items
    whose recycling_hashIdentifier matches their recycler_hashIdentifier and
    turn each into the recyclingData outputs with a chance (Xeno-Scrap ->
    65 % Advanced Machinery Parts / 35 % Electronic Components). Speed:
    recycler_itemsPerMinute input items. Outputs as expected amounts, most
    likely first; recipes whose only output is the input itself are skipped.
    The game has no recipe name for these: "<recycler>: <input>". Biomass
    recycles into Biomass and is listed in-game, so it is kept.
    """
    bots_raw = load_yaml_templates(templates_dir, "BuildableObjectTemplate")
    items_raw = load_yaml_templates(templates_dir, "ItemTemplate")
    item_ids = _build_item_bot_ids(templates_dir)
    cat_name = category_map.get("_base_components", "Components")
    recyclers = {}
    for ident, v in bots_raw.items():
        if v.get("type") == "Recycler" and ident in item_ids and id_to_name.get(ident):
            try:
                ipm = float(v.get("recycler_itemsPerMinute") or 0)
            except (ValueError, TypeError):
                ipm = 0.0
            if ipm > 0:
                recyclers[v.get("recycler_hashIdentifier", "")] = (id_to_name[ident], ipm)
    recipes = []
    for ident, v in items_raw.items():
        machine = recyclers.get(v.get("recycling_hashIdentifier") or "")
        in_name = v.get("name", "")
        if not machine or not in_name:
            continue
        outs = []
        for d in v.get("recyclingData") or []:
            try:
                chance = float(d.get("chance_str") or 0)
            except (ValueError, TypeError):
                chance = 0.0
            out_name = id_to_name.get(d.get("itemTemplateIdentifier", ""), "")
            if out_name and chance > 0:
                outs.append({"item": out_name, "amount": round(chance, 6), "chance": None, "is_elemental": False})
        outs.sort(key=lambda o: -o["amount"])
        if not outs:
            continue
        mname, ipm = machine
        recipes.append({
            "identifier": f"synthetic_recycling_{ident}",
            "name": f"{mname}: {in_name}",
            "category_id": "_base_components",
            "category_name": cat_name,
            "rowgroup_id": "",
            "rowgroup_title": "",
            "rowgroup_sort": 0,
            "sorting_in_rowgroup": 0,
            "machines": {mname: round(60 / ipm, 6)},
            "icon_identifier": v.get("icon_identifier", ""),  # the game shows the input item
            "chance_outputs": True,  # all outputs are equal products with a chance, none is "main"
            "dlc": v.get("entitlementIdentifier", "") or "",
            "ingredients": [{"item": in_name, "amount": 1, "is_elemental": False}],
            "outputs": outs,
            "unresolved_tags": [],
        })
    return recipes


def parse_npp_reactor_recipes(templates_dir: Path, id_to_name: dict,
                              category_map: dict) -> list[dict]:
    """
    Xeno Reactor (type NPP_Reactor) as a recipe, per minute at 100 % load:
      Reactor Fuel Mix (maxInputPerTick) + Depleted Reactor Compound (looped
      back from the Steam Generator, 1:1 with the output)
      → Energized Reactor Compound (maxOutputPerTick).
    Verified in-game: 43,200 L/min fuel → 180,000 L/min energized.
    """
    bots_raw = load_yaml_templates(templates_dir, "BuildableObjectTemplate")
    item_ids = _build_item_bot_ids(templates_dir)
    cat_name = category_map.get("_base_buildings", "Buildings")
    recipes = []
    for ident, v in bots_raw.items():
        if v.get("type") != "NPP_Reactor" or ident not in item_ids or not id_to_name.get(ident):
            continue
        try:
            fuel = float(v.get("nppReactor_maxInputPerTick_str") or 0) * TICKS_PER_MIN
            out  = float(v.get("nppReactor_maxOutputPerTick_str") or 0) * TICKS_PER_MIN
        except (ValueError, TypeError):
            continue
        fuel_name = id_to_name.get(v.get("nppReactor_input_elementalTemplate_identifier", ""), "")
        out_name  = id_to_name.get(v.get("nppReactor_output_elementalTemplate_identifier", ""), "")
        loop_name = id_to_name.get(v.get("nppReactor_steamGeneratorInput_elementalTemplate_identifier", ""), "")
        if not (fuel and out and fuel_name and out_name):
            continue
        ingredients = [{"item": fuel_name, "amount": fuel, "is_elemental": True}]
        if loop_name:
            ingredients.append({"item": loop_name, "amount": out, "is_elemental": True})
        recipes.append({
            "identifier": f"synthetic_npp_reactor_{ident}",
            "name": out_name,
            "category_id": "_base_buildings",
            "category_name": cat_name,
            "rowgroup_id": "",
            "rowgroup_title": "",
            "rowgroup_sort": 0,
            "sorting_in_rowgroup": 0,
            "machines": {id_to_name[ident]: 60},
            "ingredients": ingredients,
            "outputs": [{"item": out_name, "amount": out, "chance": None, "is_elemental": True}],
            "unresolved_tags": [],
        })
    return recipes


def parse_pumpjack_recipes(templates_dir: Path, id_to_name: dict,
                            category_map: dict) -> list[dict]:
    """
    Generate one synthetic recipe per ReservoirTemplate entry.
    Pumpjack machines detected by type='Pumpjack' and player-craftable.
    cycleTime=1, throughput = pumpjack_amountPerSec_str × 60 L/min
    """
    bots_raw = load_yaml_templates(templates_dir, "BuildableObjectTemplate")
    reservoirs = load_yaml_templates(templates_dir, "ReservoirTemplate")
    cat_name = category_map.get("_base_buildings", "Buildings")
    item_ids = _build_item_bot_ids(templates_dir)

    # Collect pumpjack machines
    pumpjack_machines: dict[str, float] = {}  # machine_name → cycle_time
    for ident, v in bots_raw.items():
        if v.get("type") != "Pumpjack":
            continue
        if ident not in item_ids:
            continue
        name = id_to_name.get(ident, "")
        if not name:
            continue
        amt_raw = v.get("pumpjack_amountPerSec_str")
        try:
            amt = float(amt_raw) if amt_raw else None
        except (ValueError, TypeError):
            amt = None
        if amt:
            # cycleTime=1 second, amounts are per second
            pumpjack_machines[name] = 1

    if not pumpjack_machines:
        return []

    recipes = []
    for res_id, res in reservoirs.items():
        elem_id = res.get("elementIdentifier", "")
        if not elem_id:
            continue
        elem_name = id_to_name.get(elem_id, elem_id)
        if not elem_name:
            continue

        # Find throughput from pumpjack bot
        # Use the amount_str from the first pumpjack found
        throughput = 0.0
        for ident, v in bots_raw.items():
            if v.get("type") == "Pumpjack" and ident in item_ids:
                amt_raw = v.get("pumpjack_amountPerSec_str")
                try:
                    throughput = float(amt_raw) if amt_raw else 0.0
                except (ValueError, TypeError):
                    pass
                if throughput > 0:
                    break

        recipes.append({
            "identifier": f"synthetic_pumpjack_{res_id}",
            "name": elem_name,
            "category_id": "_base_buildings",
            "category_name": cat_name,
            "rowgroup_id": "",
            "rowgroup_title": "",
            "rowgroup_sort": 0,
            "sorting_in_rowgroup": 0,
            "machines": dict(pumpjack_machines),
            "ingredients": [],
            "outputs": [{"item": elem_name, "amount": throughput, "chance": None,
                          "is_elemental": True}],
            "unresolved_tags": [],
            "throughput_per_min": throughput * 60,
        })

    return recipes


# ─────────────────────────────────────────────────────────────────────────────
# Build RECIPE_SUBGROUPS structure from row groups
# ─────────────────────────────────────────────────────────────────────────────

def build_recipe_subgroups(recipes: list[dict], subgroup_map: dict,
                           category_map: dict) -> dict:
    """
    Build RECIPE_SUBGROUPS: category_name → [{ label, rows: [[recipe_names]] }]
    grouped by rowgroup, sorted by sortingOrder.
    """
    from collections import defaultdict

    cat_rg_recipes: dict[str, dict[str, list]] = defaultdict(lambda: defaultdict(list))

    for r in recipes:
        rg_id = r.get("rowgroup_id", "")
        cat_id = r.get("category_id", "")
        if not rg_id or not cat_id:
            continue
        cat_rg_recipes[cat_id][rg_id].append(
            (r["sorting_in_rowgroup"], r["name"])
        )

    subgroups: dict[str, list] = {}
    for cat_id, rg_dict in cat_rg_recipes.items():
        cat_name = category_map.get(cat_id, cat_id)
        group_list = []
        for rg_id, recipe_tuples in rg_dict.items():
            rg_info = subgroup_map.get(rg_id, {})
            label = rg_info.get("title", rg_id)
            sort_order = rg_info.get("sortingOrder", 0)
            recipe_names = [name for _, name in sorted(recipe_tuples)]
            group_list.append((sort_order, label, recipe_names))

        group_list.sort(key=lambda x: x[0])
        subgroups[cat_name] = [
            {"label": label, "rows": [names]}
            for _, label, names in group_list
        ]

    return subgroups


# ─────────────────────────────────────────────────────────────────────────────
# Detect fluid items
# ─────────────────────────────────────────────────────────────────────────────

def detect_fluid_items(templates_dir: Path, id_to_name: dict) -> set[str]:
    """
    Returns a set of item display names for fluids/gases (transported via pipes).
    """
    fluid_ids = set()
    for ident in load_yaml_templates(templates_dir, "ElementTemplate"):
        fluid_ids.add(ident)
    for ident in load_yaml_templates(templates_dir, "LiquidTemplate"):
        fluid_ids.add(ident)

    for r in load_yaml_templates(templates_dir, "CraftingRecipe").values():
        for inp in (r.get("inputElemental_data") or []):
            iid = inp.get("identifier", "")
            if iid:
                fluid_ids.add(iid)
        for out in (r.get("outputElemental_data") or []):
            oid = out.get("identifier", "")
            if oid:
                fluid_ids.add(oid)

    return {id_to_name[fid] for fid in fluid_ids if fid in id_to_name}


# ─────────────────────────────────────────────────────────────────────────────
# JS name conversion
# ─────────────────────────────────────────────────────────────────────────────

def rename_unique_recipes_to_item(recipes: list[dict]) -> None:
    """
    The game names some recipes differently from the item they make
    ("Loader, 2nd Lane" makes "Loader (2nd Lane)", "Ceiling Light" makes
    "Ceiling Light I"). A recipe that is the only producer of its item takes the
    item's name, so recipes and items match everywhere. Recipes sharing an item
    keep their own names (Tier 1/2/3 …), they are the choice between them.
    """
    producers: dict[str, int] = {}
    for r in recipes:
        if r["outputs"]:
            producers[r["outputs"][0]["item"]] = producers.get(r["outputs"][0]["item"], 0) + 1
    taken = {r["name"] for r in recipes}
    for r in recipes:
        item = r["outputs"][0]["item"] if r["outputs"] else ""
        if item and r["name"] != item and producers[item] == 1 and item not in taken:
            print(f"  recipe renamed to its item: {r['name']!r} -> {item!r}")
            taken.add(item)
            r["name"] = item


def build_variant_groups(recipes: list[dict]) -> list[dict]:
    """
    Items with more than one recipe → a choice (Xenoferrite Plates Tier 1-3,
    Biomass from Biomass or a Seed, Advanced Machinery Parts via Scrap
    Recycler, Ore Rubble from Dirt …). Recyclers count for every product they
    can yield. Recipes that only give back their own input (Resource Separator:
    Biomass) are no choice. Order: the recipe named like the item first, then
    the recipes of the main crafting row in the game's order (Tier 1 < Tier 2),
    other rows (Barrel Recycle), recyclers last.
    Returns [{"label": item, "variants": [recipe names]}].
    """
    groups: dict[str, list[dict]] = {}
    for r in recipes:
        ins = {i["item"] for i in r.get("ingredients", [])}
        outs = [o["item"] for o in r.get("outputs", [])]
        if not outs or ins == set(outs):  # only gives back its own input
            continue
        for item in (outs if r.get("chance_outputs") else outs[:1]):
            groups.setdefault(item, []).append(r)
    out = []
    for item, rs in sorted(groups.items()):
        if len(rs) < 2:
            continue
        # the game's own order: main crafting row first, by its sorting order
        rows = [r.get("rowgroup_id") for r in rs if r.get("rowgroup_id") and not r.get("chance_outputs")]
        main_row = max(set(rows), key=rows.count) if rows else ""
        rs.sort(key=lambda r: (r["name"] != item, bool(r.get("chance_outputs")),
                               r.get("rowgroup_id") != main_row, r.get("sorting_in_rowgroup", 0), r["name"]))
        out.append({"label": item, "variants": [r["name"] for r in rs]})
    return out


def to_const_key(name: str) -> str:
    """Convert display name to JS constant key: 'Advanced Smelter' → 'ADVANCED_SMELTER'."""
    s = re.sub(r"[^\w\s]", " ", name)
    s = re.sub(r"\s+", "_", s.strip())
    s = re.sub(r"_+", "_", s)
    return s.upper().strip("_")


def format_cycle_time(ct: float) -> str:
    """Format cycle time for JS: trim trailing zeros."""
    if ct == int(ct):
        return str(int(ct))
    s = f"{ct:.6f}".rstrip("0").rstrip(".")
    return s


# ─────────────────────────────────────────────────────────────────────────────
# JS generators
# ─────────────────────────────────────────────────────────────────────────────

def generate_game_data_js(version: str, recipes: list[dict],
                          fluid_items: set[str],
                          intermediate_items: set[str],
                          bot_data: dict,
                          subgroups: dict,
                          templates_dir: Path,
                          id_to_name: dict,
                          assembly_line_composition: dict,
                          assembly_line_robots: dict,
                          fluid_sources: dict,
                          byproduct_disposal: dict,
                          machine_fluid_minimums: dict,
                          modular_buildings: dict,
                          vein_mining_fluids: dict,
                          research_bonuses: dict,
                          external_sources: dict,
                          workstation_data: dict,
                          shipping_data: dict,
                          power_data: dict | None = None) -> str:
    """Generate game-data.js content."""

    # Collect all machine names used in recipes
    all_machines: dict[str, str] = {}
    for r in recipes:
        for mname in r["machines"]:
            key = to_const_key(mname)
            all_machines[mname] = key

    # Also add Assembly Line machines
    for al_name in ["Assembly Line", "Assembly Line Start",
                    "Assembly Line Producer", "Assembly Line Painter"]:
        all_machines[al_name] = to_const_key(al_name)

    # Disposal buildings (Flare Stack, Incinerator) only appear as dissolvers in
    # BYPRODUCT_DISPOSAL, not as recipe machines, but draw power while running.
    for info in byproduct_disposal.values():
        for mname in (info["machine"], ((info.get("reprocess") or {}).get("surplus") or {}).get("machine")):
            if mname:
                all_machines[mname] = to_const_key(mname)

    sorted_machines = sorted(all_machines.items(), key=lambda x: x[1])

    # Collect all item names from recipes with deduplication
    key_to_name: dict[str, str] = {}
    for r in recipes:
        for ing in r["ingredients"]:
            n = ing["item"]
            key_to_name[to_const_key(n)] = n
        for out in r["outputs"]:
            n = out["item"]
            key_to_name[to_const_key(n)] = n
    for r in recipes:
        k = to_const_key(r["name"])
        if k not in key_to_name:
            key_to_name[k] = r["name"]
    all_items: dict[str, str] = {name: key for key, name in key_to_name.items()}
    sorted_items = sorted(all_items.items(), key=lambda x: x[1])

    # Collect categories
    cats: dict[str, str] = {}
    for r in recipes:
        cname = r["category_name"]
        if cname:
            cats[cname] = to_const_key(cname)
    sorted_cats = sorted(cats.items(), key=lambda x: x[1])

    # Build MACHINE_POWER_KW from bot_data
    machine_power: dict[str, float] = {}
    for ident, bd in bot_data.items():
        name = bd["name"]
        if name in all_machines:
            machine_power[name] = bd["power_kw"]

    # Build MACHINE_CONNECTIONS from bot_data
    machine_connections: dict[str, dict] = {}
    for ident, bd in bot_data.items():
        name = bd["name"]
        machine_connections[name] = {
            "sides": bd["loader_sides"],
            "loader_needed": bd["loader_needed"],
        }

    lines = []
    lines.append(f"const GAME_VERSION_ID = '{version}'; // muss mit dem Verzeichnisnamen übereinstimmen")
    lines.append("// ============================================================")
    lines.append("// data/game-data.js  (auto-generated by extract_game_data.py)")
    lines.append("// ============================================================")
    lines.append("")

    # M object
    lines.append("// ── Machine name constants ────────────────────────────────────")
    lines.append("const M = Object.freeze({")
    for mname, mkey in sorted_machines:
        lines.append(f'  {mkey}: "{mname}",')
    lines.append("});")
    lines.append("")

    # ASSEMBLY_LINE_COMPOSITION (dynamically computed)
    al = assembly_line_composition
    lines.append("// ── Assembly Line sub-machine composition ─────────────────────")
    lines.append("const ASSEMBLY_LINE_COMPOSITION = Object.freeze({")
    lines.append(f'  start:      {{ count: {al["start"]["count"]},  name: "{al["start"]["name"]}"    }},')
    lines.append(f'  producer:   {{ count: {al["producer"]["count"]}, name: "{al["producer"]["name"]}" }},')
    lines.append(f'  painter:    {{ count: {al["painter"]["count"]},  name: "{al["painter"]["name"]}"  }},')
    lines.append(f'  cycle_time: {al["cycle_time"]},  // seconds per complete robot')
    lines.append("});")
    lines.append("// Energy per finished robot (kJ): start + attach/weld per part + painting")
    lines.append(f"const ASSEMBLY_LINE_ENERGY_KJ = Object.freeze({json.dumps(al.get('energy_kj', {}), sort_keys=True)});")
    lines.append("// Paint per robot (every part painted, litres from the colour variants)")
    lines.append(f"const ASSEMBLY_LINE_PAINT = Object.freeze({json.dumps(al.get('paint', {}), sort_keys=True)});")
    lines.append("")

    # ASSEMBLY_LINE_ROBOT_PARTS (part counts per robot, from AssemblyLineObjectTemplate)
    lines.append("// ── Assembly Line robot part counts (canonical title → amount) ─")
    lines.append("// Derived from AssemblyLineObjectTemplate objectParts (Left+Right each = 1).")
    lines.append("const ASSEMBLY_LINE_ROBOT_PARTS = Object.freeze({")
    for robot_name, counts in sorted(assembly_line_robots.items()):
        parts_js = ", ".join(f'"{k}": {v}' for k, v in sorted(counts.items()))
        lines.append(f'  "{robot_name}": {{ {parts_js} }},')
    lines.append("});")
    lines.append("")

    # I object
    lines.append("// ── Item name constants ───────────────────────────────────────")
    lines.append("const I = Object.freeze({")
    for iname, ikey in sorted_items:
        lines.append(f'  {ikey}: "{iname}",')
    lines.append("});")
    lines.append("")

    # CAT object
    lines.append("// ── Category constants ────────────────────────────────────────")
    lines.append("const CAT = Object.freeze({")
    for cname, ckey in sorted_cats:
        lines.append(f'  {ckey}: "{cname}",')
    lines.append("});")
    lines.append("")

    # RECIPE_SUBGROUPS
    lines.append("// ── Recipe browser subcategory groupings ──────────────────────")
    lines.append("const RECIPE_SUBGROUPS = {")
    for cat_name in sorted(subgroups.keys()):
        groups = subgroups[cat_name]
        if not groups:
            continue
        lines.append(f'  "{cat_name}": [')
        for g in groups:
            label = g["label"].replace('"', '\\"')
            rows_js = json.dumps(g["rows"], ensure_ascii=False)
            lines.append(f'    {{ label: "{label}", rows: {rows_js} }},')
        lines.append("  ],")
    lines.append("};")
    lines.append("")

    # FLUID_ITEMS
    lines.append("// ── Fluid / gas items (transported via pipes, not loaders) ───")
    lines.append("const FLUID_ITEMS = new Set([")
    for fname in sorted(fluid_items):
        lines.append(f'  "{fname}",')
    lines.append("]);")
    lines.append("")

    # INTERMEDIATE_ITEMS
    lines.append("// ── Intermediate items (depth-mode 1 stop boundary) ──────────")
    lines.append("const INTERMEDIATE_ITEMS = new Set([")
    for iname in sorted(intermediate_items):
        lines.append(f'  "{iname}",')
    lines.append("]);")
    lines.append("")

    # FLUID_SOURCE_MACHINES (dynamically detected)
    lines.append("// ── Raw fluid sources ──────────────────────────────────────────")
    lines.append("const FLUID_SOURCE_MACHINES = Object.freeze({")
    for fluid_id, info in sorted(fluid_sources.items()):
        fluid_name = id_to_name.get(fluid_id, fluid_id)
        alts = json.dumps(info.get("alternatives", []))
        lines.append(f"  '{fluid_name}': {{ machine: '{info['machine']}', capacityPerMin: {info['capacityPerMin']}, alternatives: {alts} }},")
    lines.append("});")
    lines.append("")

    # BYPRODUCT_DISPOSAL (dynamically detected)
    lines.append("// ── Byproduct disposal ────────────────────────────────────────")
    lines.append("const BYPRODUCT_DISPOSAL = Object.freeze({")
    for item_name, info in sorted(byproduct_disposal.items()):
        if "reprocess" in info:
            rp = info["reprocess"]
            lines.append(f"  '{item_name}': {{")
            lines.append(f"    machine: '{info['machine']}', capacityPerMin: {info['capacityPerMin']},")
            surplus = rp.get("surplus")
            surplus_js = (f", surplus: {{ machine: '{surplus['machine']}', capacityPerMin: {surplus['capacityPerMin']} }}"
                          if surplus else "")
            lines.append(f"    reprocess: {{ recipe: '{rp['recipe']}', produces: '{rp['produces']}'{surplus_js} }},")
            lines.append("  },")
        else:
            lines.append(f"  '{item_name}': {{ machine: '{info['machine']}', capacityPerMin: {info['capacityPerMin']} }},")
    lines.append("});")
    lines.append("")

    # MACHINE_FLUID_MINIMUMS (dynamically detected)
    lines.append("// ── Minimum fluid supply per machine instance ─────────────────")
    lines.append("const MACHINE_FLUID_MINIMUMS = Object.freeze({")
    for mach_name, fluids in sorted(machine_fluid_minimums.items()):
        fluids_js = ", ".join(f"'{k}': {v}" for k, v in fluids.items())
        lines.append(f"  '{mach_name}': {{ {fluids_js} }},")
    lines.append("});")
    lines.append("")

    # VEIN_MINING_FLUIDS (dynamically detected)
    lines.append("// ── Fluid per Ore Vein Miner once a vein is depleted (app setting) ──")
    lines.append("const VEIN_MINING_FLUIDS = Object.freeze({")
    for ore, info in sorted(vein_mining_fluids.items()):
        lines.append(f"  '{ore}': {json.dumps(info)},")
    lines.append("});")
    lines.append("")

    # SHIPPING (planet <-> station) and item weights
    lines.append("// ── Shipping pads, cargo ships, conveyor speeds, item weights (kg) ──")
    lines.append(f"const SHIPPING = Object.freeze({json.dumps({k: shipping_data[k] for k in ('ships', 'pads', 'conveyors')})});")
    lines.append(f"const ITEM_WEIGHTS_KG = Object.freeze({json.dumps(shipping_data['weights'], sort_keys=True)});")
    lines.append("// Loader power per lane (1 = Loader, 2 = 2nd Lane, 3 = 3rd Lane), kW")
    lines.append(f"const LOADER_POWER_KW = Object.freeze({json.dumps(shipping_data['loaderKw'], sort_keys=True)});")
    lines.append("")

    # WORKSTATION_CATEGORIES / WORKSTATION_EFFECTS (robot bonuses per machine group)
    lines.append("// ── Workstations: machine groups and robot bonuses ─────────────")
    lines.append(f"const WORKSTATION_CATEGORIES = Object.freeze({json.dumps(workstation_data['categories'])});")
    lines.append(f"const WORKSTATION_EFFECTS = Object.freeze({json.dumps(workstation_data['effects'])});")
    lines.append("")

    # EXTERNAL_SOURCES (items delivered from the orbital station)
    lines.append("// ── Items without production, delivered from the space station ──")
    lines.append(f"const EXTERNAL_SOURCES = Object.freeze({json.dumps(external_sources)});")
    lines.append("// Gathered from the world (digging terrain, mining world objects): start of a chain")
    lines.append(f"const EXCAVATION = Object.freeze({json.dumps(shipping_data.get('excavation', {}))});")
    lines.append("// Pipe types (L/min), pipe/pipeline connections per building, pumps between them")
    lines.append(f"const FLUID_PORTS = Object.freeze({json.dumps(shipping_data.get('fluid', {}), sort_keys=True)});")
    lines.append("// Items with several recipes: the choice offered in the settings / sidebar")
    lines.append(f"const RECIPE_VARIANT_GROUPS = Object.freeze({json.dumps(shipping_data.get('variants', []))});")
    lines.append("")

    # RESEARCH_BONUSES (parsed from endless research descriptions)
    lines.append("// ── Endless research: bonus per level (parsed from descriptions) ──")
    lines.append(f"const RESEARCH_BONUSES = Object.freeze({json.dumps(research_bonuses)});")
    lines.append("")

    # MODULAR_BUILDINGS (dynamically detected)
    lines.append("// ── Modular buildings: speed per optional module ─────────────")
    lines.append("// speed = 1 + (modules - ignored) × speedPerModule; values at base speed above.")
    lines.append("const MODULAR_BUILDINGS = Object.freeze({")
    for mach_name, info in sorted(modular_buildings.items()):
        lines.append(f"  '{mach_name}': {json.dumps(info)},")
    lines.append("});")
    lines.append("")

    # MACHINE_POWER_KW
    lines.append("// ── Machine power consumption (kW) ───────────────────────────")
    lines.append("const MACHINE_POWER_KW = Object.freeze({")
    for mname, mkey in sorted_machines:
        power = machine_power.get(mname)
        if power is not None:
            power_str = str(int(power)) if power == int(power) else str(power)
            lines.append(f"  [M.{mkey}]: {power_str},")
    lines.append("});")
    lines.append("")

    # MACHINE_CONNECTIONS
    lines.append("// ── Machine connection layout ─────────────────────────────────")
    lines.append("const MACHINE_CONNECTIONS = Object.freeze({")
    for mname, mkey in sorted_machines:
        conn = machine_connections.get(mname)
        if conn:
            sides = conn["sides"]
            ln = conn["loader_needed"]
            ln_str = "true" if ln else "false"
            lines.append(f"  [M.{mkey}]: {{ sides: {sides}, loader_needed: {ln_str} }},")
    # Extra non-recipe machines
    for extra_name in sorted(set(machine_connections.keys()) - set(all_machines.keys())):
        conn = machine_connections[extra_name]
        sides = conn["sides"]
        ln = conn["loader_needed"]
        ln_str = "true" if ln else "false"
        esc = extra_name.replace('"', '\\"')
        lines.append(f'  "{esc}": {{ sides: {sides}, loader_needed: {ln_str} }},')
    lines.append("});")
    lines.append("")

    # POWER_SOURCES and POWER_FUEL_ITEMS (dynamically extracted from templates)
    if power_data:
        lines.append("// ── Power generator sources ───────────────────────────────────")
        lines.append("const POWER_SOURCES = Object.freeze([")
        for src in power_data.get("sources", []):
            src_type = src["type"]
            name_esc = src["name"].replace('"', '\\"')
            id_esc = src["id"].replace('"', '\\"')
            if src_type == "solar":
                lines.append(
                    f'  {{ id: "{id_esc}", name: "{name_esc}", type: "solar",'
                    f' power_kw: {src["power_kw"]}, power_kw_min: {src["power_kw_min"]} }},'
                )
            elif src_type == "solid_fuel":
                locked_esc = src.get("locked_fuel", "").replace('"', '\\"')
                lines.append(
                    f'  {{ id: "{id_esc}", name: "{name_esc}", type: "solid_fuel",'
                    f' power_kw: {src["power_kw"]}, efficiency: {src["efficiency"]},'
                    f' locked_fuel: "{locked_esc}" }},'
                )
            elif src_type == "steam_turbine":
                lines.append(
                    f'  {{ id: "{id_esc}", name: "{name_esc}", type: "steam_turbine",'
                    f' power_kw: {src["power_kw"]} }},'
                )
            elif src_type == "steam_boiler":
                vent_str = "true" if src["requires_vent"] else "false"
                lines.append(
                    f'  {{ id: "{id_esc}", name: "{name_esc}", type: "steam_boiler",'
                    f' steam_lit_per_sec: {src["steam_lit_per_sec"]},'
                    f' energy_kj_per_sec: {src["energy_kj_per_sec"]},'
                    f' requires_vent: {vent_str} }},'
                )
            elif src_type == "npp_turbine":
                lines.append(
                    f'  {{ id: "{id_esc}", name: "{name_esc}", type: "npp_turbine",'
                    f' power_kw: {src["power_kw"]}, efficiency: {src["efficiency"]},'
                    f' steam_lit_per_min: {src.get("steam_lit_per_min", 0)},'
                    f' turbines_per_cooling_tower: {src.get("turbines_per_cooling_tower", 0)} }},'
                )
            elif src_type == "npp_reactor":
                fuel_esc = src.get("fuel_name", "").replace('"', '\\"')
                lines.append(
                    f'  {{ id: "{id_esc}", name: "{name_esc}", type: "npp_reactor",'
                    f' fuel_name: "{fuel_esc}", fuel_lit_per_min: {src["fuel_lit_per_min"]},'
                    f' turbines_per_reactor: {src.get("turbines_per_reactor", 0)} }},'
                )
            elif src_type == "npp_cooling_tower":
                lines.append(
                    f'  {{ id: "{id_esc}", name: "{name_esc}", type: "npp_cooling_tower",'
                    f' capacity_lit_per_min: {src["capacity_lit_per_min"]} }},'
                )
        lines.append("]);")
        lines.append("")

        lines.append("// ── Power fuel items ──────────────────────────────────────────")
        lines.append("const POWER_FUEL_ITEMS = Object.freeze({")
        for fname, fdata in sorted(power_data.get("fuel_items", {}).items()):
            fname_esc = fname.replace('"', '\\"')
            mj_str = str(fdata["mj"]) if fdata["mj"] != int(fdata["mj"]) else str(int(fdata["mj"]))
            extra = ""
            if fdata["type"] == "solid":
                extra = f', burnable: {"true" if fdata.get("burnable") else "false"}'
                if fdata.get("residual"):
                    extra += f', residual: "{fdata["residual"]}", residualCount: {fdata["residualCount"]}'
            lines.append(f'  "{fname_esc}": {{ mj: {mj_str}, type: "{fdata["type"]}"{extra} }},')
        lines.append("});")
        lines.append("")

    return "\n".join(lines)


def generate_recipes_js(version: str, recipes: list[dict],
                        all_items: dict[str, str],
                        all_machines: dict[str, str],
                        all_cats: dict[str, str]) -> str:
    """Generate recipes.js content."""

    def item_ref(name: str) -> str:
        key = to_const_key(name)
        if key in all_items.values():
            for iname, ikey in all_items.items():
                if ikey == key and iname == name:
                    return f"I.{key}"
        return f'"{name}"'

    def machine_ref(name: str) -> str:
        key = to_const_key(name)
        return f"[M.{key}]"

    def cat_ref(cat_name: str) -> str:
        key = to_const_key(cat_name)
        return f"CAT.{key}"

    by_cat: dict[str, list[dict]] = {}
    for r in recipes:
        by_cat.setdefault(r["category_name"] or "Unknown", []).append(r)

    lines = []
    lines.append("const RECIPES = {")

    first_recipe = True
    for cat_name, cat_recipes in sorted(by_cat.items()):
        if not first_recipe:
            lines.append("")
        lines.append(f"  // ── {cat_name} ──────────────────────────────────────────")
        first_recipe = False

        for r in cat_recipes:
            recipe_name = r["name"]
            cat_ref_str = cat_ref(r["category_name"]) if r["category_name"] else '"Unknown"'

            if r["ingredients"]:
                ing_parts = []
                for ing in r["ingredients"]:
                    iref = item_ref(ing["item"])
                    amt = ing["amount"]
                    amt_str = str(int(amt)) if float(amt) == int(float(amt)) else str(amt)
                    ing_parts.append(f"{{ item: {iref}, amount: {amt_str} }}")
                ing_str = ", ".join(ing_parts)
            else:
                ing_str = ""

            outputs = r["outputs"]
            if len(outputs) == 0:
                out_str = "{ amount: 1 }"
            elif len(outputs) == 1 and outputs[0]["item"] == recipe_name:
                amt = outputs[0]["amount"]
                amt_str = str(int(amt)) if float(amt) == int(float(amt)) else str(amt)
                if outputs[0]["chance"]:
                    out_str = f"{{ amount: {amt_str}, chance: {outputs[0]['chance']} }}"
                else:
                    out_str = f"{{ amount: {amt_str} }}"
            else:
                out_parts = []
                for out in outputs:
                    iref = item_ref(out["item"])
                    amt = out["amount"]
                    amt_str = str(int(amt)) if float(amt) == int(float(amt)) else str(amt)
                    if out["chance"]:
                        out_parts.append(f"{{ item: {iref}, amount: {amt_str}, chance: {out['chance']} }}")
                    else:
                        out_parts.append(f"{{ item: {iref}, amount: {amt_str} }}")
                out_str = "[" + ", ".join(out_parts) + "]"

            mach_parts = []
            for mname, cycle_time in sorted(r["machines"].items(), key=lambda x: x[1]):
                mref = machine_ref(mname)
                ct_str = format_cycle_time(cycle_time)
                mach_parts.append(f"{mref}: {{ cycleTime: {ct_str} }}")

            lines.append(f'  "{recipe_name}": {{')
            lines.append(f"    category: {cat_ref_str},")
            if r["ingredients"]:
                lines.append(f"    ingredients: [{ing_str}],")
            else:
                lines.append("    ingredients: [],")
            lines.append(f"    output: {out_str},")
            if r.get("chance_outputs"):
                lines.append("    chanceOutputs: true,")
            if r.get("dlc"):
                lines.append(f'    dlc: "{r["dlc"]}",')
            lines.append("    machines: {")
            for mpart in mach_parts:
                lines.append(f"      {mpart},")
            lines.append("    },")
            lines.append("  },")

    lines.append("};")
    return "\n".join(lines)


def generate_game_data_json(version: str, recipes: list[dict],
                            bot_data: dict, id_to_name: dict,
                            fluid_items: set[str],
                            intermediate_items: set[str],
                            category_map: dict,
                            subgroup_map: dict,
                            templates_dir: Path,
                            icon_map: dict) -> dict:
    """Generate comprehensive game-data.json structure."""

    recipes_json = {}
    for r in recipes:
        rec_id = r["identifier"]
        recipes_json[rec_id] = {
            "name": r["name"],
            "category_id": r["category_id"],
            "subgroup_id": r.get("rowgroup_id", ""),
            "time_ms": 0,
            "inputs": [{"id": ing["item"], "amount": ing["amount"]}
                       for ing in r["ingredients"]],
            "outputs": [{"id": out["item"], "amount": out["amount"]}
                        for out in r["outputs"]],
            "machines": r["machines"],
        }

    all_item_names: set[str] = set()
    for r in recipes:
        for ing in r["ingredients"]:
            all_item_names.add(ing["item"])
        for out in r["outputs"]:
            all_item_names.add(out["item"])
        all_item_names.add(r["name"])

    name_to_id: dict[str, str] = {v: k for k, v in id_to_name.items()}

    items_json = {}
    for item_name in sorted(all_item_names):
        item_id = name_to_id.get(item_name, "")
        icon_id = ""
        icon_path = ""
        if item_id and icon_map:
            icon_id = item_id
            icon_path = icon_map.get(item_id, "")
        items_json[item_name] = {
            "name": item_name,
            "icon_id": icon_id,
            "icon_path": icon_path,
            "is_fluid": item_name in fluid_items,
            "is_intermediate": item_name in intermediate_items,
        }

    machines_json = {}
    for ident, bd in bot_data.items():
        machines_json[ident] = {
            "name": bd["name"],
            "power_kw": bd["power_kw"],
            "loader_sides": bd["loader_sides"],
            "loader_needed": bd["loader_needed"],
        }

    categories_json = {}
    for cat_id, cat_name in category_map.items():
        categories_json[cat_id] = {"name": cat_name}

    subgroups_json = {}
    for sg_id, sg_info in subgroup_map.items():
        subgroups_json[sg_id] = {
            "name": sg_info["title"],
            "category_id": sg_info["category_id"],
            "sort": sg_info["sortingOrder"],
            "recipe_ids": [],
        }
    for r in recipes:
        rg_id = r.get("rowgroup_id", "")
        if rg_id and rg_id in subgroups_json:
            subgroups_json[rg_id]["recipe_ids"].append(r["identifier"])

    return {
        "version": version,
        "recipes": recipes_json,
        "items": items_json,
        "machines": machines_json,
        "categories": categories_json,
        "subgroups": subgroups_json,
    }


def generate_icons_js(version: str, icon_map: dict,
                      id_to_name: dict, id_to_icon: dict,
                      recipes: list | None = None) -> str:
    """Generate icons.js with icon path maps."""

    name_to_path: dict[str, str] = {}

    # From ItemTemplate: item name → icon
    for ident, icon_id in id_to_icon.items():
        name = id_to_name.get(ident, "")
        if name and icon_id in icon_map:
            name_to_path[name] = icon_map[icon_id]

    # From recipes: recipe name → recipe icon_identifier
    # Covers recipes like "Cement (Slag Reprocessing)", "Olumite Refining: X"
    # that have their own icon_identifier separate from the output item's icon.
    if recipes:
        for r in recipes:
            recipe_name = r.get("name", "")
            icon_id = r.get("icon_identifier", "")
            if recipe_name and icon_id and icon_id in icon_map:
                if recipe_name not in name_to_path:
                    name_to_path[recipe_name] = icon_map[icon_id]

    # Static aliases for virtual composite machines that have no single icon
    # "Assembly Line" is a composite (Start+Producer+Painter) — use Producer icon
    static_aliases: dict[str, str] = {}
    if "Assembly Line Producer" in name_to_path:
        static_aliases["Assembly Line"] = "Assembly Line Producer"

    # Build aliases: recipe names that have no icon_identifier → fall back to output item name
    aliases: dict[str, str] = {**static_aliases}
    if recipes:
        for r in recipes:
            recipe_name = r.get("name", "")
            if not recipe_name or recipe_name in name_to_path:
                continue
            # Try: use the primary output item's name as alias
            outputs = r.get("outputs", [])
            if outputs:
                out_name = outputs[0].get("item", "")
                if out_name and out_name in name_to_path:
                    aliases[recipe_name] = out_name

    lines = []
    lines.append("// ── Icon path maps (auto-generated by extract_game_data.py) ──")
    lines.append("")
    lines.append("const ICON_ALIASES = {")
    for alias, target in sorted(aliases.items()):
        esc_alias = alias.replace('"', '\\"')
        esc_target = target.replace('"', '\\"')
        lines.append(f'  "{esc_alias}": "{esc_target}",')
    lines.append("};")
    lines.append("")
    lines.append("function getIcon(name, size = 28, isBot = false) {")
    lines.append("  const allIcons = Object.assign({}, ITEM_ICONS, BUILDING_ICONS);")
    lines.append("  const resolve = (n) => allIcons[n];")
    lines.append("  const b64 = resolve(name) || (ICON_ALIASES[name] ? resolve(ICON_ALIASES[name]) : null);")
    lines.append("  if (b64)")
    lines.append('    return `<img src="${b64}" style="width:${size}px;height:${size}px;flex-shrink:0;border-radius:3px;object-fit:cover;" title="${name}">`; ')
    lines.append('  return `<div style="width:${size}px;height:${size}px;background:rgba(255,255,255,0.08);border-radius:6px;border:1px solid rgba(255,255,255,0.12);flex-shrink:0" title="${name}"></div>`;')
    lines.append("}")
    lines.append("")
    lines.append("const ITEM_ICONS = {")
    for name, path in sorted(name_to_path.items()):
        esc = name.replace('"', '\\"')
        lines.append(f'  "{esc}": "{path}",')
    lines.append("};")
    lines.append("")
    lines.append("const BUILDING_ICONS = {};")

    return "\n".join(lines)


# ─────────────────────────────────────────────────────────────────────────────
# Icon extraction
# ─────────────────────────────────────────────────────────────────────────────

def extract_icons(bundle_path: Path, out_dir: Path, target_size: int = 512) -> dict:
    """Extract all _512 sprites from the AssetBundle as PNGs. Returns icon_id → filename."""
    try:
        import UnityPy
    except ImportError:
        print("ERROR: UnityPy not installed. Run: pip3 install --user UnityPy", file=sys.stderr)
        return {}

    print(f"Loading AssetBundle: {bundle_path}")
    env = UnityPy.load(str(bundle_path))
    out_dir.mkdir(parents=True, exist_ok=True)

    icon_map = {}
    count = 0
    skipped = 0

    for obj in env.objects:
        if obj.type.name != "Sprite":
            continue
        data = obj.read()
        sprite_name = data.m_Name
        if not sprite_name.endswith("_512"):
            continue

        icon_id = sprite_name[:-4]
        filename = f"{icon_id}.png"
        out_path = out_dir / filename

        if out_path.exists():
            icon_map[icon_id] = filename
            skipped += 1
            continue

        try:
            img = data.image
            if target_size and (img.width != target_size or img.height != target_size):
                img = img.resize((target_size, target_size))
            img.save(str(out_path))
            icon_map[icon_id] = filename
            count += 1
        except Exception as e:
            print(f"  WARNING: Could not extract {sprite_name}: {e}", file=sys.stderr)

    print(f"  Extracted {count} new icons, {skipped} already existed ({len(icon_map)} total)")
    return icon_map


# ─────────────────────────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────────────────────────

def read_game_version(game_path: Path) -> str:
    version_file = game_path / "version.txt"
    if not version_file.exists():
        return "unknown"
    return version_file.read_text(encoding="utf-8").strip()


def main():
    parser = argparse.ArgumentParser(description="Extract Foundry game data")
    parser.add_argument("--game-path", default=GAME_PATH_DEFAULT)
    parser.add_argument("--icons-only", action="store_true")
    parser.add_argument("--no-icons", action="store_true")
    parser.add_argument("--no-js", action="store_true",
                        help="Skip JS file generation (only JSON)")
    parser.add_argument("--icon-size", type=int, default=512,
                        help="Icon size in px (default: 512, use 0 for original)")
    args = parser.parse_args()

    game_path = Path(args.game_path)
    if not game_path.exists():
        print(f"ERROR: Game path not found: {game_path}", file=sys.stderr)
        sys.exit(1)

    version = read_game_version(game_path)
    version_tag = f"v{version}"
    print(f"Game version: {version_tag}")

    templates_dir = game_path / "foundry_Data" / "StreamingAssets" / "Templates"
    bundle_path   = game_path / "foundry_Data" / "StreamingAssets" / "AssetBundles" / "foundry_main_bundle"
    out_dir   = SCRIPT_DIR / "data" / "versions" / version_tag
    icons_dir = SCRIPT_DIR / "icons" / version_tag
    out_dir.mkdir(parents=True, exist_ok=True)

    # ── Icons ─────────────────────────────────────────────────────────────────
    icon_map = {}
    if not args.no_icons:
        if not bundle_path.exists():
            print(f"WARNING: AssetBundle not found: {bundle_path}", file=sys.stderr)
        else:
            icon_map = extract_icons(bundle_path, icons_dir, target_size=args.icon_size)
            icon_map_relative = {k: f"icons/{version_tag}/{v}" for k, v in icon_map.items()}
            with open(out_dir / "icon_map.json", "w", encoding="utf-8") as f:
                json.dump(icon_map_relative, f, indent=2, ensure_ascii=False)
            print(f"  Wrote icon_map.json ({len(icon_map_relative)} entries)")
    else:
        # Load existing icon_map.json so icons.js can still be regenerated
        icon_map_json = out_dir / "icon_map.json"
        if icon_map_json.exists():
            with open(icon_map_json, encoding="utf-8") as f:
                raw = json.load(f)
            # icon_map uses relative paths; strip the version prefix for internal use
            icon_map = {k: Path(v).name for k, v in raw.items()}

    if args.icons_only:
        print("Done (icons only).")
        return

    # ── Build lookup tables ───────────────────────────────────────────────────
    print("Building lookup tables...")
    id_to_name       = build_id_to_name(templates_dir)
    id_to_icon       = build_id_to_icon(templates_dir)
    tag_machines     = build_tag_to_machines(templates_dir, id_to_name)
    category_map     = build_category_map(templates_dir)
    subgroup_map     = build_subgroup_map(templates_dir)
    fluid_items      = detect_fluid_items(templates_dir, id_to_name)
    intermediate_items = build_intermediate_items(templates_dir, id_to_name)
    bot_data         = build_bot_data(templates_dir, id_to_name)
    bots_raw         = load_yaml_templates(templates_dir, "BuildableObjectTemplate")

    # Dynamic detections
    assembly_line_composition = build_assembly_line_composition(templates_dir)
    assembly_line_composition["energy_kj"] = build_assembly_line_energy(templates_dir)
    assembly_line_composition["paint"] = build_assembly_line_paint(templates_dir, id_to_name)
    assembly_line_robots      = build_assembly_line_robots(templates_dir, id_to_name)
    fluid_sources = detect_fluid_sources(templates_dir, bots_raw, id_to_name)
    machine_fluid_minimums = detect_machine_fluid_minimums(bots_raw, id_to_name)
    modular_buildings = detect_modular_buildings(bots_raw, id_to_name, _build_item_bot_ids(templates_dir))
    power_data = extract_power_data(templates_dir, id_to_name)

    print(f"  {len(id_to_name)} named identifiers, {len(tag_machines)} production tags, "
          f"{len(fluid_items)} fluid items, {len(intermediate_items)} intermediate items, "
          f"{len(bot_data)} machines with data")
    print(f"  Assembly line: {assembly_line_composition['producer']['count']} producer stations")
    print(f"  Fluid sources: {len(fluid_sources)}")
    print(f"  Machine fluid minimums: {len(machine_fluid_minimums)} machines")
    print(f"  Modular buildings with speed modules: {len(modular_buildings)}")
    print(f"  Power sources: {len(power_data['sources'])}, fuel items: {len(power_data['fuel_items'])}")

    # ── Parse recipes ─────────────────────────────────────────────────────────
    print("Parsing recipes...")
    recipes = parse_recipes(templates_dir, id_to_name, tag_machines, category_map,
                             subgroup_map)
    bf_recipes     = parse_blast_furnace_recipes(templates_dir, id_to_name, category_map)
    mining_recipes = parse_mining_recipes(templates_dir, id_to_name, category_map)
    boiler_recipes = parse_boiler_recipe(templates_dir, id_to_name, category_map)
    rc_recipes     = parse_resource_converter_recipes(templates_dir, id_to_name, category_map)
    pj_recipes     = parse_pumpjack_recipes(templates_dir, id_to_name, category_map)
    npp_recipes    = parse_npp_reactor_recipes(templates_dir, id_to_name, category_map)
    endless_recipes = parse_endless_miner_recipes(templates_dir, id_to_name, category_map)
    recycler_recipes = parse_recycler_recipes(templates_dir, id_to_name, category_map)

    recipes.extend(bf_recipes)
    recipes.extend(mining_recipes)
    recipes.extend(boiler_recipes)
    recipes.extend(rc_recipes)
    recipes.extend(pj_recipes)
    recipes.extend(npp_recipes)
    recipes.extend(endless_recipes)
    recipes.extend(recycler_recipes)
    rename_unique_recipes_to_item(recipes)

    # Byproduct disposal (needs complete recipe list)
    byproduct_disposal = detect_byproducts_and_disposal(templates_dir, recipes, id_to_name)
    external_sources = detect_external_sources(templates_dir, recipes, fluid_sources, id_to_name)
    shipping_excavation = detect_excavation(templates_dir, bots_raw, id_to_name)
    workstation_data = detect_workstation_data(templates_dir, id_to_name)
    shipping_data = detect_shipping_data(templates_dir, id_to_name)
    shipping_data["excavation"] = shipping_excavation  # rides along to the JS writer
    shipping_data["fluid"] = detect_fluid_ports(templates_dir, bots_raw, id_to_name)
    shipping_data["variants"] = build_variant_groups(recipes)
    vein_mining_fluids = detect_vein_mining_fluids(templates_dir, bots_raw, id_to_name)
    research_bonuses = detect_research_bonuses(templates_dir, bots_raw, id_to_name)
    # A vein mining fluid is consumed (by miners), so it is no byproduct to dispose of
    for info in vein_mining_fluids.values():
        byproduct_disposal.pop(info["fluid"], None)

    recipes_with_todo = [r for r in recipes if r["unresolved_tags"]]
    print(f"  {len(recipes)} recipes parsed "
          f"({len(bf_recipes)} blast furnace, {len(mining_recipes)} mining, "
          f"{len(boiler_recipes)} boiler, {len(rc_recipes)} resource converter, "
          f"{len(pj_recipes)} pumpjack), "
          f"{len(recipes_with_todo)} with unresolved machine tags")
    print(f"  Byproducts detected: {len(byproduct_disposal)}")

    # ── Build subgroups for game-data.js ──────────────────────────────────────
    subgroups = build_recipe_subgroups(recipes, subgroup_map, category_map)

    # ── Write game-data.json ──────────────────────────────────────────────────
    print("Writing game-data.json...")
    icon_map_relative = {k: f"icons/{version_tag}/{v}" for k, v in icon_map.items()}
    gd_json = generate_game_data_json(
        version_tag, recipes, bot_data, id_to_name,
        fluid_items, intermediate_items, category_map, subgroup_map,
        templates_dir, icon_map_relative)
    gd_json_path = out_dir / "game-data.json"
    with open(gd_json_path, "w", encoding="utf-8") as f:
        json.dump(gd_json, f, indent=2, ensure_ascii=False)
    print(f"  Wrote {gd_json_path}")

    if args.no_js:
        print("Done (no JS generated).")
        return

    # ── Build constant lookup sets ────────────────────────────────────────────
    _key_to_name: dict[str, str] = {}
    all_machines: dict[str, str] = {}
    all_cats: dict[str, str] = {}
    for r in recipes:
        for ing in r["ingredients"]:
            n = ing["item"]; _key_to_name[to_const_key(n)] = n
        for out in r["outputs"]:
            n = out["item"]; _key_to_name[to_const_key(n)] = n
        for mname in r["machines"]:
            all_machines[mname] = to_const_key(mname)
        if r["category_name"]:
            all_cats[r["category_name"]] = to_const_key(r["category_name"])
    for r in recipes:
        k = to_const_key(r["name"])
        if k not in _key_to_name:
            _key_to_name[k] = r["name"]
    all_items: dict[str, str] = {name: key for key, name in _key_to_name.items()}

    # ── Generate game-data.js ─────────────────────────────────────────────────
    print("Generating game-data.js...")
    game_data_content = generate_game_data_js(
        version_tag, recipes, fluid_items, intermediate_items,
        bot_data, subgroups, templates_dir, id_to_name,
        assembly_line_composition, assembly_line_robots, fluid_sources,
        byproduct_disposal, machine_fluid_minimums, modular_buildings,
        vein_mining_fluids, research_bonuses, external_sources, workstation_data, shipping_data, power_data)
    game_data_path = out_dir / "game-data.js"
    game_data_path.write_text(game_data_content, encoding="utf-8")
    print(f"  Wrote {game_data_path}")

    # ── Generate recipes.js ───────────────────────────────────────────────────
    print("Generating recipes.js...")
    recipes_content = generate_recipes_js(
        version_tag, recipes, all_items, all_machines, all_cats)
    recipes_path = out_dir / "recipes.js"
    recipes_path.write_text(recipes_content, encoding="utf-8")
    print(f"  Wrote {recipes_path}")

    # ── Generate icons.js ─────────────────────────────────────────────────────
    if icon_map:
        print("Generating icons.js...")
        icon_map_versioned = {k: f"icons/{version_tag}/{v}" for k, v in icon_map.items()}
        icons_content = generate_icons_js(version_tag, icon_map_versioned, id_to_name, id_to_icon, recipes)
        icons_js_path = out_dir / "icons.js"
        icons_js_path.write_text(icons_content, encoding="utf-8")
        print(f"  Wrote {icons_js_path}")

    print(f"\nDone. All files in data/versions/{version_tag}/")

    # Verify zero TODO comments in generated game-data.js
    gd_content = game_data_path.read_text(encoding="utf-8")
    todo_count = gd_content.count("TODO")
    if todo_count == 0:
        print("  game-data.js: zero TODO comments ✓")
    else:
        print(f"  WARNING: game-data.js still has {todo_count} TODO comments")

    if recipes_with_todo:
        print(f"\nNOTE: {len(recipes_with_todo)} recipes have unresolved machine tags:")
        for r in recipes_with_todo[:10]:
            print(f"  '{r['name']}' — tags: {r['unresolved_tags']}")
        if len(recipes_with_todo) > 10:
            print(f"  ... and {len(recipes_with_todo)-10} more")


if __name__ == "__main__":
    main()