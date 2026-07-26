import type { FloorPattern } from "../types/scene";

export interface FloorPatternDef {
  id: FloorPattern;
  label: string;
  /** Short description shown in the picker */
  hint: string;
}

export const FLOOR_PATTERNS: FloorPatternDef[] = [
  { id: "plain", label: "Plain", hint: "Solid color, no pattern" },
  { id: "wood", label: "Wood planks", hint: "Striped wood-look planks" },
  { id: "tile", label: "Tile", hint: "Grid of square tiles" },
  { id: "carpet", label: "Carpet", hint: "Soft flecked texture" },
];

/** A few one-click starting colors shown alongside the native color input. */
export const FLOOR_COLOR_PRESETS = [
  "#c9a876", // warm oak
  "#8a6d4a", // walnut
  "#e7e2d6", // light tile
  "#4a4d52", // dark slate
  "#a8556b", // carpet red
  "#5b6b8a", // carpet blue
];

export const WALL_COLOR_PRESETS = [
  "#e8e6df", // default off-white
  "#f5f0e6", // warm white
  "#cfd8dc", // cool gray
  "#8a9a7a", // sage
  "#c9a876", // tan
  "#3a3d42", // charcoal accent wall
];

/**
 * Renders a small repeatable canvas texture for a floor pattern + tint color.
 * Used by the 3D viewer as a CanvasTexture; cheap enough to regenerate when
 * the pattern/color changes since it only runs on floor-style edits.
 */
export function drawFloorPatternToCanvas(canvas: HTMLCanvasElement, pattern: FloorPattern, color: string) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const { width, height } = canvas;
  ctx.clearRect(0, 0, width, height);

  switch (pattern) {
    case "wood": {
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, width, height);
      const plankHeight = height / 6;
      for (let i = 0; i < 6; i++) {
        const y = i * plankHeight;
        ctx.fillStyle = i % 2 === 0 ? shade(color, -0.08) : shade(color, 0.05);
        ctx.fillRect(0, y, width, plankHeight);
        ctx.strokeStyle = shade(color, -0.3);
        ctx.lineWidth = 1;
        ctx.strokeRect(0, y, width, plankHeight);
        // stagger a plank seam
        const seamX = (i % 2 === 0 ? width * 0.3 : width * 0.7);
        ctx.beginPath();
        ctx.moveTo(seamX, y);
        ctx.lineTo(seamX, y + plankHeight);
        ctx.stroke();
      }
      break;
    }
    case "tile": {
      ctx.fillStyle = shade(color, 0.08);
      ctx.fillRect(0, 0, width, height);
      const cols = 4;
      const cell = width / cols;
      ctx.strokeStyle = shade(color, -0.35);
      ctx.lineWidth = 3;
      for (let i = 0; i <= cols; i++) {
        ctx.beginPath();
        ctx.moveTo(i * cell, 0);
        ctx.lineTo(i * cell, height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * cell);
        ctx.lineTo(width, i * cell);
        ctx.stroke();
      }
      break;
    }
    case "carpet": {
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, width, height);
      // flecked noise texture
      for (let i = 0; i < 900; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        ctx.fillStyle = Math.random() > 0.5 ? shade(color, 0.12) : shade(color, -0.12);
        ctx.fillRect(x, y, 2, 2);
      }
      break;
    }
    case "plain":
    default: {
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, width, height);
      break;
    }
  }
}

function shade(hex: string, amt: number): string {
  const c = hex.replace("#", "");
  const num = parseInt(c.length === 3 ? c.split("").map((x) => x + x).join("") : c, 16);
  let r = (num >> 16) & 0xff;
  let g = (num >> 8) & 0xff;
  let b = num & 0xff;
  const adjust = (v: number) => Math.max(0, Math.min(255, Math.round(v + (amt >= 0 ? (255 - v) * amt : v * amt))));
  r = adjust(r);
  g = adjust(g);
  b = adjust(b);
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}
