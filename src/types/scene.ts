// Core data model shared by the 2D editor and the 3D viewer.
// Units are centimeters throughout the store; convert only at render time.

export type Point = [number, number]; // [x, z] in cm, top-down plane

export interface Wall {
  id: string;
  start: Point;
  end: Point;
  thickness: number; // cm
  height: number; // cm
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
}

export interface RoomScene {
  walls: Wall[];
  openings: Opening[];
  furniture: FurnitureItem[];
  floorMaterial: string;
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
}
