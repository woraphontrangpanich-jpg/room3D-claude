#!/usr/bin/env python3
"""
download_furniture_models.py

Download the free Eclair/Kenney furniture GLB zip automatically, extract it,
map files to project catalog ids, copy them into public/models/, and write
public/models/manifest.json.

What it does:
- Tries to download the public zip directly from itch.io/Eclair asset page
- Extracts all .glb files
- Matches filenames to catalog ids using keyword rules
- Copies matched files to public/models/<catalog_id>.glb
- Writes public/models/manifest.json

Usage:
  python download_furniture_models.py --project-root .
  python download_furniture_models.py --project-root . --keep-zip
  python download_furniture_models.py --project-root . --dry-run

Notes:
- The asset page advertises a free, no-login zip named:
  furniture-kit-glb-pack-140-free-cc0-3d-models-glb.zip
- If itch changes the final download URL flow, the script will print the page it
  found and where to patch the URL extractor.
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
from html.parser import HTMLParser
from pathlib import Path
from typing import Dict, List, Tuple
from urllib.parse import urljoin

import requests

ASSET_PAGE = "https://eclair-assets.itch.io/furniture-kit-glb-pack-140-free-cc0-3d-models"
PURCHASE_PAGE = f"{ASSET_PAGE}/purchase"
ZIP_NAME = "furniture-kit-glb-pack-140-free-cc0-3d-models-glb.zip"
HEADERS = {"User-Agent": "Mozilla/5.0 (furniture-downloader/1.0)"}

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
    "lounge_design_chair": ["lounge design chair"],
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

class LinkParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []
    def handle_starttag(self, tag, attrs):
        if tag.lower() == 'a':
            d = dict(attrs)
            href = d.get('href')
            if href:
                self.links.append(href)


def normalize(text: str) -> str:
    text = text.lower()
    text = re.sub(r'[_\-]+', ' ', text)
    text = re.sub(r'[^a-z0-9 ]+', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
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
            hits = sum(1 for t in p.split() if t in name)
            best = max(best, hits * 10)
    return best


def collect_glbs(folder: Path) -> List[Path]:
    return sorted([p for p in folder.rglob('*.glb') if p.is_file()])


def extract_csrf_token(html: str) -> str:
    m = re.search(r'<meta name="csrf_token" value="([^"]*)"', html)
    return m.group(1) if m else ""


def extract_game_id(html: str) -> str:
    m = re.search(r'"id"\s*:\s*(\d+)', html)
    if m:
        return m.group(1)
    raise RuntimeError("Could not discover game id from asset page")


def request_direct_download_url(session: requests.Session) -> str:
    purchase_page = session.get(PURCHASE_PAGE, headers=HEADERS, timeout=30)
    purchase_page.raise_for_status()
    html = purchase_page.text

    game_id = extract_game_id(html)
    csrf_token = extract_csrf_token(html)
    download_endpoint = f"{ASSET_PAGE}/download_url"

    resp = session.post(
        download_endpoint,
        headers={**HEADERS, "Referer": PURCHASE_PAGE},
        timeout=30,
        data={"csrf_token": csrf_token, "reward_id": ""},
    )
    resp.raise_for_status()

    payload = resp.json()
    url = payload.get("url")
    if not url:
        raise RuntimeError(f"Download URL response did not include a url for game {game_id}")
    return url


def discover_zip_url(session: requests.Session) -> str:
    r = session.get(ASSET_PAGE, headers=HEADERS, timeout=30)
    r.raise_for_status()
    html = r.text

    if ZIP_NAME in html:
        m = re.search(r'href=["\']([^"\']*' + re.escape(ZIP_NAME) + r'[^"\']*)["\']', html, re.I)
        if m:
            return urljoin(ASSET_PAGE, m.group(1))

    parser = LinkParser()
    parser.feed(html)
    for href in parser.links:
        if ZIP_NAME in href:
            return urljoin(ASSET_PAGE, href)

    for href in parser.links:
        if 'download' in href.lower():
            return urljoin(ASSET_PAGE, href)

    return request_direct_download_url(session)


def download_zip(session: requests.Session, out_path: Path, dry_run: bool = False) -> Path:
    if not dry_run and out_path.exists() and zipfile.is_zipfile(out_path):
        print(f'[OK] Reusing existing zip at {out_path}')
        return out_path

    url = discover_zip_url(session)
    print(f'Found download URL: {url}')
    if dry_run:
        print(f'[DRY] Would download to {out_path}')
        return out_path

    with session.get(url, headers=HEADERS, timeout=60, stream=True, allow_redirects=True) as r:
        r.raise_for_status()
        out_path.parent.mkdir(parents=True, exist_ok=True)
        with open(out_path, 'wb') as f:
            for chunk in r.iter_content(chunk_size=1024 * 64):
                if chunk:
                    f.write(chunk)
    print(f'[OK] Downloaded zip to {out_path}')
    return out_path


def extract_zip(zip_path: Path, target_dir: Path, dry_run: bool = False) -> Path:
    if dry_run:
        print(f'[DRY] Would extract {zip_path} -> {target_dir}')
        return target_dir
    target_dir.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(zip_path, 'r') as zf:
        zf.extractall(target_dir)
    print(f'[OK] Extracted zip to {target_dir}')
    return target_dir


def build_mapping(glb_files: List[Path]) -> Tuple[Dict[str, Path], List[Path]]:
    chosen: Dict[str, Path] = {}
    used = set()
    for catalog_id, phrases in MODEL_RULES.items():
        candidates = []
        for p in glb_files:
            s = score_match(p.stem, phrases)
            if s > 0:
                candidates.append((s, len(p.stem), p))
        candidates.sort(key=lambda x: (-x[0], x[1], str(x[2])))
        for _, _, path in candidates:
            if path not in used:
                chosen[catalog_id] = path
                used.add(path)
                break
    unmatched = [p for p in glb_files if p not in used]
    return chosen, unmatched


def copy_models(mapping: Dict[str, Path], dest_dir: Path, dry_run: bool = False) -> List[str]:
    if not dry_run:
        dest_dir.mkdir(parents=True, exist_ok=True)
    imported = []
    for catalog_id, src in sorted(mapping.items()):
        dest = dest_dir / f'{catalog_id}.glb'
        if dry_run:
            print(f'[DRY] {src.name} -> {dest}')
        else:
            shutil.copy2(src, dest)
            print(f'[OK]  {src.name} -> {dest.name}')
        imported.append(catalog_id)
    return imported


def write_manifest(dest_dir: Path, imported_ids: List[str], dry_run: bool = False) -> None:
    manifest = {'available': sorted(imported_ids)}
    manifest_path = dest_dir / 'manifest.json'
    if dry_run:
        print(f'[DRY] Would write {manifest_path} with {len(imported_ids)} ids')
        return
    with open(manifest_path, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, indent=2)
    print(f'[OK]  Wrote {manifest_path}')


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument('--project-root', default='.', help='Project root containing public/models')
    parser.add_argument('--keep-zip', action='store_true', help='Keep downloaded zip file')
    parser.add_argument('--dry-run', action='store_true')
    args = parser.parse_args()

    project_root = Path(args.project_root).expanduser().resolve()
    models_dir = project_root / 'public' / 'models'
    downloads_dir = project_root / '.model_downloads'
    zip_path = downloads_dir / ZIP_NAME
    extract_dir = downloads_dir / 'extracted'

    session = requests.Session()
    temp_cleanup_needed = False

    try:
        download_zip(session, zip_path, dry_run=args.dry_run)
        extract_zip(zip_path, extract_dir, dry_run=args.dry_run)

        if args.dry_run:
            print('[DRY] Skipping GLB scan because no zip was downloaded/extracted.')
            return 0

        glb_files = collect_glbs(extract_dir)
        if not glb_files:
            print('No .glb files found after extraction.')
            return 1

        print(f'Found {len(glb_files)} .glb files')
        mapping, unmatched = build_mapping(glb_files)
        print(f'Matched {len(mapping)} models to catalog ids')

        imported_ids = copy_models(mapping, models_dir, dry_run=args.dry_run)
        write_manifest(models_dir, imported_ids, dry_run=args.dry_run)

        print('\nUnmatched source files:')
        if unmatched:
            for p in unmatched[:50]:
                print(f'- {p.name}')
            if len(unmatched) > 50:
                print(f'... and {len(unmatched) - 50} more')
        else:
            print('- None')

        if not args.keep_zip and zip_path.exists():
            zip_path.unlink()
            print(f'\n[OK] Removed temporary zip: {zip_path}')

        print('\nDone.')
        print(f'Models directory: {models_dir}')
        return 0
    except requests.HTTPError as e:
        print(f'HTTP error: {e}')
        return 1
    except Exception as e:
        print(f'Error: {e}')
        return 1


if __name__ == '__main__':
    raise SystemExit(main())
