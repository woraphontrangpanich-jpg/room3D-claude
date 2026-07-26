"use client";
import { useRoomStore } from "../../store/roomStore";

const modes = [
  { key: "plan2d", label: "2D Plan" },
  { key: "orbit3d", label: "3D Orbit" },
  { key: "walkthrough", label: "Walkthrough" },
] as const;

export default function Toolbar() {
  const viewMode = useRoomStore((s) => s.viewMode);
  const setViewMode = useRoomStore((s) => s.setViewMode);

  return (
    <div
      style={{
        position: "absolute",
        top: 16,
        left: 16,
        zIndex: 30,
        display: "flex",
        gap: 8,
        padding: 8,
        borderRadius: 8,
        background: "rgba(15, 23, 42, 0.85)",
      }}
    >
      {modes.map((mode) => (
        <button
          key={mode.key}
          type="button"
          onClick={() => setViewMode(mode.key)}
          style={{
            padding: "8px 12px",
            borderRadius: 6,
            border: viewMode === mode.key ? "1px solid #60a5fa" : "1px solid #334155",
            background: viewMode === mode.key ? "#2563eb" : "#0f172a",
            color: "#f8fafc",
            cursor: "pointer",
          }}
        >
          {mode.label}
        </button>
      ))}
    </div>
  );
}
