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

# ── Machines to exclude from production machine lists ─────────────────────────
NON_PRODUCTION_BOTS = {
    '_base_construction_drone_port_i',
    '_base_construction_warehouse_i',
    '_base_door_i', '_base_door_ii', '_base_door_iii', '_base_door_iii_station',
    '_base_emergency_beacon',
    '_base_exploration_analyzer',
    '_base_quarry_building_i',
    '_base_space_station_prop_hangar',
    '_base_space_station_terminal',
    '_base_transport_drone_port_i',
    # Pump-variants with internal identifiers (not player-craftable items)
    '_base_pump_pipes_i_pgm',
    '_base_pump_pipe_to_pipeline_i_pgm',
    '_base_pump_pipelines_i_pgm',
    '_base_pump_pipeline_to_pipe_i_pgm',
}

# ── Recipe tags that don't match any BOT but have known machines ──────────────
MANUAL_TAG_MACHINES = {
    # tag → [(machine_display_name, effective_modifier)]
    'boiler': [('Boiler', 1.0)],
    'character': [('Character', 1.0)],
}

# ── Recipe tags to skip entirely (game systems without production relevance) ──
SKIP_TAGS = {'base_station', 'geothermal_generator', 'npp_fuel_mixer', 'heavy_caster'}

# ── Blast Furnace: cycleTime convention ───────────────────────────────────────
BLAST_FURNACE_CYCLE_TIME = 1

# ── Ore rubble items mined by drone miners / ore vein miner ───────────────────
# Maps rubble item name → set of machine names that can mine it
RUBBLE_ITEMS = [
    '_base_rubble_xenoferrite',
    '_base_rubble_ignium',
    '_base_rubble_technum',
    '_base_rubble_telluxite',
]
# Drone Miner I/II mine all 4 rubble types (confirmed from game data)
DRONE_MINER_BOTS = {'_base_drone_miner_i', '_base_drone_miner_ii'}
# Ore Vein Miner mines all 4 rubble types
ORE_VEIN_MINER_BOT = '_base_ore_vein_miner_i'

# ── Resource Converter BOTs that matter for the calculator ────────────────────
# (air_intake and hot_air_stove base)
RESOURCE_CONVERTER_BOTS = {
    '_base_air_intake_1': 'Air Intake Base',
    '_base_hot_air_stove_base_energy_1': 'Hot Air Stove Base',
}

# ── MACHINE_FLUID_MINIMUMS hardcoded (unit unclear from raw data) ──────────────
# Blast Furnace always needs 324,000 L/min Hot Air per furnace.
MACHINE_FLUID_MINIMUMS_STATIC = {
    'Blast Furnace': {'Hot Air': 324000},
}

# ── BYPRODUCT_DISPOSAL hardcoded ──────────────────────────────────────────────
BYPRODUCT_DISPOSAL_STATIC = {
    'Waste Gas': {'machine': 'Flare Stack', 'capacityPerMin': 3000},
    'Blast Furnace Slag': {
        'machine': 'Flare Stack', 'capacityPerMin': 3000,
        'reprocess': {'recipe': 'Cement (Slag Reprocessing)', 'produces': 'Cement'},
    },
}

# ── FLUID_SOURCE_MACHINES hardcoded ───────────────────────────────────────────
FLUID_SOURCE_MACHINES_STATIC = {
    'water': {'machine': 'Pipe Intake', 'capacityPerMin': 30000},
}

# ── Assembly Line composition ─────────────────────────────────────────────────
ASSEMBLY_LINE_COMPOSITION_STATIC = {
    'start':    {'count': 1,  'name': 'Assembly Line Start'},
    'producer': {'count': 10, 'name': 'Assembly Line Producer'},
    'painter':  {'count': 1,  'name': 'Assembly Line Painter'},
}

# ── Machines that run on non-electrical energy (power_kw = 0) ─────────────────
ZERO_POWER_MACHINE_NAMES = {
    'Lava-Smelter I', 'Lava-Smelter II',  # lava heat
    'Boiler',                              # fuel
    'Blast Furnace',                       # hot air
}


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
    """Returns identifier → human-readable name from Item, Element, Liquid templates."""
    id_to_name = {}
    for ttype in ["ItemTemplate", "ElementTemplate", "LiquidTemplate"]:
        for ident, v in load_yaml_templates(templates_dir, ttype).items():
            name = v.get("name", "")
            if name and ident not in id_to_name:
                id_to_name[ident] = name
    # Add BOT nameOverride names for resource-converter machines
    for bot_ident, machine_name in RESOURCE_CONVERTER_BOTS.items():
        if bot_ident not in id_to_name:
            id_to_name[bot_ident] = machine_name
    return id_to_name


