#!/usr/bin/env python3
"""
download_models.py
------------------
Downloads all Kenney furniture GLB models from Poly Pizza and saves them
into public/models/ with catalog-friendly snake_case filenames.
Also auto-generates public/models/manifest.json from whatever was downloaded.

Usage:
    python download_models.py

Requirements:
    pip install requests
"""

import os
import json
import time
import requests

# ---------------------------------------------------------------------------
# Model list: (display_name, catalog_id)
# catalog_id matches furnitureCatalog.ts ids — adjust to your actual ids.
# ---------------------------------------------------------------------------
MODELS = [
    # Bathroom
    ("Bathroom Mirror",             "bathroom_mirror"),
    ("Bathroom Sink",               "bathroom_sink"),
    ("Bathroom Sink Square",        "bathroom_sink_square"),
    ("Bathroom Cabinet",            "bathroom_cabinet"),
    ("Bathroom Cabinet Drawer",     "bathroom_cabinet_drawer"),
    ("Bathtub",                     "bathtub"),
    ("Shower Round",                "shower"),
    ("Toilet",                      "toilet"),
    ("Toilet Square",               "toilet_square"),
    # Bedroom
    ("Bed Bunk",                    "bed_bunk"),
    ("Bed Double",                  "bed_double"),
    ("Bed Single",                  "bed_single"),
    ("Cabinet Bed",                 "cabinet_bed"),
    ("Cabinet Bed Drawer",          "cabinet_bed_drawer"),
    ("Cabinet Bed Drawer Table",    "cabinet_bed_drawer_table"),
    # Seating
    ("Chair",                       "chair"),
    ("Chair Cushion",               "chair_cushion"),
    ("Chair Modern Cushion",        "chair_modern_cushion"),
    ("Chair Modern Frame Cushion",  "chair_modern_frame_cushion"),
    ("Chair Rounded",               "chair_rounded"),
    ("Desk Chair",                  "desk_chair"),
    ("Lounge Chair",                "lounge_chair"),
    ("Lounge Design Chair",         "lounge_design_chair"),
    ("Bar Stool",                   "bar_stool"),
    ("Stool Bar Square",            "stool_bar_square"),
    ("Bench",                       "bench"),
    ("Bench Cushion",               "bench_cushion"),
    ("Bench Cushion Low",           "bench_cushion_low"),
    # Sofas
    ("Lounge Sofa",                 "sofa"),
    ("Lounge Sofa Long",            "sofa_long"),
    ("Lounge Sofa Corner",          "sofa_corner"),
    ("Lounge Sofa Ottoman",         "sofa_ottoman"),
    ("Lounge Design Sofa",          "sofa_design"),
    ("Lounge Design Sofa Corner",   "sofa_design_corner"),
    # Tables
    ("Coffee Table",                "coffee_table"),
    ("Table Coffee Glass",          "coffee_table_glass"),
    ("Table Coffee Square",         "coffee_table_square"),
    ("Table",                       "dining_table"),
    ("Round Table",                 "table_round"),
    ("Table Cross",                 "table_cross"),
    ("Table Cross Cloth",           "table_cross_cloth"),
    ("Side Table",                  "side_table"),
    ("Side Table Drawers",          "side_table_drawers"),
    ("Kitchen Bar",                 "kitchen_island"),
    # Desks & Office
    ("Desk",                        "desk"),
    ("Desk Corner",                 "desk_corner"),
    ("Computer Screen",             "monitor"),
    ("Computer Keyboard",           "keyboard"),
    ("Laptop",                      "laptop"),
    # Storage / Shelving
    ("Bookcase Open",               "bookshelf_open"),
    ("Bookcase Open Low",           "bookshelf_open_low"),
    ("Bookcase Closed",             "bookshelf_closed"),
    ("Bookcase Closed Doors",       "bookshelf_closed_doors"),
    ("Bookcase Closed Wide",        "bookshelf_closed_wide"),
    ("Books",                       "books"),
    ("Cabinet Television",          "tv_stand"),
    ("Cabinet Television Doors",    "tv_stand_doors"),
    # Kitchen
    ("Kitchen Cabinet",             "kitchen_cabinet_lower"),
    ("Kitchen Cabinet Corner",      "kitchen_cabinet_corner"),
    ("Kitchen Cabinet Drawer",      "kitchen_cabinet_drawer"),
    ("Kitchen Cabinet Upper",       "kitchen_cabinet_upper"),
    ("Kitchen Cabinet Upper Large", "kitchen_cabinet_upper_large"),
    ("Kitchen Sink",                "kitchen_sink"),
    ("Kitchen Stove",               "stove"),
    ("Kitchen Stove Electric",      "stove_electric"),
    ("Kitchen Fridge",              "refrigerator"),
    ("Kitchen Fridge Built In",     "refrigerator_builtin"),
    ("Kitchen Fridge Large",        "refrigerator_large"),
    ("Kitchen Fridge Small",        "refrigerator_small"),
    ("Kitchen Microwave",           "microwave"),
    ("Kitchen Coffee Machine",      "coffee_machine"),
    ("Kitchen Blender",             "blender"),
    ("Kitchen Hood Large",          "range_hood"),
    ("Toaster",                     "toaster"),
    ("Dryer",                       "dryer"),
    ("Washer",                      "washer"),
    # Lamps & Lighting
    ("Lamp Square Floor",           "floor_lamp_square"),
    ("Lamp Square Table",           "table_lamp_square"),
    ("Lamp Square Ceiling",         "ceiling_lamp_square"),
    ("Lamp Round Floor",            "floor_lamp"),
    ("Lamp Round Table",            "table_lamp"),
    ("Lamp Wall",                   "wall_lamp"),
    ("Ceiling Fan",                 "ceiling_fan"),
    # TV / Media
    ("Television",                  "tv"),
    ("Television Vintage",          "tv_vintage"),
    ("Speaker",                     "speaker"),
    ("Speaker Small",               "speaker_small"),
    ("Radio",                       "radio"),
    # Rugs & Floor
    ("Rug Round",                   "rug_round"),
    ("Rug Rectangle",               "rug_rectangle"),
    ("Rug Rounded",                 "rug_rounded"),
    ("Rug Square",                  "rug_square"),
    ("Rug Doormat",                 "rug_doormat"),
    # Plants / Decor
    ("Potted Plant",                "plant"),
    ("Plant Small",                 "plant_small"),
    ("Trashcan",                    "trash_bin"),
    ("Coat Rack",                   "coat_rack"),
    ("Coat Rack Standing",          "coat_rack_standing"),
    ("Cardboard Box Closed",        "storage_box"),
    ("Cardboard Box Open",          "storage_box_open"),
]

