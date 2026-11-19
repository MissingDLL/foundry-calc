#!/usr/bin/env python3
"""
FOUNDRY savegame reader → JSON.

Save layout (reverse-engineered, saveDataVersion seen: see output meta):
  "FOUNDRY" magic, header table at 0x40: u32 n, n × (u32 id, u32 offset, u32 size).
  The section directory starts right after the last header entry:
    u32 version, u32 count, count × (u64 nameHash, u32 offset, u32 size)
    offsets are relative to the directory start.
  Each section is zstd-compressed MessagePack (field names in clear text).
  Template references are 64-bit hashes: GameRoot.generateStringHash64(prefix + identifier)
  (decompiled from Main.dll), prefix per template type, e.g. "bot_", "cr_", "it_".
  Fields ending in _fpm are fixed point × 10,000.

Usage:
  python3 read_savegame.py                    # newest save in the default Proton save dir
  python3 read_savegame.py <save file|world folder> [-o out.json] [--parts] [--decor]
Needs: pip install msgpack zstandard pyyaml
"""

import argparse
import json
import struct
import sys
from collections import Counter, defaultdict
from pathlib import Path

import msgpack
import zstandard

from extract_game_data import (GAME_PATH_DEFAULT, SAVE_HASH_PREFIX as HASH_PREFIX, build_id_to_name,
                               load_yaml_templates, string_hash64)

SAVE_DIR_DEFAULT = ("/run/media/system/Games/SteamLibrary/steamapps/compatdata/983870/pfx/drive_c/"
                    "users/steamuser/AppData/LocalLow/Channel 3 Entertainment/Foundry/save")
FPM = 10_000          # fixed point scale of *_fpm fields
TICKS_PER_SEC = 60    # *PerTick → per second

class Templates:
    """hash → (template type, identifier, display name, fields)."""

    def __init__(self, templates_dir: Path):
        id_to_name = build_id_to_name(templates_dir)
        self.by_hash = {}
        for ttype, prefix in HASH_PREFIX.items():
            for ident, fields in load_yaml_templates(templates_dir, ttype).items():
                name = fields.get("name") or id_to_name.get(ident) or ident
                self.by_hash[string_hash64(prefix + ident)] = (ttype, ident, name, fields)

    def get(self, h):
        return self.by_hash.get(h) if h else None

    def name(self, h):
        t = self.get(h)
        return t[2] if t else (None if not h else f"#{h}")

    def ident(self, h):
        t = self.get(h)
        return t[1] if t else None


def read_sections(path: Path):
    """Yield (index, nameHash, raw bytes) for every directory section."""
    d = path.read_bytes()
    if d[:7] != b"FOUNDRY":
        sys.exit(f"{path}: not a FOUNDRY save")
    n = struct.unpack_from("<I", d, 0x40)[0]
    entries = [struct.unpack_from("<III", d, 0x44 + i * 12) for i in range(n)]
    base = max(off + size for _, off, size in entries)
    _version, count = struct.unpack_from("<II", d, base)
    dctx = zstandard.ZstdDecompressor()
    for i in range(count):
        h, off, size = struct.unpack_from("<QII", d, base + 8 + i * 16)
        yield i, h, dctx.decompressobj().decompress(d[base + off: base + off + size])


def entity_base(e):
    """BuildableEntityData of a building record (plain or modular), else None."""
    if not isinstance(e, dict):
        return None
    if "BuildableEntityData" in e:
        return e["BuildableEntityData"]
    return (e.get("ModularEntityBaseData") or {}).get("BuildableEntityData")


