#!/usr/bin/env python3
"""
Foundry game data extractor.
Reads recipe YAMLs and icons from the Unity AssetBundle and outputs:
  - data/versions/v<version>/game-data.js  — M, I, CAT constants + RECIPES structure
  - data/versions/v<version>/recipes.js    — RECIPES object
  - data/versions/v<version>/icons.js      — icon path maps
  - data/versions/v<version>/*.json        — raw extracted JSON (for inspection)
  - icons/v<version>/                      — PNG icons (512x512 by default)

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
# These BOTs have production tags but are not factory machines.
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
# BF recipes have no timeMs in YAML. We use cycleTime=1 (per-second tick convention)
# matching the existing recipes.js. Amounts in BlastFurnaceModeTemplate are per-tick.
BLAST_FURNACE_CYCLE_TIME = 1


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
# Build tag → machines map from BuildableObjectTemplate
# ─────────────────────────────────────────────────────────────────────────────

def build_tag_to_machines(templates_dir: Path, id_to_name: dict) -> dict:
    """
    Returns tag → [(machine_display_name, effective_modifier)].

    Priority rule (mirrors actual game behaviour):
      1. If any machine has tag as its autoProducer_recipeType_tag  → use ONLY those
         machines for that tag, with their autoProducer_recipeTimeModifier.
      2. If NO auto match exists for a tag → fall back to machines that list the tag
         in producer_recipeType_tags, using producer_recipeTimeModifier.

    This means:
    - 'smelter'          → only Smelter (Small) via auto (mod=1)
    - 'advanced_smelter' → only Advanced Smelter via auto (mod=1.5)
    - 'smelter_lava'     → only Lava-Smelter I/II via auto
    - 'crusher'          → Crusher I/II via prod fallback (no auto for crusher)
    - 'assembler'        → Assembler I/II/III via prod fallback
    """
    # tag → {machine_name: modifier}  — separate auto and prod maps
    auto_map: dict[str, dict[str, float]] = {}   # tag → {name: mod} from autoProducer
    prod_map: dict[str, dict[str, float]] = {}   # tag → {name: mod} from producer

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

    # Merge: for each tag, prefer auto entries; fall back to prod only when no auto exists
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
# Parse recipes
# ─────────────────────────────────────────────────────────────────────────────

def parse_recipes(templates_dir: Path, id_to_name: dict,
                  tag_to_machines: dict, category_map: dict) -> list[dict]:
    """
    Parse all CraftingRecipe YAMLs into structured recipe dicts ready for JS output.
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
            continue  # recipe has no known machines (e.g., pure character recipe filtered out)

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
    Uses cycleTime=1 (per-second tick convention, matching existing recipes.js).
    Hot Air is NOT included here — add it via MACHINE_FLUID_MINIMUMS.
    """
    raw = load_yaml_templates(templates_dir, "BlastFurnaceModeTemplate")
    recipes = []
    cat_name = category_map.get("_base_metallurgy", "Metallurgy")

    for identifier, r in raw.items():
        # Primary output = first element in output_data_elemental
        outputs_raw = r.get("output_data_elemental") or []
        if not outputs_raw:
            continue

        primary_out = outputs_raw[0]
        primary_id = primary_out.get("identifier", "")
        primary_name = id_to_name.get(primary_id, primary_id)
        recipe_name = primary_name  # e.g. "Molten Xenoferrite"

        # Ingredients (solid only — Hot Air comes from MACHINE_FLUID_MINIMUMS)
        ingredients = []
        for inp in r.get("input_data") or []:
            iid = inp.get("identifier", "")
            iamt = inp.get("amount", 1)
            iname = id_to_name.get(iid, iid)
            if iname:
                ingredients.append({"item": iname, "amount": iamt})

        # Outputs (elemental)
        outputs = []
        for out in outputs_raw:
            oid = out.get("identifier", "")
            oamt = float(out.get("amount_str", out.get("amount", 0)) or 0)
            oname = id_to_name.get(oid, oid)
            if oname:
                outputs.append({"item": oname, "amount": oamt, "chance": None})

        # Waste gas as output
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
            "machines": {"Blast Furnace": BLAST_FURNACE_CYCLE_TIME},
            "ingredients": ingredients,
            "outputs": outputs,
            "unresolved_tags": [],
        })

    return recipes


# ─────────────────────────────────────────────────────────────────────────────
# JS name conversion
# ─────────────────────────────────────────────────────────────────────────────

def to_const_key(name: str) -> str:
    """Convert display name to JS constant key: 'Advanced Smelter' → 'ADVANCED_SMELTER'."""
    s = re.sub(r"[^\w\s]", " ", name)   # remove non-word, non-space chars
    s = re.sub(r"\s+", "_", s.strip())   # spaces → underscore
    s = re.sub(r"_+", "_", s)            # collapse multiple underscores
    return s.upper().strip("_")


def format_cycle_time(ct: float) -> str:
    """Format cycle time for JS: trim trailing zeros."""
    if ct == int(ct):
        return str(int(ct))
    # Round to 3 decimal places, remove trailing zeros
    s = f"{ct:.3f}".rstrip("0").rstrip(".")
    return s


# ─────────────────────────────────────────────────────────────────────────────
# Detect fluid items
# ─────────────────────────────────────────────────────────────────────────────

def detect_fluid_items(templates_dir: Path, id_to_name: dict) -> set[str]:
    """
    Returns a set of item display names that appear in elemental data across all recipes.
    These are transported via pipes, not belts.
    """
    fluid_ids = set()
    for ident in load_yaml_templates(templates_dir, "ElementTemplate"):
        fluid_ids.add(ident)
    for ident in load_yaml_templates(templates_dir, "LiquidTemplate"):
        fluid_ids.add(ident)

    # Also collect from recipe elemental fields
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
# JS generators
# ─────────────────────────────────────────────────────────────────────────────

def generate_game_data_js(version: str, recipes: list[dict],
                          fluid_items: set[str], templates_dir: Path,
                          id_to_name: dict) -> str:
    """Generate game-data.js content in the same format as the existing file."""

    # Collect all machine names used in recipes
    all_machines: dict[str, str] = {}  # display_name → const_key
    for r in recipes:
        for mname in r["machines"]:
            key = to_const_key(mname)
            all_machines[mname] = key
    # Sort by const key for stability
    sorted_machines = sorted(all_machines.items(), key=lambda x: x[1])

    # Collect all item names used in recipes (ingredients + outputs)
    all_items: dict[str, str] = {}  # display_name → const_key
    for r in recipes:
        for ing in r["ingredients"]:
            n = ing["item"]
            all_items[n] = to_const_key(n)
        for out in r["outputs"]:
            n = out["item"]
            all_items[n] = to_const_key(n)
        # Also add recipe name itself as an item (implicit single outputs)
        all_items[r["name"]] = to_const_key(r["name"])
    sorted_items = sorted(all_items.items(), key=lambda x: x[1])

    # Collect categories
    cats: dict[str, str] = {}  # display_name → const_key
    for r in recipes:
        cname = r["category_name"]
        if cname:
            cats[cname] = to_const_key(cname)
    sorted_cats = sorted(cats.items(), key=lambda x: x[1])

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

    # ASSEMBLY_LINE_COMPOSITION — carry over as-is (manual)
    lines.append("// ── Assembly Line sub-machine composition ─────────────────────")
    lines.append("// TODO: review counts for this version")
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

    # RECIPE_SUBGROUPS — stub
    lines.append("// ── Recipe browser subcategory groupings ──────────────────────")
    lines.append("// TODO: fill from subgroups-template.csv")
    lines.append("const RECIPE_SUBGROUPS = {};")
    lines.append("")

    # FLUID_ITEMS — auto-detected
    lines.append("// ── Fluid / gas items (transported via pipes, not loaders) ───")
    lines.append("const FLUID_ITEMS = new Set([")
    for fname in sorted(fluid_items):
        lines.append(f'  "{fname}",')
    lines.append("]);")
    lines.append("")

    # INTERMEDIATE_ITEMS — stub
    lines.append("// ── Intermediate items (depth-mode 1 stop boundary) ──────────")
    lines.append("// TODO: review and fill for this version")
    lines.append("const INTERMEDIATE_ITEMS = new Set([]);")
    lines.append("")

    # FLUID_SOURCE_MACHINES — stub
    lines.append("// ── Raw fluid sources ──────────────────────────────────────────")
    lines.append("// TODO: review for this version")
    lines.append("const FLUID_SOURCE_MACHINES = Object.freeze({")
    lines.append("  'water': { machine: 'Pipe Intake', capacityPerMin: 30000 },")
    lines.append("});")
    lines.append("")

    # BYPRODUCT_DISPOSAL — stub
    lines.append("// ── Byproduct disposal ────────────────────────────────────────")
    lines.append("// TODO: review for this version")
    lines.append("const BYPRODUCT_DISPOSAL = Object.freeze({")
    lines.append("  'Waste Gas': { machine: 'Flare Stack', capacityPerMin: 3000 },")
    lines.append("  'Blast Furnace Slag': {")
    lines.append("    machine: 'Flare Stack', capacityPerMin: 3000,")
    lines.append("    reprocess: { recipe: 'Cement (Slag Reprocessing)', produces: 'Cement' },")
    lines.append("  },")
    lines.append("});")
    lines.append("")

    # MACHINE_FLUID_MINIMUMS — stub
    lines.append("// ── Minimum fluid supply per machine instance ─────────────────")
    lines.append("// TODO: review for this version")
    lines.append("const MACHINE_FLUID_MINIMUMS = Object.freeze({")
    lines.append("  'Blast Furnace': { 'Hot Air': 324000 },")
    lines.append("});")
    lines.append("")

    # MACHINE_POWER_KW — stub
    lines.append("// ── Machine power consumption (kW) ───────────────────────────")
    lines.append("// TODO: extract from BuildableObjectTemplate")
    lines.append("const MACHINE_POWER_KW = Object.freeze({});")
    lines.append("")

    # MACHINE_CONNECTIONS — stub
    lines.append("// ── Machine connection layout ─────────────────────────────────")
    lines.append("// TODO: extract from BuildableObjectTemplate")
    lines.append("const MACHINE_CONNECTIONS = Object.freeze({});")
    lines.append("")

    return "\n".join(lines)


def generate_recipes_js(version: str, recipes: list[dict],
                        all_items: dict[str, str],
                        all_machines: dict[str, str],
                        all_cats: dict[str, str]) -> str:
    """Generate recipes.js content in the same format as the existing file."""

    def item_ref(name: str) -> str:
        key = to_const_key(name)
        if key in all_items.values():
            # Find canonical key
            for iname, ikey in all_items.items():
                if ikey == key and iname == name:
                    return f"I.{key}"
        return f'"{name}"'  # fallback to string literal

    def machine_ref(name: str) -> str:
        key = to_const_key(name)
        return f"[M.{key}]"

    def cat_ref(cat_name: str) -> str:
        key = to_const_key(cat_name)
        return f"CAT.{key}"

    # Group recipes by category for comments
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

            # Build ingredients line
            if r["ingredients"]:
                ing_parts = []
                for ing in r["ingredients"]:
                    iref = item_ref(ing["item"])
                    amt = ing["amount"]
                    amt_str = str(int(amt)) if amt == int(amt) else str(amt)
                    ing_parts.append(f"{{ item: {iref}, amount: {amt_str} }}")
                ing_str = ", ".join(ing_parts)
            else:
                ing_str = ""

            # Build output
            outputs = r["outputs"]
            if len(outputs) == 0:
                out_str = "{ amount: 1 }"
            elif len(outputs) == 1:
                amt = outputs[0]["amount"]
                amt_str = str(int(amt)) if amt == int(amt) else str(amt)
                if outputs[0]["chance"]:
                    out_str = f"{{ amount: {amt_str}, chance: {outputs[0]['chance']} }}"
                else:
                    out_str = f"{{ amount: {amt_str} }}"
            else:
                out_parts = []
                for out in outputs:
                    iref = item_ref(out["item"])
                    amt = out["amount"]
                    amt_str = str(int(amt)) if amt == int(amt) else str(amt)
                    if out["chance"]:
                        out_parts.append(f"{{ item: {iref}, amount: {amt_str}, chance: {out['chance']} }}")
                    else:
                        out_parts.append(f"{{ item: {iref}, amount: {amt_str} }}")
                out_str = "[" + ", ".join(out_parts) + "]"

            # Build machines
            mach_parts = []
            for mname, cycle_time in sorted(r["machines"].items(),
                                             key=lambda x: x[1]):  # sort by speed (fastest first)
                mref = machine_ref(mname)
                ct_str = format_cycle_time(cycle_time)
                mach_parts.append(f"{mref}: {{ cycleTime: {ct_str} }}")

            # Unresolved tags comment
            todo_comment = ""
            if r["unresolved_tags"]:
                todo_comment = f"  // TODO: no machine found for tags: {r['unresolved_tags']}\n"

            # Write the recipe entry
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
            if todo_comment:
                lines.append(f"      // TODO: add machine for tags: {r['unresolved_tags']}")
            lines.append("    },")
            lines.append("  },")

    lines.append("};")
    return "\n".join(lines)


def generate_icons_js(version: str, icon_map: dict,
                      id_to_name: dict, id_to_icon: dict) -> str:
    """Generate icons.js with icon path maps, grouped by category."""

    # Build name → icon path map
    name_to_path: dict[str, str] = {}
    for ident, icon_id in id_to_icon.items():
        name = id_to_name.get(ident, "")
        if name and icon_id in icon_map:
            name_to_path[name] = icon_map[icon_id]

    lines = []
    lines.append("// ── Icon path maps (auto-generated by extract_game_data.py) ──")
    lines.append("")
    lines.append("const ICON_ALIASES = {")
    lines.append("  // TODO: review aliases for this version")
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
    lines.append("const BUILDING_ICONS = {};  // TODO: add building icons")

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
# Raw JSON extraction (for inspection)
# ─────────────────────────────────────────────────────────────────────────────

def extract_raw_json(templates_dir: Path, out_dir: Path):
    """Extract raw JSON files for inspection (not used by the app)."""
    print("Extracting raw JSON...")

    raw_recipes = []
    for ident, r in load_yaml_templates(templates_dir, "CraftingRecipe").items():
        raw_recipes.append({
            "identifier": ident,
            "name": r.get("name", ""),
            "icon_identifier": r.get("icon_identifier", ""),
            "category_identifier": r.get("category_identifier", ""),
            "timeMs": r.get("timeMs", 0),
            "tags": r.get("tags", []),
            "inputs": [{"identifier": x.get("identifier"), "amount": x.get("amount")}
                       for x in (r.get("input_data") or [])],
            "outputs": [{"identifier": x.get("identifier"), "amount": x.get("amount")}
                        for x in (r.get("output_data") or [])],
            "inputs_elemental": [{"identifier": x.get("identifier"),
                                   "amount": x.get("amount") or x.get("amount_str")}
                                  for x in (r.get("inputElemental_data") or []) if x.get("identifier")],
            "outputs_elemental": [{"identifier": x.get("identifier"),
                                    "amount": x.get("amount") or x.get("amount_str")}
                                   for x in (r.get("outputElemental_data") or []) if x.get("identifier")],
        })

    raw_items = []
    for ident, it in load_yaml_templates(templates_dir, "ItemTemplate").items():
        raw_items.append({
            "identifier": ident,
            "name": it.get("name", ""),
            "icon_identifier": it.get("icon_identifier", ""),
            "category": it.get("itemCategoryIdentifier", ""),
        })

    with open(out_dir / "recipes_raw.json", "w", encoding="utf-8") as f:
        json.dump(raw_recipes, f, indent=2, ensure_ascii=False)
    with open(out_dir / "items_raw.json", "w", encoding="utf-8") as f:
        json.dump(raw_items, f, indent=2, ensure_ascii=False)
    print(f"  Wrote {len(raw_recipes)} raw recipes, {len(raw_items)} raw items")


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
                        help="Skip JS file generation (only extract raw JSON)")
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
            # Write icon_map.json for reference
            icon_map_relative = {k: f"icons/{version_tag}/{v}" for k, v in icon_map.items()}
            with open(out_dir / "icon_map.json", "w", encoding="utf-8") as f:
                json.dump(icon_map_relative, f, indent=2, ensure_ascii=False)
            print(f"  Wrote icon_map.json ({len(icon_map_relative)} entries)")

    if args.icons_only:
        print("Done (icons only).")
        return

    # ── Build lookup tables ───────────────────────────────────────────────────
    print("Building lookup tables...")
    id_to_name   = build_id_to_name(templates_dir)
    id_to_icon   = build_id_to_icon(templates_dir)
    tag_machines = build_tag_to_machines(templates_dir, id_to_name)
    category_map = build_category_map(templates_dir)
    fluid_items  = detect_fluid_items(templates_dir, id_to_name)
    print(f"  {len(id_to_name)} named identifiers, {len(tag_machines)} production tags, {len(fluid_items)} fluid items")

    # ── Parse recipes ─────────────────────────────────────────────────────────
    print("Parsing recipes...")
    recipes = parse_recipes(templates_dir, id_to_name, tag_machines, category_map)
    bf_recipes = parse_blast_furnace_recipes(templates_dir, id_to_name, category_map)
    recipes.extend(bf_recipes)
    recipes_with_todo = [r for r in recipes if r["unresolved_tags"]]
    print(f"  {len(recipes)} recipes parsed ({len(bf_recipes)} blast furnace), "
          f"{len(recipes_with_todo)} with unresolved machine tags")

    # ── Raw JSON ──────────────────────────────────────────────────────────────
    extract_raw_json(templates_dir, out_dir)

    if args.no_js:
        print("Done (no JS generated).")
        return

    # ── Build constant lookup sets ────────────────────────────────────────────
    all_items: dict[str, str] = {}
    all_machines: dict[str, str] = {}
    all_cats: dict[str, str] = {}
    for r in recipes:
        for ing in r["ingredients"]:
            n = ing["item"]; all_items[n] = to_const_key(n)
        for out in r["outputs"]:
            n = out["item"]; all_items[n] = to_const_key(n)
        all_items[r["name"]] = to_const_key(r["name"])
        for mname in r["machines"]:
            all_machines[mname] = to_const_key(mname)
        if r["category_name"]:
            all_cats[r["category_name"]] = to_const_key(r["category_name"])

    # ── Generate game-data.js ─────────────────────────────────────────────────
    print("Generating game-data.js...")
    game_data_content = generate_game_data_js(
        version_tag, recipes, fluid_items, templates_dir, id_to_name)
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
    if recipes_with_todo:
        print(f"\nNOTE: {len(recipes_with_todo)} recipes have TODO comments (unresolved machine tags):")
        for r in recipes_with_todo[:10]:
            print(f"  '{r['name']}' — tags: {r['unresolved_tags']}")
        if len(recipes_with_todo) > 10:
            print(f"  ... and {len(recipes_with_todo)-10} more")


if __name__ == "__main__":
    main()
