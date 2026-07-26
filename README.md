# Room3D — 2D Floor Plan → 3D Walkthrough

A working scaffold for designing a single-floor room in 2D (top-down, like a
blueprint) and instantly viewing/walking through the same room in 3D — the
same idea as tools like Planner5D or the linked Sketchfab room, but
authorable rather than a fixed model.

The full product plan (UX, features, phased roadmap, furniture catalog,
gaps to watch for) lives in `PROJECT_PLAN.md`. This README covers the code
that implements the first slice of that plan.

## Run it

```bash
npm install
npm run dev
```

Open the printed local URL. Use the **2D Floor Plan** tab to edit the room,
then switch to **3D Walkthrough** to see it rendered — both tabs read from
the exact same in-memory scene, so nothing needs to be "synced."

## Architecture

**One data model, two renderers.** The whole app revolves around a single
JSON-like scene object (`src/types/scene.ts`) held in a Zustand store
(`src/store/sceneStore.ts`):

```
RoomScene
├── vertices[]   — shared corner points; walls reference these by ID so
│                  dragging one corner moves every wall attached to it
├── walls[]      — startVertexId/endVertexId + thickness + height (any polygon, not just a rectangle)
├── openings[]   — doors/windows, each attached to a wallId + position along it
└── furniture[]  — catalogId + position + rotation + footprint + color
```

- The **2D editor** (`src/components/Editor2D/`) is a `react-konva` canvas
  that reads/writes this store directly — dragging a sofa updates
  `furniture[].position` in the store, nothing more.
- The **3D viewer** (`src/components/Viewer3D/`) is a `@react-three/fiber`
  scene that reads the *same* store and extrudes walls into boxes, cuts
  door/window gaps, and renders furniture as sized boxes positioned from the
  same `position`/`rotationDeg`/`footprint` fields.

Because both sides read one source of truth, there's no import/export step
between "2D mode" and "3D mode" — switching tabs just swaps which renderer
is mounted.

### File map

```
src/
├── types/scene.ts              Shared data model (Wall, Opening, FurnitureItem, RoomScene)
├── data/furnitureCatalog.ts    ~35 furniture/fixture types across 6 categories, with real-world cm dimensions
├── store/sceneStore.ts         Zustand store: scene state, selection, undo/redo history
├── components/
│   ├── Layout/TopBar.tsx       Tab switcher (2D/3D), undo/redo, reset
│   ├── Editor2D/
│   │   ├── PlanCanvas.tsx      Konva canvas: freeform wall drawing, vertex drag-editing, door/window placement, furniture drag/rotate/resize, meter ruler
│   │   ├── CatalogPanel.tsx    Left sidebar — drag or click to add furniture
│   │   └── Inspector.tsx       Right sidebar — edit selected wall/opening/furniture's exact dimensions/rotation/color
│   └── Viewer3D/
│       ├── Viewer3D.tsx        Canvas setup, lighting, camera mode toggle
│       ├── RoomMesh.tsx        Extrudes any wall polygon (not just rectangles) from the vertex/wall chain; cuts door/window openings
│       ├── FurnitureMeshes.tsx Positions/rotates each furniture instance and hands off to FurnitureShape
│       ├── FurnitureShape.tsx  Procedural mesh builder — one function per shapeType (chair, sofa, bed, fridge, toilet, etc.) instead of a plain box
│       └── WalkControls.tsx    First-person WASD + mouse-look, with simple box collision
├── utils/
│   ├── units.ts                cm ⇄ m/cm/ft conversion + formatting for display
│   └── color.ts                Shade/darken helper used to color furniture sub-parts (legs, doors, etc.)
```

## What's implemented right now

- **Freeform room shapes**: draw any polygon room (L-shape, angled walls,
  not just rectangles) via the "Draw walls" tool — click to place corners,
  live length preview with 45° angle snapping, click near the start point
  (or press Enter) to close the loop, Esc to cancel.
- **Shared vertex model**: corners are shared points, so dragging one
  corner moves every wall attached to it — no gaps from disconnected walls.
