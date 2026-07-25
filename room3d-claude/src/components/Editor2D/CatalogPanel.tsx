import { CATALOG_CATEGORIES, FURNITURE_CATALOG } from "../../data/furnitureCatalog";
import { useSceneStore } from "../../store/sceneStore";

export default function CatalogPanel() {
  return (
    <div className="catalog-panel">
      <h2>Furniture</h2>
      <p className="catalog-hint">Drag an item onto the room, or click to drop it in the center.</p>
      {CATALOG_CATEGORIES.map((category) => (
        <div key={category} className="catalog-category">
          <h3>{category}</h3>
          <div className="catalog-grid">
            {FURNITURE_CATALOG.filter((f) => f.category === category).map((f) => (
              <div
                key={f.id}
                className="catalog-item"
                draggable
                onDragStart={(e) => e.dataTransfer.setData("catalogId", f.id)}
                onClick={() => useSceneStore.getState().addFurniture(f.id, [250, 200])}
                title={`${f.footprint[0]}×${f.footprint[1]}cm, ${f.heightCm}cm tall`}
              >
                <div className="catalog-swatch" style={{ background: f.color }} />
                <span>{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
