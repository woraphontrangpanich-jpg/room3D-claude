import { useSceneStore } from "../../store/sceneStore";
import { parseLengthToCm } from "../../utils/units";

export default function Inspector() {
  const scene = useSceneStore((s) => s.scene);
  const selectedId = useSceneStore((s) => s.selectedId);
  const selectedKind = useSceneStore((s) => s.selectedKind);
  const displayUnit = useSceneStore((s) => s.displayUnit);
  const updateFurniture = useSceneStore((s) => s.updateFurniture);
  const updateOpening = useSceneStore((s) => s.updateOpening);
  const updateWall = useSceneStore((s) => s.updateWall);
  const setWallLength = useSceneStore((s) => s.setWallLength);
  const removeFurniture = useSceneStore((s) => s.removeFurniture);
  const removeOpening = useSceneStore((s) => s.removeOpening);
  const removeWall = useSceneStore((s) => s.removeWall);
  const duplicateFurniture = useSceneStore((s) => s.duplicateFurniture);
  const pushHistory = useSceneStore((s) => s.pushHistory);

  if (selectedKind === "wall") {
    const wall = scene.walls.find((w) => w.id === selectedId);
    if (!wall) return null;
    const startV = scene.vertices.find((v) => v.id === wall.startVertexId);
    const endV = scene.vertices.find((v) => v.id === wall.endVertexId);
    const lenCm = startV && endV ? Math.hypot(endV.point[0] - startV.point[0], endV.point[1] - startV.point[1]) : 0;
    return (
      <div className="inspector-panel">
        <h2>Wall</h2>
        <label>
          Length ({displayUnit})
          <input
            type="number"
            defaultValue={(lenCm / (displayUnit === "m" ? 100 : displayUnit === "ft" ? 30.48 : 1)).toFixed(2)}
            onBlur={(e) => setWallLength(wall.id, parseLengthToCm(e.target.value, displayUnit))}
          />
        </label>
        <label>
          Thickness (cm)
          <input
            type="number"
            value={wall.thickness}
            onChange={(e) => updateWall(wall.id, { thickness: Number(e.target.value) })}
            onBlur={() => pushHistory()}
          />
        </label>
        <label>
          Height (cm)
          <input
            type="number"
            value={wall.height}
            onChange={(e) => updateWall(wall.id, { height: Number(e.target.value) })}
            onBlur={() => pushHistory()}
          />
        </label>
        <div className="inspector-actions">
          <button className="danger" onClick={() => removeWall(wall.id)}>Delete wall</button>
        </div>
      </div>
    );
  }

  if (!selectedId || !selectedKind) {
    return (
      <div className="inspector-panel">
        <h2>Inspector</h2>
        <p className="catalog-hint">Select a wall, opening, or piece of furniture to edit its properties.</p>
      </div>
    );
  }

  if (selectedKind === "furniture") {
    const item = scene.furniture.find((f) => f.id === selectedId);
    if (!item) return null;
    return (
      <div className="inspector-panel">
        <h2>{item.label}</h2>
        <label>
          Width (cm)
          <input
            type="number"
            value={Math.round(item.footprint[0])}
            onChange={(e) => updateFurniture(item.id, { footprint: [Number(e.target.value), item.footprint[1]] })}
            onBlur={() => pushHistory()}
          />
        </label>
        <label>
          Depth (cm)
          <input
            type="number"
            value={Math.round(item.footprint[1])}
            onChange={(e) => updateFurniture(item.id, { footprint: [item.footprint[0], Number(e.target.value)] })}
            onBlur={() => pushHistory()}
          />
        </label>
        <label>
          Rotation (°)
          <input
            type="number"
            step={15}
            value={Math.round(item.rotationDeg)}
            onChange={(e) => updateFurniture(item.id, { rotationDeg: Number(e.target.value) })}
            onBlur={() => pushHistory()}
          />
        </label>
        <label>
          Color
          <input
            type="color"
            value={item.color}
            onChange={(e) => updateFurniture(item.id, { color: e.target.value })}
          />
        </label>
        <div className="inspector-actions">
          <button onClick={() => duplicateFurniture(item.id)}>Duplicate</button>
          <button className="danger" onClick={() => removeFurniture(item.id)}>Delete</button>
        </div>
      </div>
    );
  }

  if (selectedKind === "opening") {
    const opening = scene.openings.find((o) => o.id === selectedId);
    if (!opening) return null;
    return (
      <div className="inspector-panel">
        <h2>{opening.type === "door" ? "Door" : "Window"}</h2>
        <label>
          Width (cm)
          <input
            type="number"
            value={opening.width}
            onChange={(e) => updateOpening(opening.id, { width: Number(e.target.value) })}
            onBlur={() => pushHistory()}
          />
        </label>
        <label>
          Height (cm)
          <input
            type="number"
            value={opening.height}
            onChange={(e) => updateOpening(opening.id, { height: Number(e.target.value) })}
            onBlur={() => pushHistory()}
          />
        </label>
        <label>
          Position along wall (cm)
          <input
            type="number"
            value={Math.round(opening.position)}
            onChange={(e) => updateOpening(opening.id, { position: Number(e.target.value) })}
            onBlur={() => pushHistory()}
          />
        </label>
        {opening.type === "window" && (
          <label>
            Sill height (cm)
            <input
              type="number"
              value={opening.sillHeight ?? 90}
              onChange={(e) => updateOpening(opening.id, { sillHeight: Number(e.target.value) })}
              onBlur={() => pushHistory()}
            />
          </label>
        )}
        <div className="inspector-actions">
          <button className="danger" onClick={() => removeOpening(opening.id)}>Delete</button>
        </div>
      </div>
    );
  }

  return null;
}