def build_id_to_icon(templates_dir: Path) -> dict:
    """Returns identifier → icon_identifier from ItemTemplate only."""
    result = {}
    for ident, v in load_yaml_templates(templates_dir, "ItemTemplate").items():
        icon = v.get("icon_identifier", "")
        if icon:
            result[ident] = icon
    return result


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
    player-relevant BOTs.
    """
    bots_raw = load_yaml_templates(templates_dir, "BuildableObjectTemplate")
    bot_data = {}

    for ident, v in bots_raw.items():
        if ident in NON_PRODUCTION_BOTS:
            continue

        # Get display name: prefer item template, fallback to nameOverride
        name = id_to_name.get(ident, "")
        if not name and v.get("hasNameOverride"):
            name = v.get("nameOverride", "")
        if not name:
            continue  # not player-visible

        power_raw = v.get("energyConsumptionKW_str")
        try:
            power_kw = float(power_raw) if power_raw else 0.0
        except (ValueError, TypeError):
            power_kw = 0.0

        # Override power for zero-power machines (lava, fuel-based, etc.)
        if name in ZERO_POWER_MACHINE_NAMES:
            power_kw = 0.0

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

    Priority rule:
      1. If any machine has tag as its autoProducer_recipeType_tag → use ONLY those.
      2. If NO auto match → fall back to machines with the tag in producer_recipeType_tags.
    """
    auto_map: dict[str, dict[str, float]] = {}
    prod_map: dict[str, dict[str, float]] = {}

    bots = load_yaml_templates(templates_dir, "BuildableObjectTemplate")
    for ident, v in bots.items():
        if ident in NON_PRODUCTION_BOTS:
            continue
        machine_name = id_to_name.get(ident, "")
        if not machine_name:
            continue

        auto_tag = v.get("autoProducer_recipeType_tag") or ""
        auto_mod = v.get("autoProducer_recipeTimeModifier_str")
        prod_tags = v.get("producer_recipeType_tags") or []
        prod_mod = v.get("producer_recipeTimeModifier_str")

        try:
            auto_mod = float(auto_mod) if auto_mod else None
            prod_mod = float(prod_mod) if prod_mod else 1.0
        except (ValueError, TypeError):
            auto_mod = None
            prod_mod = 1.0

        if auto_tag and auto_mod is not None:
            auto_map.setdefault(auto_tag, {})[machine_name] = auto_mod

        for tag in prod_tags:
            prod_map.setdefault(tag, {})[machine_name] = prod_mod

    tag_machines: dict[str, dict[str, float]] = {}
    all_tags = set(auto_map) | set(prod_map)
    for tag in all_tags:
        if tag in auto_map:
            tag_machines[tag] = auto_map[tag]
        else:
            tag_machines[tag] = prod_map[tag]

    # Add manual tag→machine mappings
    for tag, machines in MANUAL_TAG_MACHINES.items():
        tag_machines.setdefault(tag, {})
        for name, mod in machines:
            tag_machines[tag].setdefault(name, mod)

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
# Parse recipes
# ─────────────────────────────────────────────────────────────────────────────

