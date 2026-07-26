import type { CatalogEntry } from "../types/scene";

// Realistic-ish default dimensions (cm). Colors are placeholders standing in
// for materials until real textures/models are wired in (see README "Next steps").

export const FURNITURE_CATALOG: CatalogEntry[] = [
  // ---------------- Living room ----------------
  { id: "sofa_2seat", label: "Sofa (2-seat)", category: "Living room", footprint: [150, 85], heightCm: 80, color: "#8a6d5c" },
  { id: "sofa_3seat", label: "Sofa (3-seat)", category: "Living room", footprint: [200, 90], heightCm: 80, color: "#8a6d5c" },
  { id: "sofa_sectional", label: "Sectional sofa", category: "Living room", footprint: [250, 250], heightCm: 80, color: "#7c6152" },
  { id: "armchair", label: "Armchair", category: "Living room", footprint: [80, 85], heightCm: 85, color: "#9c7d5e" },
  { id: "recliner", label: "Recliner", category: "Living room", footprint: [85, 95], heightCm: 100, color: "#8a6d5c" },
  { id: "coffee_table", label: "Coffee table", category: "Living room", footprint: [110, 55], heightCm: 40, color: "#c9a876" },
  { id: "console_table", label: "Console table", category: "Living room", footprint: [110, 35], heightCm: 80, color: "#c9a876", wallHugging: true },
  { id: "tv_stand", label: "TV stand / media console", category: "Living room", footprint: [140, 40], heightCm: 45, color: "#5b4636", wallHugging: true },
  { id: "tv_wall", label: "Wall TV", category: "Living room", footprint: [120, 8], heightCm: 70, color: "#111318", wallHugging: true },
  { id: "bookshelf", label: "Bookshelf", category: "Living room", footprint: [90, 30], heightCm: 200, color: "#6b4f3a", wallHugging: true },
  { id: "shelf_living", label: "Shelf", category: "Living room", footprint: [90, 25], heightCm: 20, color: "#6b4f3a", wallHugging: true },
  { id: "cabinet_living", label: "Cabinet", category: "Living room", footprint: [100, 45], heightCm: 85, color: "#5b4636", wallHugging: true },
  { id: "side_table", label: "Side table", category: "Living room", footprint: [45, 45], heightCm: 55, color: "#c9a876" },
  { id: "ottoman", label: "Ottoman", category: "Living room", footprint: [60, 60], heightCm: 42, color: "#9c7d5e" },
  { id: "floor_lamp", label: "Floor lamp", category: "Living room", footprint: [35, 35], heightCm: 160, color: "#d8c9a3" },
  { id: "table_lamp_living", label: "Table lamp", category: "Living room", footprint: [20, 20], heightCm: 45, color: "#d8c9a3" },
  { id: "curtains_living", label: "Curtains / blinds", category: "Living room", footprint: [140, 10], heightCm: 240, color: "#cbb9a3", wallHugging: true },
  { id: "area_rug", label: "Area rug", category: "Living room", footprint: [200, 140], heightCm: 1, color: "#a8556b" },
  { id: "plant_potted", label: "Potted plant", category: "Living room", footprint: [40, 40], heightCm: 120, color: "#3f6b3a" },

  // ---------------- Bedroom ----------------
  { id: "bed_single", label: "Bed (single)", category: "Bedroom", footprint: [100, 200], heightCm: 55, color: "#b7a68e" },
  { id: "bed_double", label: "Bed (double)", category: "Bedroom", footprint: [140, 200], heightCm: 55, color: "#b7a68e" },
  { id: "bed_queen", label: "Bed (queen)", category: "Bedroom", footprint: [160, 200], heightCm: 55, color: "#b7a68e" },
  { id: "bed_king", label: "Bed (king)", category: "Bedroom", footprint: [190, 200], heightCm: 55, color: "#b7a68e" },
  { id: "mattress", label: "Mattress", category: "Bedroom", footprint: [160, 200], heightCm: 25, color: "#efece4" },
  { id: "bed_frame", label: "Bed frame", category: "Bedroom", footprint: [160, 200], heightCm: 30, color: "#6b4f3a" },
  { id: "headboard", label: "Headboard", category: "Bedroom", footprint: [160, 10], heightCm: 110, color: "#6b4f3a", wallHugging: true },
  { id: "nightstand", label: "Nightstand", category: "Bedroom", footprint: [45, 40], heightCm: 55, color: "#6b4f3a" },
  { id: "wardrobe", label: "Wardrobe / closet", category: "Bedroom", footprint: [120, 60], heightCm: 220, color: "#5b4636", wallHugging: true },
  { id: "dresser", label: "Dresser", category: "Bedroom", footprint: [100, 45], heightCm: 90, color: "#6b4f3a", wallHugging: true },
  { id: "desk_bedroom", label: "Desk", category: "Bedroom", footprint: [120, 60], heightCm: 75, color: "#a9805a" },
  { id: "chair_bedroom", label: "Chair", category: "Bedroom", footprint: [50, 50], heightCm: 85, color: "#8a6d5c" },
  { id: "mirror_standing", label: "Mirror", category: "Bedroom", footprint: [50, 5], heightCm: 170, color: "#c7d3d9", wallHugging: true },
  { id: "bookshelf_bedroom", label: "Bookshelf / wall shelves", category: "Bedroom", footprint: [80, 30], heightCm: 180, color: "#6b4f3a", wallHugging: true },
  { id: "rug_bedroom", label: "Rug", category: "Bedroom", footprint: [180, 120], heightCm: 1, color: "#9c7a8a" },
  { id: "lamp_bedroom", label: "Table lamp / floor lamp", category: "Bedroom", footprint: [25, 25], heightCm: 50, color: "#d8c9a3" },
  { id: "curtains_bedroom", label: "Curtains / blinds", category: "Bedroom", footprint: [140, 10], heightCm: 220, color: "#cbb9a3", wallHugging: true },
  { id: "storage_box", label: "Storage box", category: "Bedroom", footprint: [45, 35], heightCm: 30, color: "#b9ab8f" },

  // ---------------- Kitchen ----------------
  { id: "counter_base", label: "Lower cabinets", category: "Kitchen", footprint: [200, 60], heightCm: 90, color: "#d9d2c4", wallHugging: true },
  { id: "cabinet_upper", label: "Upper cabinets", category: "Kitchen", footprint: [200, 35], heightCm: 70, color: "#d9d2c4", wallHugging: true },
  { id: "countertop", label: "Countertop", category: "Kitchen", footprint: [200, 60], heightCm: 4, color: "#c7bfb0", wallHugging: true },
  { id: "kitchen_island", label: "Kitchen island", category: "Kitchen", footprint: [150, 90], heightCm: 90, color: "#d9d2c4" },
  { id: "pantry_cabinet", label: "Pantry cabinet", category: "Kitchen", footprint: [80, 60], heightCm: 210, color: "#c9bfae", wallHugging: true },
  { id: "sink_kitchen", label: "Sink", category: "Kitchen", footprint: [80, 60], heightCm: 90, color: "#b9c2c9", wallHugging: true },
  { id: "stove", label: "Stove / cooktop", category: "Kitchen", footprint: [75, 60], heightCm: 90, color: "#2b2d31", wallHugging: true },
  { id: "oven", label: "Oven", category: "Kitchen", footprint: [60, 60], heightCm: 90, color: "#2b2d31", wallHugging: true },
  { id: "fridge", label: "Refrigerator", category: "Kitchen", footprint: [80, 70], heightCm: 180, color: "#c9cdd1", wallHugging: true },
  { id: "dishwasher", label: "Dishwasher", category: "Kitchen", footprint: [60, 60], heightCm: 85, color: "#b9c2c9", wallHugging: true },
  { id: "microwave", label: "Microwave", category: "Kitchen", footprint: [50, 40], heightCm: 30, color: "#3a3d42" },
  { id: "dining_table", label: "Dining table", category: "Kitchen", footprint: [160, 90], heightCm: 75, color: "#a9805a" },
  { id: "dining_chair", label: "Dining chair", category: "Kitchen", footprint: [45, 45], heightCm: 90, color: "#8a6d5c" },
  { id: "bar_stool", label: "Bar stool", category: "Kitchen", footprint: [35, 35], heightCm: 75, color: "#8a6d5c" },
  { id: "shelf_kitchen", label: "Shelf", category: "Kitchen", footprint: [90, 25], heightCm: 20, color: "#6b4f3a", wallHugging: true },
  { id: "trash_bin", label: "Trash bin", category: "Kitchen", footprint: [30, 30], heightCm: 60, color: "#4a4d52" },
  { id: "range_hood", label: "Range hood", category: "Kitchen", footprint: [75, 40], heightCm: 20, color: "#9aa0a6", wallHugging: true },

  // ---------------- Bathroom ----------------
  { id: "toilet", label: "Toilet", category: "Bathroom", footprint: [40, 65], heightCm: 80, color: "#f2f2f0", wallHugging: true },
  { id: "sink_bathroom", label: "Sink", category: "Bathroom", footprint: [55, 45], heightCm: 85, color: "#f2f2f0", wallHugging: true },
  { id: "sink_vanity", label: "Vanity", category: "Bathroom", footprint: [80, 50], heightCm: 85, color: "#f2f2f0", wallHugging: true },
  { id: "mirror_bathroom", label: "Mirror", category: "Bathroom", footprint: [60, 5], heightCm: 70, color: "#c7d3d9", wallHugging: true },
  { id: "cabinet_bathroom", label: "Bathroom cabinet", category: "Bathroom", footprint: [60, 35], heightCm: 80, color: "#eef1f0", wallHugging: true },
  { id: "medicine_cabinet", label: "Medicine cabinet", category: "Bathroom", footprint: [50, 15], heightCm: 60, color: "#eef1f0", wallHugging: true },
  { id: "bathtub", label: "Bathtub", category: "Bathroom", footprint: [170, 75], heightCm: 55, color: "#eef2f4", wallHugging: true },
  { id: "shower_stall", label: "Shower", category: "Bathroom", footprint: [90, 90], heightCm: 200, color: "#cfe3ea" },
  { id: "shower_curtain", label: "Shower curtain", category: "Bathroom", footprint: [90, 5], heightCm: 190, color: "#e3eef2" },
  { id: "towel_rack", label: "Towel rack", category: "Bathroom", footprint: [60, 5], heightCm: 90, color: "#9aa0a6", wallHugging: true },
  { id: "towel_stack", label: "Towel stack", category: "Bathroom", footprint: [35, 30], heightCm: 25, color: "#dce7ea" },
  { id: "hamper", label: "Hamper / laundry basket", category: "Bathroom", footprint: [40, 40], heightCm: 55, color: "#8a7461" },
  { id: "shelf_bathroom", label: "Shelf", category: "Bathroom", footprint: [60, 20], heightCm: 15, color: "#c7bfb0", wallHugging: true },
  { id: "soap_dispenser", label: "Soap dispenser", category: "Bathroom", footprint: [8, 8], heightCm: 15, color: "#dce7ea" },
  { id: "toilet_paper_holder", label: "Toilet paper holder", category: "Bathroom", footprint: [12, 8], heightCm: 12, color: "#9aa0a6", wallHugging: true },
  { id: "bath_mat", label: "Bath mat", category: "Bathroom", footprint: [70, 45], heightCm: 1, color: "#cfe3ea" },

  // ---------------- Office / study ----------------
  { id: "desk", label: "Desk", category: "Office", footprint: [130, 65], heightCm: 75, color: "#a9805a" },
  { id: "office_chair", label: "Office chair", category: "Office", footprint: [55, 55], heightCm: 95, color: "#3a3d42" },
  { id: "filing_cabinet", label: "Filing cabinet", category: "Office", footprint: [45, 55], heightCm: 100, color: "#5b4636", wallHugging: true },

  // ---------------- Architectural / utility ----------------
  { id: "aircon_split", label: "Air conditioner (split, wall)", category: "Architectural", footprint: [80, 20], heightCm: 30, color: "#e7ebee", wallHugging: true },
  { id: "ceiling_fan", label: "Ceiling fan", category: "Architectural", footprint: [110, 110], heightCm: 30, color: "#2b2d31" },
  { id: "staircase", label: "Staircase", category: "Architectural", footprint: [100, 300], heightCm: 270, color: "#8a7461" },

  // ---------------- Decor / props ----------------
  { id: "plant_decor", label: "Plant", category: "Decor", footprint: [35, 35], heightCm: 90, color: "#3f6b3a" },
  { id: "wall_art", label: "Wall art", category: "Decor", footprint: [50, 4], heightCm: 60, color: "#c7a97a", wallHugging: true },
  { id: "books_stack", label: "Books", category: "Decor", footprint: [25, 20], heightCm: 20, color: "#7a4b3a" },
  { id: "pillow", label: "Pillow", category: "Decor", footprint: [45, 45], heightCm: 15, color: "#c99b7a" },
  { id: "blanket", label: "Blanket", category: "Decor", footprint: [130, 100], heightCm: 3, color: "#a8556b" },
  { id: "clock_wall", label: "Clock", category: "Decor", footprint: [30, 4], heightCm: 30, color: "#e7e2d6", wallHugging: true },
  { id: "basket", label: "Basket", category: "Decor", footprint: [35, 35], heightCm: 30, color: "#b08a5a" },
  { id: "shoes", label: "Shoes", category: "Decor", footprint: [30, 20], heightCm: 12, color: "#3a3d42" },
  { id: "vase", label: "Vase", category: "Decor", footprint: [18, 18], heightCm: 35, color: "#c7d3d9" },
  { id: "frame", label: "Frame", category: "Decor", footprint: [25, 3], heightCm: 30, color: "#c7a97a", wallHugging: true },
  { id: "tissue_box", label: "Tissue box", category: "Decor", footprint: [22, 12], heightCm: 8, color: "#e7e2d6" },
  { id: "bottle_cup", label: "Bottle / cup", category: "Decor", footprint: [8, 8], heightCm: 15, color: "#cfe3ea" },
  { id: "laptop", label: "Laptop", category: "Decor", footprint: [32, 22], heightCm: 2, color: "#8a8f96" },
  { id: "remote_control", label: "Remote control", category: "Decor", footprint: [5, 15], heightCm: 2, color: "#2b2d31" },
  { id: "dishware", label: "Dishware", category: "Decor", footprint: [25, 25], heightCm: 5, color: "#e7e2d6" },
];

export const CATALOG_CATEGORIES = Array.from(
  new Set(FURNITURE_CATALOG.map((f) => f.category))
);

export function getCatalogEntry(catalogId: string): CatalogEntry | undefined {
  return FURNITURE_CATALOG.find((f) => f.id === catalogId);
}
