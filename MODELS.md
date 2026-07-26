# Adding real 3D models

Every furniture item currently renders as a placeholder box sized to its
real-world footprint/height. The rendering code is already wired to use a
**real `.glb` model instead, the moment you add one** — no code changes
required for the common case.

## How the wiring works

- `src/components/Viewer3D/FurnitureModel.tsx` loads a `.glb` via
  `@react-three/drei`'s `useGLTF`, then automatically rescales and recenters
  it to match the item's `footprint` (width/depth) and `heightCm` from
  `src/data/furnitureCatalog.ts` — so you don't need to pre-scale or
  pre-position the model yourself, whatever real-world units it was exported in.
- `src/components/Viewer3D/FurnitureMeshes.tsx` reads
  `public/models/manifest.json` once on load to know which catalog items
  have a real model available. Anything not listed there keeps using the
  placeholder box. If a listed model fails to load (bad path, corrupt file),
  it also falls back to the box instead of crashing the viewer.

## Steps to add a model

1. **Get a `.glb` file** for the item (see sources below).
2. **Save it** as `public/models/<catalogId>.glb`, where `<catalogId>` is the
   `id` field from `src/data/furnitureCatalog.ts` — e.g. the sofa entry is
   `{ id: "sofa_2seat", ... }`, so save the file as
   `public/models/sofa_2seat.glb`.
3. **Register it** by adding that same id to the `available` array in
   `public/models/manifest.json`:
   ```json
   { "available": ["sofa_2seat"] }
   ```
4. Reload the app (3D tab). That item now renders the real model.

Repeat for as many catalog ids as you have models for — partial coverage is
fine, everything else just stays a box until you get to it.

If you'd rather point an id at a shared/reused model file at a different
path, you can instead set `modelUrl` directly on that entry in
`furnitureCatalog.ts` (e.g. `modelUrl: "/models/shared/generic_chair.glb"`)
and skip the manifest for it.

## Where to get free `.glb` furniture models

All of these are free and usable in a project like this (check each
model's specific license before shipping commercially — most on these sites
are CC0 or CC-BY):

- **[Kenney.nl](https://kenney.nl/assets?q=3d)** — CC0, no attribution
  required. Has furniture/room asset packs already in `.glb`/`.gltf`. Easiest
  legal option; best starting point.
- **[Poly Pizza](https://poly.pizza)** — aggregates CC0/CC-BY models
  (successor to Google Poly), searchable, many exported as `.glb` directly.
- **[Sketchfab](https://sketchfab.com)** — filter by "Downloadable" +
  license (CC0 / CC-BY); largest selection but quality/topology varies a lot
  per model, and many aren't free.
- **[Quaternius](https://quaternius.com)** — free low-poly asset packs,
  including furniture/interior sets, CC0.

## Tips for a consistent look

- Try to keep all your sourced models in a similar art style (e.g. all
  low-poly/flat-shaded, or all realistic-PBR) — mixing styles looks worse
  than plain boxes.
- If a model looks too dark or wrong-colored in the 3D viewer, it may be
  missing textures on export — re-export with "embed textures" checked
  (most tools call this "glTF Embedded" or similar), or convert with
  [glTF-Transform](https://gltf-transform.dev/) / Blender's glTF exporter.
- Keep individual files small (under a few MB each) — 90 heavy models will
  make the 3D tab slow to load. Simplify/decimate geometry in Blender first
  if a downloaded model is too dense.
