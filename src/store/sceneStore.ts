import { create } from "zustand";
import type { FurnitureItem, Opening, Point, RoomScene, Wall } from "../types/scene";
import { getCatalogEntry } from "../data/furnitureCatalog";
import type { DisplayUnit } from "../utils/units";

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

const LOCAL_STORAGE_KEY = "room3d.savedScene.v1";

/** Fill in fields that may be missing from scenes saved by an older version of the app. */
function migrateScene(raw: unknown): RoomScene | null {
  if (!raw || typeof raw !== "object") return null;
  const s = raw as Partial<RoomScene>;
  if (!Array.isArray(s.walls) || !Array.isArray(s.openings) || !Array.isArray(s.furniture)) return null;
  return {
    walls: s.walls,
    openings: s.openings,
    furniture: s.furniture,
    floorMaterial: s.floorMaterial ?? "oak-wood-01",
    floorStyle: s.floorStyle ?? { pattern: "wood", color: "#c9a876" },
    ceilingHeight: s.ceilingHeight ?? 260,
    unit: "cm",
  };
}

// A blank scene: no walls, nothing to edit until the user draws something.
function emptyRoom(): RoomScene {
  return {
    walls: [],
    openings: [],
    furniture: [],
    floorMaterial: "oak-wood-01",
    floorStyle: { pattern: "wood", color: "#c9a876" },
    ceilingHeight: 260,
    unit: "cm",
  };
}

// A sample rectangular room (5m x 4m), available on demand via "Load sample room".
function sampleRoom(): RoomScene {
  const w = 500;
  const d = 400;
  const height = 260;
  const walls: Wall[] = [
    { id: uid("wall"), start: [0, 0], end: [w, 0], thickness: 12, height },
    { id: uid("wall"), start: [w, 0], end: [w, d], thickness: 12, height },
    { id: uid("wall"), start: [w, d], end: [0, d], thickness: 12, height },
    { id: uid("wall"), start: [0, d], end: [0, 0], thickness: 12, height },
  ];
  return {
    walls,
    openings: [
      { id: uid("open"), wallId: walls[0].id, type: "door", position: 100, width: 90, height: 210, swing: "in-left" },
      { id: uid("open"), wallId: walls[1].id, type: "window", position: 200, width: 140, height: 120, sillHeight: 90 },
    ],
    furniture: [],
    floorMaterial: "oak-wood-01",
    floorStyle: { pattern: "wood", color: "#c9a876" },
    ceilingHeight: height,
    unit: "cm",
  };
}

export type SelectableKind = "wall" | "opening" | "furniture" | null;

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

  // walls
  addWall: (wall: Omit<Wall, "id">) => void;
  addWalls: (walls: Omit<Wall, "id">[]) => void;
  updateWall: (id: string, patch: Partial<Wall>) => void;
  removeWall: (id: string) => void;
  setWallLength: (wallId: string, newLengthCm: number) => void;

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
  loadSampleRoom: () => void;
  setFloorStyle: (style: RoomScene["floorStyle"]) => void;

  // save / load
  saveToLocalStorage: () => void;
  loadFromLocalStorage: () => boolean;
  hasSavedScene: () => boolean;
  exportSceneJson: () => string;
  importSceneJson: (json: string) => boolean;
  lastSavedAt: number | null;

  // history
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;
}

const MAX_HISTORY = 50;

