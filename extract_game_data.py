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

# ── Tick rate (justified convention, not magic number) ────────────────────────
# Air Intake: amount_str=450 → known output 162,000 L/min
# 162,000 / 450 / 60 = 6 ticks/sec = 360 ticks/min
# Cross-check: Hot Air Stove amount_str=900 × 360 = 324,000 L/min ✓
TICKS_PER_MIN = 360

# ── Blast Furnace cycle time convention ───────────────────────────────────────
# BF has no timeMs in BlastFurnaceModeTemplate — continuous process.
# cycleTime=1 means "amounts are per second" (calculator convention).
BLAST_FURNACE_CYCLE_TIME = 1

# ── BuildableObjectTemplate `type` values ────────────────────────────────────
# Production machine types — these resolve to recipe machines
PROD_TYPES = {"Producer", "AutoProducer", "ModularEntityProducer"}
# Resource converter types — generate synthetic fluid conversion recipes
RC_TYPES = {"ResourceConverter", "NPP_CoolingTower"}


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
        return float(kw or 0)
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

def build_assembly_line_composition(templates_dir: Path) -> dict:
    """
    Derives Assembly Line sub-machine composition from AssemblyLineObjectTemplate.
    Each robot type has 1 initial part (torso → AL Start) and N non-initial parts.
    Each non-initial part needs attach + weld = 2 producer stations.
    Returns: {start: {count, name}, producer: {count, name}, painter: {count, name}}
    """
    al_objects = load_yaml_templates(templates_dir, "AssemblyLineObjectTemplate")

    max_non_initial = 0
    for obj_id, obj in al_objects.items():
        parts = obj.get("objectParts") or []
        non_initial = sum(1 for p in parts if not p.get("isInitialPart", False))
        if non_initial > max_non_initial:
            max_non_initial = non_initial

    producer_count = max_non_initial * 2  # attach + weld per part

    return {
        "start":    {"count": 1,              "name": "Assembly Line Start"},
        "producer": {"count": producer_count, "name": "Assembly Line Producer"},
        "painter":  {"count": 1,              "name": "Assembly Line Painter"},
    }


# ─────────────────────────────────────────────────────────────────────────────
# Byproduct disposal — dynamic from recipes + Flare Stack template
# ─────────────────────────────────────────────────────────────────────────────

