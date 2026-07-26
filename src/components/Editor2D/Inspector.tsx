import { useSceneStore } from "../../store/sceneStore";
import { parseLengthToCm } from "../../utils/units";
import { FLOOR_PATTERNS, FLOOR_COLOR_PRESETS, WALL_COLOR_PRESETS } from "../../data/floorPatterns";

function normalizeDeg(deg: number) {
  const d = deg % 360;
  return d < 0 ? d + 360 : d;
}

export default function Inspector() {
  const scene = useSceneStore((s) => s.scene);
  const selectedId = useSceneStore((s) => s.selectedId);
  const selectedKind = useSceneStore((s) => s.selectedKind);
  const updateFurniture = useSceneStore((s) => s.updateFurniture);
  const updateOpening = useSceneStore((s) => s.updateOpening);
  const updateWall = useSceneStore((s) => s.updateWall);
  const setWallLength = useSceneStore((s) => s.setWallLength);
  const setFloorStyle = useSceneStore((s) => s.setFloorStyle);
  const displayUnit = useSceneStore((s) => s.displayUnit);
  const removeFurniture = useSceneStore((s) => s.removeFurniture);
  const removeOpening = useSceneStore((s) => s.removeOpening);
  const removeWall = useSceneStore((s) => s.removeWall);
  const duplicateFurniture = useSceneStore((s) => s.duplicateFurniture);
  const pushHistory = useSceneStore((s) => s.pushHistory);

  if (!selectedId || !selectedKind) {
    return (
      <div className="inspector-panel">
        <h2>Room</h2>
        <p className="catalog-hint">Select a wall, opening, or piece of furniture to edit its properties.</p>
        <h3 className="inspector-subheading">Floor</h3>
        <label>
          Pattern
          <select
            value={scene.floorStyle.pattern}
            onChange={(e) => setFloorStyle({ ...scene.floorStyle, pattern: e.target.value as typeof scene.floorStyle.pattern })}
          >
            {FLOOR_PATTERNS.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
        </label>
        <label>
          Color
          <input
            type="color"
            value={scene.floorStyle.color}
            onChange={(e) => setFloorStyle({ ...scene.floorStyle, color: e.target.value })}
          />
        </label>
        <div className="swatch-row">
          {FLOOR_COLOR_PRESETS.map((c) => (
            <button
              key={c}
              className="swatch"
              style={{ background: c }}
              title={c}
              onClick={() => setFloorStyle({ ...scene.floorStyle, color: c })}
            />
          ))}
        </div>
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
          <button
            onClick={() => {
              pushHistory();
              updateFurniture(item.id, { rotationDeg: normalizeDeg(item.rotationDeg - 90) });
            }}
          >
            ⟲ Rotate 90°
          </button>
          <button
            onClick={() => {
              pushHistory();
              updateFurniture(item.id, { rotationDeg: normalizeDeg(item.rotationDeg + 90) });
            }}
          >
            ⟳ Rotate 90°
          </button>
        </div>
        <div className="inspector-actions">
          <button
            onClick={() => {
              pushHistory();
              updateFurniture(item.id, { flippedX: !item.flippedX });
            }}
          >
            {item.flippedX ? "Unflip" : "Flip"} left/right
          </button>
        </div>
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

  if (selectedKind === "wall") {
    const wall = scene.walls.find((w) => w.id === selectedId);
    if (!wall) return null;
    const lengthCm = Math.hypot(wall.end[0] - wall.start[0], wall.end[1] - wall.start[1]);
    const unitDivisor = displayUnit === "m" ? 100 : displayUnit === "ft" ? 30.48 : 1;
    return (
      <div className="inspector-panel">
        <h2>Wall</h2>
        <label>
          Length ({displayUnit})
          <input
            type="number"
            defaultValue={(lengthCm / unitDivisor).toFixed(2)}
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
        <label className="inspector-checkbox">
          <input
            type="checkbox"
            checked={!!wall.isGlass}
            onChange={(e) => {
              pushHistory();
              updateWall(wall.id, { isGlass: e.target.checked });
            }}
          />
          Glass wall
        </label>
        {!wall.isGlass && (
          <>
            <label>
              Wall color
              <input
                type="color"
                value={wall.color ?? "#e8e6df"}
                onChange={(e) => updateWall(wall.id, { color: e.target.value, wallpaperUrl: undefined })}
                onBlur={() => pushHistory()}
              />
            </label>
            <div className="swatch-row">
              {WALL_COLOR_PRESETS.map((c) => (
                <button
                  key={c}
                  className="swatch"
                  style={{ background: c }}
                  title={c}
                  onClick={() => {
                    pushHistory();
                    updateWall(wall.id, { color: c, wallpaperUrl: undefined });
                  }}
                />
              ))}
            </div>
            <label>
              Wallpaper image URL
              <input
                key={wall.id}
                type="text"
                placeholder="https://... or paste an uploaded image"
                defaultValue={wall.wallpaperUrl ?? ""}
                onBlur={(e) => {
                  pushHistory();
                  updateWall(wall.id, { wallpaperUrl: e.target.value.trim() || undefined });
                }}
              />
            </label>
            <label>
              Or upload an image
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => {
                    pushHistory();
                    updateWall(wall.id, { wallpaperUrl: String(reader.result) });
                  };
                  reader.readAsDataURL(file);
                }}
              />
            </label>
            {wall.wallpaperUrl && (
              <button onClick={() => { pushHistory(); updateWall(wall.id, { wallpaperUrl: undefined }); }}>
                Remove wallpaper
              </button>
            )}
          </>
        )}
        <div className="inspector-actions">
          <button className="danger" onClick={() => removeWall(wall.id)}>Delete</button>
        </div>
      </div>
    );
  }

  return null;
}
