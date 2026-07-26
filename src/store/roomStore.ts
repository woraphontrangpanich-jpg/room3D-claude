import { create } from "zustand";
import type { RoomSchema, FurnitureItem, FurnitureType } from "../types/room";

type ViewMode = "plan2d" | "orbit3d" | "walkthrough";

type RoomState = {
  schema: RoomSchema;
  viewMode: ViewMode;
  selectedId: string | null;
  setViewMode: (m: ViewMode) => void;
  selectItem: (id: string | null) => void;
  addFurniture: (type: FurnitureType, x: number, z: number) => void;
  updateFurniture: (id: string, patch: Partial<FurnitureItem>) => void;
  removeFurniture: (id: string) => void;
};

const defaultSchema: RoomSchema = {
  room: { width: 6, depth: 5, height: 2.8, wallThickness: 0.12 },
  walls: [
    { id: "n", start: { x: -3, z: -2.5 }, end: { x: 3, z: -2.5 }, thickness: 0.12 },
    { id: "e", start: { x: 3, z: -2.5 }, end: { x: 3, z: 2.5 }, thickness: 0.12 },
    { id: "s", start: { x: 3, z: 2.5 }, end: { x: -3, z: 2.5 }, thickness: 0.12 },
    { id: "w", start: { x: -3, z: 2.5 }, end: { x: -3, z: -2.5 }, thickness: 0.12 },
  ],
  openings: [
    { id: "door1", type: "door", wallId: "s", positionAlongWall: 0.5, width: 1.0, height: 2.1, bottom: 0 },
    { id: "win1", type: "window", wallId: "w", positionAlongWall: 0.5, width: 1.4, height: 1.2, bottom: 0.9 },
  ],
  furniture: [
    { id: "bed1", type: "bed", x: -1.6, y: 0, z: -1.3, rotationY: 0, scale: 1 },
    { id: "desk1", type: "desk", x: 2.2, y: 0, z: -1.9, rotationY: Math.PI, scale: 1 },
    { id: "chair1", type: "chair", x: 2.2, y: 0, z: -1.35, rotationY: 0, scale: 1 },
    { id: "wardrobe1", type: "wardrobe", x: -2.6, y: 0, z: 1.6, rotationY: Math.PI / 2, scale: 1 },
    { id: "sofa1", type: "sofa", x: 1.6, y: 0, z: 1.6, rotationY: Math.PI, scale: 1 },
    { id: "coffeeTable1", type: "coffeeTable", x: 1.6, y: 0.001, z: 0.9, rotationY: 0, scale: 1 },
    { id: "bookshelf1", type: "bookshelf", x: 2.6, y: 0, z: 1.9, rotationY: -Math.PI / 2, scale: 1 },
    { id: "acUnit1", type: "acUnit", x: 0, y: 2.4, z: -2.4, rotationY: 0, scale: 1 },
    { id: "rug1", type: "rug", x: 1.6, y: 0.001, z: 1.3, rotationY: 0, scale: 1 },
  ],
};

export const useRoomStore = create<RoomState>((set) => ({
  schema: defaultSchema,
  viewMode: "orbit3d",
  selectedId: null,
  setViewMode: (m) => set({ viewMode: m }),
  selectItem: (id) => set({ selectedId: id }),
  addFurniture: (type, x, z) =>
    set((state) => ({
      schema: {
        ...state.schema,
        furniture: [
          ...state.schema.furniture,
          { id: `${type}-${Date.now()}`, type, x, y: 0, z, rotationY: 0, scale: 1 },
        ],
      },
    })),
  updateFurniture: (id, patch) =>
    set((state) => ({
      schema: {
        ...state.schema,
        furniture: state.schema.furniture.map((f: FurnitureItem) => (f.id === id ? { ...f, ...patch } : f)),
      },
    })),
  removeFurniture: (id) =>
    set((state) => ({
      schema: { ...state.schema, furniture: state.schema.furniture.filter((f: FurnitureItem) => f.id !== id) },
    })),
}));