# ---------------------------------------------------------------------------
# Poly Pizza search → GLB download URL resolution
# ---------------------------------------------------------------------------
SEARCH_URL = "https://poly.pizza/api/search"
BASE_HEADERS = {"User-Agent": "Mozilla/5.0 (furniture-model-downloader/1.0)"}


def search_model(name: str) -> dict | None:
    """Search Poly Pizza for a model by name, return first CC0 GLB hit."""
    try:
        r = requests.get(
            SEARCH_URL,
            params={"q": name, "format": "glb", "licence": "CC0"},
            headers=BASE_HEADERS,
            timeout=10,
        )
        r.raise_for_status()
        data = r.json()
        results = data.get("results") or data.get("Assets") or []
        for asset in results:
            dl = asset.get("Download") or asset.get("download") or ""
            if dl and dl.endswith(".glb"):
                return asset
        return None
    except Exception as e:
        print(f"  [search error] {name}: {e}")
        return None


def download_file(url: str, dest_path: str) -> bool:
    """Download url → dest_path. Returns True on success."""
    try:
        r = requests.get(url, headers=BASE_HEADERS, timeout=30, stream=True)
        r.raise_for_status()
        os.makedirs(os.path.dirname(dest_path), exist_ok=True)
        with open(dest_path, "wb") as f:
            for chunk in r.iter_content(chunk_size=8192):
                f.write(chunk)
        size_kb = os.path.getsize(dest_path) / 1024
        print(f"  ✓  {os.path.basename(dest_path)}  ({size_kb:.0f} KB)")
        return True
    except Exception as e:
        print(f"  ✗  {os.path.basename(dest_path)}: {e}")
        return False


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    out_dir = os.path.join("public", "models")
    os.makedirs(out_dir, exist_ok=True)

    downloaded: list[str] = []
    failed: list[str] = []

    total = len(MODELS)
    for i, (display_name, catalog_id) in enumerate(MODELS, 1):
        dest = os.path.join(out_dir, f"{catalog_id}.glb")

        # Skip already-downloaded files (safe to re-run)
        if os.path.exists(dest) and os.path.getsize(dest) > 0:
            print(f"[{i}/{total}] SKIP  {catalog_id}.glb (already exists)")
            downloaded.append(catalog_id)
            continue

        print(f"[{i}/{total}] Searching: {display_name!r} → {catalog_id}.glb")
        asset = search_model(display_name)

        if not asset:
            print(f"  ✗  No GLB URL found for {display_name!r}")
            failed.append(catalog_id)
            time.sleep(0.5)
            continue

        url = asset.get("Download") or asset.get("download") or ""
        ok = download_file(url, dest)
        if ok:
            downloaded.append(catalog_id)
        else:
            failed.append(catalog_id)

        time.sleep(0.3)  # polite rate limit

    # Write manifest.json
    manifest_path = os.path.join(out_dir, "manifest.json")
    manifest = {"available": sorted(downloaded)}
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2)
    print(f"\n✅  manifest.json written with {len(downloaded)} models.")

    if failed:
        print(f"\n⚠️  {len(failed)} models not found / failed:")
        for cid in failed:
            print(f"   - {cid}")
        print("\n   For missing models try manually:")
        print("   • https://poly.pizza  (search, download GLTF, rename to <id>.glb)")
        print("   • https://www.mixos.io/free-models/furniture  (bathroom appliances)")
        print("   • https://furnimesh.com/library/  (kitchen appliances)")

    print(f"\nDone. Models saved to: {os.path.abspath(out_dir)}/")


if __name__ == "__main__":
    main()
