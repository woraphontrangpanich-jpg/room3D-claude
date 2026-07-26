# Phase 2 Plan — Freeform Room Shapes + Real Furniture Silhouettes

Two upgrades to the current scaffold. Both are additive to the existing
data model (`Wall`, `Opening`, `FurnitureItem`, `CatalogEntry`) — nothing
here requires a rewrite, just extension.

---

## 1. Freeform wall drawing (any room shape, not just a fixed box)

### 1.1 What changes conceptually
Right now the room is 4 hardcoded walls. You want the user to **draw** the
walls themselves — any polygon: L-shape, angled corner, non-rectangular
room. The data model already supports this (`walls: Wall[]` is already a
list of arbitrary line segments) — this is purely a **2D editor UX**
problem, not a data model problem.

### 1.2 Drawing tool — interaction design
A "Draw Walls" tool, similar to Figma's pen tool / SketchUp's line tool:

- **Click** to place the first point (a wall vertex).
- **Move mouse** → a live preview wall segment follows the cursor from the
  last placed point, with:
  - Live length label in meters next to the segment (e.g. `3.20 m`)
  - Angle snapping to 0°/45°/90° relative to the previous wall when the
    cursor is close to those angles (with a visual snap indicator)
  - Optional: press **Tab** or type a number to enter an exact length for
    the segment before clicking (precise input, not just eyeballing)
- **Click again** to commit that wall segment and start the next one from
  that point.
- **Double-click, press Enter, or click back on the starting point** to
  close the loop and finish the room.
- **Escape** cancels the in-progress wall chain.
- Walls snap to a grid (toggleable) and to existing wall endpoints/edges so
  corners actually connect (critical — open the door here for a common bug:
  two "touching" walls that are actually 0.3cm apart and leave a gap in 3D).

### 1.3 Editing an existing shape
Once a room exists, users need to reshape it without redrawing from
scratch:
- Each wall endpoint (vertex) is a draggable handle. Dragging a shared
  vertex moves **both** connected walls (since two walls share that point) —
  this is the main reason walls need to reference shared vertices, not just
  independent start/end coordinates (see 1.5 below).
- **Double-click a wall** to insert a new vertex at that point (splits one
  wall into two), enabling an L-shape or notch to be added to an existing
  rectangle.
- **Select a wall → Delete** removes it (with a warning if it breaks the
  loop / leaves the room open).
- Drag a whole wall (not just an endpoint) to move it in parallel, keeping
  both endpoints' relative offset.
- Numeric inspector for the selected wall: exact length, thickness, height
  — typing a new length stretches the wall from the endpoint nearest the
  next wall in the loop.

### 1.4 Units in meters
- **Canonical internal unit stays centimeters** (as now, for precision —
  avoids floating point drift), but **all displayed numbers convert to
  meters** with 2 decimal places (e.g. `450cm` internally → shown as `4.50 m`).
- Add a small **unit toggle** in the top bar: `m` / `cm` / `ft` — changes
  display formatting everywhere (wall length labels, inspector fields,
  furniture dimensions) without touching the underlying data.
- **Grid + ruler**: draw ruled tick marks along two edges of the canvas
  (like Figma/CAD tools), labeled in the active unit, with major gridlines
  every 1m and minor every 0.1m — this alone makes "is this room actually
  4 meters" answerable at a glance instead of guessing from pixel size.
- **Live dimension lines**: while a wall is selected (not just while
  drawing), show its length label persistently along the wall, like
  architectural drawings.

### 1.5 Data model addition needed
To make shared corners behave correctly (drag one corner, both walls
follow), it's worth adding an explicit **vertex layer** rather than each
wall owning independent start/end points:

```ts
interface RoomVertex {
  id: string;
  point: [number, number]; // cm
}

interface Wall {
  id: string;
  startVertexId: string;
  endVertexId: string;
  thickness: number;
  height: number;
}
```

