// Core data model shared by the 2D editor and the 3D viewer.
// Units are centimeters throughout the store; convert only at render/display time.

export type Point = [number, number]; // [x, z] in cm, top-down plane

export interface RoomVertex {
  id: string;
  point: Point;
}

export interface Wall {
  id: string;
  /** references RoomVertex.id — shared vertices let dragging one corner move every connected wall */
  startVertexId: string;
  endVertexId: string;
  thickness: number; // cm
  height: number; // cm
}

export type OpeningType = "door" | "window";

export interface Opening {
  id: string;
  wallId: string;
  type: OpeningType;
  /** distance in cm from the wall's start vertex along the wall to the CENTER of the opening */
  position: number;
  width: number; // cm
  height: number; // cm
  /** window only: height of the sill above the floor, cm */
  sillHeight?: number;
  /** door only */
  swing?: "in-left" | "in-right" | "out-left" | "out-right";
}

// Furniture "family" — determines which procedural mesh builder (or model)
// is used to render it in 3D, and which 2D top-down icon shape is drawn.
export type ShapeType =
  | "sofa"
  | "sofa-sectional"
  | "armchair"
  | "chair"
  | "table-rect"
  | "table-round"
  | "bed"
  | "wardrobe"
  | "cabinet-low"
  | "cabinet-tall"
  | "fridge"
  | "stove"
  | "sink"
  | "toilet"
  | "bathtub"
  | "shower"
  | "lamp-floor"
  | "lamp-table"
  | "plant"
  | "tv"
  | "rug"
  | "mirror"
  | "aircon"
  | "ceiling-fan"
  | "stairs"
  | "generic-box";

export interface FurnitureItem {
  id: string;
  catalogId: string;
  position: Point; // center position on floor plane
  rotationDeg: number; // rotation around vertical axis
  /** footprint in cm — width (x) and depth (z) */
  footprint: [number, number];
  heightCm: number;
  color: string;
  label: string;
}

export interface RoomScene {
  vertices: RoomVertex[];
  walls: Wall[];
  openings: Opening[];
  furniture: FurnitureItem[];
  floorMaterial: string;
  ceilingHeight: number; // cm, used as default for new walls
  unit: "cm";
}

export interface CatalogEntry {
  id: string;
  label: string;
  category: string;
  /** default footprint in cm: [width, depth] */
  footprint: [number, number];
  heightCm: number;
  color: string;
  shapeType: ShapeType;
  /** true if it should snap to / hug the nearest wall on drop */
  wallHugging?: boolean;
  /** optional path to a real .glb model — if present, takes priority over the procedural shapeType builder (not wired up yet, reserved for a later pass) */
  modelPath?: string;
}