def detect_byproducts_and_disposal(templates_dir: Path, recipes: list[dict],
                                   id_to_name: dict) -> dict:
    """
    Returns {item_name: {machine, capacityPerMin, ?reprocess}} for byproduct items.
    Byproducts = elemental outputs that never appear as elemental inputs in any recipe.
    The disposal machine is detected by dissolver_isElemental=True in BuildableObjectTemplate.
    Reprocess entries are found by scanning recipes for inputs matching the byproduct.
    """
    bots_raw = load_yaml_templates(templates_dir, "BuildableObjectTemplate")

    # Find all elemental outputs and inputs across recipes
    elemental_outputs: dict[str, str] = {}  # item_name → recipe_name
    elemental_inputs: set[str] = set()

    for r in recipes:
        for out in r.get("outputs", []):
            if out.get("is_elemental"):
                elemental_outputs[out["item"]] = r["name"]
        for inp in r.get("ingredients", []):  # recipes use "ingredients", not "inputs"
            if inp.get("is_elemental"):
                elemental_inputs.add(inp["item"])

    byproduct_names = set(elemental_outputs.keys()) - elemental_inputs

    # Find Flare Stack (dissolver_isElemental=True) in ItemTemplate bots
    item_ids = _build_item_bot_ids(templates_dir)
    flare_stack_name = ""
    flare_capacity = 0.0
    for ident, v in bots_raw.items():
        if ident not in item_ids:
            continue
        if v.get("dissolver_isElemental") and v.get("dissolver_elementalConsumptionPerSecond_str"):
            name = id_to_name.get(ident, "")
            if not name:
                continue
            try:
                cap = float(v["dissolver_elementalConsumptionPerSecond_str"]) * 60
            except (ValueError, TypeError):
                cap = 0.0
            if cap > flare_capacity:
                flare_stack_name = name
                flare_capacity = cap

    if not flare_stack_name:
        return {}

    # Build reprocess map: byproduct_name → {recipe, produces}
    reprocess_map: dict[str, dict] = {}
    for r in recipes:
        for inp in r["ingredients"]:
            if inp["item"] in byproduct_names:
                byp = inp["item"]
                if r["outputs"]:
                    produces = r["outputs"][0]["item"]
                    reprocess_map[byp] = {"recipe": r["name"], "produces": produces}

    disposal: dict[str, dict] = {}
    for bp_name in sorted(byproduct_names):
        entry: dict = {
            "machine": flare_stack_name,
            "capacityPerMin": flare_capacity,
        }
        if bp_name in reprocess_map:
            entry["reprocess"] = reprocess_map[bp_name]
        disposal[bp_name] = entry

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
            # Keep the lowest capacity per fluid (= most basic machine, not pipeline variant)
            if fluid_id not in sources or capacity_per_min < sources[fluid_id]["capacityPerMin"]:
                sources[fluid_id] = {
                    "machine": machine_name,
                    "capacityPerMin": capacity_per_min,
                }

    return sources


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

        if not machines and not has_unresolved_tags:
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

        waste = r.get("waste_gas_data") or {}
        if waste.get("identifier"):
            wname = id_to_name.get(waste["identifier"], waste["identifier"])
            wamt = float(waste.get("amount_str", waste.get("amount", 0)) or 0)
            if wname and wamt:
                outputs.append({"item": wname, "amount": wamt, "chance": None,
                                 "is_elemental": True})

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

    machines = {mdata["name"]: mdata["cycle_time"]
                for mdata in mining_machines.values()}

    # Get mineable items from OreVeinTemplate → TerrainBlockType
    ore_mining_map = build_ore_mining_map(templates_dir)
    recipes = []

    for rubble_id in sorted(ore_mining_map.keys()):
        rubble_name = id_to_name.get(rubble_id, rubble_id)
        if not rubble_name:
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
    cycleTime=60, water=consumptionPerSecond, steam=outputPerSecond.
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
            "machines": {name: 60},
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
    throughput_per_min = amount_str × TICKS_PER_MIN
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
                    amt = float(amt_raw) * TICKS_PER_MIN
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
                    amt = float(amt_raw) * TICKS_PER_MIN
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
                          fluid_sources: dict,
                          byproduct_disposal: dict,
                          machine_fluid_minimums: dict) -> str:
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
    lines.append(f'  start:    {{ count: {al["start"]["count"]},  name: "{al["start"]["name"]}"    }},')
    lines.append(f'  producer: {{ count: {al["producer"]["count"]}, name: "{al["producer"]["name"]}" }},')
    lines.append(f'  painter:  {{ count: {al["painter"]["count"]},  name: "{al["painter"]["name"]}"  }},')
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
        lines.append(f"  '{fluid_name}': {{ machine: '{info['machine']}', capacityPerMin: {info['capacityPerMin']} }},")
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
            lines.append(f"    reprocess: {{ recipe: '{rp['recipe']}', produces: '{rp['produces']}' }},")
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
    bots_raw         = load_yaml_templates(templates_dir, "BuildableObjectTemplate")

    # Dynamic detections
    assembly_line_composition = build_assembly_line_composition(templates_dir)
    fluid_sources = detect_fluid_sources(templates_dir, bots_raw, id_to_name)
    machine_fluid_minimums = detect_machine_fluid_minimums(bots_raw, id_to_name)

    print(f"  {len(id_to_name)} named identifiers, {len(tag_machines)} production tags, "
          f"{len(fluid_items)} fluid items, {len(intermediate_items)} intermediate items, "
          f"{len(bot_data)} machines with data")
    print(f"  Assembly line: {assembly_line_composition['producer']['count']} producer stations")
    print(f"  Fluid sources: {len(fluid_sources)}")
    print(f"  Machine fluid minimums: {len(machine_fluid_minimums)} machines")

    # ── Parse recipes ─────────────────────────────────────────────────────────
    print("Parsing recipes...")
    recipes = parse_recipes(templates_dir, id_to_name, tag_machines, category_map,
                             subgroup_map)
    bf_recipes     = parse_blast_furnace_recipes(templates_dir, id_to_name, category_map)
    mining_recipes = parse_mining_recipes(templates_dir, id_to_name, category_map)
    boiler_recipes = parse_boiler_recipe(templates_dir, id_to_name, category_map)
    rc_recipes     = parse_resource_converter_recipes(templates_dir, id_to_name, category_map)
    pj_recipes     = parse_pumpjack_recipes(templates_dir, id_to_name, category_map)

    recipes.extend(bf_recipes)
    recipes.extend(mining_recipes)
    recipes.extend(boiler_recipes)
    recipes.extend(rc_recipes)
    recipes.extend(pj_recipes)

    # Byproduct disposal (needs complete recipe list)
    byproduct_disposal = detect_byproducts_and_disposal(templates_dir, recipes, id_to_name)

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
        assembly_line_composition, fluid_sources,
        byproduct_disposal, machine_fluid_minimums)
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