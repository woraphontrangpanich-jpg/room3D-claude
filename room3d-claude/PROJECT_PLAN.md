# 3D Room Designer — Full Project Plan (Single-Floor MVP)

## 0. What you're actually building

Two apps glued together by one shared data model:

1. **2D Floor Plan Editor** — a CAD-lite tool: draw room outline, place doors/windows, drag-and-drop furniture (top-down icons), resize/rotate everything.
2. **3D Viewer/Walkthrough** — takes the exact same data and extrudes it into a real 3D scene you can orbit around or walk through in first person, like your Sketchfab reference.

The single most important decision: **the 2D plan is not a picture, it's structured data** (a JSON "scene graph"). The 3D view is just a renderer of that same JSON. If you build it this way, 2D and 3D always stay in sync automatically. If you instead treat 2D as "a drawing" and try to reconstruct 3D from pixels later, you will suffer. So Phase 0 below is the data model — get that right before UI.

---

## 1. Tech stack recommendation

| Layer | Tool | Why |
|---|---|---|
| 2D canvas editor | **Konva.js** (or Fabric.js) on `<canvas>`, wrapped in React | Built-in drag/resize/rotate, snapping, layering, hit-testing — you don't hand-roll vector math |
| 3D engine | **Three.js** via **react-three-fiber (R3F)** | Industry standard, huge ecosystem, works in plain browser, good perf |
| First-person walk controls | Three.js `PointerLockControls` + custom capsule collider | Standard FPS-style movement |
| State management | **Zustand** (or Redux) holding the single JSON scene | One source of truth read by both 2D and 3D views |
| 3D furniture models | **glTF/.glb** format (compressed with Draco/Meshopt) | Native to Three.js, small file size, PBR materials built in |
| Model sourcing | Sketchfab (CC-licensed downloads), Poly Pizza, Quaternius, KayKit, or generate via Meshy/Tripo AI | You will NOT model furniture by hand for an MVP — curate/download instead |
| Textures | PBR texture sets (albedo/normal/roughness) from Poly Haven | For floors, walls, wood, fabric |
| Persistence | LocalStorage → later a backend (Postgres/Firebase) for saved projects | Start local, add accounts later |
| File export | Export scene as `.glb` (via `GLTFExporter`) for sharing/embedding | Lets you reuse Sketchfab-style embeds elsewhere |

---

## 2. Phase 0 — Data model (build this first, literally before any UI)

This is the piece most plans skip, and it's the piece that will save you the most rework.

```json
{
  "room": {
    "id": "room-1",
    "walls": [
      { "id": "w1", "start": [0,0], "end": [500,0], "thickness": 10, "height": 250 },
      { "id": "w2", "start": [500,0], "end": [500,400], "thickness": 10, "height": 250 }
    ],
    "floorMaterial": "oak-wood-01",
    "ceilingHeight": 250,
    "unit": "cm"
  },
  "openings": [
    { "id": "door-1", "wallId": "w1", "type": "door", "position": 120, "width": 90, "height": 210, "swing": "in-left" },
    { "id": "win-1", "wallId": "w2", "type": "window", "position": 80, "width": 120, "height": 100, "sillHeight": 90 }
  ],
  "furniture": [
    {
      "id": "bed-1",
      "catalogId": "bed_queen_01",
      "position": [100, 150],
      "rotationDeg": 90,
      "scale": 1.0,
      "footprint": [160, 200],
      "material": "walnut"
    }
  ]
}
```

Key modeling decisions baked in above:
- **Walls are line segments with thickness + height**, not just drawn rectangles — this is what makes 3D extrusion trivial.
- **Doors/windows are attached to a wall by ID + position-along-wall**, not free-floating — so if a wall moves, openings move with it.
- **Furniture stores a 2D footprint AND references a 3D catalog model** — the 2D icon and 3D mesh are two views of one catalog entry, not two separate assets you keep in sync manually.
- Everything has stable IDs so undo/redo and selection state work cleanly.

---

## 3. Phase 1 — 2D Floor Plan Editor

