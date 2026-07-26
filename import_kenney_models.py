#!/usr/bin/env python3
"""
import_kenney_models.py

Import furniture .glb models from a locally downloaded Kenney/Eclair zip or an
extracted folder into your project structure:

  public/models/<catalog_id>.glb
  public/models/manifest.json

What this script does:
- Accepts either a .zip file or an extracted folder as input
- Scans all .glb files inside
- Uses filename keyword matching to map source files to your catalog ids
- Copies matched files into public/models/
- Writes manifest.json with all imported ids
- Prints unmatched files so you can manually rename/map them

Source pack reference:
- Eclair Assets hosts a free, no-login zip named
  furniture-kit-glb-pack-140-free-cc0-3d-models-glb.zip based on Kenney's
  Furniture Kit, licensed CC0.

Usage examples:
  python import_kenney_models.py --input ./furniture-kit-glb-pack-140-free-cc0-3d-models-glb.zip
  python import_kenney_models.py --input ./FurnitureKitExtracted
  python import_kenney_models.py --input ./FurnitureKitExtracted --project-root .

Optional:
  --dry-run    Show what would be imported without copying files
"""

from __future__ import annotations
import argparse
import json
import os
import re
import shutil
import sys
import tempfile
import zipfile
from pathlib import Path
from typing import Dict, List, Tuple


MODEL_RULES: Dict[str, List[str]] = {
    "bathroom_mirror": ["bathroom mirror", "mirror bathroom"],
    "bathroom_sink": ["bathroom sink"],
    "bathroom_sink_square": ["bathroom sink square", "sink square bathroom"],
    "bathroom_cabinet": ["bathroom cabinet"],
    "bathroom_cabinet_drawer": ["bathroom cabinet drawer"],
    "bathtub": ["bathtub", "bath tub"],
    "shower": ["shower round", "shower"],
    "toilet": ["toilet"],
    "toilet_square": ["toilet square"],

    "bed_bunk": ["bed bunk", "bunk bed"],
    "bed_double": ["bed double", "double bed"],
    "bed_single": ["bed single", "single bed"],
    "cabinet_bed": ["cabinet bed"],
    "cabinet_bed_drawer": ["cabinet bed drawer"],
    "cabinet_bed_drawer_table": ["cabinet bed drawer table"],

    "chair": ["chair"],
    "chair_cushion": ["chair cushion"],
    "chair_modern_cushion": ["chair modern cushion"],
    "chair_modern_frame_cushion": ["chair modern frame cushion"],
    "chair_rounded": ["chair rounded"],
    "desk_chair": ["desk chair"],
    "lounge_chair": ["lounge chair"],
    "lounge_design_chair": ["lounge design chair", "design chair lounge"],
    "bar_stool": ["bar stool"],
    "stool_bar_square": ["stool bar square", "bar stool square"],
    "bench": ["bench"],
    "bench_cushion": ["bench cushion"],
    "bench_cushion_low": ["bench cushion low"],

    "sofa": ["lounge sofa", "sofa"],
    "sofa_long": ["lounge sofa long", "sofa long"],
    "sofa_corner": ["lounge sofa corner", "sofa corner"],
    "sofa_ottoman": ["lounge sofa ottoman", "sofa ottoman", "ottoman"],
    "sofa_design": ["lounge design sofa", "design sofa"],
    "sofa_design_corner": ["lounge design sofa corner", "design sofa corner"],

    "coffee_table": ["coffee table"],
    "coffee_table_glass": ["table coffee glass", "coffee table glass"],
    "coffee_table_square": ["table coffee square", "coffee table square"],
    "dining_table": ["table"],
    "table_round": ["round table"],
    "table_cross": ["table cross"],
    "table_cross_cloth": ["table cross cloth"],
    "side_table": ["side table"],
    "side_table_drawers": ["side table drawers", "side table drawer"],
    "kitchen_island": ["kitchen bar", "kitchen island"],

    "desk": ["desk"],
    "desk_corner": ["desk corner"],
    "monitor": ["computer screen", "monitor"],
    "keyboard": ["computer keyboard", "keyboard"],
    "laptop": ["laptop"],

    "bookshelf_open": ["bookcase open"],
    "bookshelf_open_low": ["bookcase open low"],
    "bookshelf_closed": ["bookcase closed"],
    "bookshelf_closed_doors": ["bookcase closed doors"],
    "bookshelf_closed_wide": ["bookcase closed wide"],
    "books": ["books"],
    "tv_stand": ["cabinet television", "tv stand", "television cabinet"],
    "tv_stand_doors": ["cabinet television doors", "tv stand doors"],

    "kitchen_cabinet_lower": ["kitchen cabinet"],
    "kitchen_cabinet_corner": ["kitchen cabinet corner"],
    "kitchen_cabinet_drawer": ["kitchen cabinet drawer"],
    "kitchen_cabinet_upper": ["kitchen cabinet upper"],
    "kitchen_cabinet_upper_large": ["kitchen cabinet upper large"],
    "kitchen_sink": ["kitchen sink"],
    "stove": ["kitchen stove"],
    "stove_electric": ["kitchen stove electric"],
    "refrigerator": ["kitchen fridge"],
    "refrigerator_builtin": ["kitchen fridge built in"],
    "refrigerator_large": ["kitchen fridge large"],
    "refrigerator_small": ["kitchen fridge small"],
    "microwave": ["kitchen microwave", "microwave"],
    "coffee_machine": ["kitchen coffee machine", "coffee machine"],
    "blender": ["kitchen blender", "blender"],
    "range_hood": ["kitchen hood large", "range hood"],
    "toaster": ["toaster"],
    "dryer": ["dryer"],
    "washer": ["washer"],

    "floor_lamp_square": ["lamp square floor"],
    "table_lamp_square": ["lamp square table"],
    "ceiling_lamp_square": ["lamp square ceiling"],
    "floor_lamp": ["lamp round floor", "floor lamp"],
    "table_lamp": ["lamp round table", "table lamp"],
    "wall_lamp": ["lamp wall", "wall lamp"],
    "ceiling_fan": ["ceiling fan"],

    "tv": ["television"],
    "tv_vintage": ["television vintage", "vintage television"],
    "speaker": ["speaker"],
    "speaker_small": ["speaker small"],
    "radio": ["radio"],

    "rug_round": ["rug round"],
    "rug_rectangle": ["rug rectangle"],
    "rug_rounded": ["rug rounded"],
    "rug_square": ["rug square"],
    "rug_doormat": ["rug doormat", "doormat"],

    "plant": ["potted plant", "plant"],
    "plant_small": ["plant small"],
    "trash_bin": ["trashcan", "trash can"],
    "coat_rack": ["coat rack"],
    "coat_rack_standing": ["coat rack standing"],
    "storage_box": ["cardboard box closed", "storage box"],
    "storage_box_open": ["cardboard box open", "storage box open"],
}