- Double-click an existing wall to insert a new corner (for adding a notch/
  L-shape to an already-built room).
- **Meter ruler + unit toggle** (m / cm / ft) along the canvas edges, plus
  a persistent length label on every wall, and precise numeric length entry
  in the Inspector.
- Click-to-place doors and windows on any wall, with adjustable width/height/position
- ~35 furniture/fixture catalog entries across Living room, Bedroom, Kitchen,
  Bathroom, Office, and Architectural (aircon, ceiling fan, staircase)
- Drag-and-drop furniture placement, drag to move, transformer handles to
  resize/rotate, numeric inspector for exact values
- Undo/redo (snapshot-based, ~50 steps)
- **Procedural furniture shapes**: every catalog item renders as a
  recognizable silhouette built from primitives — a chair has a seat,
  backrest, and four legs; a sofa has a base, backrest, and armrests; a bed
  has a frame, mattress, headboard, and pillows; a toilet, sink, fridge,
  stove, etc. each have their own shape — instead of a single box (see
  `FurnitureShape.tsx`).
- 3D extrusion of any wall polygon with real door/window cutouts
  (segment-based, not full CSG — see "Known simplifications" below)
- 3D orbit camera (mouse-drag to look around, like the Sketchfab reference)
- 3D first-person walk mode: click to lock the mouse, WASD/arrows to move,
  with simple AABB collision against walls and furniture so you can't walk
  through them

## Known simplifications (intentional, for a first working slice)

These are called out in `PROJECT_PLAN.md` too — flagging them explicitly so
they're a to-do list, not a mystery later:

1. **Furniture is procedural (primitives), not real downloaded models.**
   Each `shapeType` (chair, sofa, bed, fridge, ...) is built from a handful
   of boxes/cylinders/cones in `FurnitureShape.tsx` — recognizable, but not
   photorealistic. `CatalogEntry.modelPath` is already reserved in the type
   so real `.glb` models (Sketchfab/Poly Pizza/Quaternius) can be swapped in
   per-item later without touching the rest of the code — if `modelPath` is
   set, load it; otherwise fall back to the procedural builder.
2. **Wall openings are cut by segmenting the wall** (solid strips around the
   gap) rather than a true boolean/CSG subtraction. Visually fine for
   rectangular openings; won't handle angled or curved cuts.
3. **2D top-down furniture icons are still plain rectangles** — the 3D side
   now has real shapes, but the 2D floor-plan icons haven't been upgraded
   to matching outline symbols (circle for round table, L for sectional,
   etc.) yet. Purely cosmetic, doesn't block anything.
3. **Furniture collision (walk mode) ignores rotation** — it uses an
   axis-aligned box even for a rotated sofa. Fine for an MVP; swap for
   oriented-box or capsule collision if it becomes noticeable.
4. **No textures yet** — materials are flat colors. PBR textures (wood,
   fabric, tile) from something like Poly Haven are the next realism lever
   after real furniture models.
5. **No persistence beyond the current browser session.** `loadScene`/save-
   to-localStorage hooks exist in the store shape but aren't wired to UI yet.
6. **Single room, single floor**, as scoped. The data model is easy to
   extend to multiple rooms/floors later (see plan doc) but the UI doesn't
   expose that yet.

## Suggested next steps (in priority order)

1. Wire up localStorage save/load + a "My projects" list.
2. Swap the highest-impact procedural shapes for real `.glb` models (start
   with sofa, bed, dining table, TV, fridge) using the `modelPath` fallback.
3. Add PBR floor/wall textures + a material picker in the Inspector.
4. Add a time-of-day light slider (cheap, big realism win).
5. Upgrade 2D furniture icons to per-shapeType outline symbols.
6. Mobile/touch controls for both the 2D editor and 3D walk mode.

See `PROJECT_PLAN.md` for the original roadmap and `PHASE2_PLAN.md` for the
freeform-walls + real-furniture-shapes plan this update implements.