def newest_save(p: Path) -> Path:
    files = [f for f in p.rglob("*") if f.is_file() and f.open("rb").read(7) == b"FOUNDRY"] if p.is_dir() else [p]
    if not files:
        sys.exit(f"no FOUNDRY save found in {p}")
    return max(files, key=lambda f: f.stat().st_mtime)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("save", nargs="?", default=SAVE_DIR_DEFAULT, help="save file or folder (newest file is used)")
    ap.add_argument("--game-path", default=GAME_PATH_DEFAULT)
    ap.add_argument("-o", "--output", help="output JSON (default: stdout)")
    ap.add_argument("--parts", action="store_true", help="include building parts (foundations/walls) with positions")
    ap.add_argument("--decor", action="store_true", help="include world decor (plants, stalagmites) with positions")
    args = ap.parse_args()

    save = newest_save(Path(args.save))
    tpl = Templates(Path(args.game_path) / "foundry_Data/StreamingAssets/Templates")
    print(f"reading {save}", file=sys.stderr)

    out = {
        "meta": {"file": str(save), "mtime": save.stat().st_mtime},
        "summary": {},
        "buildings": [], "decor": [], "powerGrids": [], "pipeNetworks": [],
        "oreVeins": [], "production48h": {}, "research": [],
    }
    counts, recipes = Counter(), defaultdict(Counter)

    for idx, _h, raw in read_sections(save):
        head = raw[:300]
        if b"bin_terrainData" in head:                      # terrain chunks: not needed yet
            continue
        if b"ticksGrown" in head and not args.decor:          # world decor, ~500k entries
            continue
        obj = msgpack.unpackb(raw, raw=False, strict_map_key=False)

        if isinstance(obj, dict):
            if "saveDataVersion" in obj:
                out["meta"]["saveDataVersion"] = obj["saveDataVersion"]
            if "vec_pipeSegments" in obj:
                for p in obj["vec_pipeSegments"]:
                    out["pipeNetworks"].append({
                        "id": p["id"], "pipe": tpl.name(p["pipeTemplateId"]),
                        "fluid": tpl.name(p["content_elementTemplateId"]),
                        "contentL": p["content_amount_l_fpm"] / FPM, "capacityL": p["capacity_l_fpm"] / FPM,
                    })
            if "umap_productionStats48h" in obj:
                # ponytail: raw ring buffer (49 slots, current = productionStats48hIdx); unit not verified yet
                out["production48h"] = {
                    "currentIdx": obj["productionStats48hIdx"],
                    "items": {tpl.name(k): v for k, v in obj["umap_productionStats48h"].items()},
                }
            if "umap_amountCompletedResearches" in obj:
                done = obj["umap_amountCompletedResearches"]
                out["research"] = sorted(tpl.name(k) for k in done)
                # endless researches store how often they were completed (= level)
                out["researchLevels"] = {
                    tpl.name(k): n for k, n in done.items()
                    if tpl.get(k) and "ENDLESS_RESEARCH" in str(tpl.get(k)[3].get("flags", "")).split("|")
                }
                out["meta"]["miningHardnessLevel"] = obj.get("unlockedMiningHardnessLevel")
            if "map_dataPerSalesItem" in obj:
                # RDLabSystem (Main.dll): efficiency +2 %/point, weight −12.5 %/point, sales price +5 %/point
                out["rdLab"] = {
                    tpl.name(k): {
                        "level": v["currentLevel"], "unspentPoints": v["availableTechPoints"],
                        "efficiencyPct": v["spentTechPoints_efficiency"] * 2,
                        "weightReductionPct": v["spentTechPoints_weight"] * 12.5,
                        "qualityPct": v["spentTechPoints_quality"] * 5,
                    }
                    for k, v in obj["map_dataPerSalesItem"].items() if v["xpTotal"]
                }
            continue

        if not isinstance(obj, list) or not obj or not isinstance(obj[0], dict):
            continue
        first = obj[0]

        if "energySatisfactionLevel" in first and "battery_capacity_kj" in first:
            to_kw = TICKS_PER_SEC / FPM
            for g in obj:
                if not g["energyRequestedPerTick"] and not g["battery_capacity_kj"]:
                    continue
                out["powerGrids"].append({
                    "id": g["id"], "satisfactionPct": g["energySatisfactionLevel"] / 100,
                    "demandKw": g["energyRequestedPerTick"] * to_kw,
                    "drawnKw": g["energyDrawnPerTick"] * to_kw,
                    "producerKw": g["maxTotalProducerOutputPerTick_current"] * to_kw,
                    "batteryFlowKw": g["battery_delta_kj"] * to_kw,   # negative = discharging (snapshot)
                    "batteryCapacityKJ": g["battery_capacity_kj"] / FPM,
                    "batteryChargeKJ": g["battery_storedCharge_kj"] / FPM,
                    "buildingsEnabled": sum(g["enabledBuildingsArray"]),
                    "buildingsDisabled": sum(g["disabledBuildingsArray"]),
                })
            continue

        if "worldCellPos" in first and "connectedMinerCount" in first:
            for v in obj:
                p = v["worldCellPos"]
                out["oreVeins"].append({
                    "ore": tpl.name(v["templateId"]), "x": p["x"], "y": p["y"], "z": p["z"],
                    "available": v["miningProgressAvailableForConsumption_fpm"] / FPM,
                    "max": v["maxMiningProgressAvailableForConsumption_fpm"] / FPM,
                    "miners": v["connectedMinerCount"],
                })
            continue

        if "ticksGrown" in first:
            for e in obj:
                a = e["aabb"]
                out["decor"].append({"name": tpl.name(e["buildableObjectTemplateId"]), "x": a["x0"], "y": a["y0"], "z": a["z0"]})
            continue

        if entity_base(first) is None:
            continue
        for e in obj:
            b = entity_base(e)
            t = tpl.get(b["buildableObjectTemplateId"])
            name = t[2] if t else f"#{b['buildableObjectTemplateId']}"
            btype = t[3].get("type") if t else None
            counts[name] += 1
            if btype == "BuildingPart" and not args.parts:
                continue
            boxes = b["aabb"]["vec_aabbs"]
            a = boxes[0]
            rec = {
                "id": b["id"], "name": name, "ident": t[1] if t else None, "type": btype,
                "x": a["x0"], "y": a["y0"], "z": a["z0"], "w": [a["wx"], a["wy"], a["wz"]],
                "rot": b["orientationY"], "enabled": b["isEnabled"],
            }
            if len(boxes) > 1:
                rec["boxes"] = [[q["x0"], q["y0"], q["z0"], q["wx"], q["wy"], q["wz"]] for q in boxes]
            rid = e.get("craftingRecipeId") or e.get("craftingReceiptId") or e.get("craftingModeTemplateId")
            if rid:
                rec["recipe"] = tpl.name(rid)
                recipes[rec["recipe"]][name] += 1
            out["buildings"].append(rec)

    out["summary"] = {
        "buildingCounts": dict(counts.most_common()),
        "recipes": {r: dict(m) for r, m in sorted(recipes.items())},
        "powerKw": {
            "demand": sum(g["demandKw"] for g in out["powerGrids"]),
            "producers": sum(g["producerKw"] for g in out["powerGrids"]),
        },
        "unresolvedTemplates": sorted(n for n in counts if n.startswith("#")),
    }
    if not args.decor:
        del out["decor"]

    text = json.dumps(out, ensure_ascii=False, separators=(",", ":"))
    if args.output:
        Path(args.output).write_text(text, encoding="utf-8")
        print(f"wrote {args.output} ({len(text) / 1e6:.1f} MB)", file=sys.stderr)
    else:
        print(text)


if __name__ == "__main__":
    main()