export const useSceneStore = create<SceneState>((set, get) => ({
  scene: emptyRoom(),
  selectedId: null,
  selectedKind: null,
  history: [],
  future: [],
  displayUnit: "m",
  lastSavedAt: null,

  select: (id, kind) => set({ selectedId: id, selectedKind: kind }),
  setDisplayUnit: (unit) => set({ displayUnit: unit }),

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
    set({
      scene: previous.scene,
      history: history.slice(0, -1),
      future: [{ scene: structuredClone(scene) }, ...future],
    });
  },

  redo: () => {
    const { history, future, scene } = get();
    if (future.length === 0) return;
    const next = future[0];
    set({
      scene: next.scene,
      future: future.slice(1),
      history: [...history, { scene: structuredClone(scene) }],
    });
  },

  addWall: (wall) => {
    get().pushHistory();
    set((s) => ({ scene: { ...s.scene, walls: [...s.scene.walls, { ...wall, id: uid("wall") }] } }));
  },

  addWalls: (walls) => {
    if (walls.length === 0) return;
    get().pushHistory();
    set((s) => ({
      scene: { ...s.scene, walls: [...s.scene.walls, ...walls.map((w) => ({ ...w, id: uid("wall") }))] },
    }));
  },

  updateWall: (id, patch) => {
    set((s) => ({
      scene: {
        ...s.scene,
        walls: s.scene.walls.map((w) => (w.id === id ? { ...w, ...patch } : w)),
      },
    }));
  },

  removeWall: (id) => {
    get().pushHistory();
    set((s) => ({
      selectedId: s.selectedId === id ? null : s.selectedId,
      selectedKind: s.selectedId === id ? null : s.selectedKind,
      scene: {
        ...s.scene,
        walls: s.scene.walls.filter((w) => w.id !== id),
        openings: s.scene.openings.filter((o) => o.wallId !== id),
      },
    }));
  },

  setWallLength: (wallId, newLengthCm) => {
    const { scene } = get();
    const wall = scene.walls.find((w) => w.id === wallId);
    if (!wall) return;
    const dx = wall.end[0] - wall.start[0];
    const dz = wall.end[1] - wall.start[1];
    const currentLen = Math.hypot(dx, dz) || 1;
    const ux = dx / currentLen;
    const uz = dz / currentLen;
    const newEnd: Point = [wall.start[0] + ux * newLengthCm, wall.start[1] + uz * newLengthCm];
    get().pushHistory();
    get().updateWall(wallId, { end: newEnd });
  },

  addOpening: (opening) => {
    get().pushHistory();
    set((s) => ({ scene: { ...s.scene, openings: [...s.scene.openings, { ...opening, id: uid("open") }] } }));
  },

  updateOpening: (id, patch) => {
    set((s) => ({
      scene: {
        ...s.scene,
        openings: s.scene.openings.map((o) => (o.id === id ? { ...o, ...patch } : o)),
      },
    }));
  },

  removeOpening: (id) => {
    get().pushHistory();
    set((s) => ({
      selectedId: s.selectedId === id ? null : s.selectedId,
      selectedKind: s.selectedId === id ? null : s.selectedKind,
      scene: { ...s.scene, openings: s.scene.openings.filter((o) => o.id !== id) },
    }));
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
      scene: {
        ...s.scene,
        furniture: s.scene.furniture.map((f) => (f.id === id ? { ...f, ...patch } : f)),
      },
    }));
  },

  removeFurniture: (id) => {
    get().pushHistory();
    set((s) => ({
      selectedId: s.selectedId === id ? null : s.selectedId,
      selectedKind: s.selectedId === id ? null : s.selectedKind,
      scene: { ...s.scene, furniture: s.scene.furniture.filter((f) => f.id !== id) },
    }));
  },

  duplicateFurniture: (id) => {
    const item = get().scene.furniture.find((f) => f.id === id);
    if (!item) return;
    get().pushHistory();
    const copy: FurnitureItem = {
      ...item,
      id: uid("furn"),
      position: [item.position[0] + 30, item.position[1] + 30],
    };
    set((s) => ({ scene: { ...s.scene, furniture: [...s.scene.furniture, copy] } }));
  },

  loadScene: (scene) => {
    get().pushHistory();
    set({ scene, selectedId: null, selectedKind: null });
  },

  resetRoom: () => {
    get().pushHistory();
    set({ scene: emptyRoom(), selectedId: null, selectedKind: null });
  },

  loadSampleRoom: () => {
    get().pushHistory();
    set({ scene: sampleRoom(), selectedId: null, selectedKind: null });
  },

  setFloorStyle: (style) => {
    get().pushHistory();
    set((s) => ({ scene: { ...s.scene, floorStyle: style } }));
  },

  saveToLocalStorage: () => {
    try {
      window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(get().scene));
      set({ lastSavedAt: Date.now() });
    } catch (err) {
      console.error("Failed to save room to localStorage", err);
    }
  },

  loadFromLocalStorage: () => {
    try {
      const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!raw) return false;
      const migrated = migrateScene(JSON.parse(raw));
      if (!migrated) return false;
      get().pushHistory();
      set({ scene: migrated, selectedId: null, selectedKind: null });
      return true;
    } catch (err) {
      console.error("Failed to load room from localStorage", err);
      return false;
    }
  },

  hasSavedScene: () => {
    try {
      return window.localStorage.getItem(LOCAL_STORAGE_KEY) !== null;
    } catch {
      return false;
    }
  },

  exportSceneJson: () => JSON.stringify(get().scene, null, 2),

  importSceneJson: (json) => {
    try {
      const migrated = migrateScene(JSON.parse(json));
      if (!migrated) return false;
      get().pushHistory();
      set({ scene: migrated, selectedId: null, selectedKind: null });
      return true;
    } catch (err) {
      console.error("Failed to import room JSON", err);
      return false;
    }
  },
}));
