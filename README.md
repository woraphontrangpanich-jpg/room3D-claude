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
├── walls[]      — line segments with thickness + height
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
│   │   ├── PlanCanvas.tsx      Konva canvas: walls, door/window placement, furniture drag/rotate/resize
│   │   ├── CatalogPanel.tsx    Left sidebar — drag or click to add furniture
│   │   └── Inspector.tsx       Right sidebar — edit selected item's exact dimensions/rotation/color
│   └── Viewer3D/
│       ├── Viewer3D.tsx        Canvas setup, lighting, camera mode toggle
│       ├── RoomMesh.tsx        Extrudes walls/floor from the scene; cuts door/window openings
│       ├── FurnitureMeshes.tsx Renders furniture as positioned/rotated boxes
│       └── WalkControls.tsx    First-person WASD + mouse-look, with simple box collision
```

## What's implemented right now

- **Blank canvas by default.** The app starts with no walls; use "Load sample
  room" in the 2D toolbar to drop in a demo 5m × 4m room instead.
- **Freeform wall drawing.** "+ Draw wall" (or "+ Draw glass wall") lets you
  click point-by-point to lay walls side by side. Click near your starting
  point to close the loop into a room, or press Enter/double-click to finish
  an open wall run. Esc cancels.
- **Glass walls.** Draw them directly with "+ Draw glass wall", or select any
  existing wall and toggle "Glass wall" in the Inspector — renders as a fully
  transparent wall in 3D (same physical glass material as windows).
- Click-to-place doors and windows on any wall, with adjustable width/height/position
- ~90 furniture/fixture catalog entries across Living room, Bedroom, Kitchen,
  Bathroom, Office, Architectural, and Decor (small props)
- Drag-and-drop furniture placement, drag to move, transformer handles to
  resize/rotate, numeric inspector for exact values, plus one-click
  **rotate 90° (either direction)** and **flip left/right** buttons
- Undo/redo (snapshot-based, ~50 steps)
- 3D extrusion of walls with real door/window cutouts (segment-based, not
  full CSG — see "Known simplifications" below)
- 3D orbit camera (mouse-drag to look around, like the Sketchfab reference)
- 3D first-person walk mode: click to lock the mouse, WASD/arrows to move,
  with simple AABB collision against walls and furniture so you can't walk
  through them

## Known simplifications (intentional, for a first working slice)

These are called out in `PROJECT_PLAN.md` too — flagging them explicitly so
they're a to-do list, not a mystery later:

1. **Furniture in 3D is a plain colored box** sized to its real-world
   footprint, not a real model. Swapping in actual `.glb` models (Sketchfab/
   Poly Pizza/Quaternius, or generated) is the highest-leverage next step
   for realism — the catalog (`furnitureCatalog.ts`) already has a stable
   `catalogId` per item to hang a model path off of.
2. **Wall openings are cut by segmenting the wall** (solid strips around the
   gap) rather than a true boolean/CSG subtraction. Visually fine for
   rectangular openings; won't handle angled or curved cuts.
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
2. Swap furniture boxes for real `.glb` models (start with 5–6 hero pieces:
   sofa, bed, dining table, TV, fridge).
3. Add PBR floor/wall textures + a material picker in the Inspector.
4. Add a time-of-day light slider (cheap, big realism win).
5. Mobile/touch controls for both the 2D editor and 3D walk mode.

See `PROJECT_PLAN.md` for the full roadmap this was scaffolded from.
