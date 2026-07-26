"use client";
import { useRoomStore } from "../../store/roomStore";

export default function PropertyPanel() {
  const selectedId = useRoomStore((s) => s.selectedId);
  const schema = useRoomStore((s) => s.schema);
  const updateFurniture = useRoomStore((s) => s.updateFurniture);

  const item = schema.furniture.find((f) => f.id === selectedId);
  if (!item) return null;

  return (
    <div
      style={{
        position: "absolute",
        top: 16,
        right: 16,
        zIndex: 30,
        width: 240,
        padding: 12,
        borderRadius: 10,
        background: "rgba(248, 250, 252, 0.95)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
      }}
    >
      <strong style={{ display: "block", marginBottom: 8 }}>Properties</strong>
      <div style={{ fontSize: 14, color: "#334155" }}>{item.type}</div>
      <label style={{ display: "block", marginTop: 10, fontSize: 13 }}>
        Rotation
        <input
          type="range"
          min="0"
          max={Math.PI * 2}
          step={0.01}
          value={item.rotationY}
          onChange={(e) => updateFurniture(item.id, { rotationY: Number(e.target.value) })}
          style={{ width: "100%" }}
        />
      </label>
      <label style={{ display: "block", marginTop: 8, fontSize: 13 }}>
        Scale
        <input
          type="range"
          min="0.7"
          max="1.8"
          step="0.05"
          value={item.scale}
          onChange={(e) => updateFurniture(item.id, { scale: Number(e.target.value) })}
          style={{ width: "100%" }}
        />
      </label>
    </div>
  );
}
