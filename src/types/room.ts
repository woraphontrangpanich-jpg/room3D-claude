export type Vec2 = { x: number; z: number };

export type Opening = {
  id: string;
  type: "door" | "window";
  wallId: string;
  positionAlongWall: number;
  width: number;
  height: number;
  bottom: number;
};

export type Wall = {
  id: string;
  start: Vec2;
  end: Vec2;
  thickness: number;
};

export type FurnitureType =
  | "bed"
  | "desk"
  | "chair"
  | "sofa"
  | "wardrobe"
  | "coffeeTable"
  | "bookshelf"
  | "acUnit"
  | "rug";

export type FurnitureItem = {
  id: string;
  type: FurnitureType;
  x: number;
  y: number;
  z: number;
  rotationY: number;
  scale: number;
};

export type RoomSchema = {
  room: { width: number; depth: number; height: number; wallThickness: number };
  walls: Wall[];
  openings: Opening[];
  furniture: FurnitureItem[];
};
