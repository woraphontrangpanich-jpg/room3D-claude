import { create } from "zustand";
import type { FurnitureItem, Opening, Point, RoomScene, RoomVertex, Wall } from "../types/scene";
import { getCatalogEntry } from "../data/furnitureCatalog";
import type { DisplayUnit } from "../utils/units";

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

const DEFAULT_WALL_HEIGHT = 260;
const DEFAULT_WALL_THICKNESS = 12;

// A simple default rectangular room (5m x 4m) so the app isn't empty on load.
function defaultRoom(): RoomScene {
  const w = 500;
  const d = 400;
  const height = DEFAULT_WALL_HEIGHT;

  const vertices: RoomVertex[] = [
    { id: uid("v"), point: [0, 0] },
    { id: uid("v"), point: [w, 0] },
    { id: uid("v"), point: [w, d] },
    { id: uid("v"), point: [0, d] },
  ];

  const walls: Wall[] = vertices.map((v, i) => {
    const next = vertices[(i + 1) % vertices.length];
    return {
      id: uid("wall"),
      startVertexId: v.id,
      endVertexId: next.id,
      thickness: DEFAULT_WALL_THICKNESS,
      height,
    };
  });

  return {
    vertices,
    walls,
    openings: [
      { id: uid("open"), wallId: walls[0].id, type: "door", position: 100, width: 90, height: 210, swing: "in-left" },
      { id: uid("open"), wallId: walls[1].id, type: "window", position: 200, width: 140, height: 120, sillHeight: 90 },
    ],
    furniture: [],
    floorMaterial: "oak-wood-01",
    ceilingHeight: height,
    unit: "cm",
  };
}

export type SelectableKind = "wall" | "vertex" | "opening" | "furniture" | null;

interface HistoryEntry {
  scene: RoomScene;
}

interface SceneState {
  scene: RoomScene;
  selectedId: string | null;
  selectedKind: SelectableKind;
  history: HistoryEntry[];
  future: HistoryEntry[];
  displayUnit: DisplayUnit;

  // selection
  select: (id: string | null, kind: SelectableKind) => void;
  setDisplayUnit: (unit: DisplayUnit) => void;

  // vertices
  addVertex: (point: Point) => string;
  updateVertexPosition: (id: string, point: Point) => void;
  getVertex: (id: string) => RoomVertex | undefined;

  // walls
  addWallBetweenVertices: (startVertexId: string, endVertexId: string) => string;
  updateWall: (id: string, patch: Partial<Wall>) => void;
  removeWall: (id: string) => void;
  /** Splits a wall at the given point, inserting a new shared vertex — used to add a corner/notch to an existing shape */
  insertVertexOnWall: (wallId: string, point: Point) => void;
  /** Sets a wall's length by moving its end vertex along the wall's current direction (used by the numeric inspector) */
  setWallLength: (wallId: string, newLengthCm: number) => void;
  /** Replaces the whole room shape at once — used when finishing a freehand-drawn polygon */
  commitDrawnPolygon: (points: Point[]) => void;

  // openings
  addOpening: (opening: Omit<Opening, "id">) => void;
  updateOpening: (id: string, patch: Partial<Opening>) => void;
  removeOpening: (id: string) => void;

  // furniture
  addFurniture: (catalogId: string, position: [number, number]) => void;
  updateFurniture: (id: string, patch: Partial<FurnitureItem>) => void;
  removeFurniture: (id: string) => void;
  duplicateFurniture: (id: string) => void;

  // whole-scene
  loadScene: (scene: RoomScene) => void;
  resetRoom: () => void;

  // history
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;
}

const MAX_HISTORY = 50;