This is the one real structural change. Walls reference vertices by ID
instead of embedding raw coordinates twice (once as another wall's `end`,
once as this wall's `start`) — today, if you move a corner, you'd have to
find and update *two* wall objects and hope they stay equal. With shared
vertices, moving one vertex automatically updates every wall touching it,
and it becomes trivial to detect "is this polygon closed" (does the chain
of vertices loop back to the start).

### 1.6 Validation & guardrails
- **Closed-loop check** before allowing "Generate 3D" / switching to the 3D
  tab — walk the vertex graph and confirm it forms one closed loop (or
  clearly flag an open gap on the 2D canvas with a highlighted dashed line
  where it's not closed).
- **Self-intersection check** — warn if the polygon crosses itself (a wall
  drawn through another wall), since that breaks floor-shape triangulation
  in 3D.
- **Minimum wall length** (e.g. 20cm) to avoid degenerate geometry.
- **Concave/L-shaped polygons**: the current 3D floor mesh uses
  `THREE.Shape` + `shapeGeometry`, which already handles concave polygons
  correctly (it's not limited to rectangles) — so no 3D-side change is
  needed there, just making sure the 2D tool can actually produce a
  concave loop.

### 1.7 Rooms with holes / multiple rooms (flag for later, not now)
Not in scope for "1 floor, 1 room" as you've stated, but worth knowing the
model supports it later: multiple separate `walls[]` polygons (e.g. a
hallway carved out of a bigger shape, or a second room) is an additive
change — a `rooms: RoomScene[]` wrapper — not a rewrite.

---

## 2. Real furniture shapes (replacing boxes)

### 2.1 The core decision: procedural shapes vs. real 3D models
There are two ways to make furniture look like furniture instead of a
colored box, and they're not mutually exclusive — I'd recommend doing
**both, in this order**:

**Tier 1 — Procedural silhouettes (build first, no external assets needed)**
Instead of one `BoxGeometry` per item, build each furniture *type* out of a
small combination of primitives (boxes, cylinders, rounded boxes) that
together read as the right silhouette. For example:

| Item | Built from |
|---|---|
| Chair | seat (box) + backrest (thin box, angled) + 4 legs (thin cylinders) |
| Dining table | tabletop (box) + 4 legs (cylinders) |
| Sofa | base cushion (box) + backrest (box) + 2 armrests (boxes) + optionally rounded edges |
| Bed | frame (flat box) + mattress (box, slightly inset, rounded top edge) + headboard (box) + 1–2 pillows (small rounded boxes) |
| Wardrobe / dresser | body (box) + 2–3 door panel seams (thin inset boxes or just edge lines) + small handle knobs (tiny cylinders) |
| Toilet | base (rounded box/cylinder) + tank (box) + seat (flattened torus or rounded box) |
| Sink/vanity | basin (shallow box with rounded top) + cabinet base (box) + faucet (thin cylinder) |
| Fridge/stove/dishwasher | body (box) + a couple of thin inset panel lines/handle for detail |
| Lamp | base (cylinder) + pole (thin cylinder) + shade (cone or lathe shape) |
| Plant | pot (frustum/cylinder) + foliage (a few overlapping spheres or icosahedrons) |
| TV | thin flat box + small stand base |
| Rug | flat box, just a different height (already close to correct) |

This is a **shape builder function per furniture "shapeType"**, not per
individual catalog item — e.g. every dining chair, office chair, and
armchair variant can reuse a parameterized `buildChair(seatW, seatD,
backH...)` function, fed by that item's footprint/height. This gets you
from "everything is a box" to "everything is recognizably furniture" with
zero new asset files, no downloads, no licensing to track, and it stays
lightweight (a handful of primitives per item, not thousands of polygons).

**Tier 2 — Real `.glb` models (swap in progressively, after Tier 1 works)**
For the pieces where silhouette really matters visually (sofa, bed, dining
table + chairs, TV, fridge are the highest-impact ones people notice first),
replace the procedural mesh with a real downloaded model:
- Source from Sketchfab (CC-licensed, downloadable), Poly Pizza, Quaternius,
  or KayKit — free, web-ready, glTF/.glb format.
- Track per catalog entry: `modelPath` (optional) — if present, load the
  `.glb`; if absent, fall back to the Tier 1 procedural builder. This means
  the catalog degrades gracefully — you don't need a real model for all ~35
  items on day one, just the ones that matter most, and everything else
  still looks like furniture instead of a box.
- Track license/attribution per model in the catalog metadata now, so
  you're not auditing sources later (this was flagged in the original
  project plan too, still applies here).

### 2.2 Data model addition needed
```ts
interface CatalogEntry {
  // ...existing fields...
  shapeType: ShapeType;        // e.g. "chair" | "sofa" | "bed" | "table-rect" | ...
  modelPath?: string;          // optional .glb path — if set, takes priority over shapeType builder
}
```
The furniture *instance* (`FurnitureItem`) doesn't need to change at all —
it still just stores `catalogId`, `position`, `rotationDeg`, `footprint`,
`heightCm`, `color`. The renderer looks up the catalog entry, and either
loads the model or calls the matching procedural builder, passing in that
instance's actual footprint/height so a resized chair still scales
correctly either way.

### 2.3 2D top-down icons should get the same treatment
Right now the 2D canvas also draws every item as a plain rectangle. Once
`shapeType` exists, the 2D icon can draw a simple representative outline
per type too (a circle for a round table, an L for a sectional sofa, a
rectangle with a diagonal line for a bed, a small quarter-circle arc for a
door swing) — cheap to add once the taxonomy from 2.2 exists, and it makes
the floor plan itself easier to read at a glance, closer to real
architectural floor plan symbols.

### 2.4 Rotation & materials
- Procedural shapes rotate for free (it's all one `<group>` per item,
  already wired to `rotationDeg` in the current code).
- Materials: once shapes have sub-parts (e.g. a chair's legs vs. seat),
  each sub-part can get its own material — legs as a metal/wood material,
  cushion as fabric-colored — instead of one flat color for the whole item.
  This is a good moment to also introduce the small **material picker**
  mentioned in the original plan's "next steps" (wood tone, fabric color)
  since sub-parts give you somewhere meaningful to apply it.

### 2.5 Performance note
Procedural furniture made of 5–10 primitives each is still very cheap
(tens of primitives × ~30 items = nowhere near a performance concern for
a single room). If you later add rooms with hundreds of items, revisit
with `InstancedMesh` for repeated items (e.g. a row of identical dining
chairs) — not needed yet.

---

## 3. Suggested build order for this phase

1. Add `RoomVertex` layer + migrate the 4 hardcoded walls to reference
   vertices (data model change, small and mechanical).
2. Build the "Draw Walls" 2D tool: click-to-place, live length preview,
   angle snap, close-loop detection.
3. Add vertex-drag editing + wall insertion (double-click to split) on top
   of the drawing tool.
4. Add meter-based ruler/grid + unit toggle + persistent dimension labels.
5. Add closed-loop / self-intersection validation before allowing 3D view.
6. Define `ShapeType` enum + one procedural builder function per type;
   wire `RoomMesh`'s furniture renderer (`FurnitureMeshes.tsx`) to call the
   right builder instead of always rendering `BoxGeometry`.
7. Update 2D `PlanCanvas` icons to draw simple per-type outlines instead of
   plain rectangles.
8. (Later) Start swapping in real `.glb` models for the 5–6 highest-impact
   items, with `modelPath` fallback logic.

Steps 1–5 (freeform walls) and 6–7 (real furniture shapes) are independent
of each other and can be built in either order or in parallel — they only
share the fact that both live in the same store and renderers.