def normalize(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[_\-]+", " ", text)
    text = re.sub(r"[^a-z0-9 ]+", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def score_match(filename: str, phrases: List[str]) -> int:
    name = normalize(filename)
    best = 0
    for phrase in phrases:
        p = normalize(phrase)
        if name == p:
            best = max(best, 100)
        elif p in name:
            best = max(best, 80)
        else:
            tokens = p.split()
            hits = sum(1 for t in tokens if t in name)
            if hits:
                best = max(best, hits * 10)
    return best


def collect_glbs(folder: Path) -> List[Path]:
    return sorted([p for p in folder.rglob("*.glb") if p.is_file()])


def ensure_input_folder(input_path: Path) -> Tuple[Path, tempfile.TemporaryDirectory | None]:
    if input_path.is_dir():
        return input_path, None
    if input_path.is_file() and input_path.suffix.lower() == ".zip":
        tmp = tempfile.TemporaryDirectory(prefix="kenney_glb_")
        with zipfile.ZipFile(input_path, "r") as zf:
            zf.extractall(tmp.name)
        return Path(tmp.name), tmp
    raise FileNotFoundError(f"Input must be a folder or .zip file: {input_path}")


def build_mapping(glb_files: List[Path]) -> Tuple[Dict[str, Path], List[Path]]:
    chosen: Dict[str, Path] = {}
    used_paths = set()

    for catalog_id, phrases in MODEL_RULES.items():
        candidates = []
        for p in glb_files:
            s = score_match(p.stem, phrases)
            if s > 0:
                candidates.append((s, len(p.stem), p))
        candidates.sort(key=lambda x: (-x[0], x[1], str(x[2])))
        for score, _, path in candidates:
            if path not in used_paths:
                chosen[catalog_id] = path
                used_paths.add(path)
                break

    unmatched = [p for p in glb_files if p not in used_paths]
    return chosen, unmatched


def copy_models(mapping: Dict[str, Path], dest_dir: Path, dry_run: bool = False) -> List[str]:
    dest_dir.mkdir(parents=True, exist_ok=True)
    imported = []
    for catalog_id, src in sorted(mapping.items()):
        dest = dest_dir / f"{catalog_id}.glb"
        if dry_run:
            print(f"[DRY] {src.name} -> {dest}")
        else:
            shutil.copy2(src, dest)
            print(f"[OK]  {src.name} -> {dest.name}")
        imported.append(catalog_id)
    return imported


def write_manifest(dest_dir: Path, imported_ids: List[str], dry_run: bool = False) -> None:
    manifest = {"available": sorted(imported_ids)}
    manifest_path = dest_dir / "manifest.json"
    if dry_run:
        print(f"[DRY] Would write {manifest_path} with {len(imported_ids)} ids")
    else:
        with open(manifest_path, "w", encoding="utf-8") as f:
            json.dump(manifest, f, indent=2)
        print(f"[OK]  Wrote {manifest_path}")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, help="Path to extracted folder or downloaded .zip")
    parser.add_argument("--project-root", default=".", help="Project root containing public/models")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    input_path = Path(args.input).expanduser().resolve()
    project_root = Path(args.project_root).expanduser().resolve()
    dest_dir = project_root / "public" / "models"

    extracted_root = None
    temp_dir = None
    try:
        extracted_root, temp_dir = ensure_input_folder(input_path)
        glb_files = collect_glbs(extracted_root)
        if not glb_files:
            print("No .glb files found in input.")
            return 1

        print(f"Found {len(glb_files)} .glb files")
        mapping, unmatched = build_mapping(glb_files)

        print(f"Matched {len(mapping)} models to catalog ids")
        imported_ids = copy_models(mapping, dest_dir, dry_run=args.dry_run)
        write_manifest(dest_dir, imported_ids, dry_run=args.dry_run)

        print("\nUnmatched source files:")
        if unmatched:
            for p in unmatched[:50]:
                print(f"- {p.name}")
            if len(unmatched) > 50:
                print(f"... and {len(unmatched) - 50} more")
        else:
            print("- None")

        print("\nDone.")
        return 0
    finally:
        if temp_dir is not None:
            temp_dir.cleanup()


if __name__ == "__main__":
    raise SystemExit(main())