export const useSceneStore = create<SceneState>((set, get) => ({
  scene: defaultRoom(),
  selectedId: null,
  selectedKind: null,
  history: [],
  future: [],
  displayUnit: "m",

  select: (id, kind) => set({ selectedId: id, selectedKind: kind }),
  setDisplayUnit: (unit) => set({ displayUnit: unit }),

  addVertex: (point) => {
    const id = uid("v");
    set((s) => ({ scene: { ...s.scene, vertices: [...s.scene.vertices, { id, point }] } }));
    return id;
  },

  updateVertexPosition: (id, point) => {
    set((s) => ({
      scene: {
        ...s.scene,
        vertices: s.scene.vertices.map((v) => (v.id === id ? { ...v, point } : v)),
      },
    }));
  },

  getVertex: (id) => get().scene.vertices.find((v) => v.id === id),

  addWallBetweenVertices: (startVertexId, endVertexId) => {
    const id = uid("wall");
    set((s) => ({
      scene: {
        ...s.scene,
        walls: [
          ...s.scene.walls,
          { id, startVertexId, endVertexId, thickness: DEFAULT_WALL_THICKNESS, height: s.scene.ceilingHeight },
        ],
      },
    }));
    return id;
  },

  updateWall: (id, patch) => {
    set((s) => ({
      scene: { ...s.scene, walls: s.scene.walls.map((w) => (w.id === id ? { ...w, ...patch } : w)) },
    }));
  },

  removeWall: (id) => {
    get().pushHistory();
    set((s) => ({
      scene: {
        ...s.scene,
        walls: s.scene.walls.filter((w) => w.id !== id),
        openings: s.scene.openings.filter((o) => o.wallId !== id),
      },
    }));
  },

  insertVertexOnWall: (wallId, point) => {
    const { scene } = get();
    const wall = scene.walls.find((w) => w.id === wallId);
    if (!wall) return;
    get().pushHistory();
    const newVertexId = uid("v");
    const newWallId = uid("wall");
    set((s) => ({
      scene: {
        ...s.scene,
        vertices: [...s.scene.vertices, { id: newVertexId, point }],
        walls: [
          ...s.scene.walls.map((w) =>
            w.id === wallId ? { ...w, endVertexId: newVertexId } : w
          ),
          { id: newWallId, startVertexId: newVertexId, endVertexId: wall.endVertexId, thickness: wall.thickness, height: wall.height },
        ],
        // openings on the original wall stay attached to whichever half still contains their position;
        // left as-is (attached to the first half) — fine for the common "add a notch" use case.
      },
    }));
  },

  setWallLength: (wallId, newLengthCm) => {
    const { scene } = get();
    const wall = scene.walls.find((w) => w.id === wallId);
    if (!wall) return;
    const startV = scene.vertices.find((v) => v.id === wall.startVertexId);
    const endV = scene.vertices.find((v) => v.id === wall.endVertexId);
    if (!startV || !endV) return;
    const dx = endV.point[0] - startV.point[0];
    const dz = endV.point[1] - startV.point[1];
    const currentLen = Math.hypot(dx, dz) || 1;
    const ux = dx / currentLen;
    const uz = dz / currentLen;
    const newEnd: Point = [startV.point[0] + ux * newLengthCm, startV.point[1] + uz * newLengthCm];
    get().pushHistory();
    get().updateVertexPosition(endV.id, newEnd);
  },

  commitDrawnPolygon: (points) => {
    if (points.length < 3) return;
    get().pushHistory();
    const vertices: RoomVertex[] = points.map((p) => ({ id: uid("v"), point: p }));
    const walls: Wall[] = vertices.map((v, i) => {
      const next = vertices[(i + 1) % vertices.length];
      return {
        id: uid("wall"),
        startVertexId: v.id,
        endVertexId: next.id,
        thickness: DEFAULT_WALL_THICKNESS,
        height: get().scene.ceilingHeight,
      };
    });
    set((s) => ({
      scene: { ...s.scene, vertices, walls, openings: [], furniture: s.scene.furniture },
    }));
  },

  addOpening: (opening) => {
    get().pushHistory();
    set((s) => ({ scene: { ...s.scene, openings: [...s.scene.openings, { ...opening, id: uid("open") }] } }));
  },

  updateOpening: (id, patch) => {
    set((s) => ({
      scene: { ...s.scene, openings: s.scene.openings.map((o) => (o.id === id ? { ...o, ...patch } : o)) },
    }));
  },

  removeOpening: (id) => {
    get().pushHistory();
    set((s) => ({ scene: { ...s.scene, openings: s.scene.openings.filter((o) => o.id !== id) } }));
  },

  addFurniture: (catalogId, position) => {
    const entry = getCatalogEntry(catalogId);
    if (!entry) return;
    get().pushHistory();
    const item: FurnitureItem = {
      id: uid("furn"),
      catalogId,
      position,
      rotationDeg: 0,
      footprint: entry.footprint,
      heightCm: entry.heightCm,
      color: entry.color,
      label: entry.label,
    };
    set((s) => ({ scene: { ...s.scene, furniture: [...s.scene.furniture, item] } }));
  },

  updateFurniture: (id, patch) => {
    set((s) => ({
      scene: { ...s.scene, furniture: s.scene.furniture.map((f) => (f.id === id ? { ...f, ...patch } : f)) },
    }));
  },

  removeFurniture: (id) => {
    get().pushHistory();
    set((s) => ({ scene: { ...s.scene, furniture: s.scene.furniture.filter((f) => f.id !== id) } }));
  },

  duplicateFurniture: (id) => {
    const item = get().scene.furniture.find((f) => f.id === id);
    if (!item) return;
    get().pushHistory();
    const copy: FurnitureItem = { ...item, id: uid("furn"), position: [item.position[0] + 30, item.position[1] + 30] };
    set((s) => ({ scene: { ...s.scene, furniture: [...s.scene.furniture, copy] } }));
  },

  loadScene: (scene) => {
    get().pushHistory();
    set({ scene, selectedId: null, selectedKind: null });
  },

  resetRoom: () => {
    get().pushHistory();
    set({ scene: defaultRoom(), selectedId: null, selectedKind: null });
  },

  pushHistory: () => {
    const { scene, history } = get();
    const snapshot: HistoryEntry = { scene: structuredClone(scene) };
    const nextHistory = [...history, snapshot].slice(-MAX_HISTORY);
    set({ history: nextHistory, future: [] });
  },

  undo: () => {
    const { history, future, scene } = get();
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    set({ scene: previous.scene, history: history.slice(0, -1), future: [{ scene: structuredClone(scene) }, ...future] });
  },

  redo: () => {
    const { history, future, scene } = get();
    if (future.length === 0) return;
    const next = future[0];
    set({ scene: next.scene, future: future.slice(1), history: [...history, { scene: structuredClone(scene) }] });
  },
}));