### 3.1 Core drawing tools
- **Wall/room tool**: click-click-click to draw a closed polygon (room outline); snap to right angles (0/45/90°) and to previous points.
- **Room size input**: numeric width/height/length entry as an alternative to freehand drawing (people who want exact 4m×5m rooms).
- **Grid + snapping**: configurable grid (e.g. 10cm), snap-to-grid toggle, snap-to-other-object edges, snap-to-wall.
- **Measurement/dimension lines**: auto-labeled wall lengths, editable inline (type "350" to resize a wall precisely).
- **Wall thickness & height editing** per wall or globally.
- **Multi-room support** (even though you said "1 floor, 1 room" — still model it so a hallway or closet doesn't require a rewrite later).

### 3.2 Doors & windows
- Drag a door/window type from a palette onto a wall — it auto-snaps to the wall and orients itself perpendicular to it.
- Adjustable: width, height, position along wall, swing direction (in/out, left/right) for doors; sill height for windows.
- Prevent invalid placement (opening wider than the wall segment, overlapping openings).

### 3.3 Furniture placement
- **Categorized catalog panel** (see full furniture list in section 5) with top-down icon thumbnails.
- **Drag-and-drop onto canvas**, then:
  - Move (drag)
  - Rotate (rotate handle or numeric degree input — snap to 15°/45°/90°)
  - Resize/scale (corner handles, with option to lock aspect ratio)
  - Duplicate / delete
  - Layer/z-order for overlapping decor (e.g. rug under table)
- **Collision/overlap warnings**: soft highlight when furniture overlaps a wall or another piece (don't hard-block — real designers sometimes intentionally overlap for planning).
- **Snapping furniture to walls** (a wardrobe should hug a wall automatically) and to grid.
- **Alignment & distribution tools**: align left/center/right, distribute evenly (for a row of dining chairs).
- **Grouping**: group a table + its chairs so they move together.
- **Material/color picker per item** (wood tone, fabric color) — this maps to material swap in 3D later.

### 3.4 Editor UX
- Zoom/pan canvas (scroll to zoom, space+drag or middle-mouse to pan).
- Left sidebar: catalog browser with search + category filters.
- Right sidebar: property inspector for the selected object (position, rotation, size, material).
- Top toolbar: select/move/wall/door/window/dimension tools, undo/redo, save, "Generate 3D" button.
- **Undo/redo** (this is non-negotiable for any drawing tool — implement via command pattern or state snapshots early, it's much harder to bolt on later).
- Keyboard shortcuts: Delete, Ctrl+Z/Y, arrow-key nudge, Ctrl+D duplicate.
- Autosave to localStorage + explicit "Save project" (named projects, JSON export/import).
- Room templates (empty rectangle, L-shape, studio apartment) to skip drawing from scratch.
- Validation before "Generate 3D": closed polygon, no self-intersecting walls, reasonable dimensions.

---

## 4. Phase 2 — 3D Generation & Walkthrough

### 4.1 2D → 3D conversion pipeline
- Extrude each wall polyline into a 3D box (length × thickness × height).
- Cut door/window openings out of the wall geometry (boolean subtraction, or simpler: build walls as segments around the opening rather than true CSG — much faster to implement).
- Generate floor mesh from the room polygon, ceiling mesh (optional, can leave open for camera visibility, or add and hide when in first-person).
- Apply wall/floor materials (textures) from the material chosen in 2D.
- For each furniture item: load its `.glb` from the catalog, position/rotate/scale per the 2D transform, apply chosen material variant if supported.
- Add door as an actual openable mesh (swinging door is a nice realism touch: click to open/close via hinge rotation).
- Add window glass (semi-transparent material) + frame.

### 4.2 Camera / navigation modes
- **Orbit mode** (default, like Sketchfab): rotate/zoom/pan around the whole room from outside/above — good for reviewing the design.
- **Dollhouse/top-down mode**: locked overhead view, useful transition between 2D plan and 3D.
- **First-person walk mode**: WASD + mouse-look, pointer-lock, eye-height camera (~160–170cm), collision so you can't walk through walls/furniture (simple AABB or capsule vs. box collision is enough).
- Smooth transition/animation when switching modes (camera flies from orbit position into walk-start position).
- Mobile: touch-drag orbit, and virtual joystick + drag-to-look for walk mode.

### 4.3 Lighting & realism
- Ambient + directional "sun" light through windows (adjustable time-of-day slider is a great realism win and is cheap to build).
- Point/area lights for lamps and ceiling fixtures — tie fixture furniture items to actual light sources.
- Shadows (Three.js `PCFSoftShadowMap`), baked or real-time depending on perf budget.
- PBR materials (roughness/metalness maps) so wood, fabric, metal, glass all look distinct — this is the single biggest lever for "does it look like the Sketchfab reference" realism.
- Optional: simple ambient occlusion / post-processing (bloom, tone-mapping via Three.js `EffectComposer`) for a polished look.
- Skybox or simple outdoor backdrop visible through windows (even a gradient sky > void black background).

### 4.4 Performance
- Instancing for repeated furniture (e.g. multiple identical chairs) via `InstancedMesh`.
- LOD (swap to lower-poly model at distance) if using detailed catalog models.
- Texture compression (KTX2/Basis) and Draco-compressed geometry.
- Frustum culling is automatic in Three.js, but keep polycount budgets per item (aim <20k triangles per furniture piece for web).

---

## 5. Furniture catalog — categories to include for "realistic full room"

Structure the catalog by room type since you'll want this reusable beyond one room:

**Living room**: sofa (2-seat, 3-seat, sectional, loveseat), armchair, coffee table, TV console/stand, TV, bookshelf, side table, floor lamp, area rug, curtains, wall art/frames, plants (potted), ceiling light fixture.

**Bedroom**: bed (single/double/queen/king), nightstand, wardrobe/closet, dresser, mirror, desk + chair, bedside lamp, rug, curtains.

**Kitchen**: counter/cabinet runs (base + upper), sink, stove/cooktop, refrigerator, dishwasher, kitchen island, dining table, dining chairs, range hood, pendant lights.

**Bathroom**: toilet, sink/vanity, bathtub, shower stall, mirror cabinet, towel rack.

**Office/study**: desk, office chair, bookshelf, filing cabinet, monitor/computer.

**Architectural elements (not "furniture" but essential)**: doors (single, double, sliding), windows (fixed, casement, sliding), staircase (even for single floor, useful for future multi-story), air conditioner (wall-mount split unit + optional ceiling duct type), ceiling fan, electrical outlets/switches (nice detail, low cost), skirting/baseboards, crown molding (realism detail).

**Decor/detail layer** (cheap to add, big realism payoff): rugs, curtains/blinds, wall art, plants, books, lamps, cushions/throw pillows — these are what make a render look "staged" instead of empty like a CAD model.

---

## 6. Gaps you'd likely hit later — addressed now

- **Units & scale**: pick cm or meters as canonical unit internally, let user toggle display units (metric/imperial) — decide this in Phase 0, not later.
- **Real-world proportions**: standard door = 80–90cm wide/200–210cm tall, ceiling height default 240–270cm, counter height ~85–90cm — bake sane defaults into your catalog so novice users don't build a room with a 4m-tall door.
- **Material/texture library management**: you'll want a small material browser (wood tones, paint colors, fabric swatches) reused across floor/wall/furniture, not one-off pickers per object.
- **Asset licensing**: if pulling models from Sketchfab/Poly Pizza, track license type per asset (CC0 vs CC-BY needing attribution) in your catalog metadata now, so you're not auditing hundreds of files later.
- **Save/share**: decide early whether projects live in browser storage only (fast MVP) or need accounts + backend (for sharing a room link, like the Sketchfab embed you referenced).
- **Mobile/touch support**: 2D drag-resize-rotate and 3D orbit/walk both need touch equivalents — plan responsive controls from the start, don't bolt on later.
- **Multi-floor future-proofing**: even for a single floor now, keep the data model floor-aware (`floors: [ {id, elevation, room...} ]`) so adding floor 2 later is additive, not a rewrite.
- **Performance ceiling**: decide a target device (mid-range laptop/phone) and a triangle/texture budget early so the catalog doesn't grow into something that lags in the browser.
- **Export**: users will eventually want to export their room as an image (screenshot), a shareable 3D link (glTF viewer), or even print the 2D floor plan with dimensions — worth stubbing these buttons early even if inactive.

---

## 7. Suggested build order (milestones)

1. Data model + local JSON persistence (no UI yet — just get the schema right, write a couple of test scenes by hand).
2. 2D canvas: draw walls, resize/rotate room, snapping, undo/redo.
3. 2D: doors/windows on walls.
4. 2D: furniture drag/drop from a small catalog (5–10 items), move/rotate/resize.
5. 3D: static extrusion of walls/floor/openings from the data model, orbit camera only.
6. 3D: load furniture `.glb` models mapped from 2D catalog, apply transforms.
7. 3D: lighting, materials, shadows — get it looking "real."
8. 3D: first-person walk mode with collision.
9. Polish: templates, more catalog items, save/load projects, mobile controls, export.

---

## 8. Where this plan intentionally stops

This covers a genuinely realistic single-floor room designer — comparable in ambition to the Sketchfab room you linked, but authorable rather than a fixed model. It does **not** cover: multi-user collaboration, AI auto-furnishing/layout suggestions, physics simulation beyond basic collision, or e-commerce integration (linking real furniture SKUs) — flag if you want any of those scoped in, they're separate feature tracks on top of this foundation.
