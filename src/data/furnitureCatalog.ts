import type { CatalogEntry } from "../types/scene";

// Realistic-ish default dimensions (cm). Colors are placeholders standing in
// for materials until real textures/models are wired in (see README "Next steps").

export const FURNITURE_CATALOG: CatalogEntry[] = [
  // ---------------- Living room ----------------
  { id: "sofa_2seat", label: "Sofa (2-seat)", category: "Living room", footprint: [150, 85], heightCm: 80, color: "#8a6d5c" },
  { id: "sofa_3seat", label: "Sofa (3-seat)", category: "Living room", footprint: [200, 90], heightCm: 80, color: "#8a6d5c" },
  { id: "sofa_sectional", label: "Sectional sofa", category: "Living room", footprint: [250, 250], heightCm: 80, color: "#7c6152" },
  { id: "armchair", label: "Armchair", category: "Living room", footprint: [80, 85], heightCm: 85, color: "#9c7d5e" },
  { id: "coffee_table", label: "Coffee table", category: "Living room", footprint: [110, 55], heightCm: 40, color: "#c9a876" },
  { id: "tv_stand", label: "TV console", category: "Living room", footprint: [140, 40], heightCm: 45, color: "#5b4636", wallHugging: true },
  { id: "tv", label: "TV", category: "Living room", footprint: [120, 8], heightCm: 70, color: "#111318", wallHugging: true },
  { id: "bookshelf", label: "Bookshelf", category: "Living room", footprint: [90, 30], heightCm: 200, color: "#6b4f3a", wallHugging: true },
  { id: "side_table", label: "Side table", category: "Living room", footprint: [45, 45], heightCm: 55, color: "#c9a876" },
  { id: "floor_lamp", label: "Floor lamp", category: "Living room", footprint: [35, 35], heightCm: 160, color: "#d8c9a3" },
  { id: "area_rug", label: "Area rug", category: "Living room", footprint: [200, 140], heightCm: 1, color: "#a8556b" },
  { id: "plant_potted", label: "Potted plant", category: "Living room", footprint: [40, 40], heightCm: 120, color: "#3f6b3a" },

  // ---------------- Bedroom ----------------
  { id: "bed_single", label: "Bed (single)", category: "Bedroom", footprint: [100, 200], heightCm: 55, color: "#b7a68e" },
  { id: "bed_double", label: "Bed (double)", category: "Bedroom", footprint: [140, 200], heightCm: 55, color: "#b7a68e" },
  { id: "bed_queen", label: "Bed (queen)", category: "Bedroom", footprint: [160, 200], heightCm: 55, color: "#b7a68e" },
  { id: "bed_king", label: "Bed (king)", category: "Bedroom", footprint: [190, 200], heightCm: 55, color: "#b7a68e" },
  { id: "nightstand", label: "Nightstand", category: "Bedroom", footprint: [45, 40], heightCm: 55, color: "#6b4f3a" },
  { id: "wardrobe", label: "Wardrobe", category: "Bedroom", footprint: [120, 60], heightCm: 220, color: "#5b4636", wallHugging: true },
  { id: "dresser", label: "Dresser", category: "Bedroom", footprint: [100, 45], heightCm: 90, color: "#6b4f3a", wallHugging: true },
  { id: "mirror_standing", label: "Standing mirror", category: "Bedroom", footprint: [50, 5], heightCm: 170, color: "#c7d3d9", wallHugging: true },

  // ---------------- Kitchen ----------------
  { id: "counter_base", label: "Base cabinet run", category: "Kitchen", footprint: [200, 60], heightCm: 90, color: "#d9d2c4", wallHugging: true },
  { id: "kitchen_island", label: "Kitchen island", category: "Kitchen", footprint: [150, 90], heightCm: 90, color: "#d9d2c4" },
  { id: "sink_kitchen", label: "Kitchen sink", category: "Kitchen", footprint: [80, 60], heightCm: 90, color: "#b9c2c9", wallHugging: true },
  { id: "stove", label: "Stove / cooktop", category: "Kitchen", footprint: [75, 60], heightCm: 90, color: "#2b2d31", wallHugging: true },
  { id: "fridge", label: "Refrigerator", category: "Kitchen", footprint: [80, 70], heightCm: 180, color: "#c9cdd1", wallHugging: true },
  { id: "dishwasher", label: "Dishwasher", category: "Kitchen", footprint: [60, 60], heightCm: 85, color: "#b9c2c9", wallHugging: true },
  { id: "dining_table", label: "Dining table", category: "Kitchen", footprint: [160, 90], heightCm: 75, color: "#a9805a" },
  { id: "dining_chair", label: "Dining chair", category: "Kitchen", footprint: [45, 45], heightCm: 90, color: "#8a6d5c" },
  { id: "range_hood", label: "Range hood", category: "Kitchen", footprint: [75, 40], heightCm: 20, color: "#9aa0a6", wallHugging: true },

  // ---------------- Bathroom ----------------
  { id: "toilet", label: "Toilet", category: "Bathroom", footprint: [40, 65], heightCm: 80, color: "#f2f2f0", wallHugging: true },
  { id: "sink_vanity", label: "Vanity sink", category: "Bathroom", footprint: [80, 50], heightCm: 85, color: "#f2f2f0", wallHugging: true },
  { id: "bathtub", label: "Bathtub", category: "Bathroom", footprint: [170, 75], heightCm: 55, color: "#eef2f4", wallHugging: true },
  { id: "shower_stall", label: "Shower stall", category: "Bathroom", footprint: [90, 90], heightCm: 200, color: "#cfe3ea" },
  { id: "towel_rack", label: "Towel rack", category: "Bathroom", footprint: [60, 5], heightCm: 90, color: "#9aa0a6", wallHugging: true },

  // ---------------- Office / study ----------------
  { id: "desk", label: "Desk", category: "Office", footprint: [130, 65], heightCm: 75, color: "#a9805a" },
  { id: "office_chair", label: "Office chair", category: "Office", footprint: [55, 55], heightCm: 95, color: "#3a3d42" },
  { id: "filing_cabinet", label: "Filing cabinet", category: "Office", footprint: [45, 55], heightCm: 100, color: "#5b4636", wallHugging: true },

  // ---------------- Architectural / utility ----------------
  { id: "aircon_split", label: "Air conditioner (split, wall)", category: "Architectural", footprint: [80, 20], heightCm: 30, color: "#e7ebee", wallHugging: true },
  { id: "ceiling_fan", label: "Ceiling fan", category: "Architectural", footprint: [110, 110], heightCm: 30, color: "#2b2d31" },
  { id: "staircase", label: "Staircase", category: "Architectural", footprint: [100, 300], heightCm: 270, color: "#8a7461" },
];

export const CATALOG_CATEGORIES = Array.from(
  new Set(FURNITURE_CATALOG.map((f) => f.category))
);

export function getCatalogEntry(catalogId: string): CatalogEntry | undefined {
  return FURNITURE_CATALOG.find((f) => f.id === catalogId);
}