def parse_recipes(templates_dir: Path, id_to_name: dict,
                  tag_to_machines: dict, category_map: dict,
                  subgroup_map: dict) -> list[dict]:
    """
    Parse all CraftingRecipe YAMLs into structured recipe dicts.
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
            if tag in SKIP_TAGS:
                continue
            if tag == "character":
                machines["Character"] = round(time_ms / 1000, 6)
                continue
            tag_mach = tag_to_machines.get(tag, [])
            if not tag_mach:
                has_unresolved_tags.append(tag)
                continue
            for mname, mod in tag_mach:
                if mname not in machines:
                    cycle_time = time_ms / 1000 / max(mod, 0.001)
                    machines[mname] = round(cycle_time, 6)

        if not machines and not has_unresolved_tags:
            continue

        # Resolve input items (solid + elemental)
        ingredients = []
        for inp in r.get("input_data") or []:
            iid = inp.get("identifier", "")
            iamt = inp.get("amount", 1)
            iname = id_to_name.get(iid, iid)
            if iname:
                ingredients.append({"item": iname, "amount": iamt})

        for inp in r.get("inputElemental_data") or []:
            iid = inp.get("identifier", "")
            iamt = inp.get("amount") or inp.get("amount_str", 0)
            iname = id_to_name.get(iid, iid)
            if iname and iid:
                ingredients.append({"item": iname, "amount": float(iamt) if iamt else 0})

        # Resolve output items (solid + elemental)
        outputs = []
        for out in r.get("output_data") or []:
            oid = out.get("identifier", "")
            oamt = out.get("amount", 1)
            opct = float(out.get("percentage_str", 1) or 1)
            oname = id_to_name.get(oid, oid)
            if oname:
                outputs.append({"item": oname, "amount": oamt,
                                 "chance": opct if opct < 1.0 else None})

        for out in r.get("outputElemental_data") or []:
            oid = out.get("identifier", "")
            oamt = out.get("amount") or out.get("amount_str", 0)
            oname = id_to_name.get(oid, oid)
            if oname and oid:
                outputs.append({"item": oname, "amount": float(oamt) if oamt else 0,
                                 "chance": None})

        recipes.append({
            "identifier": identifier,
            "name": name,
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
        })

    return recipes


def parse_blast_furnace_recipes(templates_dir: Path, id_to_name: dict,
                                category_map: dict) -> list[dict]:
    """
    Parse BlastFurnaceModeTemplate into recipe dicts for the Blast Furnace.
    Uses cycleTime=1 (per-second tick convention).
    Hot Air is handled via MACHINE_FLUID_MINIMUMS, not as recipe ingredient.
    """
    raw = load_yaml_templates(templates_dir, "BlastFurnaceModeTemplate")
    recipes = []
    cat_name = category_map.get("_base_metallurgy", "Metallurgy")

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
                ingredients.append({"item": iname, "amount": iamt})

        outputs = []
        for out in outputs_raw:
            oid = out.get("identifier", "")
            oamt = float(out.get("amount_str", out.get("amount", 0)) or 0)
            oname = id_to_name.get(oid, oid)
            if oname:
                outputs.append({"item": oname, "amount": oamt, "chance": None})

        waste = r.get("waste_gas_data") or {}
        if waste.get("identifier"):
            wname = id_to_name.get(waste["identifier"], waste["identifier"])
            wamt = float(waste.get("amount_str", waste.get("amount", 0)) or 0)
            if wname and wamt:
                outputs.append({"item": wname, "amount": wamt, "chance": None})

        recipes.append({
            "identifier": identifier,
            "name": recipe_name,
            "category_id": "_base_metallurgy",
            "category_name": cat_name,
            "rowgroup_id": "",
            "rowgroup_title": "",
            "rowgroup_sort": 0,
            "sorting_in_rowgroup": 0,
            "machines": {"Blast Furnace": BLAST_FURNACE_CYCLE_TIME},
            "ingredients": ingredients,
            "outputs": outputs,
            "unresolved_tags": [],
        })

    return recipes


def parse_mining_recipes(templates_dir: Path, id_to_name: dict,
                         category_map: dict) -> list[dict]:
    """
    Generate synthetic mining recipes for drone miners, ore vein miner.
    cycleTime formula:
      - Drone Miner: cycleTime = miningSpeed_str / 60.0  (speed=60 → 1s → 60/min)
      - Ore Vein Miner: cycleTime = ticksPerOre_str / 60.0  (22.5 → 0.375s → 160/min)
    """
    bots_raw = load_yaml_templates(templates_dir, "BuildableObjectTemplate")
    cat_name = category_map.get("_base_metallurgy", "Metallurgy")
    recipes = []

    # Collect drone miners and ore vein miner data
    mining_machines: dict[str, dict] = {}  # ident → {name, cycleTime}

    for ident, v in bots_raw.items():
        name = id_to_name.get(ident, "")
        if not name:
            continue

        if ident in DRONE_MINER_BOTS:
            speed_raw = v.get("droneMiner_miningSpeed_str")
            try:
                speed = float(speed_raw) if speed_raw else None
            except (ValueError, TypeError):
                speed = None
            if speed:
                cycle_time = round(speed / 60.0, 6)
                mining_machines[ident] = {"name": name, "cycle_time": cycle_time,
                                          "type": "drone"}

        elif ident == ORE_VEIN_MINER_BOT:
            ticks_raw = v.get("oreVeinMiner_ticksPerOre_str")
            try:
                ticks = float(ticks_raw) if ticks_raw else None
            except (ValueError, TypeError):
                ticks = None
            if ticks:
                cycle_time = round(ticks / 60.0, 6)
                mining_machines[ident] = {"name": name, "cycle_time": cycle_time,
                                          "type": "orevein"}

    # Generate one recipe per rubble ore type
    for rubble_id in RUBBLE_ITEMS:
        rubble_name = id_to_name.get(rubble_id, rubble_id)
        if not rubble_name:
            continue

        machines = {}
        for ident, mdata in mining_machines.items():
            machines[mdata["name"]] = mdata["cycle_time"]

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
            "machines": machines,
            "ingredients": [],
            "outputs": [{"item": rubble_name, "amount": 1, "chance": None}],
            "unresolved_tags": [],
        })

    return recipes


def parse_boiler_recipe(templates_dir: Path, id_to_name: dict,
                        category_map: dict) -> list[dict]:
    """
    Generate Boiler (Steam) recipe from BOT boiler_* fields.
    cycleTime=60, water=consumptionPerSecond, steam=outputPerSecond.
    """
    bots_raw = load_yaml_templates(templates_dir, "BuildableObjectTemplate")
    cat_name = category_map.get("_base_components", "Components")

    for ident, v in bots_raw.items():
        water_id = v.get("boiler_elementTemplateIdentifier_source", "")
        steam_id = v.get("boiler_elementTemplateIdentifier_output", "")
        consumption_raw = v.get("boiler_consumptionPerSecond_str")
        output_raw = v.get("boiler_outputPerSecond_str")

        if not (water_id and steam_id and consumption_raw and output_raw):
            continue

        # Skip non-buildable boiler BOTs
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
            "machines": {name: 60},
            "ingredients": [{"item": water_name, "amount": water_amt}],
            "outputs": [{"item": steam_name, "amount": steam_amt, "chance": None}],
            "unresolved_tags": [],
        }]

    return []


def parse_resource_converter_recipes(templates_dir: Path, id_to_name: dict,
                                     category_map: dict) -> list[dict]:
    """
    Generate synthetic resource converter recipes for Air Intake Base and Hot Air Stove Base.
    throughput_per_min = amount_str * 360 (formula: 450 * 360 = 162000 L/min for air intake).
    These are stored as special fluid source/transformer recipes.
    """
    bots_raw = load_yaml_templates(templates_dir, "BuildableObjectTemplate")
    cat_name = category_map.get("_base_buildings", "Buildings")
    recipes = []

    for ident, machine_name in RESOURCE_CONVERTER_BOTS.items():
        v = bots_raw.get(ident)
        if not v:
            continue

        inputs = v.get("resourceConverter_input_elemental") or []
        outputs = v.get("resourceConverter_output_elemental") or []

        if not outputs:
            continue

        ingredients = []
        for inp in inputs:
            inp_id = inp.get("identifier", "")
            amt_raw = inp.get("amount_str", inp.get("amount", 0))
            inp_name = id_to_name.get(inp_id, inp_id)
            if inp_name and inp_id:
                try:
                    amt = float(amt_raw) * 360  # L/min
                except (ValueError, TypeError):
                    amt = 0.0
                ingredients.append({"item": inp_name, "amount": amt})

        output_list = []
        for out in outputs:
            out_id = out.get("identifier", "")
            amt_raw = out.get("amount_str", out.get("amount", 0))
            out_name = id_to_name.get(out_id, out_id)
            if out_name and out_id:
                try:
                    amt = float(amt_raw) * 360  # L/min
                except (ValueError, TypeError):
                    amt = 0.0
                output_list.append({"item": out_name, "amount": amt, "chance": None})

        if not output_list:
            continue

        recipe_name = output_list[0]["item"]  # e.g. "Air" or "Hot Air"

        recipes.append({
            "identifier": f"synthetic_resource_converter_{ident}",
            "name": recipe_name,
            "category_id": "_base_buildings",
            "category_name": cat_name,
            "rowgroup_id": "",
            "rowgroup_title": "",
            "rowgroup_sort": 0,
            "sorting_in_rowgroup": 0,
            "machines": {machine_name: 60},  # cycleTime=60 (per minute convention)
            "ingredients": ingredients,
            "outputs": output_list,
            "unresolved_tags": [],
            "throughput_per_min": output_list[0]["amount"],  # special field
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

    # category_id → rowgroup_id → [recipe_name] (sorted by sorting_in_rowgroup)
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
                          id_to_name: dict) -> str:
    """Generate game-data.js content matching the format of v0.6.0.24342/game-data.js."""

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

    sorted_machines = sorted(all_machines.items(), key=lambda x: x[1])

    # Collect all item names from recipes.
    # Use key→name map to deduplicate: ingredient/output item names take priority
    # over recipe names (handles cases like "Fluid-Assembler I" recipe vs
    # "Fluid Assembler I" item — both map to FLUID_ASSEMBLER_I).
    key_to_name: dict[str, str] = {}
    # Pass 1: ingredient and output item names (highest priority)
    for r in recipes:
        for ing in r["ingredients"]:
            n = ing["item"]
            key_to_name[to_const_key(n)] = n
        for out in r["outputs"]:
            n = out["item"]
            key_to_name[to_const_key(n)] = n
    # Pass 2: recipe names (only if key not already taken)
    for r in recipes:
        k = to_const_key(r["name"])
        if k not in key_to_name:
            key_to_name[k] = r["name"]
    # Invert: name → key
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
        if name in all_machines or name in {
            "Research Server", "Xeno-Scrap-Extraktor", "Xeno-Crystal-Extraktor",
            "Resource Separator", "Scrap Recycler", "Freight Elevator I",
            "Freight Elevator II", "Freight Elevator III", "Freight Elevator IV",
            "Shipping Pad (Small)", "Shipping Pad (Medium)",
            "Shipping Pad (Medium, Assembly Line)", "Cargo Shuttle Start Pad",
            "Cargo Shuttle Target Pad", "Burner Generator", "Incinerator",
        }:
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

    # ASSEMBLY_LINE_COMPOSITION
    lines.append("// ── Assembly Line sub-machine composition ─────────────────────")
    lines.append("const ASSEMBLY_LINE_COMPOSITION = Object.freeze({")
    lines.append('  start:    { count: 1,  name: "Assembly Line Start"    },')
    lines.append('  producer: { count: 10, name: "Assembly Line Producer" },')
    lines.append('  painter:  { count: 1,  name: "Assembly Line Painter"  },')
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

    # FLUID_SOURCE_MACHINES
    lines.append("// ── Raw fluid sources ──────────────────────────────────────────")
    lines.append("const FLUID_SOURCE_MACHINES = Object.freeze({")
    for fluid_key, info in FLUID_SOURCE_MACHINES_STATIC.items():
        lines.append(f"  '{fluid_key}': {{ machine: '{info['machine']}', capacityPerMin: {info['capacityPerMin']} }},")
    lines.append("});")
    lines.append("")

    # BYPRODUCT_DISPOSAL
    lines.append("// ── Byproduct disposal ────────────────────────────────────────")
    lines.append("const BYPRODUCT_DISPOSAL = Object.freeze({")
    for item_name, info in BYPRODUCT_DISPOSAL_STATIC.items():
        if "reprocess" in info:
            rp = info["reprocess"]
            lines.append(f"  '{item_name}': {{")
            lines.append(f"    machine: '{info['machine']}', capacityPerMin: {info['capacityPerMin']},")
            lines.append(f"    reprocess: {{ recipe: '{rp['recipe']}', produces: '{rp['produces']}' }},")
            lines.append("  },")
        else:
            lines.append(f"  '{item_name}': {{ machine: '{info['machine']}', capacityPerMin: {info['capacityPerMin']} }},")
    lines.append("});")
    lines.append("")

    # MACHINE_FLUID_MINIMUMS
    lines.append("// ── Minimum fluid supply per machine instance ─────────────────")
    lines.append("const MACHINE_FLUID_MINIMUMS = Object.freeze({")
    for mach_name, fluids in MACHINE_FLUID_MINIMUMS_STATIC.items():
        fluids_js = ", ".join(f"'{k}': {v}" for k, v in fluids.items())
        lines.append(f"  '{mach_name}': {{ {fluids_js} }},")
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

    return "\n".join(lines)


def generate_recipes_js(version: str, recipes: list[dict],
                        all_items: dict[str, str],
                        all_machines: dict[str, str],
                        all_cats: dict[str, str]) -> str:
    """Generate recipes.js content matching the format of v0.6.0.24342/recipes.js."""

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
            elif len(outputs) == 1:
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

    # Recipes
    recipes_json = {}
    for r in recipes:
        rec_id = r["identifier"]
        recipes_json[rec_id] = {
            "name": r["name"],
            "category_id": r["category_id"],
            "subgroup_id": r.get("rowgroup_id", ""),
            "time_ms": 0 if r.get("machines", {}).get("Blast Furnace") else 0,
            "inputs": [{"id": ing["item"], "amount": ing["amount"]}
                       for ing in r["ingredients"]],
            "outputs": [{"id": out["item"], "amount": out["amount"]}
                        for out in r["outputs"]],
            "machines": r["machines"],
        }

    # Items: collect all items referenced in recipes
    all_item_names: set[str] = set()
    for r in recipes:
        for ing in r["ingredients"]:
            all_item_names.add(ing["item"])
        for out in r["outputs"]:
            all_item_names.add(out["item"])
        all_item_names.add(r["name"])

    # Build name→item_id reverse map from id_to_name
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

    # Machines
    machines_json = {}
    for ident, bd in bot_data.items():
        machines_json[ident] = {
            "name": bd["name"],
            "power_kw": bd["power_kw"],
            "loader_sides": bd["loader_sides"],
            "loader_needed": bd["loader_needed"],
        }

    # Categories
    categories_json = {}
    for cat_id, cat_name in category_map.items():
        categories_json[cat_id] = {"name": cat_name}

    # Subgroups
    subgroups_json = {}
    for sg_id, sg_info in subgroup_map.items():
        subgroups_json[sg_id] = {
            "name": sg_info["title"],
            "category_id": sg_info["category_id"],
            "sort": sg_info["sortingOrder"],
            "recipe_ids": [],
        }
    # Fill recipe_ids
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
                      id_to_name: dict, id_to_icon: dict) -> str:
    """Generate icons.js with icon path maps."""

    name_to_path: dict[str, str] = {}
    for ident, icon_id in id_to_icon.items():
        name = id_to_name.get(ident, "")
        if name and icon_id in icon_map:
            name_to_path[name] = icon_map[icon_id]

    lines = []
    lines.append("// ── Icon path maps (auto-generated by extract_game_data.py) ──")
    lines.append("")
    lines.append("const ICON_ALIASES = {};")
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
    print(f"  {len(id_to_name)} named identifiers, {len(tag_machines)} production tags, "
          f"{len(fluid_items)} fluid items, {len(intermediate_items)} intermediate items, "
          f"{len(bot_data)} machines with data")

    # ── Parse recipes ─────────────────────────────────────────────────────────
    print("Parsing recipes...")
    recipes = parse_recipes(templates_dir, id_to_name, tag_machines, category_map,
                             subgroup_map)
    bf_recipes    = parse_blast_furnace_recipes(templates_dir, id_to_name, category_map)
    mining_recipes = parse_mining_recipes(templates_dir, id_to_name, category_map)
    boiler_recipes = parse_boiler_recipe(templates_dir, id_to_name, category_map)
    rc_recipes    = parse_resource_converter_recipes(templates_dir, id_to_name, category_map)

    recipes.extend(bf_recipes)
    recipes.extend(mining_recipes)
    recipes.extend(boiler_recipes)
    recipes.extend(rc_recipes)

    recipes_with_todo = [r for r in recipes if r["unresolved_tags"]]
    print(f"  {len(recipes)} recipes parsed "
          f"({len(bf_recipes)} blast furnace, {len(mining_recipes)} mining, "
          f"{len(boiler_recipes)} boiler, {len(rc_recipes)} resource converter), "
          f"{len(recipes_with_todo)} with unresolved machine tags")

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
    # Build all_items with deduplication: ingredient/output names take priority over recipe names.
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
        bot_data, subgroups, templates_dir, id_to_name)
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
        icons_content = generate_icons_js(version_tag, icon_map_versioned, id_to_name, id_to_icon)
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
