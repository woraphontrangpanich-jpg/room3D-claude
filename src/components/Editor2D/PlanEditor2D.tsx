"use client";
import { useEffect, useRef } from "react";
import type { FurnitureItem } from "../../types/room";
import { useRoomStore } from "../../store/roomStore";

const GRID_SIZE = 0.25;

export default function PlanEditor2D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const schema = useRoomStore((s) => s.schema);
  const selectedId = useRoomStore((s) => s.selectedId);
  const selectItem = useRoomStore((s) => s.selectItem);
  const updateFurniture = useRoomStore((s) => s.updateFurniture);
  const draggingRef = useRef<{ id: string; offsetX: number; offsetZ: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, depth } = schema.room;
    const scale = Math.min(canvas.width / (width + 2), canvas.height / (depth + 2));
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.scale(scale, scale);

      ctx.strokeStyle = "#64748b";
      ctx.lineWidth = 0.02;
      for (let x = -Math.ceil(width / 2); x <= Math.ceil(width / 2); x += GRID_SIZE) {
        ctx.beginPath();
        ctx.moveTo(x, -depth / 2);
        ctx.lineTo(x, depth / 2);
        ctx.stroke();
      }
      for (let z = -Math.ceil(depth / 2); z <= Math.ceil(depth / 2); z += GRID_SIZE) {
        ctx.beginPath();
        ctx.moveTo(-width / 2, z);
        ctx.lineTo(width / 2, z);
        ctx.stroke();
      }

      ctx.strokeStyle = "#f8fafc";
      ctx.strokeRect(-width / 2, -depth / 2, width, depth);

      schema.furniture.forEach((item: FurnitureItem) => {
        const isSelected = item.id === selectedId;
        ctx.fillStyle = isSelected ? "#f59e0b" : "#38bdf8";
        ctx.beginPath();
        ctx.arc(item.x, item.z, 0.18, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    };

    draw();
  }, [schema, selectedId]);

  function toWorld(clientX: number, clientY: number) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * canvas.width - canvas.width / 2;
    const z = ((clientY - rect.top) / rect.height) * canvas.height - canvas.height / 2;
    const scale = Math.min(canvas.width / (schema.room.width + 2), canvas.height / (schema.room.depth + 2));
    return { x: x / scale, z: z / scale };
  }

  function snap(v: number) {
    return Math.round(v / GRID_SIZE) * GRID_SIZE;
  }

  function handlePointerDown(e: React.PointerEvent) {
    const { x, z } = toWorld(e.clientX, e.clientY);
    const hit = [...schema.furniture].reverse().find((item) => Math.hypot(item.x - x, item.z - z) < 0.3);
    if (hit) {
      selectItem(hit.id);
      draggingRef.current = {
        id: hit.id,
        offsetX: hit.x - x,
        offsetZ: hit.z - z,
      };
    } else {
      selectItem(null);
    }
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!draggingRef.current) return;
    const { x, z } = toWorld(e.clientX, e.clientY);
    const { id, offsetX, offsetZ } = draggingRef.current;
    updateFurniture(id, { x: snap(x + offsetX), z: snap(z + offsetZ) });
  }

  function handlePointerUp() {
    draggingRef.current = null;
  }

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 10, pointerEvents: "none" }}>
      <canvas
        ref={canvasRef}
        width={900}
        height={600}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        style={{ width: "100%", height: "100%", background: "rgba(15, 23, 42, 0.75)", cursor: "grab", pointerEvents: "auto" }}
      />
    </div>
  );
}
