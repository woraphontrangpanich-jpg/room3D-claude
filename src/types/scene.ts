// Core data model shared by the 2D editor and the 3D viewer.
// Units are centimeters throughout the store; convert only at render time.

export type Point = [number, number]; // [x, z] in cm, top-down plane

export interface Wall {
  id: string;
  start: Point;
  end: Point;
  thickness: number; // cm
  height: number; // cm
  /** true = fully transparent/glass wall (rendered like window glass, no opening needed) */
  isGlass?: boolean;
  /** solid paint color for this wall, e.g. "#e8e6df". Ignored if wallpaperUrl is set. */
  color?: string;
  /** image URL (http(s) or data: URL from an upload) tiled across the wall as wallpaper */
  wallpaperUrl?: string;
}

export type OpeningType = "door" | "window";

export interface Opening {
  id: string;
  wallId: string;
  type: OpeningType;
  /** distance in cm from wall.start along the wall to the CENTER of the opening */
  position: number;
  width: number; // cm
  height: number; // cm
  /** window only: height of the sill above the floor, cm */
  sillHeight?: number;
  /** door only */
  swing?: "in-left" | "in-right" | "out-left" | "out-right";
}

export interface FurnitureItem {
  id: string;
  catalogId: string;
  position: Point; // center position on floor plane
  rotationDeg: number; // rotation around vertical axis
  /** footprint in cm, already scaled — width (x) and depth (z) */
  footprint: [number, number];
  heightCm: number;
  color: string;
  label: string;
  /** mirror the item along its local X axis (left/right flip) */
  flippedX?: boolean;
}

export type FloorPattern = "plain" | "wood" | "tile" | "carpet";

export interface FloorStyle {
  pattern: FloorPattern;
  /** base color; for "plain" this is the only color used, for patterns it tints the pattern */
  color: string;
}

export interface RoomScene {
  walls: Wall[];
  openings: Opening[];
  furniture: FurnitureItem[];
  /** @deprecated kept for backward compatibility with older saved files; use floorStyle instead */
  floorMaterial: string;
  floorStyle: FloorStyle;
  ceilingHeight: number; // cm, used when a wall doesn't override height
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
  /** true if it should snap to / hug the nearest wall on drop */
  wallHugging?: boolean;
  /**
   * Path to a real 3D model (.glb/.gltf), served from /public, e.g. "/models/sofa_2seat.glb".
   * If set, the 3D viewer loads and displays this model (auto-scaled to fit
   * footprint/heightCm) instead of the placeholder box. Leave unset to keep
   * using the placeholder box for this item.
   */
  modelUrl?: string;
}

export type ShapeType =
  | "sofa"
  | "sofa-sectional"
  | "armchair"
  | "chair"
  | "table-rect"
  | "table-round"
  | "bed"
  | "wardrobe"
  | "cabinet-tall"
  | "cabinet-low"
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
